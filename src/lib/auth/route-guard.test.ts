import { describe, expect, it } from "vitest";
import { decideRoute } from "./route-guard";

const base = { search: "", method: "GET", signedIn: false, hadRefresh: false };

describe("decideRoute (proxy 분기)", () => {
  it("미로그인 보호 경로 → /login?next=, refresh가 있었으면 reason=expired", () => {
    expect(decideRoute({ ...base, pathname: "/mypage" })).toEqual({ type: "redirect", to: "/login?next=%2Fmypage" });
    expect(decideRoute({ ...base, pathname: "/mypage", hadRefresh: true })).toEqual({ type: "redirect", to: "/login?next=%2Fmypage&reason=expired" });
  });
  it("로그인 상태 GET /login·/signup → next 또는 /mypage", () => {
    expect(decideRoute({ ...base, pathname: "/login", signedIn: true })).toEqual({ type: "redirect", to: "/mypage" });
    expect(decideRoute({ ...base, pathname: "/login", search: "?next=/signup/complete", signedIn: true })).toEqual({ type: "redirect", to: "/signup/complete" });
    expect(decideRoute({ ...base, pathname: "/login", search: "?next=//evil.com", signedIn: true })).toEqual({ type: "redirect", to: "/mypage" });
  });
  it("회귀: 서명만 유효한 오래된 access(DAL이 reason을 붙여 보냄)는 /login을 그대로 보여 루프가 없다", () => {
    // DAL: tokenVersion 불일치 → /login?reason=expired. proxy는 서명만 보므로 signedIn=true
    const atLogin = decideRoute({ ...base, pathname: "/login", search: "?reason=expired", signedIn: true });
    expect(atLogin).toEqual({ type: "next" });
    // DAL이 실제로 보내는 형태(reason + next)도 그대로 보여준다
    expect(decideRoute({ ...base, pathname: "/login", search: "?reason=expired&next=%2Fmypage", signedIn: true })).toEqual({ type: "next" });
  });
  it("POST(Server Action)·하위 경로는 통과", () => {
    expect(decideRoute({ ...base, pathname: "/login", method: "POST", signedIn: true })).toEqual({ type: "next" });
    expect(decideRoute({ ...base, pathname: "/signup/complete", signedIn: true })).toEqual({ type: "next" });
  });
});
