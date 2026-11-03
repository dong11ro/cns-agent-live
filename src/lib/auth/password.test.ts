import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "./password";

describe("argon2id", () => {
  it("hash → verify 성공, 틀린 비밀번호 실패, 파라미터 포함", async () => {
    const h = await hashPassword("Ab1!xyzw");
    expect(h.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);
    expect(needsRehash(h)).toBe(false);
    expect(await verifyPassword(h, "Ab1!xyzw")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
  });
  it("해시가 없으면 false", async () => {
    expect(await verifyPassword(null, "anything")).toBe(false);
  });
});
