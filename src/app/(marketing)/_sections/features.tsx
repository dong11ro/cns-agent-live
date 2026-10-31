import { type Feature, FeatureItem } from "@/components/molecules/feature-item";
import { SectionHeading } from "@/components/molecules/section-heading";
import { toneAt } from "@/lib/tones";
import type { Section } from "../_content";

export function Features({ heading, items }: Section<Feature>) {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-linear-to-br from-secondary via-background to-chart-3/20 py-24"
    >
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading {...heading} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((feature, i) => (
            <FeatureItem key={feature.title} {...feature} tone={toneAt(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
