import { type Faq as FaqEntry, FaqItem } from "@/components/molecules/faq-item";
import { SectionHeading } from "@/components/molecules/section-heading";
import { Accordion } from "@/components/ui/accordion";
import type { Section } from "../_content";

export function Faq({ heading, items }: Section<FaqEntry>) {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading {...heading} />
        <Accordion className="mt-12 gap-3">
          {items.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}
