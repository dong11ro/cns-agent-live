import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PartyPopper } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { verifySession } from "@/lib/auth/dal"
import { safeNext } from "@/lib/auth/redirect"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "가입 완료 | 넥스트스텝 IT 아카데미" }

// 토스트 대신 완료 화면 한 장(토스트 의존성을 늘리지 않기 위해)
export default function SignupCompletePage({ searchParams }: PageProps<"/signup/complete">) {
  return (
    <Card className="items-center gap-5 rounded-3xl px-6 py-10 text-center shadow-xl shadow-primary/5">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <PartyPopper className="size-7" aria-hidden />
      </span>
      <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />}>
        <Welcome searchParams={searchParams} />
      </Suspense>
    </Card>
  )
}

async function Welcome({ searchParams }: { searchParams: PageProps<"/signup/complete">["searchParams"] }) {
  const user = await verifySession()
  const next = safeNext((await searchParams).next, "")
  return (
    <>
      <h1 className="font-heading text-3xl">환영합니다, {user.name}님!</h1>
      <p className="text-sm text-muted-foreground">가입이 완료되어 로그인되었습니다.</p>
      <div className="flex w-full flex-col gap-2">
        <Link
          href={next || "/#courses"}
          className={cn(buttonVariants(), "h-11 rounded-full bg-linear-to-r gradient-brand font-bold shadow-md shadow-primary/30 hover:opacity-90")}
        >
          {next ? "하던 곳으로 돌아가기" : "강의 둘러보기"}
        </Link>
        <Link href="/mypage" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full")}>
          마이페이지
        </Link>
      </div>
    </>
  )
}
