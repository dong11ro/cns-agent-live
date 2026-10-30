import {
  ArrowRight,
  BrainCircuit,
  Briefcase,
  Cloud,
  Code2,
  GraduationCap,
  Quote,
  Users,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#courses", label: "교육과정" },
  { href: "#features", label: "특징" },
  { href: "#reviews", label: "수강후기" },
  { href: "#faq", label: "FAQ" },
];

const stats = [
  { value: "12,000+", label: "누적 수강생" },
  { value: "87%", label: "6개월 내 취업률" },
  { value: "4.9/5", label: "평균 수강 만족도" },
  { value: "120+", label: "채용 연계 기업" },
];

const courses = [
  {
    icon: Code2,
    badge: "인기",
    title: "풀스택 웹 개발",
    description: "React, Next.js, Node.js로 실서비스 수준의 웹 애플리케이션을 만듭니다.",
    meta: "24주 · 온/오프라인",
  },
  {
    icon: BrainCircuit,
    badge: "신규",
    title: "데이터 분석 & AI",
    description: "Python, pandas, PyTorch로 데이터 분석부터 LLM 서비스 개발까지 다룹니다.",
    meta: "20주 · 온라인",
  },
  {
    icon: Cloud,
    badge: "재직자",
    title: "클라우드 & DevOps",
    description: "AWS, Docker, Kubernetes, CI/CD로 운영 가능한 인프라를 직접 구축합니다.",
    meta: "16주 · 주말반",
  },
];

const features = [
  {
    icon: Users,
    title: "현업 개발자 멘토링",
    description: "평균 경력 10년 이상의 현업 멘토가 매주 코드 리뷰와 1:1 피드백을 제공합니다.",
  },
  {
    icon: GraduationCap,
    title: "프로젝트 중심 커리큘럼",
    description: "이론은 짧게, 실습은 깊게. 팀 프로젝트 3회로 포트폴리오를 완성합니다.",
  },
  {
    icon: Briefcase,
    title: "끝까지 책임지는 취업 지원",
    description: "이력서·면접 코칭부터 채용 연계 기업 추천까지 수료 후 1년간 지원합니다.",
  },
];

const reviews = [
  {
    quote: "비전공자라 걱정이 많았는데, 멘토님의 코드 리뷰 덕분에 실무에서 바로 쓸 수 있는 습관을 들였어요.",
    name: "김OO",
    role: "풀스택 과정 수료 · 스타트업 프론트엔드 개발자",
  },
  {
    quote: "프로젝트 위주라 면접에서 할 얘기가 많았습니다. 포트폴리오가 곧 경쟁력이 됐어요.",
    name: "이OO",
    role: "데이터·AI 과정 수료 · 데이터 분석가",
  },
  {
    quote: "재직 중에 주말반으로 들었는데, 회사 인프라를 직접 개선하는 데까지 이어졌습니다.",
    name: "박OO",
    role: "클라우드 과정 수료 · 백엔드 엔지니어",
  },
];

const faqs = [
  {
    q: "비전공자도 수강할 수 있나요?",
    a: "네. 수강생의 절반 이상이 비전공자입니다. 사전 학습 자료와 기초 부트캠프를 함께 제공합니다.",
  },
  {
    q: "국비 지원(K-디지털 트레이닝)이 가능한가요?",
    a: "풀스택 웹 개발, 데이터 분석 & AI 과정은 국민내일배움카드로 자기부담금 없이 수강할 수 있습니다.",
  },
  {
    q: "수업은 어떤 방식으로 진행되나요?",
    a: "실시간 라이브 강의와 실습, 주 1회 멘토링으로 진행되며, 모든 강의는 녹화본으로 다시 볼 수 있습니다.",
  },
  {
    q: "수료 후에도 지원을 받을 수 있나요?",
    a: "수료 후 1년간 커리어 코칭과 채용 연계 추천, 동문 커뮤니티를 이용할 수 있습니다.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            넥스트스텝
          </a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <a href="#apply" className={buttonVariants()}>
            수강 신청
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-6">
            2027년 1기 모집 중 · 얼리버드 ~ 11/30
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            코드로 여는
            <br />
            <span className="text-primary">당신의 다음 커리어</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            현업 개발자 멘토와 함께하는 프로젝트 중심 IT 교육.
            <br className="hidden sm:block" />
            비전공자도 6개월이면 실무에 투입될 수 있습니다.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#courses" className={cn(buttonVariants({ size: "lg" }), "h-11 px-6")}>
              교육과정 보기 <ArrowRight />
            </a>
            <a
              href="#apply"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-6")}
            >
              무료 상담 신청
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24">
          <SectionHeading
            eyebrow="교육과정"
            title="목표에 맞는 과정을 선택하세요"
            description="입문부터 재직자 심화까지, 현업에서 바로 쓰는 기술만 담았습니다."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.title} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <course.icon className="size-5" />
                    </span>
                    <Badge variant="outline">{course.badge}</Badge>
                  </div>
                  <CardTitle className="mt-4 text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-sm text-muted-foreground">
                  {course.meta}
                </CardContent>
                <CardFooter>
                  <a
                    href="#apply"
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
                  >
                    커리큘럼 자세히 보기
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 bg-muted/40 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              eyebrow="왜 넥스트스텝인가요"
              title="배우는 것에서 끝나지 않습니다"
              description="수강생이 실제로 취업하고 성장하는 것까지가 우리의 목표입니다."
            />
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title}>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
                    <feature.icon className="size-6 text-primary" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24">
          <SectionHeading
            eyebrow="수강후기"
            title="먼저 시작한 선배들의 이야기"
            description="수료생들이 직접 남긴 후기입니다."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.name}>
                <CardContent className="flex h-full flex-col">
                  <Quote className="size-6 text-primary/40" />
                  <p className="mt-4 flex-1 leading-relaxed">{review.quote}</p>
                  <Separator className="my-5" />
                  <div className="text-sm font-semibold">{review.name}</div>
                  <div className="text-xs text-muted-foreground">{review.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-t py-24">
          <div className="mx-auto max-w-3xl px-4">
            <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
            <Accordion className="mt-12">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="py-4 text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section id="apply" className="scroll-mt-16 px-4 pb-24">
          <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:py-20">
            <h2 className="text-3xl font-bold md:text-4xl">지금 바로 시작하세요</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              무료 상담으로 나에게 맞는 과정과 국비 지원 여부를 확인해 보세요.
            </p>
            <a
              href="mailto:contact@nextstep-academy.kr"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "mt-8 h-11 px-6")}
            >
              무료 상담 신청하기 <ArrowRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t">
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
      <div className="text-sm font-semibold text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
