import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type OAuthButton = { id: "kakao" | "google"; label: string; enabled: boolean }

// 각 제공자 브랜드 가이드의 버튼 색(카카오 #FEE500 배경 + 85% 검정 글자, Google 흰 배경 + 테두리)
const STYLE = {
  kakao: "border-transparent bg-[#FEE500] text-black/85 hover:bg-[#FEE500]/90",
  google: "border-border bg-white text-[#1f1f1f] hover:bg-muted dark:bg-white",
}

function KakaoLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M12 3C6.48 3 2 6.5 2 10.82c0 2.8 1.88 5.25 4.7 6.63l-.95 3.5c-.08.3.26.54.52.37l4.14-2.74c.52.06 1.05.1 1.59.1 5.52 0 10-3.5 10-7.86S17.52 3 12 3Z" />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

/**
 * 제공자별 시작 링크(GET, 상태 변경 없음). 키가 없는 제공자는 "준비 중"으로 비활성 표시한다.
 * 화면에 있는 제공자 목록·활성 여부는 서버에서 계산해 넘긴다.
 */
export function OAuthButtons({ providers, intent = "login", next, verb = "로그인" }: {
  providers: OAuthButton[]
  intent?: "login" | "link"
  next?: string
  verb?: string
}) {
  return (
    <div className="grid gap-2">
      {providers.map((p) => {
        const className = cn(buttonVariants({ variant: "outline" }), "relative h-11 w-full rounded-full font-bold", STYLE[p.id])
        const content = (
          <>
            {p.id === "kakao" ? <KakaoLogo /> : <GoogleLogo />}
            {p.label}로 {verb}
          </>
        )
        if (!p.enabled) {
          return (
            <button key={p.id} type="button" disabled aria-describedby={`oauth-${p.id}-soon`} className={cn(className, "opacity-60")}>
              {content}
              <span id={`oauth-${p.id}-soon`} className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[0.7rem] font-medium">
                준비 중
              </span>
            </button>
          )
        }
        const params = new URLSearchParams({ intent, ...(next ? { next } : {}) })
        return (
          <a key={p.id} href={`/api/auth/oauth/${p.id}?${params}`} className={className}>
            {content}
          </a>
        )
      })}
    </div>
  )
}
