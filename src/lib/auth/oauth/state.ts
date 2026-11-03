import "server-only"
import { timingSafeEqual } from "node:crypto"
import type { OAuthProviderId } from "../config"
import { signTempToken, verifyTempToken } from "../tokens"
import type { OAuthProfile } from "./providers"

export const OAUTH_COOKIE = "ns_oauth"
export const OAUTH_COOKIE_PATH = "/api/auth/oauth"
export const PENDING_COOKIE = "ns_pending"
export const TEMP_TTL_SEC = 10 * 60

export type OAuthIntent = "login" | "link"

export type OAuthStart = { provider: OAuthProviderId; state: string; codeVerifier: string; intent: OAuthIntent; next: string }

export type PendingSignup = OAuthProfile & { provider: OAuthProviderId; next: string }

export function signOAuthStart(data: OAuthStart) {
  return signTempToken("oauth", data, TEMP_TTL_SEC)
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** 서명된 쿠키를 검증하고 제공자·state(상수 시간 비교)가 맞을 때만 시작 정보를 돌려준다. */
export async function verifyOAuthCallback(cookie: string | undefined, provider: string, state: string | null): Promise<OAuthStart | null> {
  const data = await verifyTempToken<OAuthStart & Record<string, unknown>>("oauth", cookie)
  if (!data || !state || data.provider !== provider || typeof data.state !== "string") return null
  return safeEqual(data.state, state) ? data : null
}

export function signPendingSignup(data: PendingSignup) {
  return signTempToken("pending", data, TEMP_TTL_SEC)
}

export function verifyPendingSignup(cookie: string | undefined) {
  return verifyTempToken<PendingSignup & Record<string, unknown>>("pending", cookie)
}
