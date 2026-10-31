import { type Review, ReviewCard } from "@/components/molecules/review-card";
import { SectionHeading } from "@/components/molecules/section-heading";
import { toneAt } from "@/lib/tones";

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow="수강후기"
        title="먼저 시작한 선배들의 이야기"
        description="수료생들이 직접 남긴 후기입니다."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {reviews.map((review, i) => (
          <ReviewCard key={review.name} {...review} tone={toneAt(i)} />
        ))}
      </div>
    </section>
  );
}
