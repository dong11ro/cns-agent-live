"use client"

import { useActionState } from "react"
import { FormField } from "@/components/molecules/form-field"
import { SubmitButton } from "@/components/molecules/submit-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth/actions"
import type { FormState } from "@/lib/auth/schemas"
import { deleteAccount, logoutAll } from "../_actions"
import { FormStatus } from "./form-status"
import { SectionCard } from "./section-card"

export function DangerZoneSection({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState(deleteAccount, {} as FormState)
  return (
    <SectionCard title="로그인 관리 · 회원 탈퇴">
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          {/* 상태를 바꾸므로 링크가 아니라 form POST */}
          <form action={logout}>
            <SubmitButton variant="outline" pendingLabel="로그아웃 중…">
              로그아웃
            </SubmitButton>
          </form>
          <form action={logoutAll}>
            <SubmitButton variant="outline" pendingLabel="처리 중…">
              모든 기기에서 로그아웃
            </SubmitButton>
          </form>
        </div>
        <div className="grid gap-2 rounded-2xl border border-destructive/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            탈퇴하면 계정·연결 계정·동의 내역이 즉시 삭제되며 되돌릴 수 없습니다.
          </p>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" className="h-10 justify-self-start rounded-full px-5" />}>
              회원 탈퇴
            </AlertDialogTrigger>
            <AlertDialogContent>
              <form action={formAction} className="grid gap-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 탈퇴하시겠어요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {hasPassword ? "확인을 위해 비밀번호를 입력해 주세요." : "확인을 위해 가입한 이메일을 입력해 주세요."} 삭제된
                    정보는 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <FormField
                  id="delete-confirm"
                  name="confirm"
                  label={hasPassword ? "비밀번호" : "이메일"}
                  password={hasPassword}
                  type={hasPassword ? undefined : "email"}
                  autoComplete={hasPassword ? "current-password" : "off"}
                  required
                  error={state.fieldErrors?.confirm}
                />
                <FormStatus state={state} />
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">취소</AlertDialogCancel>
                  <SubmitButton variant="destructive" pendingLabel="탈퇴 처리 중…">
                    탈퇴하기
                  </SubmitButton>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SectionCard>
  )
}
