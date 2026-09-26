"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/lib/site";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { createSiteAssetUpload, saveSite } from "./actions";

type Item = { title: string; text: string };

export function SiteForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const text = (k: keyof SiteSettings, label: string, opts: { area?: boolean; placeholder?: string; hint?: string } = {}) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {opts.area ? (
        <Textarea rows={3} value={s[k] as string} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <Input value={s[k] as string} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value as never)} />
      )}
      {opts.hint && <p className="text-xs text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  const save = () =>
    start(async () => {
      const r = await saveSite(s);
      if (r.ok) toast.success("Tampilan situs tersimpan");
      else toast.error(r.error);
    });

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
          <CardDescription>Dipakai di header, footer, judul tab browser & panel admin.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("brand", "Nama brand", { placeholder: "Sparks English" })}
          {text("branch", "Nama cabang", { placeholder: "Klampis" })}
          {text("event_name", "Nama program/acara", { placeholder: "Sparks Session" })}
          {text("tagline", "Tagline (footer & deskripsi pencarian)")}
          <ImageField label="Logo" value={s.logo_url} onChange={(v) => set("logo_url", v)} wide />
          <ImageField label="Gambar saat link dibagikan (WhatsApp, dll.)" value={s.og_image_url} onChange={(v) => set("og_image_url", v)} wide />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero (bagian paling atas)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("hero_badge", "Label kecil di atas judul")}
          {text("hero_cta", "Tombol utama")}
          <div className="sm:col-span-2">{text("hero_title", "Judul", { hint: "Apit teks dengan *bintang* untuk menyorotnya, mis. Ikuti *Sparks Session* di Klampis!" })}</div>
          <div className="sm:col-span-2">{text("hero_text", "Deskripsi", { area: true })}</div>
          <ImageField label="Foto hero" value={s.hero_image_url} onChange={(v) => set("hero_image_url", v)} tall />
          <ItemsEditor label="Keunggulan (kotak kecil di bawah tombol)" items={s.highlights} onChange={(v) => set("highlights", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar sesi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("sessions_eyebrow", "Label kecil")}
          {text("sessions_title", "Judul")}
          <div className="sm:col-span-2">{text("sessions_text", "Deskripsi", { area: true })}</div>
          {text("empty_title", "Judul jika belum ada sesi")}
          {text("empty_text", "Teks jika belum ada sesi")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cara daftar & ajakan cek pendaftaran</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {text("steps_title", "Judul bagian langkah")}
          <div />
          <ItemsEditor label="Langkah-langkah" items={s.steps} onChange={(v) => set("steps", v)} />
          {text("cta_title", "Judul ajakan")}
          {text("cta_button", "Teks tombol cek pendaftaran")}
          <div className="sm:col-span-2">{text("cta_text", "Teks ajakan", { area: true })}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lokasi & tautan (footer)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("address", "Alamat", { area: true })}</div>
          {text("maps_url", "Link Google Maps")}
          <div />
          {text("website_url", "Link website")}
          {text("website_label", "Teks link website")}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur md:left-(--sidebar-width)">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-4">
          <Button variant="outline" asChild>
            <a href="/" target="_blank">
              Lihat situs ↗
            </a>
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ItemsEditor({ label, items, onChange }: { label: string; items: Item[]; onChange: (v: Item[]) => void }) {
  const update = (i: number, patch: Partial<Item>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>{label}</Label>
      {items.map((it, i) => (
        <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input value={it.title} placeholder="Judul" onChange={(e) => update(i, { title: e.target.value })} />
          <Input value={it.text} placeholder="Keterangan" onChange={(e) => update(i, { text: e.target.value })} />
          <Button type="button" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            Hapus
          </Button>
        </div>
      ))}
      {items.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { title: "", text: "" }])}>
          + Tambah
        </Button>
      )}
    </div>
  );
}

function ImageField({ label, value, onChange, wide, tall }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; tall?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return void toast.error("Maksimal 5 MB");
    setBusy(true);
    try {
      const r = await createSiteAssetUpload(file.name.split(".").pop()?.toLowerCase() ?? "png");
      if (!r.ok) throw new Error(r.error);
      const { error } = await createBrowserSupabase().storage.from("posters").uploadToSignedUrl(r.path, r.token, file, { contentType: file.type });
      if (error) throw error;
      onChange(r.publicUrl);
      toast.success("Gambar terupload — jangan lupa Simpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className={`relative overflow-hidden rounded-xl border bg-muted ${tall ? "aspect-[4/5] max-w-60" : wide ? "h-20" : "h-32"}`}>
        {value && <Image src={value} alt={label} fill sizes="240px" className={tall ? "object-cover" : "object-contain p-2"} />}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "Mengupload…" : "Ganti gambar"}
      </Button>
    </div>
  );
}
