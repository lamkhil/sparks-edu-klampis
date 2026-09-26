-- Revisi Sparks Session "Little Chefs":
-- tanpa email (cek ulang pakai kode + No. HP), Student Advisor jadi dropdown,
-- bukti transfer dikirim via WhatsApp (field upload dihapus), pembayaran dilacak admin,
-- rekening pembayaran diisi.
update public.sessions set
  fields = '[{"id": "f-nama", "key": "nama_siswa", "type": "short_text", "label": "Nama lengkap siswa", "required": true}, {"id": "f-hp", "key": "no_hp_ortu", "type": "phone", "label": "Nomor telepon orang tua", "help": "Gunakan nomor yang terdaftar di Sparks English. Nomor ini juga dipakai untuk cek ulang pendaftaran.", "placeholder": "08xxxxxxxxxx", "required": true}, {"id": "f-program", "key": "program", "type": "radio", "label": "Program kelas", "help": "Khusus siswa aktif Sparks English.", "options": ["Little Sparks", "Sparks Kid"], "required": true}, {"id": "f-jadwal", "key": "jadwal", "type": "slot", "label": "Jadwal Sparks Session", "help": "Harap memilih sesuai level atau usia siswa.", "required": true, "slots": [{"id": "ls12", "label": "Little Sparks 1–2 · usia 3–4 th · 13.00–14.00", "quota": 15, "guest_quota": 5}, {"id": "ls35", "label": "Little Sparks 3–5 · usia 5–6 th · 14.30–15.30", "quota": 20, "guest_quota": 5}, {"id": "sk", "label": "Sparks Kid · 16.00–17.00", "quota": 20, "guest_quota": 5}]}, {"id": "f-sa", "key": "student_advisor", "type": "select", "label": "Student Advisor", "placeholder": "— Pilih Student Advisor —", "options": ["Ms Fila", "Ms Dita", "Ms Dina"], "required": true}, {"id": "f-teman", "key": "teman", "type": "guests", "label": "Apakah membawa teman?", "help": "Khusus teman yang belum menjadi siswa Sparks English. Kuota teman terbatas 5 anak per jadwal.", "max_guests": 1, "required": false}]'::jsonb,
  track_payment = true,
  email_enabled = false,
  success_message = '🎉 Selamat! Kamu berhasil terdaftar di Sparks Session!

Kode pendaftaran: {{kode}}
Jadwal: {{jadwal}}

Terima kasih sudah melakukan pendaftaran. Untuk menyelesaikan proses pendaftaran, silakan melakukan pembayaran Rp 75.000/anak melalui nomor rekening berikut:

Bank: Jago Syariah
No. Rekening: 505112168603
Atas Nama: Sri Rahmadiani

Setelah melakukan pembayaran, mohon kirim bukti transfer via WhatsApp maksimal 2 jam setelah pendaftaran, ke Student Advisor masing-masing ({{student_advisor}}) atau Contact Center Sparks English Klampis.

*Jika tidak datang saat hari H, uang pendaftaran hangus.

Terima kasih! 😊'
where slug = 'little-chefs';
