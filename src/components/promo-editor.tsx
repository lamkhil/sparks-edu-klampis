"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createPosterUpload } from "@/app/admin/(panel)/sesi/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { Promo } from "@/lib/promo";
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

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-sun-50 p-4 ring-1 ring-sun-200 sm:col-span-2 sm:grid-cols-4">
          <div>
            <Label>Harga</Label>
            <Input value={promo.price ?? ""} placeholder="80K" onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <Label>Satuan</Label>
            <Input value={promo.price_unit ?? ""} placeholder="/pax" onChange={(e) => set("price_unit", e.target.value)} />
          </div>
          <div>
            <Label>Harga promo</Label>
            <Input value={promo.promo_price ?? ""} placeholder="140K" onChange={(e) => set("promo_price", e.target.value)} />
          </div>
          <div>
            <Label>Satuan promo</Label>
            <Input value={promo.promo_unit ?? ""} placeholder="/2 orang" onChange={(e) => set("promo_unit", e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <Label>Teks promo</Label>
            <Input value={promo.promo_text ?? ""} placeholder="Ajak teman & hemat 20K!" onChange={(e) => set("promo_text", e.target.value)} />
          </div>
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
