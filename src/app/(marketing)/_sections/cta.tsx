import { ArrowRight } from "lucide-react";
import { Sticker } from "@/components/atoms/sticker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Cta() {
  return (
    <section id="apply" className="scroll-mt-20 px-4 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-linear-to-br gradient-brand-vivid px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 md:py-20">
        <Sticker className="top-6 left-8 -rotate-12 text-5xl">🚀</Sticker>
        <Sticker className="right-10 bottom-6 rotate-12 text-5xl motion-safe:animate-bounce">🙌</Sticker>
        <h2 className="font-heading text-4xl md:text-5xl">지금 바로 시작하세요</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
          무료 상담으로 나에게 맞는 과정과 국비 지원 여부를 확인해 보세요.
        </p>
        <a
          href="mailto:contact@nextstep-academy.kr"
          className={cn(
            buttonVariants({ size: "lg", variant: "secondary" }),
            "mt-8 h-13 rounded-full bg-background px-8 text-base font-bold text-primary shadow-lg transition-transform hover:scale-105 hover:bg-background",
          )}
        >
          무료 상담 신청하기 <ArrowRight />
        </a>
      </div>
    </section>
  );
}
