import "server-only"
import { createHmac } from "node:crypto"
import { headers } from "next/headers"
import { collections } from "@/lib/db/collections"
import { deriveKey } from "./config"

export type Limit = { limit: number; windowSec: number }

export const LIMITS = {
  loginIp: { limit: 20, windowSec: 15 * 60 },
  loginEmail: { limit: 5, windowSec: 15 * 60 },
  emailCheck: { limit: 30, windowSec: 10 * 60 },
  signupIp: { limit: 5, windowSec: 60 * 60 },
  verifySend: { limit: 3, windowSec: 10 * 60 },
} satisfies Record<string, Limit>

/** 평문 이메일·IP를 남기지 않도록 HMAC 해시로 키를 만든다. */
export function rateKey(scope: string, raw: string): string {
  return `${scope}:${createHmac("sha256", deriveKey("rate-limit")).update(raw).digest("base64url")}`
}

export function isLimited(count: number, limit: number): boolean {
  return count > limit
}

export type RateResult = { limited: boolean; retryAfterSec: number }

function result(doc: { count: number; expiresAt: Date } | null, limit: number, now: Date): RateResult {
  if (!doc || doc.expiresAt <= now) return { limited: false, retryAfterSec: 0 }
  return { limited: isLimited(doc.count, limit), retryAfterSec: Math.ceil((doc.expiresAt.getTime() - now.getTime()) / 1000) }
}

/** 고정 윈도 카운터를 1 올리고 한도 초과 여부를 돌려준다. */
export async function hit(scope: string, raw: string, { limit, windowSec }: Limit): Promise<RateResult> {
  const { rateLimits } = await collections()
  const _id = rateKey(scope, raw)
  const now = new Date()
  // TTL 모니터는 1분 주기라 만료 문서가 남아 있을 수 있다
  await rateLimits.deleteOne({ _id, expiresAt: { $lte: now } })
  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + windowSec * 1000) } }
  const doc = await rateLimits
    .findOneAndUpdate({ _id }, update, { upsert: true, returnDocument: "after" })
    .catch(() => rateLimits.findOneAndUpdate({ _id }, update, { upsert: true, returnDocument: "after" })) // 동시 upsert 중복 키 1회 재시도
  return result(doc, limit, now)
}

/** 올리지 않고 현재 상태만 본다(로그인 실패 횟수 확인). count가 limit에 도달하면 제한. */
export async function peek(scope: string, raw: string, { limit }: Limit): Promise<RateResult> {
  const { rateLimits } = await collections()
  const now = new Date()
  const doc = await rateLimits.findOne({ _id: rateKey(scope, raw) })
  return result(doc, limit - 1, now)
}

export async function reset(scope: string, raw: string) {
  const { rateLimits } = await collections()
  await rateLimits.deleteOne({ _id: rateKey(scope, raw) })
}

/** 신뢰할 프록시 뒤에서만 의미가 있다. 없으면 null → IP 한도는 건너뛴다. */
export async function clientIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || null
}
