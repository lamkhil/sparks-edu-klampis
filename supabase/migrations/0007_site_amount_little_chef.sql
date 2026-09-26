-- Tampilan situs dari admin, total bayar per pendaftaran, template pengingat, dan revisi "Little Chef".

-- Isi & tampilan situs publik (Admin → Tampilan Situs).
alter table public.settings add column if not exists site jsonb not null default '{}'::jsonb;
update public.settings set site = '{"brand":"Sparks English","branch":"Klampis","event_name":"Sparks Session","tagline":"Daftar Sparks Session di Sparks English Klampis — kuota terbatas, amankan kursimu sekarang.","logo_url":"/brand/sparks-english-logo.png","og_image_url":"/brand/og.png","hero_badge":"Sparks English Klampis presents","hero_title":"Ikuti *Sparks Session* di Klampis!","hero_text":"Sesi seru belajar bahasa Inggris untuk anak usia 3–15 tahun bersama guru native & bersertifikat Cambridge TKT. Pilih sesi, isi formulir, dan simpan kode pendaftaranmu.","hero_image_url":"/brand/klampis-facade.webp","hero_cta":"Lihat sesi & daftar","highlights":[{"title":"Usia 3–15 tahun","text":"Program sesuai jenjang, dari Little Sparks sampai remaja."},{"title":"Kurikulum CEFR","text":"Terstruktur, terukur, dan menyenangkan."},{"title":"Guru native & TKT","text":"Pengajar berpengalaman dan bersertifikat."}],"sessions_eyebrow":"Sparks Session","sessions_title":"Sesi yang bisa kamu ikuti","sessions_text":"Kuota tiap sesi terbatas dan dihitung otomatis. Begitu penuh, pendaftaran langsung ditutup.","empty_title":"Belum ada sesi yang dibuka","empty_text":"Pantau terus halaman ini, sesi baru segera hadir!","steps_title":"Cara daftar","steps":[{"title":"Pilih sesi","text":"Lihat jadwal, lokasi, dan sisa kuota setiap Sparks Session."},{"title":"Isi formulir","text":"Lengkapi data peserta. Kursi langsung terkunci begitu formulir terkirim."},{"title":"Simpan kodenya","text":"Kode pendaftaran tampil di layar untuk cek ulang pendaftaran."}],"cta_title":"Sudah mendaftar?","cta_text":"Masukkan kode pendaftaran dan No. HP untuk melihat, mengubah, atau membatalkan pendaftaranmu.","cta_button":"Cek pendaftaran","address":"Jl. Klampis Jaya, Klampis Ngasem, Kec. Sukolilo, Surabaya, Jawa Timur 60117","maps_url":"https://maps.google.com/?q=Sparks+English+Klampis+Surabaya","website_url":"https://sparks-edu.com/location/surabaya/","website_label":"sparks-edu.com"}'::jsonb || site where id = 1;

-- Total yang harus dibayar, dihitung saat mendaftar (harga pendaftar + harga teman).
alter table public.submissions add column if not exists amount int;

-- Template pengingat (WhatsApp/email) per sesi.
alter table public.sessions add column if not exists reminders jsonb;

-- Little Chef: judul tanpa "s", harga & rekening sebagai pengaturan tersendiri, pesan penutup tanpa rekening.
update public.sessions set
  title = 'Sparks Session: Little Chef',
  promo = promo || '{"fee":75000,"guest_fee":75000,"price":"","price_prefix":"hanya","price_unit":"/anak","includes_title":"Yang kamu dapat","bank_name":"Jago Syariah","bank_account":"505112168603","bank_holder":"Sri Rahmadiani","whatsapp_label":"Hubungi Contact Center Sparks Klampis"}'::jsonb,
  success_message = '🎉 Selamat! Kamu berhasil terdaftar di Sparks Session!

Jadwal: {{jadwal}}

Untuk menyelesaikan pendaftaran, silakan transfer sesuai total di bawah, lalu kirim bukti transfer via WhatsApp maksimal 2 jam setelah pendaftaran ke Student Advisor ({{student_advisor}}) atau Contact Center Sparks English Klampis.

*Jika tidak datang saat hari H, uang pendaftaran hangus.

Terima kasih! 😊',
  reminders = '[{"id":"bayar","name":"Pengingat pembayaran","email_subject":"Pengingat pembayaran {{judul}} ({{kode}})","text":"Halo Bapak/Ibu, kami dari Sparks English Klampis 😊\n\nMengingatkan pembayaran {{judul}} untuk {{nama_siswa}} ({{jadwal}}).\n\nKode pendaftaran: {{kode}}\nTotal: {{total}}\n\nTransfer ke {{bank}} {{no_rekening}} a.n. {{atas_nama}}, lalu kirim bukti transfer ke Student Advisor ({{student_advisor}}).\n\nTerima kasih!"},{"id":"hadir","name":"Pengingat kehadiran","email_subject":"Sampai jumpa di {{judul}}!","text":"Halo Bapak/Ibu, sampai jumpa di {{judul}}! 🍕\n\nSiswa: {{nama_siswa}}\nJadwal: {{jadwal}}\nTanggal: {{tanggal_acara}}\nLokasi: {{lokasi}}\nKode pendaftaran: {{kode}}\n\nMohon datang 15 menit lebih awal ya. *Jika tidak datang saat hari H, uang pendaftaran hangus.\n\nTerima kasih!"}]'::jsonb
where slug = 'little-chefs';

-- Total untuk pendaftar yang sudah ada (jika ada).
update public.submissions sub set amount = 75000 + sub.guest_count * 75000
from public.sessions s where s.id = sub.session_id and s.slug = 'little-chefs' and sub.amount is null;
