import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { OAuthButtons } from "@/components/molecules/oauth-buttons"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { oauthButtonList } from "@/lib/auth/oauth/providers"
import { safeNext } from "@/lib/auth/redirect"
import { LoginForm } from "./_components/login-form"

export const metadata: Metadata = { title: "로그인 | 넥스트스텝 IT 아카데미" }

const NOTICES: Record<string, string> = {
  expired: "로그인 시간이 만료되었습니다. 다시 로그인해 주세요.",
  "linked-required": "이미 가입된 이메일입니다. 비밀번호로 로그인한 뒤 마이페이지에서 소셜 계정을 연결하세요.",
  deleted: "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.",
}

const ERRORS: Record<string, string> = {
  oauth_cancelled: "소셜 로그인이 취소되었습니다.",
  oauth_failed: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  oauth_disabled: "아직 준비 중인 로그인 방법입니다.",
  oauth_pending_expired: "가입 대기 시간이 지났습니다. 다시 시도해 주세요.",
  oauth_link_conflict: "다른 계정에 연결된 소셜 계정입니다.",
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Card className="gap-6 rounded-3xl px-6 py-8 shadow-xl shadow-primary/5">
      <h1 className="text-center font-heading text-3xl">로그인</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
        <LoginBody searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </Card>
  )
}

async function LoginBody({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "")
  const notice = NOTICES[str(params.reason)]
  const error = ERRORS[str(params.error)]
  const next = safeNext(params.next)
  return (
    <>
      {notice && (
        <p role="status" className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <LoginForm next={next} defaultEmail={str(params.email)} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        또는
        <Separator className="flex-1" />
      </div>
      <OAuthButtons providers={oauthButtonList()} next={next === "/" ? undefined : next} />
      <p className="text-center text-xs text-muted-foreground">
        소셜 계정으로 가입하셨다면 위 소셜 로그인 버튼을 이용하세요. 비밀번호를 잊으셨다면 고객센터로 문의해 주세요.
      </p>
    </>
  )
}
