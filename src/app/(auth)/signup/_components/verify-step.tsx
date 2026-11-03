"use client"

import { startTransition, useActionState, useEffect, useState } from "react"
import { FormField } from "@/components/molecules/form-field"
import { SubmitButton } from "@/components/molecules/submit-button"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/auth/schemas"
import { resendEmailCode, verifyEmailCode } from "../_actions"

const COOLDOWN = 60
const TTL = 10 * 60

/** 검증 플래그 on일 때만 렌더된다. 재발송 60초 쿨다운과 만료 타이머를 보여준다. */
export function VerifyStep({ email, next }: { email: string; next: string }) {
  const [state, formAction] = useActionState(verifyEmailCode, {} as FormState)
  const [resendState, resendAction, resending] = useActionState(resendEmailCode, {} as FormState)
  // 마지막 발송 후 지난 초
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const [prevResend, setPrevResend] = useState(resendState)
  if (prevResend !== resendState) {
    setPrevResend(resendState)
    if (resendState.ok) setElapsed(0)
  }

  const cooldown = Math.max(0, COOLDOWN - elapsed)
  const left = Math.max(0, TTL - elapsed)

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <strong>{email}</strong>(으)로 인증 코드를 보냈습니다. 남은 시간{" "}
        <span aria-live="off">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      </p>
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        {(state.formError || resendState.formError) && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError ?? resendState.formError}
          </p>
        )}
        <FormField
          id="code"
          name="code"
          label="인증 코드 6자리"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          error={state.fieldErrors?.code}
          status={resendState.message}
        />
        <SubmitButton pendingLabel="확인 중…" className="w-full">
          인증 완료
        </SubmitButton>
      </form>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        disabled={cooldown > 0 || resending}
        onClick={() => startTransition(() => resendAction())}
      >
        {cooldown > 0 ? `코드 다시 받기 (${cooldown}초)` : "코드 다시 받기"}
      </Button>
    </div>
  )
}
