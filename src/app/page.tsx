import { ArrowRight, GraduationCap, Quote } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { courses, faqs, features, navItems, reviews, stats } from "@/content/landing";
import { cn } from "@/lib/utils";

// 카드·통계 타일에 순서대로 입히는 포인트 컬러
const tones = [
  { tile: "bg-chart-1/15", icon: "bg-chart-1 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-3/30", icon: "bg-chart-3 text-accent-foreground", rotate: "rotate-1" },
  { tile: "bg-chart-4/20", icon: "bg-chart-4 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-2/20", icon: "bg-chart-2 text-white", rotate: "rotate-1" },
];

const stickers = ["🚀", "💡", "☁️"];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-3">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border bg-background/80 pr-2 pl-4 shadow-lg shadow-primary/5 backdrop-blur">
          <a href="#" className="flex items-center gap-2 font-heading text-xl">
            <span className="flex size-9 -rotate-6 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-chart-1 text-primary-foreground shadow-md">
              <GraduationCap className="size-5" />
            </span>
            넥스트스텝
          </a>
          <nav className="hidden gap-2 text-sm font-medium text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#apply"
            className={cn(
              buttonVariants(),
              "h-10 rounded-full bg-linear-to-r from-primary to-chart-1 px-5 font-bold shadow-md shadow-primary/30 hover:opacity-90",
            )}
          >
            수강 신청
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute top-10 -right-20 size-96 rounded-full bg-chart-1/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-chart-3/40 blur-3xl" />
          </div>
          <span aria-hidden className="absolute top-28 left-[8%] hidden -rotate-12 text-5xl motion-safe:animate-bounce md:block">
            💻
          </span>
          <span aria-hidden className="absolute top-40 right-[10%] hidden rotate-12 text-5xl md:block">
            ✨
          </span>
          <span aria-hidden className="absolute bottom-16 left-[14%] hidden rotate-6 text-4xl md:block">
            🎯
          </span>
          <span aria-hidden className="absolute right-[16%] bottom-20 hidden -rotate-6 text-4xl motion-safe:animate-bounce md:block">
            🔥
          </span>
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

        {/* Stats */}
        <section className="px-4">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-3xl px-4 py-8 text-center transition-transform hover:scale-105",
                  tones[i % tones.length].tile,
                  tones[i % tones.length].rotate,
                )}
              >
                <div className="font-heading text-4xl md:text-5xl">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
          <SectionHeading
            eyebrow="교육과정"
            title="목표에 맞는 과정을 선택하세요"
            description="입문부터 재직자 심화까지, 현업에서 바로 쓰는 기술만 담았습니다."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {courses.map((course, i) => (
              <Card
                key={course.title}
                className="relative rounded-3xl ring-2 ring-foreground/10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:ring-primary"
              >
                <span aria-hidden className="absolute top-4 right-20 text-2xl">
                  {stickers[i % stickers.length]}
                </span>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-12 -rotate-6 items-center justify-center rounded-2xl shadow-md",
                        tones[i % tones.length].icon,
                      )}
                    >
                      <course.icon className="size-6" />
                    </span>
                    <Badge className="h-6 rounded-full bg-secondary px-3 font-bold text-secondary-foreground">
                      {course.badge}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-2xl">{course.title}</CardTitle>
                  <CardDescription className="text-sm">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {course.meta}
                  </span>
                </CardContent>
                <CardFooter className="border-t-0 bg-transparent pb-4">
                  <a
                    href="#apply"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "h-11 w-full rounded-full font-bold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    커리큘럼 자세히 보기
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 bg-linear-to-br from-secondary via-background to-chart-3/20 py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              eyebrow="왜 넥스트스텝인가요"
              title="배우는 것에서 끝나지 않습니다"
              description="수강생이 실제로 취업하고 성장하는 것까지가 우리의 목표입니다."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="rounded-3xl bg-background/80 p-6 shadow-sm ring-1 ring-border backdrop-blur transition-transform hover:-rotate-1"
                >
                  <span
                    className={cn(
                      "flex size-14 rotate-3 items-center justify-center rounded-2xl shadow-md",
                      tones[i % tones.length].icon,
                    )}
                  >
                    <feature.icon className="size-7" />
                  </span>
                  <h3 className="mt-5 font-heading text-2xl">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
          <SectionHeading
            eyebrow="수강후기"
            title="먼저 시작한 선배들의 이야기"
            description="수료생들이 직접 남긴 후기입니다."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((review, i) => (
              <Card
                key={review.name}
                className={cn(
                  "rounded-3xl border-2 border-foreground shadow-[5px_5px_0_0_var(--foreground)] ring-0 transition-transform hover:rotate-0",
                  tones[i % tones.length].rotate,
                )}
              >
                <CardContent className="flex h-full flex-col">
                  <Quote className="size-8 fill-chart-1/30 text-chart-1" />
                  <p className="mt-4 flex-1 text-base leading-relaxed">{review.quote}</p>
                  <Separator className="my-5" />
                  <div className="font-heading text-lg">{review.name}</div>
                  <div className="text-xs text-muted-foreground">{review.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-4">
            <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
            <Accordion className="mt-12 gap-3">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className="rounded-2xl border-2 bg-card px-5 not-last:border-b-2 data-open:border-primary"
                >
                  <AccordionTrigger className="py-4 text-base font-bold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section id="apply" className="scroll-mt-20 px-4 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-linear-to-br from-primary via-chart-1 to-chart-2 px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 md:py-20">
            <span aria-hidden className="absolute top-6 left-8 -rotate-12 text-5xl">
              🚀
            </span>
            <span aria-hidden className="absolute right-10 bottom-6 rotate-12 text-5xl motion-safe:animate-bounce">
              🙌
            </span>
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
      </main>

      <footer className="border-t-2 border-dashed">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span>© 2026 넥스트스텝 IT 아카데미. All rights reserved.</span>
          <span>서울특별시 강남구 · contact@nextstep-academy.kr</span>
        </div>
      </footer>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex -rotate-2 rounded-full bg-accent px-4 py-1 text-sm font-bold text-accent-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-heading text-4xl md:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
