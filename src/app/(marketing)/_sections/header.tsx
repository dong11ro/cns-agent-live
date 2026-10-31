import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "../_content";

export function Header({ navItems }: { navItems: NavItem[] }) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border bg-background/80 pr-2 pl-4 shadow-lg shadow-primary/5 backdrop-blur">
        <a href="#" className="flex items-center gap-2 font-heading text-xl">
          <span className="flex size-9 -rotate-6 items-center justify-center rounded-2xl bg-linear-to-br gradient-brand text-primary-foreground shadow-md">
            <GraduationCap className="size-5" />
          </span>
          넥스트스텝
        </a>
        <nav className="hidden gap-2 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#apply"
          className={cn(
            buttonVariants(),
            "h-10 rounded-full bg-linear-to-r gradient-brand px-5 font-bold shadow-md shadow-primary/30 hover:opacity-90",
          )}
        >
          수강 신청
        </a>
      </div>
    </header>
  );
}
