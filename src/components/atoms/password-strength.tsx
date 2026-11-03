import { Check, X } from "lucide-react";
import { passwordChecks, passwordStrength } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

const LABELS = ["기준 미달", "약함", "보통", "강함"];
const COLORS = ["bg-destructive", "bg-chart-2", "bg-chart-4", "bg-primary"];

/** 색만으로 전달하지 않도록 단계 텍스트와 조건 체크리스트를 함께 보여준다. */
export function PasswordStrength({ password, email = "" }: { password: string; email?: string }) {
  if (!password) return null;
  const level = passwordStrength(password, email);
  const c = passwordChecks(password, email);
  const items = [
    { ok: c.length, label: "8자 이상(2종 조합이면 10자 이상), 64자 이하" },
    { ok: c.variety, label: "영문·숫자·특수문자 중 2종 이상" },
    { ok: c.noEmail, label: "이메일 아이디 미포함" },
    { ok: c.notCommon, label: "흔한 비밀번호 아님" },
  ];
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", level >= i ? COLORS[level] : level === 0 && i === 1 ? COLORS[0] : "bg-muted")} />
          ))}
        </div>
        <span className="text-xs font-medium">비밀번호 강도: {LABELS[level]}</span>
      </div>
      <ul className="grid gap-0.5 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item.label} className={cn("flex items-center gap-1", item.ok && "text-foreground")}>
            {item.ok ? <Check className="size-3 text-primary" aria-hidden /> : <X className="size-3" aria-hidden />}
            <span className="sr-only">{item.ok ? "충족" : "미충족"}: </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
