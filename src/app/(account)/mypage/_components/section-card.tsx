import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-5 rounded-3xl py-6 shadow-sm">
      <CardHeader className="px-6">
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <div className="px-6">{children}</div>
    </Card>
  );
}
