-- Data awal: Sparks Session "Little Chefs" (9 Okt 2026).
-- Hanya dibuat jika slug belum ada, sehingga perubahan dari admin tidak tertimpa.
insert into public.sessions (slug, title, description, status, quota, opens_at, closes_at, fields, success_message, email_enabled, email_subject, email_body, allow_view, allow_edit, allow_cancel, edit_deadline, one_per_email, promo)
values ('little-chefs',
  'Sparks Session: Little Chefs',
  'Serunya jadi koki cilik! Anak-anak belajar membuat pizza sendiri sambil berlatih bahasa Inggris bersama tim Sparks English Klampis.

Pendaftaran dibuka 28 September – 2 Oktober 2026. Kuota terbatas per jadwal.

*Jika tidak datang saat hari H, uang pendaftaran hangus.',
  'published',
  55,
  '2026-09-28T00:00:00+07:00',
  '2026-10-02T23:59:00+07:00',
  '[{"id":"f-nama","key":"nama_siswa","type":"short_text","label":"Nama lengkap siswa","required":true},{"id":"f-hp","key":"no_hp_ortu","type":"phone","label":"Nomor telepon orang tua","help":"Gunakan nomor yang terdaftar di Sparks English.","placeholder":"08xxxxxxxxxx","required":true},{"id":"f-email","key":"email","type":"email","label":"Email orang tua","help":"Kode pendaftaran & konfirmasi dikirim ke email ini.","required":true},{"id":"f-program","key":"program","type":"radio","label":"Program kelas","help":"Khusus siswa aktif Sparks English.","options":["Little Sparks","Sparks Kid"],"required":true},{"id":"f-jadwal","key":"jadwal","type":"slot","label":"Jadwal Sparks Session","help":"Harap memilih sesuai level atau usia siswa.","required":true,"slots":[{"id":"ls12","label":"Little Sparks 1–2 · usia 3–4 th · 13.00–14.00","quota":15,"guest_quota":5},{"id":"ls35","label":"Little Sparks 3–5 · usia 5–6 th · 14.30–15.30","quota":20,"guest_quota":5},{"id":"sk","label":"Sparks Kid · 16.00–17.00","quota":20,"guest_quota":5}]},{"id":"f-sa","key":"student_advisor","type":"short_text","label":"Student Advisor","placeholder":"Nama Student Advisor","required":true},{"id":"f-teman","key":"teman","type":"guests","label":"Apakah membawa teman?","help":"Khusus teman yang belum menjadi siswa Sparks English. Kuota teman terbatas 5 anak per jadwal.","max_guests":1,"required":false},{"id":"f-bukti","key":"bukti_transfer","type":"file","label":"Bukti transfer","help":"Tiket Rp 75.000/anak. Jika belum transfer, kamu tetap bisa mendaftar lalu konfirmasi pembayaran ke Student Advisor maksimal 2 jam setelah mendaftar.","required":false}]'::jsonb,
  '🎉 Selamat! Kamu berhasil terdaftar di Sparks Session!

Kode pendaftaran: {{kode}}
Jadwal: {{jadwal}}

Terima kasih sudah melakukan pendaftaran. Untuk menyelesaikan proses pendaftaran, silakan melakukan pembayaran melalui nomor rekening berikut:

Bank: XXXXX
No. Rekening: XXXXXXX
Atas Nama: XXXXX

Setelah melakukan pembayaran, mohon melakukan konfirmasi maksimal 2 jam setelah pendaftaran.

Konfirmasi pembayaran dapat dilakukan melalui Student Advisor masing-masing atau Contact Center Sparks English Klampis.

*Jika tidak datang saat hari H, uang pendaftaran hangus.

Terima kasih! 😊',
  true,
  'Pendaftaran {{judul}} berhasil ({{kode}})',
  'Halo,

Selamat! {{nama_siswa}} berhasil terdaftar di {{judul}}.

Kode pendaftaran: {{kode}}
Jadwal: {{jadwal}}
Tanggal: Jumat, 9 Oktober 2026
Lokasi: Pizza Hut – Galaxy Mall 2, Lantai 1, Surabaya

Untuk menyelesaikan pendaftaran, silakan melakukan pembayaran Rp 75.000/anak ke:
Bank: XXXXX
No. Rekening: XXXXXXX
Atas Nama: XXXXX

Mohon konfirmasi pembayaran maksimal 2 jam setelah pendaftaran melalui Student Advisor masing-masing atau Contact Center Sparks English Klampis.

Cek ulang pendaftaranmu kapan saja di: {{link_cek}}

*Jika tidak datang saat hari H, uang pendaftaran hangus.

Salam,
Sparks English Klampis',
  true,
  false,
  false,
  null,
  false,
  '{"subtitle":"Pizza Maker Junior","event_date":"2026-10-09","event_time":"13.00–17.00 (3 jadwal)","age_range":"Little Sparks & Sparks Kid","location_name":"Pizza Hut – Galaxy Mall 2, Lt. 1","location_address":"Galaxy Mall 2, Lantai 1, Surabaya","maps_url":"https://maps.google.com/?q=Pizza+Hut+Galaxy+Mall+2+Surabaya","price":"Rp75K","price_unit":"/anak","promo_text":"Boleh ajak 1 teman non-siswa Sparks!","promo_unit":"","includes":["Pizza (personal size)","Minuman","Topi & apron chef","Buku gambar","Goodie bag"],"partner":"Pizza Hut","internal_notes":"Pendamping:\n1. EC: Cindy\n2. Admin: Rahma\n3. Teacher (2): CC dan RR\n4. Teaching assistant (1): Fara\n5. SA (1): Dita\n\nMax pendaftaran & pembayaran: hari Senin\nSetor list peserta: Senin, 5 Oktober 2026"}'::jsonb)
on conflict (slug) do nothing;
