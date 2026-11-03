"use server"

import { redirect } from "next/navigation"
import { GENERIC_ERROR } from "@/lib/auth/account"
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password"
import { clientIp, guardedAttempt, hit, LIMITS } from "@/lib/auth/rate-limit"
import { safeNext } from "@/lib/auth/redirect"
import { fieldErrors, loginSchema, type FormState } from "@/lib/auth/schemas"
import { startSession } from "@/lib/auth/session"
import { collections } from "@/lib/db/collections"

const INVALID = "이메일 또는 비밀번호가 올바르지 않습니다."
const tooMany = (sec: number) => `로그인 시도가 너무 많습니다. ${Math.max(1, Math.ceil(sec / 60))}분 뒤 다시 시도해 주세요.`

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") }
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values }
  const { email, password } = parsed.data

  try {
    const ip = await clientIp()
    if (ip) {
      const r = await hit("login-ip", ip, LIMITS.loginIp)
      if (r.limited) return { formError: tooMany(r.retryAfterSec), values }
    }
    const { users } = await collections()
    const user = await users.findOne({ email })
    // 계정 잠금이 아니라 시간창: 타인이 계정을 영구히 잠글 수 없다.
    // 없는 계정·OAuth 전용 계정도 더미 해시로 같은 시간을 쓰고 같은 메시지를 준다
    const result = await guardedAttempt("login-email", email, LIMITS.loginEmail, () => verifyPassword(user?.passwordHash, password))
    if (result.limited) return { formError: tooMany(result.retryAfterSec), values }
    if (!user || !result.ok) return { formError: INVALID, values }

    if (user.passwordHash && needsRehash(user.passwordHash)) {
      await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() } })
    }
    await startSession(user._id, user.tokenVersion)
  } catch (err) {
    console.error("[auth] 로그인 실패", err instanceof Error ? err.name : "unknown")
    return { formError: GENERIC_ERROR, values }
  }

  redirect(safeNext(formData.get("next")))
}
