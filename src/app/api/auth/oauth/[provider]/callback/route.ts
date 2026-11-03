import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserDoc } from "@/lib/auth/dal";
import { resolveOAuth, type LinkOutcome } from "@/lib/auth/oauth/link";
import { fetchProfile, isProviderEnabled, isProviderId } from "@/lib/auth/oauth/providers";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, PENDING_COOKIE, signPendingSignup, TEMP_TTL_SEC, verifyOAuthCallback } from "@/lib/auth/oauth/state";
import { cookieOptions, startSession } from "@/lib/auth/session";

const REJECT_ERRORS = { conflict: "oauth_link_conflict", "not-logged-in": "oauth_failed", "provider-already-linked": "oauth_provider_linked" };

/** 콜백: state 검증 → 토큰 교환 → 프로필 → 링크 정책(§4.6) → 세션 발급 또는 가입 보완 단계 */
export async function GET(request: Request, ctx: RouteContext<"/api/auth/oauth/[provider]/callback">) {
  const { provider } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const store = await cookies();
  const start = await verifyOAuthCallback(store.get(OAUTH_COOKIE)?.value, provider, params.get("state"));
  store.set(OAUTH_COOKIE, "", cookieOptions(0, OAUTH_COOKIE_PATH)); // 1회용

  if (!start || !isProviderId(provider) || !isProviderEnabled(provider)) redirect("/login?error=oauth_failed");
  const failTo = start.intent === "link" ? "/mypage" : "/login";
  if (params.get("error")) redirect(`${failTo}?error=oauth_cancelled`);
  const code = params.get("code");
  if (!code) redirect(`${failTo}?error=oauth_failed`);

  let outcome: LinkOutcome;
  let profile;
  try {
    profile = await fetchProfile(provider, code, start.codeVerifier);
    const current = start.intent === "link" ? await getCurrentUserDoc() : null;
    outcome = await resolveOAuth(provider, profile, start.intent, current?._id ?? null);
    if (outcome.type === "login") await startSession(outcome.userId, outcome.tokenVersion);
  } catch (err) {
    console.error("[auth] OAuth 콜백 실패", err instanceof Error ? err.name : "unknown");
    redirect(`${failTo}?error=oauth_failed`);
  }

  switch (outcome.type) {
    case "login":
      redirect(start.next);
    case "linked":
      redirect(`/mypage?linked=${provider}`);
    case "reject":
      redirect(`${failTo}?error=${REJECT_ERRORS[outcome.reason]}`);
    case "require-local-login":
      redirect(`/login?reason=linked-required&email=${encodeURIComponent(outcome.email)}`);
    case "pending-signup":
      store.set(PENDING_COOKIE, await signPendingSignup({ ...profile, provider, next: start.next }), cookieOptions(TEMP_TTL_SEC));
      redirect("/signup/oauth");
  }
}

