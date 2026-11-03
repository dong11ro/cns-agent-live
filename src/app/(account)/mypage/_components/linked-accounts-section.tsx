"use client";

import { useActionState } from "react";
import { OAuthButtons, type OAuthButton } from "@/components/molecules/oauth-buttons";
import { SubmitButton } from "@/components/molecules/submit-button";
import type { FormState } from "@/lib/auth/schemas";
import { unlinkAccount } from "../_actions";
import { FormStatus } from "./form-status";
import { SectionCard } from "./section-card";

export type LinkedRow = OAuthButton & { connected: boolean; email: string | null };

export function LinkedAccountsSection({ rows, canUnlink, notice }: {
  rows: LinkedRow[];
  canUnlink: boolean;
  notice?: { ok: boolean; text: string };
}) {
  const [state, formAction] = useActionState(unlinkAccount, {} as FormState);
  const connected = rows.filter((r) => r.connected);
  return (
    <SectionCard title="연결된 계정" description="소셜 계정을 연결하면 그 계정으로도 로그인할 수 있습니다.">
      <div className="grid gap-4">
        {notice && (
          <p
            role={notice.ok ? "status" : "alert"}
            className={notice.ok ? "text-sm font-medium text-primary" : "rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"}
          >
            {notice.text}
          </p>
        )}
        {connected.length === 0 && <p className="text-sm text-muted-foreground">연결된 소셜 계정이 없습니다.</p>}
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
              <div className="grid">
                <span className="font-bold">{r.label}</span>
                <span className="text-xs text-muted-foreground">
                  {r.connected ? `연결됨${r.email ? ` · ${r.email}` : ""}` : "연결 안 됨"}
                </span>
              </div>
              {r.connected ? (
                <form action={formAction}>
                  <input type="hidden" name="provider" value={r.id} />
                  <SubmitButton variant="outline" disabled={!canUnlink} pendingLabel="해제 중…">
                    해제
                  </SubmitButton>
                </form>
              ) : (
                <div className="w-full sm:w-64">
                  <OAuthButtons providers={[r]} intent="link" next="/mypage" verb="연결하기" />
                </div>
              )}
            </li>
          ))}
        </ul>
        {connected.length > 0 && !canUnlink && (
          <p className="text-xs text-muted-foreground">남는 로그인 수단이 없어 해제할 수 없습니다. 먼저 비밀번호를 설정해 주세요.</p>
        )}
        <FormStatus state={state} />
      </div>
    </SectionCard>
  );
}
