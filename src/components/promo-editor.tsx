"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createPosterUpload } from "@/app/admin/(panel)/sesi/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { DEFAULT_WA_TEMPLATE, type Promo } from "@/lib/promo";
import { Alert, Button, Input, Label, Textarea } from "./kit";

export function PromoEditor({ sessionId, promo, onChange }: { sessionId: string; promo: Promo; onChange: (p: Promo) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Promo>(k: K, v: Promo[K]) => onChange({ ...promo, [k]: v });

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) return setError("Ukuran poster maksimal 5 MB.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const res = await createPosterUpload(sessionId, ext);
      if (!res.ok) throw new Error(res.error);
      const { error } = await createBrowserSupabase().storage.from("posters").uploadToSignedUrl(res.path, res.token, file, { contentType: file.type });
      if (error) throw error;
      set("poster_url", res.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div>
        <Label>Poster / flyer</Label>
        <div className="overflow-hidden rounded-leaf border border-line bg-cream">
          {promo.poster_url ? (
            <Image src={promo.poster_url} alt="Poster" width={560} height={700} className="h-auto w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center p-6 text-center text-sm text-muted-foreground">Belum ada poster. Unggah JPG/PNG/WebP, maks 5 MB (rasio 4:5 disarankan).</div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Mengunggah…" : promo.poster_url ? "Ganti poster" : "Unggah poster"}
          </Button>
          {promo.poster_url && (
            <Button type="button" variant="ghost" onClick={() => set("poster_url", "")}>
              Hapus
            </Button>
          )}
        </div>
        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}
      </div>

      <div className="grid content-start gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Subjudul</Label>
          <Input value={promo.subtitle ?? ""} placeholder="Pizza maker junior" onChange={(e) => set("subtitle", e.target.value)} />
        </div>
        <div>
          <Label>Tanggal acara</Label>
          <Input type="date" value={promo.event_date ?? ""} onChange={(e) => set("event_date", e.target.value)} />
        </div>
        <div>
          <Label>Jam</Label>
          <Input value={promo.event_time ?? ""} placeholder="13.00–14.00" onChange={(e) => set("event_time", e.target.value)} />
        </div>
        <div>
          <Label>Usia peserta</Label>
          <Input value={promo.age_range ?? ""} placeholder="3–4 tahun" onChange={(e) => set("age_range", e.target.value)} />
        </div>
        <div>
          <Label>Partner (opsional)</Label>
          <Input value={promo.partner ?? ""} placeholder="Pizza Hut" onChange={(e) => set("partner", e.target.value)} />
        </div>
        <div>
          <Label>Nama lokasi</Label>
          <Input value={promo.location_name ?? ""} placeholder="Pizza Hut Ristorante" onChange={(e) => set("location_name", e.target.value)} />
        </div>
        <div>
          <Label>Link Google Maps</Label>
          <Input value={promo.maps_url ?? ""} placeholder="https://maps.app.goo.gl/…" onChange={(e) => set("maps_url", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Alamat lokasi</Label>
          <Input value={promo.location_address ?? ""} placeholder="Galaxy Mall 2, Lt.1, Surabaya" onChange={(e) => set("location_address", e.target.value)} />
        </div>

        <Section title="Harga & pembayaran" hint="Total bayar dihitung otomatis: harga pendaftar + (jumlah teman × harga teman). Tampil di form, halaman penutup, admin & export.">
          <div>
            <Label>Harga per pendaftar (Rp)</Label>
            <Input type="number" min={0} value={promo.fee ?? ""} placeholder="75000" onChange={(e) => set("fee", e.target.value === "" ? undefined : Number(e.target.value))} />
          </div>
          <div>
            <Label>Harga per teman (Rp)</Label>
            <Input
              type="number"
              min={0}
              value={promo.guest_fee ?? ""}
              placeholder={promo.fee ? String(promo.fee) : "sama dengan harga pendaftar"}
              onChange={(e) => set("guest_fee", e.target.value === "" ? undefined : Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Isi lebih murah untuk diskon ajak teman.</p>
          </div>
          <div>
            <Label>Bank</Label>
            <Input value={promo.bank_name ?? ""} placeholder="Jago Syariah" onChange={(e) => set("bank_name", e.target.value)} />
          </div>
          <div>
            <Label>No. rekening</Label>
            <Input value={promo.bank_account ?? ""} inputMode="numeric" placeholder="505112168603" onChange={(e) => set("bank_account", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Atas nama</Label>
            <Input value={promo.bank_holder ?? ""} placeholder="Nama pemilik rekening" onChange={(e) => set("bank_holder", e.target.value)} />
          </div>
        </Section>

        <Section title="Label harga di poster & kartu" hint="Label bintang harga. Kosongkan teks harga agar otomatis dari harga per pendaftar (mis. 75K).">
          <div>
            <Label>Teks harga</Label>
            <Input value={promo.price ?? ""} placeholder={promo.fee ? "otomatis" : "80K"} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <Label>Kata di atas harga</Label>
            <Input value={promo.price_prefix ?? ""} placeholder="hanya" onChange={(e) => set("price_prefix", e.target.value)} />
          </div>
          <div>
            <Label>Satuan</Label>
            <Input value={promo.price_unit ?? ""} placeholder="/anak" onChange={(e) => set("price_unit", e.target.value)} />
          </div>
          <div>
            <Label>Teks promo</Label>
            <Input value={promo.promo_text ?? ""} placeholder="Ajak teman & hemat 20K!" onChange={(e) => set("promo_text", e.target.value)} />
          </div>
          <div>
            <Label>Harga promo</Label>
            <Input value={promo.promo_price ?? ""} placeholder="140K" onChange={(e) => set("promo_price", e.target.value)} />
          </div>
          <div>
            <Label>Satuan promo</Label>
            <Input value={promo.promo_unit ?? ""} placeholder="/2 orang" onChange={(e) => set("promo_unit", e.target.value)} />
          </div>
        </Section>

        <Section
          title="WhatsApp konfirmasi"
          hint="Tombol WhatsApp di kartu Pembayaran. Nomor per Student Advisor diatur di pertanyaan dropdown-nya (tab Form → centang “Tiap opsi punya No. WhatsApp”)."
        >
          <div>
            <Label>No. WhatsApp contact center</Label>
            <Input value={promo.whatsapp ?? ""} placeholder="08xxxxxxxxxx" inputMode="tel" onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div>
            <Label>Label tombol contact center</Label>
            <Input value={promo.whatsapp_label ?? ""} placeholder="Hubungi Contact Center via WhatsApp" onChange={(e) => set("whatsapp_label", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Template pesan WhatsApp</Label>
            <Textarea rows={8} value={promo.wa_template ?? ""} placeholder={DEFAULT_WA_TEMPLATE} onChange={(e) => set("wa_template", e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">Kosongkan untuk memakai template bawaan (tampil sebagai placeholder). Bisa pakai {"{{kode}}"}, {"{{total}}"}, {"{{ringkasan}}"}, dll.</p>
          </div>
        </Section>

        <div className="sm:col-span-2">
          <Label>Judul daftar yang didapat</Label>
          <Input value={promo.includes_title ?? ""} placeholder="Yang kamu dapat" onChange={(e) => set("includes_title", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Yang didapat (satu per baris)</Label>
          <Textarea
            rows={6}
            value={(promo.includes ?? []).join("\n")}
            placeholder={"Personal size pizza\nMinuman\nApron & topi chef\nSertifikat"}
            onChange={(e) => set("includes", e.target.value.split("\n"))}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl bg-cream/70 p-4 ring-1 ring-line sm:col-span-2 sm:grid-cols-2">
      <legend className="sr-only">{title}</legend>
      <div className="sm:col-span-2">
        <p className="font-semibold text-ink">{title}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}
