"use client"

import Link from "next/link"
import { startTransition, useActionState, useEffect, useRef, useState } from "react"
import { PasswordStrength } from "@/components/atoms/password-strength"
import { FormField } from "@/components/molecules/form-field"
import { SubmitButton } from "@/components/molecules/submit-button"
import { fieldValue, useFormValidation } from "@/hooks/use-form-validation"
import { emailSchema, firstError, nameSchema, newPasswordSchema, type FormState } from "@/lib/auth/schemas"
import { copy } from "../_content"
import { checkEmailAvailable, signup, type EmailCheck } from "../_actions"
import type { Agreements } from "./terms-step"

export type AccountValues = { email: string; password: string; passwordConfirm: string; name: string }

function validate(name: string, form: HTMLFormElement) {
  const email = fieldValue(form, "email")
  switch (name) {
    case "email":
      return firstError(emailSchema, email)
    case "password":
      return firstError(newPasswordSchema(email), fieldValue(form, "password"))
    case "passwordConfirm":
      return fieldValue(form, "passwordConfirm") !== fieldValue(form, "password") ? "비밀번호가 일치하지 않습니다." : undefined
    case "name":
      return firstError(nameSchema, fieldValue(form, "name"))
  }
}

/** 값은 상위(위저드)가 들고 있어 이전 단계로 갔다 와도 유지된다. 제출은 signup 액션 한 번. */
export function AccountStep({ values, onValues, agreements, next, onVerify }: {
  values: AccountValues
  onValues: (v: AccountValues) => void
  agreements: Agreements
  next: string
  /** 검증 플래그 on이면 가입 후 redirect 대신 ok가 와서 인증 단계로 넘어간다 */
  onVerify: () => void
}) {
  const [state, formAction, pending] = useActionState(signup, {} as FormState)
  const { formRef, errors, onBlur, onChange } = useFormValidation(state, validate)
  const [emailCheck, setEmailCheck] = useState<{ email: string; result: EmailCheck } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 제출을 startTransition으로 하므로 React의 폼 자동 리셋이 없고, 값은 클라이언트 상태에만 있다(서버로 비밀번호를 되돌려 받지 않음)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (state.ok) onVerify()
  }, [state, onVerify])

  function scheduleEmailCheck(email: string) {
    clearTimeout(timer.current)
    if (firstError(emailSchema, email)) return
    timer.current = setTimeout(async () => {
      const result = await checkEmailAvailable(email)
      setEmailCheck({ email, result })
    }, 400)
  }

  const set = (key: keyof AccountValues) => (e: React.ChangeEvent<HTMLInputElement>) => onValues({ ...values, [key]: e.target.value })
  const check = emailCheck?.email === values.email ? emailCheck.result : null
  const emailError = errors.email ?? (check === "taken" ? copy.emailTaken : undefined)

  return (
    <form
      ref={formRef}
      noValidate
      onBlur={onBlur}
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      }}
      className="grid gap-4"
    >
      <input type="hidden" name="agreements" value={JSON.stringify(agreements)} />
      <input type="hidden" name="next" value={next} />
      {state.formError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}
      <FormField
        id="email"
        name="email"
        label="이메일"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={values.email}
        onChange={set("email")}
        onBlur={(e) => scheduleEmailCheck(e.target.value)}
        error={emailError}
        status={
          check === "available" && !errors.email ? (
            <span className="text-primary">{copy.emailAvailable}</span>
          ) : check === "taken" ? (
            <Link href={`/login?email=${encodeURIComponent(values.email)}`} className="font-medium underline underline-offset-4">
              로그인하기
            </Link>
          ) : check === "limited" ? (
            <span className="text-muted-foreground">{copy.emailLimited}</span>
          ) : null
        }
      />
      <FormField
        id="password"
        name="password"
        label="비밀번호"
        password
        autoComplete="new-password"
        required
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        hint={<PasswordStrength password={values.password} email={values.email} />}
      />
      <FormField
        id="passwordConfirm"
        name="passwordConfirm"
        label="비밀번호 확인"
        password
        autoComplete="new-password"
        required
        value={values.passwordConfirm}
        onChange={set("passwordConfirm")}
        error={errors.passwordConfirm}
        status={values.passwordConfirm && values.passwordConfirm === values.password ? <span className="text-primary">{copy.passwordMatch}</span> : null}
      />
      <FormField
        id="name"
        name="name"
        label="이름"
        autoComplete="name"
        required
        maxLength={20}
        value={values.name}
        onChange={set("name")}
        error={errors.name}
        hint="강의실·후기에 표시되는 이름입니다(1~20자)."
      />
      <SubmitButton pending={pending} pendingLabel={copy.submitting} className="mt-2 w-full">
        {copy.submit}
      </SubmitButton>
    </form>
  )
}
