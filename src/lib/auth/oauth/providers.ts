import "server-only";
import { decodeIdToken, Google, Kakao } from "arctic";
import { getConfig, getOAuthCredentials, OAUTH_PROVIDERS, type OAuthProviderId } from "../config";

export type OAuthProfile = {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export const PROVIDER_LABELS: Record<OAuthProviderId, string> = { kakao: "카카오", google: "Google" };

export function isProviderId(value: string): value is OAuthProviderId {
  return (OAUTH_PROVIDERS as string[]).includes(value);
}

function redirectUri(provider: OAuthProviderId) {
  return `${getConfig().appOrigin}/api/auth/oauth/${provider}/callback`;
}

/** client id·secret이 없으면 null(비활성). */
function client(provider: OAuthProviderId) {
  const creds = getOAuthCredentials(provider);
  if (!creds) return null;
  return provider === "google"
    ? new Google(creds.clientId, creds.clientSecret, redirectUri(provider))
    : new Kakao(creds.clientId, creds.clientSecret, redirectUri(provider));
}

export function isProviderEnabled(provider: OAuthProviderId): boolean {
  return getOAuthCredentials(provider) !== null;
}

/** Google은 PKCE(S256), Kakao는 arctic 시그니처상 state만 쓴다. */
export function authorizationUrl(provider: OAuthProviderId, state: string, codeVerifier: string): URL | null {
  const c = client(provider);
  if (!c) return null;
  return c instanceof Google
    ? c.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"])
    : c.createAuthorizationURL(state, ["account_email", "profile_nickname"]);
}

export function normalizeGoogle(claims: Record<string, unknown>): OAuthProfile {
  return {
    providerAccountId: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : null,
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === "string" ? claims.name : null,
  };
}

type KakaoUser = {
  id: number | string;
  kakao_account?: { email?: string; is_email_valid?: boolean; is_email_verified?: boolean; profile?: { nickname?: string } };
};

/** Kakao는 이메일 동의가 선택이라 email이 없을 수 있다. */
export function normalizeKakao(user: KakaoUser): OAuthProfile {
  const acc = user.kakao_account ?? {};
  const email = acc.email && acc.is_email_valid !== false ? acc.email : null;
  return {
    providerAccountId: String(user.id),
    email,
    emailVerified: !!email && acc.is_email_verified === true,
    name: acc.profile?.nickname ?? null,
  };
}

/** 코드 교환 → 프로필. 제공자 토큰은 저장하지 않는다(로그인에만 씀). */
export async function fetchProfile(provider: OAuthProviderId, code: string, codeVerifier: string): Promise<OAuthProfile> {
  const c = client(provider);
  if (!c) throw new Error("provider disabled");
  if (c instanceof Google) {
    const tokens = await c.validateAuthorizationCode(code, codeVerifier);
    return normalizeGoogle(decodeIdToken(tokens.idToken()) as Record<string, unknown>);
  }
  const tokens = await c.validateAuthorizationCode(code);
  const res = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${tokens.accessToken()}` } });
  if (!res.ok) throw new Error(`kakao profile ${res.status}`);
  return normalizeKakao((await res.json()) as KakaoUser);
}

/** 화면 버튼 목록: 추천 순서(카카오 → Google), 키 없으면 비활성 */
export function oauthButtonList() {
  return OAUTH_PROVIDERS.map((id) => ({ id, label: PROVIDER_LABELS[id], enabled: isProviderEnabled(id) }));
}
