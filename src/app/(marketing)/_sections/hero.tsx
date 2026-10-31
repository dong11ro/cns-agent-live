import { ArrowRight } from "lucide-react";
import { Sticker } from "@/components/atoms/sticker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-10 -right-20 size-96 rounded-full bg-chart-1/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-chart-3/40 blur-3xl" />
      </div>
      <Sticker className="top-28 left-[8%] hidden -rotate-12 text-5xl motion-safe:animate-bounce md:block">
        💻
      </Sticker>
      <Sticker className="top-40 right-[10%] hidden rotate-12 text-5xl md:block">✨</Sticker>
      <Sticker className="bottom-16 left-[14%] hidden rotate-6 text-4xl md:block">🎯</Sticker>
      <Sticker className="right-[16%] bottom-20 hidden -rotate-6 text-4xl motion-safe:animate-bounce md:block">
        🔥
      </Sticker>
      <div className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
        <Badge className="mb-6 h-auto -rotate-2 rounded-full border-2 border-foreground bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-[3px_3px_0_0_var(--foreground)]">
          <span aria-hidden>🎉</span>
          2027년 1기 모집 중 · 얼리버드 ~ 11/30
        </Badge>
        <h1 className="mx-auto max-w-3xl font-heading text-5xl leading-tight md:text-7xl">
          코드로 여는
          <br />
          <span className="bg-linear-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
            당신의 다음 커리어
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          현업 개발자 멘토와 함께하는 프로젝트 중심 IT 교육.
          <br className="hidden sm:block" />
          비전공자도 6개월이면 실무에 투입될 수 있습니다.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#courses"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-13 rounded-full bg-linear-to-r from-primary to-chart-1 px-8 text-base font-bold shadow-xl shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:opacity-95",
            )}
          >
            교육과정 보기 <ArrowRight />
          </a>
          <a
            href="#apply"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-13 rounded-full border-2 border-foreground px-8 text-base font-bold shadow-[4px_4px_0_0_var(--foreground)] transition-transform hover:-translate-y-0.5",
            )}
          >
            무료 상담 신청
          </a>
        </div>
      </div>
    </section>
  );
}
