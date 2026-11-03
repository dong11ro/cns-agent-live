"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TERMS, type TermId } from "@/lib/auth/terms"
import { copy } from "../_content"

export type Agreements = Record<TermId, boolean>

export const emptyAgreements = Object.fromEntries(TERMS.map((t) => [t.id, false])) as Agreements

export function allRequiredAgreed(a: Agreements) {
  return TERMS.every((t) => !t.required || a[t.id])
}

/** 전체 동의(하위와 동기화, 일부만 체크 시 indeterminate) + 항목별 체크박스와 본문. /signup/oauth도 재사용한다. */
export function TermsStep({ value, onChange }: { value: Agreements; onChange: (v: Agreements) => void }) {
  const checkedCount = TERMS.filter((t) => value[t.id]).length
  const all = checkedCount === TERMS.length
  return (
    <div className="grid gap-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-secondary/40 px-4 py-3 font-bold">
        <Checkbox
          checked={all}
          indeterminate={checkedCount > 0 && !all}
          onCheckedChange={(checked) => onChange(Object.fromEntries(TERMS.map((t) => [t.id, checked])) as Agreements)}
        />
        {copy.allAgree}
      </label>
      <Accordion className="gap-2">
        {TERMS.map((term) => (
          <AccordionItem key={term.id} value={term.id} className="rounded-2xl border px-4 not-last:border-b">
            <div className="flex items-center gap-3 [&>h3]:flex-1">
              <Checkbox
                id={`term-${term.id}`}
                aria-label={term.title}
                checked={value[term.id]}
                onCheckedChange={(checked) => onChange({ ...value, [term.id]: checked })}
              />
              <Badge variant={term.required ? "default" : "secondary"} className="shrink-0">
                {term.required ? "필수" : "선택"}
              </Badge>
              <AccordionTrigger className="py-3 hover:no-underline">{term.title}</AccordionTrigger>
            </div>
            <AccordionContent className="pb-3 text-xs leading-relaxed text-muted-foreground">
              {term.body}
              <p className="mt-1">시행일 {term.version}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
