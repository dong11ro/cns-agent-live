import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("내부 경로만 허용", () => {
    expect(safeNext("/mypage")).toBe("/mypage");
    expect(safeNext("/mypage?tab=1")).toBe("/mypage?tab=1");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "", null, undefined, "mypage", "/\nx"]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
