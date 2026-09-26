# Form Berkuota

Website form pendaftaran dengan **kuota terbatas**. Admin membuat sesi, menyusun pertanyaan sendiri (mirip Google Form), mengatur pesan penutup, dan mengirim email konfirmasi lewat **SMTP**. Setiap pengisi mendapat **kode submission** (mis. `SK-7F3K9Q`) untuk cek ulang isiannya di kemudian hari.

Stack: Next.js 16 + Supabase (Postgres + Auth). Bisa di-host gratis di Vercel/Netlify + Supabase free tier.

## Fitur

- **Sesi = 1 form + kuota**: judul, deskripsi, kuota, jadwal buka/tutup, status draft/dibuka/ditutup.
- **Form builder**: teks singkat, paragraf, email, no. HP, angka, tanggal, dropdown, pilihan ganda, kotak centang. Urutkan dengan drag & drop, ada pratinjau.
- **Kuota aman**: submit diproses atomik di database (`submit_form`, row lock), jadi kuota tidak jebol walau banyak orang submit bersamaan.
- **Pesan penutup & email** bisa diatur per sesi, dengan placeholder `{{kode}}`, `{{judul}}`, `{{email}}`, `{{link_cek}}`, `{{tanggal}}`, dan `{{<key field>}}` (mis. `{{nama}}`).
- **Cek ulang** di `/cek` dengan kode + email. Per sesi admin mengatur: tampilkan detail, izinkan ubah, izinkan batal (slot kembali ke kuota), dan batas waktunya.
- **Admin**: daftar sesi dengan progres kuota, tabel isian (cari/filter), kirim ulang email, batalkan/pulihkan/hapus isian, export CSV, duplikat sesi.

## Setup

### 1. Supabase
1. Buat project gratis di <https://supabase.com>.
2. Buka **SQL Editor**, tempel & jalankan isi `supabase/migrations/0001_init.sql`.
3. **Authentication → Users → Add user**: buat akun admin (email + password, centang *Auto Confirm*).
4. Jadikan user itu admin (SQL Editor):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'admin@contoh.com';
   ```
5. **Authentication → Sign In / Providers**: matikan *Allow new users to sign up* agar orang lain tidak bisa mendaftar.

### 2. Environment
Salin `.env.example` ke `.env.local`, lalu isi dari **Project Settings → API**:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key (**rahasia**, hanya server) |
| `APP_URL` | URL publik aplikasi, dipakai untuk link di email |
| `APP_SECRET` | string acak panjang (`openssl rand -hex 32`) |

### 3. Jalankan
```bash
npm install
npm run dev
```
Buka <http://localhost:3000/admin/login>, lalu atur SMTP di **Pengaturan SMTP** (ada tombol kirim email tes).

Contoh SMTP Gmail: host `smtp.gmail.com`, port `465`, SSL aktif, user = alamat Gmail, password = [App Password](https://myaccount.google.com/apppasswords). Alternatif gratis: Brevo (300 email/hari), Zoho Mail.

### 4. Uji kuota (opsional)
```bash
npx tsx --env-file=.env.local scripts/race-test.ts
```
Mengirim 50 submit paralel ke sesi berkuota 10. Hasil yang benar: tepat 10 berhasil.

## Deploy gratis

**Vercel** (Hobby, untuk non-komersial) atau **Netlify** (free, boleh komersial):
1. Push repo ke GitHub, lalu import di Vercel/Netlify.
2. Isi environment variables yang sama seperti di atas (`APP_URL` = domain produksi).
3. Deploy.

Catatan free tier Supabase: database 500 MB, dan project di-*pause* bila tidak ada aktivitas selama 7 hari (tinggal di-*restore* dari dashboard).

## Struktur

```
supabase/migrations/0001_init.sql   skema, RLS, fungsi submit_form (atomik)
src/lib/                            form-schema (validasi dinamis), mailer, template, data, auth
src/components/                     dynamic-form, form-builder, session-editor, ui
src/app/s/[slug]                    form publik + halaman selesai
src/app/cek                         cek ulang / ubah / batal
src/app/admin                       login, sesi, isian, export CSV, pengaturan SMTP
```
