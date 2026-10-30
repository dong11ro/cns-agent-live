import { cn } from "@/lib/utils";

// 장식용 이모지라 스크린리더에서 숨긴다. 위치·회전은 className으로 받는다
export function Sticker({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span aria-hidden className={cn("absolute", className)}>
      {children}
    </span>
  );
}
