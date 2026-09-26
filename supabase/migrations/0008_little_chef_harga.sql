-- Harga Little Chef: Rp80.000/orang; mulai 2 orang (pendaftar + teman) Rp70.000/orang → berdua Rp140.000.
update public.sessions set promo = (promo - 'guest_fee') || '{"fee": 80000, "group_prices": [{"people": 2, "fee": 70000}], "promo_text": "Ajak teman, jadi 70K/anak!", "promo_price": "140K", "promo_unit": "/2 anak"}'::jsonb
where slug = 'little-chefs';

-- Hitung ulang total pendaftar yang sudah ada (jika ada).
update public.submissions sub set amount = case when sub.guest_count > 0 then (1 + sub.guest_count) * 70000 else 80000 end
from public.sessions s where s.id = sub.session_id and s.slug = 'little-chefs';
