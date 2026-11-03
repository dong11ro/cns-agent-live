"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";
import { copy, steps, type StepId } from "../_content";
import { AccountStep, type AccountValues } from "./account-step";
import { VerifyStep } from "./verify-step";
import { allRequiredAgreed, emptyAgreements, TermsStep } from "./terms-step";

/**
 * 단계 상태는 클라이언트에만 둔다. URL을 바꾸지 않아 새로고침하면 1단계로 돌아간다
 * (비밀번호를 URL·스토리지에 남기지 않기 위해).
 */
export function SignupWizard({ oauthSlot, verifyEnabled }: { oauthSlot?: React.ReactNode; verifyEnabled: boolean }) {
  const next = safeNext(useSearchParams().get("next"), "");
  const visibleSteps = verifyEnabled ? steps : steps.filter((s) => s.id !== "verify");
  const [stepId, setStepId] = useState<StepId>("terms");
  const [agreements, setAgreements] = useState(emptyAgreements);
  const [values, setValues] = useState<AccountValues>({ email: "", password: "", passwordConfirm: "", name: "" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // 단계 전환 시 새 단계 제목으로 포커스
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepId]);

  const index = visibleSteps.findIndex((s) => s.id === stepId);
  const step = visibleSteps[index];
  const canProceed = allRequiredAgreed(agreements);

  return (
    <div className="grid gap-6">
      <ol aria-label="가입 단계" className="flex gap-2">
        {visibleSteps.map((s, i) => (
          <li
            key={s.id}
            aria-current={s.id === stepId ? "step" : undefined}
            className={cn(
              "flex flex-1 flex-col gap-1.5 text-xs font-medium text-muted-foreground",
              i <= index && "text-foreground",
            )}
          >
            <span className={cn("h-1.5 rounded-full bg-muted", i <= index && "bg-linear-to-r gradient-brand")} aria-hidden />
            <span>
              {i + 1}. {s.title}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-heading text-xl outline-none">
          {step.title}
        </h2>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>

      {stepId === "terms" && (
        <>
          <TermsStep value={agreements} onChange={setAgreements} />
          {!canProceed && (
            <p id="terms-reason" className="text-xs text-muted-foreground">
              {copy.requiredMissing}
            </p>
          )}
          <Button
            type="button"
            disabled={!canProceed}
            aria-describedby={canProceed ? undefined : "terms-reason"}
            onClick={() => setStepId("account")}
            className="h-11 rounded-full bg-linear-to-r gradient-brand font-bold shadow-md shadow-primary/30 hover:opacity-90"
          >
            {copy.next}
          </Button>
        </>
      )}

      {stepId === "verify" && <VerifyStep email={values.email} next={next} />}

      {stepId === "account" && (
        <>
          {oauthSlot}
          <AccountStep values={values} onValues={setValues} agreements={agreements} next={next} onVerify={() => setStepId("verify")} />
          <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStepId("terms")}>
            {copy.back}
          </Button>
        </>
      )}
    </div>
  );
}
