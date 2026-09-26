-- Data promosi per sesi (poster, tanggal, lokasi, harga, dll) disimpan fleksibel dalam jsonb.
alter table public.sessions add column if not exists promo jsonb not null default '{}'::jsonb;

-- Bucket publik untuk poster sesi (upload dilakukan server/admin via signed URL).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posters', 'posters', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
