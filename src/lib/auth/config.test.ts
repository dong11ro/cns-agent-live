import { describe, expect, it } from "vitest";
import { enabledOAuthProviders, parseConfig } from "./config";

const base = { DATABASE_URL: "mongodb+srv://u:p@h.example.net/nextstep?retryWrites=true", AUTH_SECRET: "s".repeat(32), APP_ORIGIN: "http://localhost:3005" };

describe("parseConfig", () => {
  it("정상 값", () => {
    expect(parseConfig(base).verification).toEqual({ email: "off", sms: "off", identity: "off" });
  });
  it("DB 이름 없는 URL·짧은 비밀 거부(값은 메시지에 없음)", () => {
    expect(() => parseConfig({ ...base, DATABASE_URL: "mongodb+srv://u:p@h.example.net/" })).toThrow(/^DATABASE_URL/);
    expect(() => parseConfig({ ...base, AUTH_SECRET: "short" })).toThrow(/^AUTH_SECRET/);
  });
  it("OAuth는 id·secret 둘 다 있을 때만 활성", () => {
    expect(enabledOAuthProviders({})).toEqual([]);
    expect(enabledOAuthProviders({ AUTH_GOOGLE_CLIENT_ID: "a" })).toEqual([]);
    expect(enabledOAuthProviders({ AUTH_GOOGLE_CLIENT_ID: "a", AUTH_GOOGLE_CLIENT_SECRET: "b" })).toEqual(["google"]);
  });
});
