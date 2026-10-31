// 카드·통계 타일에 순서대로 입히는 포인트 컬러
const tones = [
  { tile: "bg-chart-1/15", icon: "bg-chart-1 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-3/30", icon: "bg-chart-3 text-accent-foreground", rotate: "rotate-1" },
  { tile: "bg-chart-4/20", icon: "bg-chart-4 text-white", rotate: "-rotate-1" },
  { tile: "bg-chart-2/20", icon: "bg-chart-2 text-white", rotate: "rotate-1" },
];

export type Tone = (typeof tones)[number];

// 항목 수가 tones보다 많아도 처음부터 다시 돌아 undefined가 나오지 않는다
export const toneAt = (index: number): Tone => tones[index % tones.length];
