import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";

export function LoginLink() {
  return (
    <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "h-10 rounded-full px-4 font-bold")}>
      로그인
    </Link>
  );
}

// 세션을 읽으므로 헤더의 Suspense 경계 안에서만 렌더한다(랜딩 정적 셸 유지)
export async function AccountSlot() {
  const user = await getCurrentUser();
  if (!user) return <LoginLink />;
  return (
    <Link
      href="/mypage"
      aria-label={`마이페이지 (${user.name})`}
      className={cn(buttonVariants({ variant: "ghost" }), "h-10 gap-2 rounded-full pr-4 pl-1.5 font-bold")}
    >
      <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
        {user.name.slice(0, 1)}
      </span>
      <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
    </Link>
  );
}
