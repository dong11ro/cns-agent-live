import type { LucideIcon } from "lucide-react";
import { Sticker } from "@/components/atoms/sticker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export type Course = {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  meta: string;
  sticker: string;
};

export function CourseCard({
  icon: Icon,
  badge,
  title,
  description,
  meta,
  tone,
  sticker,
}: Course & { tone: Tone }) {
  return (
    <Card className="relative rounded-3xl ring-2 ring-foreground/10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:ring-primary">
      <Sticker className="top-4 right-20 text-2xl">{sticker}</Sticker>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex size-12 -rotate-6 items-center justify-center rounded-2xl shadow-md",
              tone.icon,
            )}
          >
            <Icon className="size-6" />
          </span>
          <Badge className="h-6 rounded-full bg-secondary px-3 font-bold text-secondary-foreground">
            {badge}
          </Badge>
        </div>
        <CardTitle className="mt-4 text-2xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {meta}
        </span>
      </CardContent>
      <CardFooter className="border-t-0 bg-transparent pb-4">
        <a
          href="#apply"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "h-11 w-full rounded-full font-bold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
          )}
        >
          커리큘럼 자세히 보기
        </a>
      </CardFooter>
    </Card>
  );
}
