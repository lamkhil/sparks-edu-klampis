"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Dropdown bergaya Sparks untuk form publik (Radix Select, tetap terkirim lewat FormData via `name`). */
export function PrettySelect({
  id,
  name,
  options,
  defaultValue,
  placeholder = "— Pilih —",
  disabled,
}: {
  id?: string;
  name: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select name={name} defaultValue={defaultValue || undefined} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn(
          "h-auto w-full rounded-xl border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-none",
          "focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-100 data-[placeholder]:text-muted-foreground/70",
          "[&>svg]:size-5 [&>svg]:text-brand-600",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="rounded-xl border-line p-1 shadow-lg ring-brand-100">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="cursor-pointer rounded-lg py-2.5 pl-3 text-sm focus:bg-brand-50 focus:text-brand-800">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
