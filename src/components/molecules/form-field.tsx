import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PasswordInput } from "./password-input"

type Props = React.ComponentProps<"input"> & {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  /** 중복 확인 결과처럼 비동기로 바뀌는 안내(aria-live) */
  status?: ReactNode
  password?: boolean
}

/** Label + Input + 힌트 + 에러를 aria로 연결한다. */
export function FormField({ id, label, hint, error, status, password, className, ...input }: Props) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`, status && `${id}-status`].filter(Boolean).join(" ") || undefined
  const Comp = password ? PasswordInput : Input
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Comp
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("h-10 rounded-xl px-3", className)}
        {...input}
      />
      {hint && (
        <div id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      <div id={`${id}-status`} aria-live="polite" className="text-xs empty:hidden">
        {status}
      </div>
    </div>
  )
}
