import { describe, expect, it } from "vitest"
import { signTempToken } from "../tokens"
import { decideLink } from "./link"
import { normalizeGoogle, normalizeKakao } from "./providers"
import { signOAuthStart, verifyOAuthCallback, verifyPendingSignup } from "./state"

describe("링크 정책(§4.6)", () => {
  const base = { intent: "login" as const, currentUserId: null, linkedUserId: null, emailOwnerId: null }
  it("이미 연결된 providerAccountId → 그 user로 로그인", () => {
    expect(decideLink({ ...base, linkedUserId: "u1" })).toBe("login")
  })
  it("intent=link → 현재 user에 연결, 다른 user에 연결돼 있으면 거부", () => {
    expect(decideLink({ ...base, intent: "link", currentUserId: "u1" })).toBe("link")
    expect(decideLink({ ...base, intent: "link", currentUserId: "u1", linkedUserId: "u1" })).toBe("link")
    expect(decideLink({ ...base, intent: "link", currentUserId: "u1", linkedUserId: "u2" })).toBe("reject")
    expect(decideLink({ ...base, intent: "link", currentUserId: null })).toBe("reject")
  })
  it("미연결 + 같은 이메일 로컬 계정 → 자동 연결하지 않고 로컬 로그인 요구", () => {
    expect(decideLink({ ...base, emailOwnerId: "u1" })).toBe("require-local-login")
  })
  it("미연결 + 새 이메일(또는 없음) → 가입 보완 단계", () => {
    expect(decideLink(base)).toBe("pending-signup")
  })
})

describe("OAuth state 검증", () => {
  const start = { provider: "google" as const, state: "state-abc", codeVerifier: "cv", intent: "login" as const, next: "/" }
  it("쿠키·제공자·state가 맞으면 통과", async () => {
    const cookie = await signOAuthStart(start)
    expect((await verifyOAuthCallback(cookie, "google", "state-abc"))?.codeVerifier).toBe("cv")
  })
  it("state 변조·누락, 다른 제공자, 쿠키 변조·없음은 거부", async () => {
    const cookie = await signOAuthStart(start)
    expect(await verifyOAuthCallback(cookie, "google", "state-abX")).toBeNull()
    expect(await verifyOAuthCallback(cookie, "google", null)).toBeNull()
    expect(await verifyOAuthCallback(cookie, "kakao", "state-abc")).toBeNull()
    expect(await verifyOAuthCallback(cookie.slice(0, -3) + "xyz", "google", "state-abc")).toBeNull()
    expect(await verifyOAuthCallback(undefined, "google", "state-abc")).toBeNull()
  })
  it("다른 용도로 서명된 토큰은 가입 대기 쿠키로 인정하지 않음", async () => {
    expect(await verifyPendingSignup(await signTempToken("oauth", { provider: "google" }, 60))).toBeNull()
  })
})

describe("프로필 정규화", () => {
  it("Google: email_verified 반영", () => {
    expect(normalizeGoogle({ sub: "1", email: "a@b.co", email_verified: true, name: "A" })).toEqual({ providerAccountId: "1", email: "a@b.co", emailVerified: true, name: "A" })
  })
  it("Kakao: 이메일 미동의면 email null", () => {
    expect(normalizeKakao({ id: 42, kakao_account: { profile: { nickname: "춘식" } } })).toEqual({ providerAccountId: "42", email: null, emailVerified: false, name: "춘식" })
  })
})
