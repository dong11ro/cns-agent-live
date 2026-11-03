import { SignJWT } from "jose"
import { afterEach, describe, expect, it, vi } from "vitest"
import { deriveKey } from "./config"
import { signAccessToken, signTempToken, verifyAccessToken, verifyTempToken } from "./tokens"

const claims = { sub: "u1", sid: "s1", ver: 0 }

afterEach(() => vi.useRealTimers())

describe("access JWT", () => {
  it("sign → verify", async () => {
    expect(await verifyAccessToken(await signAccessToken(claims))).toEqual(claims)
  })
  it("15분 뒤 만료", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-03T00:00:00Z") })
    const t = await signAccessToken(claims)
    vi.setSystemTime(new Date("2026-11-03T00:16:00Z"))
    expect(await verifyAccessToken(t)).toBeNull()
  })
  it("다른 키·변조 서명 거부", async () => {
    const other = await new SignJWT({ sid: "s1", ver: 0 }).setProtectedHeader({ alg: "HS256" }).setSubject("u1")
      .setIssuer("nextstep").setAudience("nextstep-web").setExpirationTime("15m").sign(new TextEncoder().encode("x".repeat(32)))
    expect(await verifyAccessToken(other)).toBeNull()
    const t = await signAccessToken(claims)
    expect(await verifyAccessToken(t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA"))).toBeNull()
  })
  it("aud/iss 불일치 거부", async () => {
    const key = deriveKey("access-jwt")
    const wrongAud = await new SignJWT({ sid: "s1", ver: 0 }).setProtectedHeader({ alg: "HS256" }).setSubject("u1")
      .setIssuer("nextstep").setAudience("other").setExpirationTime("15m").sign(key)
    const wrongIss = await new SignJWT({ sid: "s1", ver: 0 }).setProtectedHeader({ alg: "HS256" }).setSubject("u1")
      .setIssuer("evil").setAudience("nextstep-web").setExpirationTime("15m").sign(key)
    expect(await verifyAccessToken(wrongAud)).toBeNull()
    expect(await verifyAccessToken(wrongIss)).toBeNull()
  })
  it("임시 토큰은 용도가 다르면 거부", async () => {
    const t = await signTempToken("oauth", { state: "x" }, 600)
    expect((await verifyTempToken<{ state: string }>("oauth", t))?.state).toBe("x")
    expect(await verifyTempToken("pending", t)).toBeNull()
    expect(await verifyAccessToken(t)).toBeNull()
  })
})
