import { NextResponse, type NextRequest } from "next/server"
import { decideRoute } from "@/lib/auth/route-guard"
import { clearSessionCookies, COOKIE, rotateSession, writeSessionCookies, type IssuedTokens } from "@/lib/auth/session"
import { verifyAccessToken } from "@/lib/auth/tokens"

/**
 * 낙관적 검사만 한다: access 서명·만료 확인, 보호 경로 리다이렉트.
 * 예외로 access 만료 + refresh 있음이면 여기서 회전한다(렌더 중엔 쿠키를 쓸 수 없어서).
 * 권위 있는 검사는 DAL(verifySession)이 한다.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const refreshToken = request.cookies.get(COOKIE.refresh)?.value
  let claims = await verifyAccessToken(request.cookies.get(COOKIE.access)?.value)
  let issued: IssuedTokens | null = null
  let clear = false

  if (!claims && refreshToken) {
    const rotated = await rotateSession(refreshToken).catch((err) => {
      console.error("[auth] refresh 회전 실패", err instanceof Error ? err.name : "unknown")
      return null
    })
    if (rotated) {
      issued = rotated.tokens
      claims = rotated.claims
      // 같은 요청의 렌더가 새 토큰을 보도록 요청 쿠키도 갱신
      request.cookies.set(COOKIE.access, issued.access)
      if (issued.refresh) request.cookies.set(COOKIE.refresh, issued.refresh)
    } else {
      clear = true
      request.cookies.delete(COOKIE.access)
      request.cookies.delete(COOKIE.refresh)
    }
  }

  const decision = decideRoute({ pathname, search, method: request.method, signedIn: !!claims, hadRefresh: !!refreshToken })
  const response =
    decision.type === "redirect"
      ? NextResponse.redirect(new URL(decision.to, request.url))
      : NextResponse.next({ request: { headers: request.headers } })

  if (issued) writeSessionCookies(response.cookies, issued)
  if (clear) clearSessionCookies(response.cookies)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
}
