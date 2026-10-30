// 카드·통계 타일에 순서대로 입히는 포인트 컬러
export const tones = [
  { tile: "bg-chart-1/15", icon: "bg-chart-1 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-3/30", icon: "bg-chart-3 text-accent-foreground", rotate: "rotate-1" },
  { tile: "bg-chart-4/20", icon: "bg-chart-4 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-2/20", icon: "bg-chart-2 text-white", rotate: "rotate-1" },
];

export type Tone = (typeof tones)[number];
