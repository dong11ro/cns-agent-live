import { type Feature, FeatureItem } from "@/components/molecules/feature-item";
import { SectionHeading } from "@/components/molecules/section-heading";
import { toneAt } from "@/lib/tones";

export function Features({ features }: { features: Feature[] }) {
  return (
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
            <FeatureItem key={feature.title} {...feature} tone={toneAt(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
