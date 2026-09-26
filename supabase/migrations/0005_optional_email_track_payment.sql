-- Email pendaftar opsional (cek ulang bisa pakai No. HP) & pelacakan pembayaran manual per sesi.

alter table public.submissions alter column email drop not null;

-- Jika aktif, pendaftar baru berstatus pembayaran "Menunggu" dan admin menandai "Lunas"
-- setelah konfirmasi (mis. lewat Student Advisor), tanpa harus upload bukti transfer.
alter table public.sessions add column if not exists track_payment boolean not null default false;

-- submit_form: email boleh kosong.
create or replace function public.submit_form(
  p_session_id uuid,
  p_email text,
  p_answers jsonb,
  p_slot text default null,
  p_guests int default 0,
  p_payment_status text default 'none'
)
returns table (code text, submission_id uuid)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  s public.sessions%rowtype;
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  used int;
  slot_quota int;
  guest_quota int;
  slot_used int;
  guests_used int;
  new_code text;
  new_id uuid;
  attempt int := 0;
begin
  select * into s from public.sessions where id = p_session_id for update;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if s.status <> 'published' then
    raise exception 'SESSION_CLOSED' using errcode = 'P0001';
  end if;
  if s.opens_at is not null and now() < s.opens_at then
    raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001';
  end if;
  if s.closes_at is not null and now() > s.closes_at then
    raise exception 'SESSION_CLOSED' using errcode = 'P0001';
  end if;

  if s.one_per_email and v_email is not null and exists (
    select 1 from public.submissions
    where session_id = s.id and status = 'active' and lower(email) = v_email
  ) then
    raise exception 'EMAIL_ALREADY_SUBMITTED' using errcode = 'P0001';
  end if;

  select count(*) into used from public.submissions where session_id = s.id and status = 'active';
  if used >= s.quota then
    raise exception 'QUOTA_FULL' using errcode = 'P0001';
  end if;

  if p_slot is not null then
    select (o->>'quota')::int, coalesce((o->>'guest_quota')::int, 0)
      into slot_quota, guest_quota
    from jsonb_array_elements(s.fields) f, jsonb_array_elements(f->'slots') o
    where f->>'type' = 'slot' and o->>'id' = p_slot
    limit 1;
    if slot_quota is null then
      raise exception 'SLOT_INVALID' using errcode = 'P0001';
    end if;

    select count(*), coalesce(sum(guest_count), 0) into slot_used, guests_used
    from public.submissions
    where session_id = s.id and status = 'active' and slot = p_slot;

    if slot_used >= slot_quota then
      raise exception 'SLOT_FULL' using errcode = 'P0001';
    end if;
    if p_guests > 0 and guests_used + p_guests > guest_quota then
      raise exception 'GUEST_FULL' using errcode = 'P0001';
    end if;
  end if;

  loop
    attempt := attempt + 1;
    new_code := public.gen_submission_code();
    begin
      insert into public.submissions (session_id, code, email, answers, slot, guest_count, payment_status)
      values (s.id, new_code, v_email, p_answers, p_slot, greatest(p_guests, 0), p_payment_status)
      returning id into new_id;
      exit;
    exception when unique_violation then
      if attempt >= 10 then raise; end if;
    end;
  end loop;

  return query select new_code, new_id;
end;
$$;

revoke all on function public.submit_form(uuid, text, jsonb, text, int, text) from public, anon, authenticated;
grant execute on function public.submit_form(uuid, text, jsonb, text, int, text) to service_role;
