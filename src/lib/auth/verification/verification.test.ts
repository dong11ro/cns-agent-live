import { describe, expect, it } from "vitest";
import { parseConfig } from "../config";
import { consoleEmailSender } from "./console";
import { disabledEmailSender } from "./disabled";
import { checkCode, generateCode, hashCode, MAX_ATTEMPTS, selectImpl } from "./index";

const now = new Date("2026-11-03T00:00:00Z");
const doc = (code: string, over: Partial<{ attempts: number; expiresAt: Date }> = {}) => ({
  codeHash: hashCode(code),
  attempts: 0,
  expiresAt: new Date(now.getTime() + 60_000),
  ...over,
});

describe("검증 코드", () => {
  it("6자리 숫자", () => {
    expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it("해시 검증 성공·불일치", () => {
    expect(checkCode(doc("123456"), "123456", now)).toBe("ok");
    expect(checkCode(doc("123456"), "654321", now)).toBe("mismatch");
  });
  it("만료·시도 초과·없음", () => {
    expect(checkCode(doc("123456", { expiresAt: now }), "123456", now)).toBe("expired");
    expect(checkCode(doc("123456", { attempts: MAX_ATTEMPTS }), "123456", now)).toBe("too-many");
    expect(checkCode(null, "123456", now)).toBe("missing");
  });
});

describe("구현 선택", () => {
  const impls = { off: disabledEmailSender, console: consoleEmailSender };
  it("off면 disabled 구현, 호출 시 에러", async () => {
    const s = selectImpl("off", impls);
    expect(s).toBe(disabledEmailSender);
    await expect(s.send({ to: "a@b.co", subject: "s", text: "t" })).rejects.toThrow("verification disabled");
  });
  it("console 플래그면 console 구현", () => {
    expect(selectImpl("console", impls)).toBe(consoleEmailSender);
  });
  it("production + console 플래그는 설정 단계에서 실패", () => {
    const env = { NODE_ENV: "production", DATABASE_URL: "mongodb://h/db", AUTH_SECRET: "s".repeat(32), APP_ORIGIN: "https://a.com", AUTH_EMAIL_VERIFICATION: "console" };
    expect(() => parseConfig(env)).toThrow(/AUTH_EMAIL_VERIFICATION/);
  });
});
