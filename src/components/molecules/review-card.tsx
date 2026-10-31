import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Review = { quote: string; name: string; role: string };

export function ReviewCard({ quote, name, role, tone }: Review & { tone: Tone }) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-2 border-foreground shadow-hard-lg ring-0 transition-transform hover:rotate-0",
        tone.rotate,
      )}
    >
      <CardContent className="flex h-full flex-col">
        <Quote className="size-8 fill-chart-1/30 text-chart-1" />
        <p className="mt-4 flex-1 text-base leading-relaxed">{quote}</p>
        <Separator className="my-5" />
        <div className="font-heading text-lg">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </CardContent>
    </Card>
  );
}
