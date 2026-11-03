"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormField } from "@/components/molecules/form-field";
import { SubmitButton } from "@/components/molecules/submit-button";
import { fieldValue, useFormValidation } from "@/hooks/use-form-validation";
import { emailSchema, firstError, type FormState } from "@/lib/auth/schemas";
import { login } from "../_actions";

function validate(name: string, form: HTMLFormElement) {
  if (name === "email") return firstError(emailSchema, fieldValue(form, "email"));
  if (name === "password") return fieldValue(form, "password") ? undefined : "비밀번호를 입력해 주세요.";
}

/** JS 없이도 기본 제출로 동작한다(form action). 실패 시 이메일은 되돌리고 비밀번호만 비운다. */
export function LoginForm({ next, defaultEmail }: { next: string; defaultEmail: string }) {
  const [state, formAction] = useActionState(login, {} as FormState);
  const { formRef, errors, onBlur, onChange } = useFormValidation(state, validate);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 로그인 실패(폼 에러)면 비밀번호 필드로 포커스
  useEffect(() => {
    if (state.formError) passwordRef.current?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate onBlur={onBlur} onChange={onChange} className="grid gap-4">
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
        defaultValue={state.values?.email ?? defaultEmail}
        error={errors.email}
      />
      <FormField
        ref={passwordRef}
        id="password"
        name="password"
        label="비밀번호"
        password
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <SubmitButton pendingLabel="로그인 중…" className="mt-2 w-full">
        로그인
      </SubmitButton>
    </form>
  );
}
