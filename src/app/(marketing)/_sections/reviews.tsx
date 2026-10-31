import { type Review, ReviewCard } from "@/components/molecules/review-card";
import { SectionHeading } from "@/components/molecules/section-heading";
import { toneAt } from "@/lib/tones";
import type { Section } from "../_content";

export function Reviews({ heading, items }: Section<Review>) {
  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
      <SectionHeading {...heading} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((review, i) => (
          <ReviewCard key={review.name} {...review} tone={toneAt(i)} />
        ))}
      </div>
    </section>
  );
}
