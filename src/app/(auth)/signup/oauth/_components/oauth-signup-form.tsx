"use client";

import { startTransition, useActionState, useState } from "react";
import { FormField } from "@/components/molecules/form-field";
import { SubmitButton } from "@/components/molecules/submit-button";
import { fieldValue, useFormValidation } from "@/hooks/use-form-validation";
import { emailSchema, firstError, nameSchema, type FormState } from "@/lib/auth/schemas";
import { allRequiredAgreed, emptyAgreements, TermsStep } from "../../_components/terms-step";
import { completeOAuthSignup } from "../_actions";

function validate(name: string, form: HTMLFormElement) {
  if (name === "email") return firstError(emailSchema, fieldValue(form, "email"));
  if (name === "name") return firstError(nameSchema, fieldValue(form, "name"));
}

/** 제공자 이메일이 있으면 읽기 전용으로 보여주고, 없으면(카카오 이메일 미동의 등) 입력받는다. */
export function OAuthSignupForm({ providerLabel, email, name }: { providerLabel: string; email: string | null; name: string }) {
  const [state, formAction, pending] = useActionState(completeOAuthSignup, {} as FormState);
  const { formRef, errors, onBlur, onChange } = useFormValidation(state, validate);
  const [agreements, setAgreements] = useState(emptyAgreements);
  const [values, setValues] = useState({ email: email ?? "", name });
  const canSubmit = allRequiredAgreed(agreements);

  return (
    <form
      ref={formRef}
      noValidate
      onBlur={onBlur}
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="grid gap-4"
    >
      <p className="text-sm text-muted-foreground">{providerLabel} 계정으로 가입합니다. 약관에 동의하고 정보를 확인해 주세요.</p>
      <input type="hidden" name="agreements" value={JSON.stringify(agreements)} />
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
        readOnly={!!email}
        required
        value={values.email}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
        error={errors.email}
        hint={email ? `${providerLabel}에서 받은 이메일입니다.` : `${providerLabel}에서 이메일을 받지 못했습니다. 연락받을 이메일을 입력해 주세요.`}
      />
      <FormField
        id="name"
        name="name"
        label="이름"
        autoComplete="name"
        required
        maxLength={20}
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        error={errors.name}
      />
      <TermsStep value={agreements} onChange={setAgreements} />
      {!canSubmit && (
        <p id="oauth-terms-reason" className="text-xs text-muted-foreground">
          필수 약관에 모두 동의해야 가입할 수 있습니다.
        </p>
      )}
      <SubmitButton pending={pending} disabled={!canSubmit} pendingLabel="가입 중…" className="w-full">
        가입하기
      </SubmitButton>
    </form>
  );
}
