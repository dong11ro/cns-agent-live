import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { getMyConsents, getMyLinkedAccounts, verifySession } from "@/lib/auth/dal"
import { oauthButtonList, PROVIDER_LABELS } from "@/lib/auth/oauth/providers"
import { ConsentsSection } from "./_components/consents-section"
import { DangerZoneSection } from "./_components/danger-zone-section"
import { SectionSkeleton } from "./_components/form-status"
import { LinkedAccountsSection } from "./_components/linked-accounts-section"
import { PasswordSection } from "./_components/password-section"
import { ProfileSection } from "./_components/profile-section"

export const metadata: Metadata = { title: "마이페이지 | 넥스트스텝 IT 아카데미" }

const LINK_ERRORS: Record<string, string> = {
  oauth_link_conflict: "다른 계정에 연결된 소셜 계정입니다.",
  oauth_provider_linked: "이미 같은 제공자의 다른 계정이 연결되어 있습니다.",
  oauth_cancelled: "소셜 계정 연결이 취소되었습니다.",
  oauth_failed: "소셜 계정 연결에 실패했습니다. 다시 시도해 주세요.",
  oauth_disabled: "아직 준비 중인 연결 방법입니다.",
}

// 페이지는 섹션 조립만 한다. 세션은 섹션마다 Suspense 경계 안에서 DAL로 읽는다(Cache Components 규칙).
export default function MyPage({ searchParams }: PageProps<"/mypage">) {
  return (
    <main className="mx-auto grid w-full max-w-2xl flex-1 gap-6 px-4 py-10">
      <div className="grid gap-2">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          홈으로
        </Link>
        <h1 className="font-heading text-3xl">마이페이지</h1>
      </div>
      <Suspense fallback={<SectionSkeleton />}>
        <Profile />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Password />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <LinkedAccounts searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Consents />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <DangerZone />
      </Suspense>
    </main>
  )
}

async function Profile() {
  return <ProfileSection user={await verifySession()} />
}

async function Password() {
  const user = await verifySession()
  return <PasswordSection hasPassword={user.hasPassword} email={user.email} />
}

async function LinkedAccounts({ searchParams }: { searchParams: PageProps<"/mypage">["searchParams"] }) {
  const [user, linked, params] = await Promise.all([verifySession(), getMyLinkedAccounts(), searchParams])
  const rows = oauthButtonList().map((p) => {
    const account = linked.find((a) => a.provider === p.id)
    return { ...p, connected: !!account, email: account?.email ?? null }
  })
  const linkedProvider = typeof params.linked === "string" && params.linked in PROVIDER_LABELS ? (params.linked as keyof typeof PROVIDER_LABELS) : null
  const error = typeof params.error === "string" ? LINK_ERRORS[params.error] : undefined
  const notice = linkedProvider ? { ok: true, text: `${PROVIDER_LABELS[linkedProvider]} 계정을 연결했습니다.` } : error ? { ok: false, text: error } : undefined
  return <LinkedAccountsSection rows={rows} canUnlink={user.hasPassword || linked.length > 1} notice={notice} />
}

async function Consents() {
  return <ConsentsSection consents={await getMyConsents()} />
}

async function DangerZone() {
  const user = await verifySession()
  return <DangerZoneSection hasPassword={user.hasPassword} />
}
