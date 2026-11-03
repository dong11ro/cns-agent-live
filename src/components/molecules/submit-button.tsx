"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 제출 중 비활성 + 스피너. 문구는 pendingLabel로 유지한다. */
export function SubmitButton({ children, pendingLabel, className, variant = "brand", disabled, pending: pendingProp }: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "brand" | "outline" | "destructive";
  disabled?: boolean;
  /** form action 대신 startTransition으로 제출할 때 useActionState의 isPending */
  pending?: boolean;
}) {
  const pending = useFormStatus().pending || !!pendingProp;
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={cn(
        variant === "brand"
          ? cn(buttonVariants(), "h-11 rounded-full bg-linear-to-r gradient-brand px-6 font-bold shadow-md shadow-primary/30 hover:opacity-90")
          : cn(buttonVariants({ variant }), "h-10 rounded-full px-5"),
        className,
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
