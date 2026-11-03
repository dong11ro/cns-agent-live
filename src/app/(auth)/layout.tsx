import Link from "next/link";
import { GraduationCap } from "lucide-react";

// 세션을 읽지 않는다(레이아웃은 내비게이션 때 다시 렌더되지 않음). 인증 검사는 각 페이지·액션에서.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center bg-background px-4 py-10 sm:py-16">
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-2xl">
        <span className="flex size-10 -rotate-6 items-center justify-center rounded-2xl bg-linear-to-br gradient-brand text-primary-foreground shadow-md">
          <GraduationCap className="size-5" />
        </span>
        넥스트스텝
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
