-- Teman bisa ikut jadwal berbeda dari pendaftar; kuota teman berkurang di jadwal masing-masing.
-- Aman dijalankan berulang kali.

alter table public.submissions add column if not exists guest_slots jsonb not null default '{}'::jsonb;

-- Data lama: anggap semua teman ikut jadwal pendaftar (kuota yang sudah terpakai tetap benar).
update public.submissions
set guest_slots = jsonb_build_object(slot, guest_count)
where slot is not null and guest_count > 0 and guest_slots = '{}'::jsonb;

drop function if exists public.submit_form(uuid, text, jsonb, text, int, text);

create or replace function public.submit_form(
  p_session_id uuid,
  p_email text,
  p_answers jsonb,
  p_slot text default null,
  p_guests int default 0,
  p_payment_status text default 'none',
  p_guest_slots jsonb default '{}'::jsonb
)
returns table (code text, submission_id uuid)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  s public.sessions%rowtype;
  used int;
  slot_quota int;
  slot_used int;
  new_code text;
  new_id uuid;
  attempt int := 0;
  gk text;
  gv int;
  g_quota int;
  g_used int;
  guest_total int := 0;
begin
  -- Kunci baris sesi: submit bersamaan diantrikan di sini.
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

  if s.one_per_email and exists (
    select 1 from public.submissions
    where session_id = s.id and status = 'active' and lower(email) = lower(p_email)
  ) then
    raise exception 'EMAIL_ALREADY_SUBMITTED' using errcode = 'P0001';
  end if;

  select count(*) into used from public.submissions where session_id = s.id and status = 'active';
  if used >= s.quota then
    raise exception 'QUOTA_FULL' using errcode = 'P0001';
  end if;

  -- Kuota reguler jadwal pendaftar (tidak terpengaruh jadwal teman).
  if p_slot is not null then
    select (o->>'quota')::int into slot_quota
    from jsonb_array_elements(s.fields) f, jsonb_array_elements(f->'slots') o
    where f->>'type' = 'slot' and o->>'id' = p_slot
    limit 1;
    if slot_quota is null then
      raise exception 'SLOT_INVALID' using errcode = 'P0001';
    end if;

    select count(*) into slot_used
    from public.submissions
    where session_id = s.id and status = 'active' and slot = p_slot;

    if slot_used >= slot_quota then
      raise exception 'SLOT_FULL' using errcode = 'P0001';
    end if;
  end if;

  -- Kuota teman: dicek per jadwal yang dipilih tiap teman, bisa beda dari jadwal pendaftar.
  if p_guest_slots is not null and p_guest_slots <> '{}'::jsonb then
    for gk, gv in select key, value::int from jsonb_each_text(p_guest_slots) loop
      if gv <= 0 then continue; end if;
      guest_total := guest_total + gv;

      select (o->>'guest_quota')::int into g_quota
      from jsonb_array_elements(s.fields) f, jsonb_array_elements(f->'slots') o
      where f->>'type' = 'slot' and o->>'id' = gk
      limit 1;
      if g_quota is null then
        raise exception 'SLOT_INVALID' using errcode = 'P0001';
      end if;

      select coalesce(sum((guest_slots->>gk)::int), 0) into g_used
      from public.submissions
      where session_id = s.id and status = 'active' and guest_slots ? gk;

      if g_used + gv > g_quota then
        raise exception 'GUEST_FULL:%', gk using errcode = 'P0001';
      end if;
    end loop;
  end if;

  loop
    attempt := attempt + 1;
    new_code := public.gen_submission_code();
    begin
      insert into public.submissions (session_id, code, email, answers, slot, guest_count, payment_status, guest_slots)
      values (s.id, new_code, lower(trim(p_email)), p_answers, p_slot, greatest(coalesce(guest_total, p_guests), 0), p_payment_status, coalesce(p_guest_slots, '{}'::jsonb))
      returning id into new_id;
      exit;
    exception when unique_violation then
      if attempt >= 10 then raise; end if;
    end;
  end loop;

  return query select new_code, new_id;
end;
$$;

revoke all on function public.submit_form(uuid, text, jsonb, text, int, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_form(uuid, text, jsonb, text, int, text, jsonb) to service_role;
