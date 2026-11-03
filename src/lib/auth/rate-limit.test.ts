import { describe, expect, it } from "vitest"
import { isLimited, rateKey } from "./rate-limit"

describe("rate limit", () => {
  it("키는 평문을 담지 않고 결정적이다", () => {
    const k = rateKey("login-email", "a@b.co")
    expect(k).toBe(rateKey("login-email", "a@b.co"))
    expect(k).not.toContain("a@b.co")
    expect(k.startsWith("login-email:")).toBe(true)
    expect(rateKey("login-email", "c@d.co")).not.toBe(k)
  })
  it("한도 초과 판정", () => {
    expect(isLimited(5, 5)).toBe(false)
    expect(isLimited(6, 5)).toBe(true)
  })
})
