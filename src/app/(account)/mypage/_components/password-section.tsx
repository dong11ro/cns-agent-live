"use client"

import { useActionState, useState } from "react"
import { PasswordStrength } from "@/components/atoms/password-strength"
import { FormField } from "@/components/molecules/form-field"
import { SubmitButton } from "@/components/molecules/submit-button"
import type { FormState } from "@/lib/auth/schemas"
import { changePassword } from "../_actions"
import { FormStatus } from "./form-status"
import { SectionCard } from "./section-card"

/** OAuth 전용 계정이면 현재 비밀번호 없이 "비밀번호 설정" */
export function PasswordSection({ hasPassword, email }: { hasPassword: boolean; email: string }) {
  const [state, formAction] = useActionState(changePassword, {} as FormState)
  const [password, setPassword] = useState("")
  const [prevState, setPrevState] = useState(state)
  if (prevState !== state) {
    setPrevState(state)
    setPassword("") // 액션 후 폼이 리셋되므로 강도 표시도 맞춘다
  }
  return (
    <SectionCard
      title={hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
      description={hasPassword ? "변경하면 다른 기기에서는 로그아웃됩니다." : "비밀번호를 설정하면 이메일로도 로그인할 수 있습니다."}
    >
      <form action={formAction} className="grid gap-4">
        {/* 브라우저 비밀번호 관리자가 계정을 알 수 있도록 */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {hasPassword && (
          <FormField id="currentPassword" name="currentPassword" label="현재 비밀번호" password autoComplete="current-password" required error={state.fieldErrors?.currentPassword} />
        )}
        <FormField
          id="newPassword"
          name="newPassword"
          label="새 비밀번호"
          password
          autoComplete="new-password"
          required
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.newPassword}
          hint={<PasswordStrength password={password} email={email} />}
        />
        <FormField id="newPasswordConfirm" name="newPasswordConfirm" label="새 비밀번호 확인" password autoComplete="new-password" required error={state.fieldErrors?.newPasswordConfirm} />
        <FormStatus state={state} />
        <SubmitButton pendingLabel="저장 중…" className="justify-self-start">
          {hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
        </SubmitButton>
      </form>
    </SectionCard>
  )
}
