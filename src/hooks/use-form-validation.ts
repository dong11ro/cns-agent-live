"use client"

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react"
import type { FormState } from "@/lib/auth/schemas"

/**
 * 같은 zod 규칙으로 blur 때 그 필드만 검사하고, 한 번 에러가 난 필드는 입력 즉시 재검사한다.
 * 서버 응답(state)이 바뀌면 서버 에러로 교체하고 첫 에러 필드로 포커스를 옮긴다.
 */
export function useFormValidation(state: FormState, validate: (name: string, form: HTMLFormElement) => string | undefined) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>(state.fieldErrors ?? {})
  const [prevState, setPrevState] = useState(state)
  if (prevState !== state) {
    setPrevState(state)
    setErrors(state.fieldErrors ?? {})
  }

  useEffect(() => {
    if (state.fieldErrors && Object.keys(state.fieldErrors).length) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state])

  function check(name: string, form: HTMLFormElement) {
    const msg = validate(name, form)
    setErrors((prev) => {
      if (prev[name] === msg) return prev
      const next = { ...prev }
      if (msg) next[name] = msg
      else delete next[name]
      return next
    })
  }

  return {
    formRef,
    errors,
    setErrors,
    onBlur(e: FocusEvent<HTMLFormElement>) {
      const name = (e.target as unknown as HTMLInputElement).name
      if (name) check(name, e.currentTarget)
    },
    onChange(e: FormEvent<HTMLFormElement>) {
      const name = (e.target as unknown as HTMLInputElement).name
      if (name && errors[name]) check(name, e.currentTarget)
    },
  }
}

/** form 안 input 값 읽기 */
export function fieldValue(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name)
  return el instanceof HTMLInputElement ? el.value : ""
}
