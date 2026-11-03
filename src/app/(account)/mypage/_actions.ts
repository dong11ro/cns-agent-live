"use server"

import { refresh } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { deleteUserCompletely, GENERIC_ERROR } from "@/lib/auth/account"
import { recordAgreements } from "@/lib/auth/consents"
import { requireUserDoc } from "@/lib/auth/dal"
import { isProviderId } from "@/lib/auth/oauth/providers"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { hit, LIMITS, peek, reset } from "@/lib/auth/rate-limit"
import { fieldErrors, newPasswordSchema, normalizeEmail, profileSchema, type FormState } from "@/lib/auth/schemas"
import { clearSessionCookies, revokeAllSessions, startSession } from "@/lib/auth/session"
import { collections } from "@/lib/db/collections"

// 모든 액션은 직접 POST로도 호출될 수 있으므로 각자 requireUserDoc()으로 인증한다(DAL).

function fail(err: unknown, what: string): FormState {
  console.error(`[account] ${what} 실패`, err instanceof Error ? err.name : "unknown")
  return { formError: GENERIC_ERROR }
}

/** 현재 비밀번호 확인. 로그인과 같은 이메일 실패 한도를 공유해 무차별 대입을 막는다. */
async function checkCurrentPassword(email: string, hash: string, password: string): Promise<string | null> {
  const limit = await peek("login-email", email, LIMITS.loginEmail)
  if (limit.limited) return `시도가 너무 많습니다. ${Math.ceil(limit.retryAfterSec / 60)}분 뒤 다시 시도해 주세요.`
  if (await verifyPassword(hash, password)) {
    await reset("login-email", email)
    return null
  }
  await hit("login-email", email, LIMITS.loginEmail)
  return "현재 비밀번호가 올바르지 않습니다."
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserDoc()
  const parsed = profileSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: { name: String(formData.get("name") ?? "") } }
  try {
    const { users } = await collections()
    await users.updateOne({ _id: user._id }, { $set: { name: parsed.data.name, updatedAt: new Date() } })
  } catch (err) {
    return fail(err, "프로필 수정")
  }
  refresh()
  return { ok: true, message: "저장되었습니다." }
}

/** 변경 시 tokenVersion+1로 다른 기기는 로그아웃, 현재 기기만 새 세션 발급. OAuth 전용이면 "설정". */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserDoc()
  const next = String(formData.get("newPassword") ?? "")
  const errors: Record<string, string> = {}
  const r = newPasswordSchema(user.email).safeParse(next)
  if (!r.success) errors.newPassword = r.error.issues[0].message
  if (next !== String(formData.get("newPasswordConfirm") ?? "")) errors.newPasswordConfirm = "비밀번호가 일치하지 않습니다."
  if (user.passwordHash && !formData.get("currentPassword")) errors.currentPassword = "현재 비밀번호를 입력해 주세요."
  if (Object.keys(errors).length) return { fieldErrors: errors }

  try {
    if (user.passwordHash) {
      const msg = await checkCurrentPassword(user.email, user.passwordHash, String(formData.get("currentPassword")))
      if (msg) return { fieldErrors: { currentPassword: msg } }
    }
    const { users } = await collections()
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(next), updatedAt: new Date() } })
    const tokenVersion = await revokeAllSessions(user._id)
    await startSession(user._id, tokenVersion)
  } catch (err) {
    return fail(err, "비밀번호 변경")
  }
  refresh()
  return { ok: true, message: user.passwordHash ? "비밀번호를 변경했습니다. 다른 기기에서는 로그아웃됩니다." : "비밀번호를 설정했습니다." }
}

/** 남는 로그인 수단(비밀번호 또는 다른 제공자)이 있을 때만 해제한다. */
export async function unlinkAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserDoc()
  const provider = String(formData.get("provider") ?? "")
  if (!isProviderId(provider)) return { formError: "알 수 없는 제공자입니다." }
  try {
    const { accounts } = await collections()
    const linked = await accounts.find({ userId: user._id }).toArray()
    if (!linked.some((a) => a.provider === provider)) return { formError: "연결되지 않은 계정입니다." }
    if (!user.passwordHash && linked.length <= 1) return { formError: "남는 로그인 수단이 없어 해제할 수 없습니다. 먼저 비밀번호를 설정해 주세요." }
    await accounts.deleteOne({ userId: user._id, provider })
  } catch (err) {
    return fail(err, "연결 해제")
  }
  refresh()
  return { ok: true, message: "연결을 해제했습니다." }
}

/** 선택 약관만 철회/재동의(이력 추가). 필수 약관 철회는 탈퇴로 처리한다. */
export async function updateMarketingConsent(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserDoc()
  const agreed = formData.get("agreed") === "true"
  try {
    await recordAgreements(user._id, { marketing: agreed }, "mypage")
  } catch (err) {
    return fail(err, "동의 변경")
  }
  refresh()
  return { ok: true, message: agreed ? "마케팅 정보 수신에 동의했습니다." : "마케팅 정보 수신 동의를 철회했습니다." }
}

export async function logoutAll() {
  const user = await requireUserDoc()
  await revokeAllSessions(user._id)
  clearSessionCookies(await cookies())
  redirect("/login")
}

/** 즉시 하드 삭제. 비밀번호 사용자는 비밀번호, OAuth 전용은 이메일 입력으로 확인한다. */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserDoc()
  const confirm = String(formData.get("confirm") ?? "")
  try {
    if (user.passwordHash) {
      const msg = await checkCurrentPassword(user.email, user.passwordHash, confirm)
      if (msg) return { fieldErrors: { confirm: msg.replace("현재 비밀번호", "비밀번호") } }
    } else if (normalizeEmail(confirm) !== user.email) {
      return { fieldErrors: { confirm: "이메일이 일치하지 않습니다." } }
    }
    await deleteUserCompletely(user._id)
    await reset("login-email", user.email)
  } catch (err) {
    return fail(err, "탈퇴")
  }
  clearSessionCookies(await cookies())
  redirect("/login?reason=deleted")
}
