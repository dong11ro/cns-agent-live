import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { Suspense } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PROVIDER_LABELS } from "@/lib/auth/oauth/providers"
import { PENDING_COOKIE, verifyPendingSignup } from "@/lib/auth/oauth/state"
import { cn } from "@/lib/utils"
import { OAuthSignupForm } from "./_components/oauth-signup-form"

export const metadata: Metadata = { title: "소셜 계정으로 가입 | 넥스트스텝 IT 아카데미" }

export default function OAuthSignupPage() {
  return (
    <Card className="gap-6 rounded-3xl px-6 py-8 shadow-xl shadow-primary/5">
      <h1 className="text-center font-heading text-3xl">소셜 계정으로 가입</h1>
      {/* 가입 대기 쿠키를 읽으므로 경계 안에서 렌더 */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <PendingSignup />
      </Suspense>
    </Card>
  )
}

async function PendingSignup() {
  const pending = await verifyPendingSignup((await cookies()).get(PENDING_COOKIE)?.value)
  if (!pending) {
    return (
      <div className="grid gap-4 text-center">
        <p role="alert" className="text-sm text-muted-foreground">
          가입 대기 시간이 지났거나 잘못된 접근입니다. 다시 시도해 주세요.
        </p>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-full")}>
          로그인으로 돌아가기
        </Link>
      </div>
    )
  }
  return <OAuthSignupForm providerLabel={PROVIDER_LABELS[pending.provider]} email={pending.email} name={(pending.name ?? "").slice(0, 20)} />
}
