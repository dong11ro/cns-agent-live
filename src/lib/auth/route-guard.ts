import { safeNext } from "./redirect"

const PROTECTED = ["/mypage"]
const GUEST_ONLY = ["/login", "/signup"] // 정확히 이 경로만(/signup/oauth·/signup/complete 제외)

export type RouteDecision = { type: "next" } | { type: "redirect"; to: string }

/**
 * proxy의 낙관적 분기 판단(서명만 본 결과로 결정). DB를 보지 않는 순수 함수.
 * reason이 붙은 /login은 DAL이 "서명은 맞지만 무효(tokenVersion 불일치 등)"로 보낸 것이라
 * 로그인 사용자로 보고 되돌려 보내면 /mypage ↔ /login 루프가 생긴다. 그래서 그대로 보여준다.
 */
export function decideRoute(input: { pathname: string; search: string; method: string; signedIn: boolean; hadRefresh: boolean }): RouteDecision {
  const { pathname, search, method, signedIn, hadRefresh } = input
  const params = new URLSearchParams(search)
  if (!signedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URLSearchParams({ next: pathname + search })
    if (hadRefresh) login.set("reason", "expired")
    return { type: "redirect", to: `/login?${login}` }
  }
  if (signedIn && GUEST_ONLY.includes(pathname) && method === "GET" && !params.has("reason")) {
    return { type: "redirect", to: safeNext(params.get("next"), "/mypage") }
  }
  return { type: "next" }
}
