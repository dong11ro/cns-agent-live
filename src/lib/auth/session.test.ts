import { describe, expect, it } from "vitest";
import { decideRefresh, GRACE_MS } from "./session";

const createdAt = new Date("2026-11-01T00:00:00Z");
const now = new Date("2026-11-03T00:00:00Z");
const base = {
  tokenHash: "new",
  prevTokenHash: "old",
  rotatedAt: new Date(now.getTime() - 10_000),
  createdAt,
  expiresAt: new Date(now.getTime() + 86_400_000),
};

describe("decideRefresh", () => {
  it("현재 토큰이면 회전", () => {
    expect(decideRefresh(base, "new", now)).toBe("rotate");
  });
  it("30초 내 이전 토큰 재사용은 유예(access만)", () => {
    expect(decideRefresh(base, "old", now)).toBe("grace");
  });
  it("30초 후 이전 토큰 재사용은 폐기", () => {
    const later = new Date(base.rotatedAt.getTime() + GRACE_MS + 1);
    expect(decideRefresh(base, "old", later)).toBe("revoke");
  });
  it("30일 상한 초과·만료·없는 세션·모르는 토큰은 거부", () => {
    expect(decideRefresh(base, "new", new Date(createdAt.getTime() + 30 * 86_400_000))).toBe("reject");
    expect(decideRefresh({ ...base, expiresAt: now }, "new", now)).toBe("reject");
    expect(decideRefresh(null, "new", now)).toBe("reject");
    expect(decideRefresh(base, "other", now)).toBe("reject");
  });
});
