"use server"

import { redirect } from "next/navigation"
import { createUser, emailExists, GENERIC_ERROR } from "@/lib/auth/account"
import { hashPassword } from "@/lib/auth/password"
import { clientIp, hit, LIMITS } from "@/lib/auth/rate-limit"
import { safeNext } from "@/lib/auth/redirect"
import { emailSchema, fieldErrors, signupSchema, type FormState } from "@/lib/auth/schemas"
import { startSession } from "@/lib/auth/session"

function parseAgreements(raw: FormDataEntryValue | null): Record<string, boolean> {
  try {
    const v = JSON.parse(String(raw ?? "{}"))
    return v && typeof v === "object" ? v : {}
  } catch {
    return {}
  }
}

export type EmailCheck = "available" | "taken" | "invalid" | "limited"

/** 가입 화면 실시간 중복 확인. 계정 열거를 막기 위해 IP rate limit을 건다. */
export async function checkEmailAvailable(email: string): Promise<EmailCheck> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return "invalid"
  try {
    const ip = await clientIp()
    if (ip && (await hit("email-check", ip, LIMITS.emailCheck)).limited) return "limited"
    return (await emailExists(parsed.data)) ? "taken" : "available"
  } catch (err) {
    console.error("[auth] 이메일 확인 실패", err instanceof Error ? err.name : "unknown")
    return "limited"
  }
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? ""), name: String(formData.get("name") ?? "") }
  // 서버는 약관·계정 전부를 다시 검증한다(클라이언트 단계 검사를 신뢰하지 않음)
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    name: formData.get("name"),
    agreements: parseAgreements(formData.get("agreements")),
  })
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error)
    // 약관 에러는 계정 단계 폼에 필드가 없으니 폼 에러로 올린다
    return { fieldErrors: errors, formError: errors.agreements, values }
  }
  const { email, password, name, agreements } = parsed.data

  try {
    const ip = await clientIp()
    if (ip && (await hit("signup", ip, LIMITS.signupIp)).limited) {
      return { formError: "가입 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", values }
    }
    const user = await createUser({ email, name, passwordHash: await hashPassword(password), emailVerifiedAt: null, agreements, source: "signup" })
    if (!user) return { fieldErrors: { email: "이미 가입된 이메일입니다." }, values }
    await startSession(user._id, user.tokenVersion)
  } catch (err) {
    console.error("[auth] 가입 실패", err instanceof Error ? err.name : "unknown")
    return { formError: GENERIC_ERROR, values }
  }

  const next = safeNext(formData.get("next"), "")
  redirect(next ? `/signup/complete?next=${encodeURIComponent(next)}` : "/signup/complete")
}
