import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GREEN = "bg-brand-50 text-brand-700 ring-brand-200";
const RED = "bg-berry-500/10 text-[#c20048] ring-berry-500/20";
const YELLOW = "bg-sun-100 text-sun-700 ring-sun-300";
const GRAY = "bg-muted text-muted-foreground ring-border";

const STYLES = {
  published: ["Dibuka", GREEN],
  draft: ["Draft", GRAY],
  closed: ["Ditutup", RED],
  active: ["Aktif", GREEN],
  cancelled: ["Dibatalkan", RED],
  sent: ["Terkirim", GREEN],
  failed: ["Gagal", RED],
  pending: ["Menunggu", YELLOW],
  skipped: ["Tidak dikirim", GRAY],
} as const;

const PAYMENT = {
  none: ["—", GRAY],
  pending: ["Menunggu", YELLOW],
  paid: ["Lunas", GREEN],
  rejected: ["Ditolak", RED],
} as const;

export function StatusBadge({ status, kind }: { status: keyof typeof STYLES; kind?: undefined } | { status: keyof typeof PAYMENT; kind: "payment" }) {
  const [label, cls] = kind === "payment" ? PAYMENT[status as keyof typeof PAYMENT] : STYLES[status as keyof typeof STYLES];
  return (
    <Badge variant="outline" className={cn("border-0 ring-1", cls)}>
      {label}
    </Badge>
  );
}
