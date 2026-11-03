import "server-only"
import { createHmac, randomInt, timingSafeEqual } from "node:crypto"
import type { ObjectId } from "mongodb"
import { collections, type VerificationDoc } from "@/lib/db/collections"
import { deriveKey, getConfig, type VerificationMode } from "../config"
import { hit, LIMITS } from "../rate-limit"
import { consoleEmailSender, consoleIdentityVerifier, consoleSmsSender } from "./console"
import { disabledEmailSender, disabledIdentityVerifier, disabledSmsSender } from "./disabled"
import type { EmailSender, IdentityVerifier, SmsSender } from "./types"

export const CODE_TTL_MS = 10 * 60 * 1000
export const MAX_ATTEMPTS = 5
export const RESEND_COOLDOWN_SEC = 60

type Impl<T> = { off: T; console: T }

/** 플래그에 따라 구현을 고른다. 실제 어댑터는 여기 분기에 한 줄 추가한다. */
export function selectImpl<T>(mode: VerificationMode, impls: Impl<T>, isProd: boolean): T {
  if (mode === "console" && isProd) throw new Error("console 구현은 개발 환경에서만 쓸 수 있습니다")
  return impls[mode]
}

export function getEmailSender(): EmailSender {
  const { verification, isProd } = getConfig()
  return selectImpl(verification.email, { off: disabledEmailSender, console: consoleEmailSender }, isProd)
}

export function getSmsSender(): SmsSender {
  const { verification, isProd } = getConfig()
  return selectImpl(verification.sms, { off: disabledSmsSender, console: consoleSmsSender }, isProd)
}

export function getIdentityVerifier(): IdentityVerifier {
  const { verification, isProd } = getConfig()
  return selectImpl(verification.identity, { off: disabledIdentityVerifier, console: consoleIdentityVerifier }, isProd)
}

export function isEmailVerificationEnabled(): boolean {
  return getConfig().verification.email !== "off"
}

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function hashCode(code: string): string {
  return createHmac("sha256", deriveKey("verification-code")).update(code).digest("base64url")
}

export type CodeCheck = "ok" | "expired" | "too-many" | "mismatch" | "missing"

/** DB 없이 테스트 가능한 코드 판정 */
export function checkCode(doc: Pick<VerificationDoc, "codeHash" | "attempts" | "expiresAt"> | null, code: string, now: Date): CodeCheck {
  if (!doc) return "missing"
  if (doc.expiresAt <= now) return "expired"
  if (doc.attempts >= MAX_ATTEMPTS) return "too-many"
  const a = Buffer.from(doc.codeHash)
  const b = Buffer.from(hashCode(code))
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "mismatch"
}

type Target = { target: string; channel: VerificationDoc["channel"]; purpose: VerificationDoc["purpose"] }

/** 코드를 발급(재발송 시 교체)하고 보낸다. 발송 한도를 넘으면 false. */
export async function issueCode(input: Target & { userId: ObjectId | null }): Promise<boolean> {
  if ((await hit(`verify-send:${input.channel}`, input.target, LIMITS.verifySend)).limited) return false
  const { verifications } = await collections()
  const code = generateCode()
  await verifications.updateOne(
    { target: input.target, channel: input.channel, purpose: input.purpose },
    { $set: { userId: input.userId, codeHash: hashCode(code), attempts: 0, expiresAt: new Date(Date.now() + CODE_TTL_MS) } },
    { upsert: true },
  )
  const text = `넥스트스텝 인증 코드: ${code} (10분 안에 입력해 주세요)`
  if (input.channel === "email") await getEmailSender().send({ to: input.target, subject: "[넥스트스텝] 이메일 인증 코드", text })
  else await getSmsSender().send({ to: input.target, text })
  return true
}

export async function verifyCode(input: Target & { code: string }): Promise<CodeCheck> {
  const { verifications } = await collections()
  const filter = { target: input.target, channel: input.channel, purpose: input.purpose }
  const doc = await verifications.findOne(filter)
  const result = checkCode(doc, input.code, new Date())
  if (result === "ok") await verifications.deleteOne(filter)
  else if (result === "mismatch") await verifications.updateOne(filter, { $inc: { attempts: 1 } })
  return result
}
