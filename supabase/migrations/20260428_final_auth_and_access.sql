create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  business_name text not null,
  email text unique not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  service_type text not null,
  scope text,
  start_date date,
  status text not null default 'planning',
  brand_color text,
  next_action text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role text not null default 'client' check (role in ('client')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (project_id, email)
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author text not null,
  author_role text not null check (author_role in ('admin', 'client')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  size bigint,
  storage_path text not null,
  bucket text not null default 'project-files',
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null,
  preview_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revision')),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_project_approvals_updated_at on public.project_approvals;
create trigger trg_project_approvals_updated_at
before update on public.project_approvals
for each row
execute function public.set_updated_at();


create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));

  if new.email = 'tunawebadm@gmail.com' then
    new.role = 'admin';
  elsif tg_op = 'UPDATE' and old.role = 'admin' then
    new.role = 'admin';
  elsif new.role is null or new.role not in ('admin', 'client') then
    new.role = 'client';
  elsif new.role = 'admin' and new.email <> 'tunawebadm@gmail.com' then
    new.role = 'client';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_enforce_role on public.profiles;
create trigger trg_profiles_enforce_role
before insert or update on public.profiles
for each row
execute function public.enforce_profile_role();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.project_approvals enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all on public.clients
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists projects_client_select_member on public.projects;
create policy projects_client_select_member on public.projects
for select
using (public.is_admin() or public.is_project_member(id));

drop policy if exists project_members_self_read on public.project_members;
create policy project_members_self_read on public.project_members
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists project_members_admin_manage on public.project_members;
create policy project_members_admin_manage on public.project_members
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists project_invites_admin_manage on public.project_invites;
create policy project_invites_admin_manage on public.project_invites
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists project_invites_user_read_own_pending on public.project_invites;
create policy project_invites_user_read_own_pending on public.project_invites
for select
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  and status = 'pending'
);

drop policy if exists project_invites_user_accept_own on public.project_invites;
create policy project_invites_user_accept_own on public.project_invites
for update
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  and status = 'pending'
)
with check (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  and status in ('accepted', 'pending')
);

drop policy if exists project_messages_member_or_admin_select on public.project_messages;
create policy project_messages_member_or_admin_select on public.project_messages
for select
using (public.is_admin() or public.is_project_member(project_id));

drop policy if exists project_messages_member_or_admin_insert on public.project_messages;
create policy project_messages_member_or_admin_insert on public.project_messages
for insert
with check (public.is_admin() or public.is_project_member(project_id));

drop policy if exists project_files_member_or_admin_select on public.project_files;
create policy project_files_member_or_admin_select on public.project_files
for select
using (public.is_admin() or public.is_project_member(project_id));

drop policy if exists project_files_member_or_admin_insert on public.project_files;
create policy project_files_member_or_admin_insert on public.project_files
for insert
with check (public.is_admin() or public.is_project_member(project_id));

drop policy if exists project_approvals_member_or_admin_select on public.project_approvals;
create policy project_approvals_member_or_admin_select on public.project_approvals
for select
using (public.is_admin() or public.is_project_member(project_id));

drop policy if exists project_approvals_admin_insert on public.project_approvals;
create policy project_approvals_admin_insert on public.project_approvals
for insert
with check (public.is_admin());

drop policy if exists project_approvals_member_or_admin_update on public.project_approvals;
create policy project_approvals_member_or_admin_update on public.project_approvals
for update
using (public.is_admin() or public.is_project_member(project_id))
with check (public.is_admin() or public.is_project_member(project_id));

-- STORAGE (bucket privado project-files)
-- 1) Crie o bucket privado project-files no painel do Supabase.
-- 2) Rode as políticas abaixo para storage.objects.

drop policy if exists storage_project_files_admin_select on storage.objects;
create policy storage_project_files_admin_select on storage.objects
for select
using (bucket_id = 'project-files' and public.is_admin());

drop policy if exists storage_project_files_admin_insert on storage.objects;
create policy storage_project_files_admin_insert on storage.objects
for insert
with check (bucket_id = 'project-files' and public.is_admin());

drop policy if exists storage_project_files_admin_delete on storage.objects;
create policy storage_project_files_admin_delete on storage.objects
for delete
using (bucket_id = 'project-files' and public.is_admin());

drop policy if exists storage_project_files_member_select on storage.objects;
create policy storage_project_files_member_select on storage.objects
for select
using (
  bucket_id = 'project-files'
  and exists (
    select 1
    from public.project_members pm
    where pm.user_id = auth.uid()
      and split_part(name, '/', 1) = pm.project_id::text
  )
);

drop policy if exists storage_project_files_member_insert on storage.objects;
create policy storage_project_files_member_insert on storage.objects
for insert
with check (
  bucket_id = 'project-files'
  and exists (
    select 1
    from public.project_members pm
    where pm.user_id = auth.uid()
      and split_part(name, '/', 1) = pm.project_id::text
  )
);

-- Regra de admin automático (email oficial).
-- A aplicação garante upsert de profile com role=admin para tunawebadm@gmail.com.
