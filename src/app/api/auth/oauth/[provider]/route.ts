import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authorizationUrl, isProviderId } from "@/lib/auth/oauth/providers";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, signOAuthStart, TEMP_TTL_SEC } from "@/lib/auth/oauth/state";
import { safeNext } from "@/lib/auth/redirect";
import { cookieOptions } from "@/lib/auth/session";

/** 시작: state·PKCE 임시 쿠키만 발급하고 제공자로 보낸다(상태 변경 없음). ?intent=login|link&next= */
export async function GET(request: Request, ctx: RouteContext<"/api/auth/oauth/[provider]">) {
  const { provider } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const intent = params.get("intent") === "link" ? "link" : "login";
  const failTo = intent === "link" ? "/mypage" : "/login";

  // 알 수 없는 제공자·키 미설정(비활성)은 404/500 대신 안내와 함께 돌려보낸다
  if (!isProviderId(provider)) redirect(`${failTo}?error=oauth_disabled`);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = authorizationUrl(provider, state, codeVerifier);
  if (!url) redirect(`${failTo}?error=oauth_disabled`);

  const token = await signOAuthStart({ provider, state, codeVerifier, intent, next: safeNext(params.get("next")) });
  (await cookies()).set(OAUTH_COOKIE, token, cookieOptions(TEMP_TTL_SEC, OAUTH_COOKIE_PATH));
  redirect(url.toString());
}
