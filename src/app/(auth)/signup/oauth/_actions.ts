"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ObjectId } from "mongodb"
import { createUser, emailExists, GENERIC_ERROR, isDuplicateKey } from "@/lib/auth/account"
import { PENDING_COOKIE, verifyPendingSignup } from "@/lib/auth/oauth/state"
import { safeNext } from "@/lib/auth/redirect"
import { fieldErrors, normalizeEmail, oauthSignupSchema, type FormState } from "@/lib/auth/schemas"
import { cookieOptions, startSession } from "@/lib/auth/session"
import { collections } from "@/lib/db/collections"

/** OAuth 신규 가입자: 서명된 ns_pending 쿠키의 프로필 + 약관 동의(+ 이메일 보완)로 user·account 생성 */
export async function completeOAuthSignup(_prev: FormState, formData: FormData): Promise<FormState> {
  const store = await cookies()
  const pending = await verifyPendingSignup(store.get(PENDING_COOKIE)?.value)
  if (!pending) redirect("/login?error=oauth_pending_expired")

  let agreements: unknown = {}
  try {
    agreements = JSON.parse(String(formData.get("agreements") ?? "{}"))
  } catch {}
  // 제공자가 이메일을 준 경우 그 값을 쓴다(폼 값으로 바꿀 수 없음)
  const values = { email: pending.email ?? String(formData.get("email") ?? ""), name: String(formData.get("name") ?? "") }
  const parsed = oauthSignupSchema.safeParse({ ...values, agreements })
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error)
    return { fieldErrors: errors, formError: errors.agreements, values }
  }
  const { email, name } = parsed.data

  let raced = false
  try {
    if (await emailExists(email)) {
      return { fieldErrors: { email: "이미 가입된 이메일입니다. 비밀번호로 로그인한 뒤 마이페이지에서 연결하세요." }, values }
    }
    const verified = pending.emailVerified && !!pending.email && normalizeEmail(pending.email) === email
    const user = await createUser({ email, name, passwordHash: null, emailVerifiedAt: verified ? new Date() : null, agreements: parsed.data.agreements, source: "oauth-signup" })
    if (!user) return { fieldErrors: { email: "이미 가입된 이메일입니다." }, values }
    const { accounts, users, termAgreements } = await collections()
    try {
      await accounts.insertOne({ _id: new ObjectId(), userId: user._id, provider: pending.provider, providerAccountId: pending.providerAccountId, email: pending.email, linkedAt: new Date() })
    } catch (err) {
      // 다른 탭에서 먼저 가입됨 → 방금 만든 user를 되돌린다
      await Promise.all([users.deleteOne({ _id: user._id }), termAgreements.deleteMany({ userId: user._id })])
      if (!isDuplicateKey(err)) throw err
      raced = true
    }
    if (!raced) await startSession(user._id, user.tokenVersion)
    store.set(PENDING_COOKIE, "", cookieOptions(0))
  } catch (err) {
    console.error("[auth] OAuth 가입 실패", err instanceof Error ? err.name : "unknown")
    return { formError: GENERIC_ERROR, values }
  }

  if (raced) redirect("/login?error=oauth_failed")
  const next = safeNext(pending.next, "")
  redirect(next && next !== "/" ? `/signup/complete?next=${encodeURIComponent(next)}` : "/signup/complete")
}
