"use client"

import { useActionState } from "react"
import { SubmitButton } from "@/components/molecules/submit-button"
import { Badge } from "@/components/ui/badge"
import type { FormState } from "@/lib/auth/schemas"
import { TERMS, type TermId } from "@/lib/auth/terms"
import { updateMarketingConsent } from "../_actions"
import { FormStatus } from "./form-status"
import { SectionCard } from "./section-card"

type Consent = { agreed: boolean; version: string; at: string } | null

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" })

/** 필수 약관 철회 = 탈퇴이므로 토글은 선택 약관에만 둔다. */
export function ConsentsSection({ consents }: { consents: Record<TermId, Consent> }) {
  const [state, formAction] = useActionState(updateMarketingConsent, {} as FormState)
  const noOptional = !TERMS.some((t) => !t.required && consents[t.id]?.agreed)
  return (
    <SectionCard title="약관 동의 내역" description="선택 항목은 언제든 철회하거나 다시 동의할 수 있습니다.">
      <ul className="grid gap-3">
        {TERMS.map((t) => {
          const c = consents[t.id]
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
              <div className="grid gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Badge variant={t.required ? "default" : "secondary"}>{t.required ? "필수" : "선택"}</Badge>
                  {t.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c ? `${c.agreed ? "동의" : "미동의"} · 버전 ${c.version} · ${fmt(c.at)}` : "기록 없음"}
                </span>
              </div>
              {!t.required && (
                <form action={formAction}>
                  <input type="hidden" name="agreed" value={c?.agreed ? "false" : "true"} />
                  <SubmitButton variant="outline" pendingLabel="저장 중…">
                    {c?.agreed ? "동의 철회" : "동의하기"}
                  </SubmitButton>
                </form>
              )}
            </li>
          )
        })}
      </ul>
      {noOptional && <p className="mt-3 text-xs text-muted-foreground">동의한 선택 항목이 없습니다.</p>}
      <div className="mt-3">
        <FormStatus state={state} />
      </div>
    </SectionCard>
  )
}
