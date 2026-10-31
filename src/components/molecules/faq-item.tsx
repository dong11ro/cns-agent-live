import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type Faq = { q: string; a: string };

export function FaqItem({ q, a }: Faq) {
  return (
    <AccordionItem
      value={q}
      className="rounded-2xl border-2 bg-card px-5 not-last:border-b-2 data-open:border-primary"
    >
      <AccordionTrigger className="py-4 text-base font-bold hover:no-underline">{q}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
    </AccordionItem>
  );
}
