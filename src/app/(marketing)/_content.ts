import {
  BrainCircuit,
  Briefcase,
  Cloud,
  Code2,
  GraduationCap,
  Users,
} from "lucide-react";
import type { Course } from "@/components/molecules/course-card";
import type { Faq } from "@/components/molecules/faq-item";
import type { Feature } from "@/components/molecules/feature-item";
import type { Review } from "@/components/molecules/review-card";
import type { SectionHeadingProps } from "@/components/molecules/section-heading";
import type { Stat } from "@/components/molecules/stat-tile";

export type NavItem = { href: string; label: string };
// 제목이 있는 목록 섹션: 항목을 추가·삭제·수정할 때는 items만 고친다
export type Section<T> = { heading: SectionHeadingProps; items: T[] };

export const navItems: NavItem[] = [
  { href: "#courses", label: "교육과정" },
  { href: "#features", label: "특징" },
  { href: "#reviews", label: "수강후기" },
  { href: "#faq", label: "FAQ" },
];

export const stats: Stat[] = [
  { value: "12,000+", label: "누적 수강생" },
  { value: "87%", label: "6개월 내 취업률" },
  { value: "4.9/5", label: "평균 수강 만족도" },
  { value: "120+", label: "채용 연계 기업" },
];

export const courses: Section<Course> = {
  heading: {
    eyebrow: "교육과정",
    title: "목표에 맞는 과정을 선택하세요",
    description: "입문부터 재직자 심화까지, 현업에서 바로 쓰는 기술만 담았습니다.",
  },
  items: [
    {
      icon: Code2,
      badge: "인기",
      title: "풀스택 웹 개발",
      description: "React, Next.js, Node.js로 실서비스 수준의 웹 애플리케이션을 만듭니다.",
      meta: "24주 · 온/오프라인",
      sticker: "🚀",
    },
    {
      icon: BrainCircuit,
      badge: "신규",
      title: "데이터 분석 & AI",
      description: "Python, pandas, PyTorch로 데이터 분석부터 LLM 서비스 개발까지 다룹니다.",
      meta: "20주 · 온라인",
      sticker: "💡",
    },
    {
      icon: Cloud,
      badge: "재직자",
      title: "클라우드 & DevOps",
      description: "AWS, Docker, Kubernetes, CI/CD로 운영 가능한 인프라를 직접 구축합니다.",
      meta: "16주 · 주말반",
      sticker: "☁️",
    },
  ],
};

export const features: Section<Feature> = {
  heading: {
    eyebrow: "왜 넥스트스텝인가요",
    title: "배우는 것에서 끝나지 않습니다",
    description: "수강생이 실제로 취업하고 성장하는 것까지가 우리의 목표입니다.",
  },
  items: [
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
  ],
};

export const reviews: Section<Review> = {
  heading: {
    eyebrow: "수강후기",
    title: "먼저 시작한 선배들의 이야기",
    description: "수료생들이 직접 남긴 후기입니다.",
  },
  items: [
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
  ],
};

export const faq: Section<Faq> = {
  heading: { eyebrow: "FAQ", title: "자주 묻는 질문" },
  items: [
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
  ],
};
