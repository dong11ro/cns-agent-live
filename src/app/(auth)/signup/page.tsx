import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OAuthButtons } from "@/components/molecules/oauth-buttons";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { oauthButtonList } from "@/lib/auth/oauth/providers";
import { isEmailVerificationEnabled } from "@/lib/auth/verification";
import { copy } from "./_content";
import { SignupWizard } from "./_components/signup-wizard";

export const metadata: Metadata = { title: "회원가입 | 넥스트스텝 IT 아카데미" };

export default function SignupPage() {
  return (
    <Card className="gap-6 rounded-3xl px-6 py-8 shadow-xl shadow-primary/5">
      <h1 className="text-center font-heading text-3xl">{copy.title}</h1>
      <noscript>
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{copy.noscript}</p>
      </noscript>
      {/* useSearchParams(next)를 읽으므로 경계 안에서 렌더 */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <SignupWizard
          verifyEnabled={isEmailVerificationEnabled()}
          oauthSlot={
            // 여기서 OAuth로 가면 1단계 동의를 들고 가지 않고 /signup/oauth에서 다시 받는다
            <>
              <OAuthButtons providers={oauthButtonList()} verb="3초 만에 가입" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" />
                또는 이메일로 가입
                <Separator className="flex-1" />
              </div>
            </>
          }
        />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        {copy.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}
