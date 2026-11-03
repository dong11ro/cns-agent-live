import "server-only";
import { hkdfSync } from "node:crypto";

export type VerificationMode = "off" | "console";
export type OAuthProviderId = "google" | "kakao";
export const OAUTH_PROVIDERS: OAuthProviderId[] = ["kakao", "google"];

type Env = Record<string, string | undefined>;

export type AuthConfig = {
  databaseUrl: string;
  appOrigin: string;
  secret: string;
  isProd: boolean;
  verification: { email: VerificationMode; sms: VerificationMode; identity: VerificationMode };
};

function parseMode(name: string, value: string | undefined, isProd: boolean): VerificationMode {
  const mode = (value ?? "off").trim() || "off";
  if (mode !== "off" && mode !== "console") throw new Error(`${name}: 지원하지 않는 값입니다(off | console)`);
  if (mode === "console" && isProd) throw new Error(`${name}=console 은 개발 환경에서만 쓸 수 있습니다`);
  return mode;
}

/** env를 검증해 설정을 만든다. 실패 시 값은 출력하지 않고 키 이름만 알린다. */
export function parseConfig(env: Env): AuthConfig {
  const isProd = env.NODE_ENV === "production";
  const databaseUrl = env.DATABASE_URL ?? "";
  if (!/^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(databaseUrl)) {
    throw new Error("DATABASE_URL: 경로에 DB 이름이 포함된 MongoDB 연결 문자열이어야 합니다");
  }
  const secret = env.AUTH_SECRET ?? "";
  if (Buffer.byteLength(secret) < 32) throw new Error("AUTH_SECRET: 32바이트 이상이어야 합니다");
  const appOrigin = env.APP_ORIGIN ?? "";
  if (!/^https?:\/\/[^/]+$/.test(appOrigin)) throw new Error("APP_ORIGIN: http(s)://host[:port] 형식이어야 합니다");
  return {
    databaseUrl,
    appOrigin,
    secret,
    isProd,
    verification: {
      email: parseMode("AUTH_EMAIL_VERIFICATION", env.AUTH_EMAIL_VERIFICATION, isProd),
      sms: parseMode("AUTH_SMS_VERIFICATION", env.AUTH_SMS_VERIFICATION, isProd),
      identity: parseMode("AUTH_IDENTITY_VERIFICATION", env.AUTH_IDENTITY_VERIFICATION, isProd),
    },
  };
}

let cached: AuthConfig | undefined;
export function getConfig(): AuthConfig {
  return (cached ??= parseConfig(process.env));
}

/** client id·secret이 둘 다 있는 제공자만 활성. AUTH_SECRET 없이도 동작해야 버튼 렌더가 안전하다. */
export function getOAuthCredentials(provider: OAuthProviderId, env: Env = process.env) {
  const key = provider.toUpperCase();
  const clientId = env[`AUTH_${key}_CLIENT_ID`];
  const clientSecret = env[`AUTH_${key}_CLIENT_SECRET`];
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function enabledOAuthProviders(env: Env = process.env): OAuthProviderId[] {
  return OAUTH_PROVIDERS.filter((p) => getOAuthCredentials(p, env));
}

const keyCache = new Map<string, Uint8Array>();
/** AUTH_SECRET 하나에서 용도별 키를 파생한다. */
export function deriveKey(purpose: string): Uint8Array {
  let key = keyCache.get(purpose);
  if (!key) {
    key = new Uint8Array(hkdfSync("sha256", getConfig().secret, "nextstep-auth", purpose, 32));
    keyCache.set(purpose, key);
  }
  return key;
}
