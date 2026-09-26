import type { FormField } from "./form-schema";
import type { Promo } from "./promo";

export type SessionStatus = "draft" | "published" | "closed";
export type PaymentStatus = "none" | "pending" | "paid" | "rejected";

/** Pemakaian kuota per jadwal. */
export type SlotUsage = Record<string, { used: number; guests: number }>;

export interface Session {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: SessionStatus;
  quota: number;
  opens_at: string | null;
  closes_at: string | null;
  fields: FormField[];
  success_message: string;
  email_enabled: boolean;
  email_subject: string;
  email_body: string;
  allow_view: boolean;
  allow_edit: boolean;
  allow_cancel: boolean;
  edit_deadline: string | null;
  one_per_email: boolean;
  promo: Promo;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  code: string;
  email: string;
  answers: Record<string, unknown>;
  status: "active" | "cancelled";
  slot: string | null;
  guest_count: number;
  payment_status: PaymentStatus;
  email_status: "pending" | "sent" | "failed" | "skipped";
  email_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  mail_from_name: string | null;
  mail_from_email: string | null;
}

export type SessionAvailability =
  | { open: true; remaining: number }
  | { open: false; reason: "draft" | "closed" | "not_open" | "ended" | "full"; remaining: number };

export function sessionAvailability(s: Session, used: number, now = new Date()): SessionAvailability {
  const remaining = Math.max(0, s.quota - used);
  if (s.status === "draft") return { open: false, reason: "draft", remaining };
  if (s.status === "closed") return { open: false, reason: "closed", remaining };
  if (s.opens_at && now < new Date(s.opens_at)) return { open: false, reason: "not_open", remaining };
  if (s.closes_at && now > new Date(s.closes_at)) return { open: false, reason: "ended", remaining };
  if (remaining <= 0) return { open: false, reason: "full", remaining };
  return { open: true, remaining };
}

/** Apakah pengisi masih boleh mengubah/membatalkan isian. */
export function canModify(s: Session, now = new Date()) {
  const beforeDeadline = !s.edit_deadline || now <= new Date(s.edit_deadline);
  const beforeClose = !s.closes_at || now <= new Date(s.closes_at);
  const ok = beforeDeadline && beforeClose && s.status !== "closed";
  return { edit: s.allow_edit && ok, cancel: s.allow_cancel && ok };
}
