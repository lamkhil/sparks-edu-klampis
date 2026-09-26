import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-brand-50 text-brand-700",
  sun: "bg-sun-100 text-sun-700",
  leaf: "bg-leaf-500/10 text-leaf-500",
  berry: "bg-berry-500/10 text-berry-500",
  ocean: "bg-ocean-500/10 text-ocean-500",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "brand" }: { label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: keyof typeof TONES }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("grid size-10 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
