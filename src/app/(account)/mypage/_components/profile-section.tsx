"use client"

import { useActionState } from "react"
import { FormField } from "@/components/molecules/form-field"
import { SubmitButton } from "@/components/molecules/submit-button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { UserDTO } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { updateProfile } from "../_actions"
import { FormStatus } from "./form-status"
import { SectionCard } from "./section-card"

export function ProfileSection({ user }: { user: UserDTO }) {
  const [state, formAction] = useActionState(updateProfile, {} as FormState)
  return (
    <SectionCard title="프로필" description="강의실·후기에 표시되는 정보입니다.">
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="profile-email">이메일</Label>
          <div className="flex items-center gap-2">
            <input id="profile-email" readOnly value={user.email} className="h-10 flex-1 rounded-xl border border-input bg-muted/50 px-3 text-sm" />
            <Badge variant={user.emailVerified ? "default" : "secondary"}>{user.emailVerified ? "인증됨" : "미인증"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">이메일 변경은 아직 지원하지 않습니다.</p>
        </div>
        <FormField
          id="profile-name"
          name="name"
          label="이름"
          autoComplete="name"
          maxLength={20}
          required
          defaultValue={state.values?.name ?? user.name}
          error={state.fieldErrors?.name}
        />
        <FormStatus state={state} />
        <SubmitButton pendingLabel="저장 중…" className="justify-self-start">
          저장
        </SubmitButton>
      </form>
    </SectionCard>
  )
}
