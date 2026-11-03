"use client"

import { Button } from "@/components/ui/button"

// 원인은 서버 로그에만 남기고 화면에는 재시도만 안내한다
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-heading text-2xl">일시적인 오류입니다</h1>
      <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <Button onClick={reset} className="h-10 rounded-full px-5">
        다시 시도
      </Button>
    </main>
  )
}
