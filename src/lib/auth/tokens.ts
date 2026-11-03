import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { deriveKey } from "./config";

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 14 * 24 * 60 * 60;
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;

const ISSUER = "nextstep";
const AUDIENCE = "nextstep-web";

export type AccessClaims = { sub: string; sid: string; ver: number };

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ sid: claims.sid, ver: claims.ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(deriveKey("access-jwt"));
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, deriveKey("access-jwt"), { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string" || typeof payload.ver !== "number") return null;
    return { sub: payload.sub, sid: payload.sid, ver: payload.ver };
  } catch {
    return null;
  }
}

/** OAuth state·가입 대기 같은 짧은 임시 쿠키용 서명 토큰. purpose별로 키와 aud를 나눈다. */
export async function signTempToken(purpose: string, payload: JWTPayload, ttlSec: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(purpose)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(deriveKey(`temp:${purpose}`));
}

export async function verifyTempToken<T extends JWTPayload>(purpose: string, token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, deriveKey(`temp:${purpose}`), { algorithms: ["HS256"], issuer: ISSUER, audience: purpose });
    return payload as T;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
