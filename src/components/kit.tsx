import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export { cn };

const variants = {
  primary: "bg-brand-600 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-700 disabled:bg-brand-300",
  sun: "bg-sun-400 text-ink shadow-sm shadow-sun-700/20 hover:bg-sun-300 disabled:bg-sun-100",
  secondary: "bg-white text-ink ring-1 ring-line hover:ring-brand-300 hover:text-brand-700 disabled:text-muted-foreground/70",
  danger: "bg-berry-500/10 text-[#c20048] ring-1 ring-berry-500/30 hover:bg-berry-500/15 disabled:opacity-50",
  ghost: "text-ink hover:bg-brand-50",
};

export function buttonClass(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed",
    variants[variant],
    className,
  );
}

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button {...p} className={buttonClass(variant, className)} />;
}

export const inputCls =
  "block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/70 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-cream disabled:text-muted-foreground";

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(inputCls, className)} />;
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn(inputCls, className)} />;
}

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23008560' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ className, style, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...p}
      style={{ backgroundImage: chevron, backgroundPosition: "right 0.85rem center", backgroundSize: "1.1rem", backgroundRepeat: "no-repeat", ...style }}
      className={cn(inputCls, "cursor-pointer appearance-none pr-10", className)}
    />
  );
}

export function Label({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
      {children}
      {required && <span className="ml-0.5 text-berry-500">*</span>}
    </label>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-line bg-white p-6 shadow-[0_1px_0_rgba(37,30,32,0.04)] sm:p-8", className)}>{children}</div>;
}

const badgeColors = {
  gray: "bg-cream text-muted-foreground ring-line",
  green: "bg-brand-50 text-brand-700 ring-brand-200",
  red: "bg-berry-500/10 text-[#c20048] ring-berry-500/20",
  yellow: "bg-sun-100 text-sun-700 ring-sun-300",
  blue: "bg-ocean-500/10 text-ocean-700 ring-ocean-500/20",
};

export function Badge({ children, color = "gray" }: { children: ReactNode; color?: keyof typeof badgeColors }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", badgeColors[color])}>{children}</span>;
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  const c = {
    error: "border-berry-500/25 bg-berry-500/5 text-[#a3003c]",
    success: "border-brand-200 bg-brand-50 text-brand-800",
    info: "border-sun-300 bg-sun-50 text-sun-700",
  }[tone];
  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", c)}>{children}</div>;
}

export function Toggle({ name, checked, onChange, label, hint }: { name?: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function QuotaBar({ used, quota }: { used: number; quota: number }) {
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 100;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-50 ring-1 ring-brand-100" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={quota}>
      <div
        className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-berry-500" : pct >= 80 ? "bg-tangerine-500" : "bg-gradient-to-r from-brand-500 to-leaf-400")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
