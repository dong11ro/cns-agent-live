import type { FormState } from "@/lib/auth/schemas"

/** 섹션 폼 결과: 성공은 aria-live 인라인, 실패는 alert */
export function FormStatus({ state }: { state: FormState }) {
  return (
    <>
      <p aria-live="polite" className="text-sm font-medium text-primary empty:hidden">
        {state.ok ? state.message : null}
      </p>
      {state.formError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}
    </>
  )
}

export function SectionSkeleton() {
  return <div className="h-48 animate-pulse rounded-3xl bg-muted" />
}
