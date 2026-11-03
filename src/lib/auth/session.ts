import "server-only"
import { randomUUID } from "node:crypto"
import { cookies, headers } from "next/headers"
import type { ObjectId } from "mongodb"
import { collections, type SessionDoc } from "@/lib/db/collections"
import {
  ACCESS_TTL_SEC,
  REFRESH_TTL_SEC,
  SESSION_MAX_AGE_SEC,
  generateRefreshToken,
  sha256,
  signAccessToken,
  type AccessClaims,
} from "./tokens"

const isProd = process.env.NODE_ENV === "production"
// production에선 __Host- 접두사로 도메인·경로 고정을 브라우저가 강제한다
export const COOKIE = {
  access: isProd ? "__Host-ns_at" : "ns_at",
  refresh: isProd ? "__Host-ns_rt" : "ns_rt",
}

export const GRACE_MS = 30_000

type CookieOptions = { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number }
type CookieWriter = { set(name: string, value: string, options: CookieOptions): unknown }

export function cookieOptions(maxAge: number, path = "/"): CookieOptions {
  return { httpOnly: true, secure: isProd, sameSite: "lax", path, maxAge }
}

export type IssuedTokens = { access: string; refresh: string | null; refreshMaxAge: number }

export type RefreshDecision = "rotate" | "grace" | "revoke" | "reject"

/** 제시된 refresh 해시로 세션을 어떻게 처리할지 정한다(DB 없이 테스트 가능한 순수 함수). */
export function decideRefresh(
  session: Pick<SessionDoc, "tokenHash" | "prevTokenHash" | "rotatedAt" | "createdAt" | "expiresAt"> | null,
  presentedHash: string,
  now: Date,
): RefreshDecision {
  if (!session) return "reject"
  if (now >= session.expiresAt || now.getTime() - session.createdAt.getTime() >= SESSION_MAX_AGE_SEC * 1000) return "reject"
  if (presentedHash === session.tokenHash) return "rotate"
  if (presentedHash === session.prevTokenHash) {
    // 동시 요청(프리페치 여러 개)이면 유예, 그 뒤 재사용은 탈취로 본다
    return session.rotatedAt && now.getTime() - session.rotatedAt.getTime() <= GRACE_MS ? "grace" : "revoke"
  }
  return "reject"
}

function refreshExpiry(createdAt: Date, now: Date): Date {
  return new Date(Math.min(now.getTime() + REFRESH_TTL_SEC * 1000, createdAt.getTime() + SESSION_MAX_AGE_SEC * 1000))
}

export async function createSession(userId: ObjectId, tokenVersion: number, userAgent?: string | null): Promise<IssuedTokens> {
  const { sessions } = await collections()
  const now = new Date()
  const refresh = generateRefreshToken()
  const _id = randomUUID()
  await sessions.insertOne({
    _id,
    userId,
    tokenHash: sha256(refresh),
    createdAt: now,
    expiresAt: refreshExpiry(now, now),
    ...(userAgent ? { userAgent: userAgent.slice(0, 200) } : {}),
  })
  const access = await signAccessToken({ sub: userId.toHexString(), sid: _id, ver: tokenVersion })
  return { access, refresh, refreshMaxAge: REFRESH_TTL_SEC }
}

/** refresh 토큰으로 새 토큰을 발급한다. 실패하면 null(쿠키를 지워야 함). */
export async function rotateSession(refreshToken: string, now = new Date()): Promise<{ tokens: IssuedTokens; claims: AccessClaims } | null> {
  const { sessions, users } = await collections()
  const hash = sha256(refreshToken)
  const session = await sessions.findOne({ $or: [{ tokenHash: hash }, { prevTokenHash: hash }] })
  let decision = decideRefresh(session, hash, now)
  if (!session || decision === "reject") return null
  if (decision === "revoke") {
    await sessions.deleteOne({ _id: session._id })
    return null
  }

  const user = await users.findOne({ _id: session.userId }, { projection: { tokenVersion: 1 } })
  if (!user) {
    await sessions.deleteOne({ _id: session._id })
    return null
  }

  let refresh: string | null = null
  let expiresAt = session.expiresAt
  if (decision === "rotate") {
    refresh = generateRefreshToken()
    expiresAt = refreshExpiry(session.createdAt, now)
    const updated = await sessions.findOneAndUpdate(
      { _id: session._id, tokenHash: hash },
      { $set: { tokenHash: sha256(refresh), prevTokenHash: hash, rotatedAt: now, expiresAt } },
    )
    // 다른 요청이 먼저 회전했다면 유예와 같이 access만 발급
    if (!updated) {
      refresh = null
      decision = "grace"
    }
  }

  const claims = { sub: session.userId.toHexString(), sid: session._id, ver: user.tokenVersion }
  const access = await signAccessToken(claims)
  return { tokens: { access, refresh, refreshMaxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000) }, claims }
}

export async function revokeSession(sid: string) {
  const { sessions } = await collections()
  await sessions.deleteOne({ _id: sid })
}

/** tokenVersion을 올리고 모든 세션을 지운다. 남은 access JWT도 DAL에서 즉시 무효. */
export async function revokeAllSessions(userId: ObjectId): Promise<number> {
  const { sessions, users } = await collections()
  const user = await users.findOneAndUpdate({ _id: userId }, { $inc: { tokenVersion: 1 }, $set: { updatedAt: new Date() } }, { returnDocument: "after" })
  await sessions.deleteMany({ userId })
  return user?.tokenVersion ?? 0
}

export function writeSessionCookies(store: CookieWriter, tokens: IssuedTokens) {
  store.set(COOKIE.access, tokens.access, cookieOptions(ACCESS_TTL_SEC))
  if (tokens.refresh) store.set(COOKIE.refresh, tokens.refresh, cookieOptions(tokens.refreshMaxAge))
}

export function clearSessionCookies(store: CookieWriter) {
  store.set(COOKIE.access, "", cookieOptions(0))
  store.set(COOKIE.refresh, "", cookieOptions(0))
}

/** Server Action·Route Handler에서 로그인 처리: 세션 생성 + 쿠키 설정. */
export async function startSession(userId: ObjectId, tokenVersion: number) {
  const userAgent = (await headers()).get("user-agent")
  const tokens = await createSession(userId, tokenVersion, userAgent)
  writeSessionCookies(await cookies(), tokens)
}
