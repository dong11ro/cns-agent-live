import { describe, expect, it } from "vitest";
import { emailSchema, newPasswordSchema, normalizeEmail, passwordStrength, signupSchema } from "./schemas";

const ok = (pw: string, email = "") => newPasswordSchema(email).safeParse(pw).success;

describe("normalizeEmail", () => {
  it("대소문자·공백·전각을 정규화한다", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
    expect(normalizeEmail("ｆｏｏ＠ｅｘａｍｐｌｅ．ｃｏｍ")).toBe("foo@example.com");
    expect(emailSchema.parse(" A@B.co ")).toBe("a@b.co");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("비밀번호 정책", () => {
  it("3종 조합은 8자 경계", () => {
    expect(ok("Ab1!xyz")).toBe(false); // 7
    expect(ok("Ab1!xyzw")).toBe(true); // 8
  });
  it("2종 조합은 10자 경계", () => {
    expect(ok("abcdefg12")).toBe(false); // 9
    expect(ok("abcdefgh12")).toBe(true); // 10
  });
  it("1종만이면 거부, 64자 초과 거부", () => {
    expect(ok("abcdefghijkl")).toBe(false);
    expect(ok("Ab1!" + "x".repeat(61))).toBe(false);
  });
  it("이메일 아이디 포함 거부", () => {
    expect(ok("Hongildong1!", "hongildong@example.com")).toBe(false);
    expect(ok("Different1!", "hongildong@example.com")).toBe(true);
  });
  it("흔한 비밀번호 거부", () => {
    expect(ok("P@ssw0rd1")).toBe(false);
    expect(ok("1q2w3e4r!")).toBe(false);
  });
  it("강도 계산", () => {
    expect(passwordStrength("abc")).toBe(0);
    expect(passwordStrength("abcdefgh12")).toBe(1);
    expect(passwordStrength("Ab1!xyzw")).toBe(2);
    expect(passwordStrength("Ab1!xyzwLongPass")).toBe(3);
  });
});

describe("signupSchema", () => {
  const base = { email: "a@b.co", password: "Ab1!xyzw", passwordConfirm: "Ab1!xyzw", name: "홍길동" };
  it("필수 약관 누락 거부", () => {
    const r = signupSchema.safeParse({ ...base, agreements: { service: true, privacy: true, age14: false } });
    expect(r.success).toBe(false);
  });
  it("필수 약관 동의 시 통과, 선택은 false로 채움", () => {
    const r = signupSchema.parse({ ...base, agreements: { service: true, privacy: true, age14: true } });
    expect(r.agreements).toEqual({ service: true, privacy: true, age14: true, marketing: false });
  });
  it("비밀번호 확인 불일치", () => {
    const r = signupSchema.safeParse({ ...base, passwordConfirm: "x", agreements: { service: true, privacy: true, age14: true } });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["passwordConfirm"]);
  });
});
