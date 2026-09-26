-- Form Berkuota: skema awal
-- Jalankan di Supabase SQL Editor atau `supabase db push`.

create extension if not exists pgcrypto;

-- ============ ADMIN ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ============ SETTINGS (SMTP) ============
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  smtp_host text,
  smtp_port int default 587,
  smtp_secure boolean default false,
  smtp_user text,
  smtp_pass text,
  mail_from_name text,
  mail_from_email text,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ============ SESSIONS ============
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  quota int not null default 100 check (quota >= 0),
  opens_at timestamptz,
  closes_at timestamptz,
  fields jsonb not null default '[]'::jsonb,
  success_message text not null default 'Terima kasih! Isian kamu sudah kami terima. Simpan kode {{kode}} untuk cek ulang.',
  email_enabled boolean not null default true,
  email_subject text not null default 'Konfirmasi: {{judul}} ({{kode}})',
  email_body text not null default E'Halo,\n\nTerima kasih sudah mengisi form "{{judul}}".\nKode submission kamu: {{kode}}\n\nCek ulang isian kamu di: {{link_cek}}\n\nSalam.',
  allow_view boolean not null default true,
  allow_edit boolean not null default false,
  allow_cancel boolean not null default false,
  edit_deadline timestamptz,
  one_per_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ SUBMISSIONS ============
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  code text not null unique,
  email text not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists submissions_session_idx on public.submissions (session_id, status);
create index if not exists submissions_email_idx on public.submissions (session_id, lower(email));

-- ============ RLS ============
-- Publik tidak mengakses tabel langsung; server memakai service-role key.
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.sessions enable row level security;
alter table public.submissions enable row level security;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (user_id = auth.uid());

drop policy if exists sessions_admin on public.sessions;
create policy sessions_admin on public.sessions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists submissions_admin on public.submissions;
create policy submissions_admin on public.submissions for all using (public.is_admin()) with check (public.is_admin());
-- settings: tanpa policy => hanya service role yang bisa baca (SMTP password aman).

-- ============ KODE SUBMISSION ============
create or replace function public.gen_submission_code()
returns text
language plpgsql volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ'; -- tanpa 0/O/1/I/L/U
  result text := 'SK-';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- ============ SUBMIT ATOMIK (kuota aman dari race condition) ============
create or replace function public.submit_form(p_session_id uuid, p_email text, p_answers jsonb)
returns table (code text, submission_id uuid)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  s public.sessions%rowtype;
  used int;
  new_code text;
  new_id uuid;
  attempt int := 0;
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

  loop
    attempt := attempt + 1;
    new_code := public.gen_submission_code();
    begin
      insert into public.submissions (session_id, code, email, answers)
      values (s.id, new_code, lower(trim(p_email)), p_answers)
      returning id into new_id;
      exit;
    exception when unique_violation then
      if attempt >= 10 then raise; end if;
    end;
  end loop;

  return query select new_code, new_id;
end;
$$;

-- Pulihkan (un-cancel) tidak disediakan untuk publik; admin bisa lewat dashboard.
revoke all on function public.submit_form(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_form(uuid, text, jsonb) to service_role;

-- ============ STATISTIK KUOTA ============
create or replace view public.session_stats
with (security_invoker = true)
as
select s.id as session_id,
       count(sub.id) filter (where sub.status = 'active') as used,
       count(sub.id) filter (where sub.status = 'cancelled') as cancelled
from public.sessions s
left join public.submissions sub on sub.session_id = s.id
group by s.id;

-- ============ updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch before update on public.sessions
for each row execute function public.touch_updated_at();

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch before update on public.submissions
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
for each row execute function public.touch_updated_at();

-- ============ ADMIN PERTAMA ============
-- 1. Buat user di Supabase Dashboard > Authentication > Users (email + password).
-- 2. Jalankan (ganti emailnya):
-- insert into public.admins (user_id) select id from auth.users where email = 'admin@contoh.com';
