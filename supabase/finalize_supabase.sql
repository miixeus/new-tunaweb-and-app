-- Finalização do backend Supabase para Mural do Projeto (Tunaweb)
-- Execute no SQL Editor do Supabase em um único run.

create extension if not exists pgcrypto;

-- 1) Tabelas principais
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  business_name text not null,
  email text not null unique,
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
  last_activity timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint projects_status_check
    check (status in ('planning', 'production', 'waiting_client', 'approved', 'published'))
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_name text not null,
  author_role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint project_messages_author_role_check check (author_role in ('admin', 'client'))
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  preview_url text,
  status text not null default 'pending',
  feedback text,
  created_at timestamptz not null default now(),
  constraint project_approvals_status_check check (status in ('pending', 'approved', 'revision'))
);

-- 2) Índices
create index if not exists idx_clients_email on public.clients(email);
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_messages_project_id on public.project_messages(project_id);
create index if not exists idx_files_project_id on public.project_files(project_id);
create index if not exists idx_approvals_project_id on public.project_approvals(project_id);

-- 3) Trigger para atualizar last_activity quando houver atividade no projeto
create or replace function public.touch_project_last_activity()
returns trigger
language plpgsql
as $$
begin
  update public.projects
  set last_activity = now()
  where id = coalesce(new.project_id, old.project_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_touch_project_by_message on public.project_messages;
create trigger trg_touch_project_by_message
after insert or update or delete on public.project_messages
for each row execute function public.touch_project_last_activity();

drop trigger if exists trg_touch_project_by_file on public.project_files;
create trigger trg_touch_project_by_file
after insert or update or delete on public.project_files
for each row execute function public.touch_project_last_activity();

drop trigger if exists trg_touch_project_by_approval on public.project_approvals;
create trigger trg_touch_project_by_approval
after insert or update or delete on public.project_approvals
for each row execute function public.touch_project_last_activity();

-- 4) Storage bucket
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- 5) RLS + policies iniciais (ambiente interno)
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.project_approvals enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'clients_authenticated_all') then
    create policy clients_authenticated_all on public.clients
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'projects_authenticated_all') then
    create policy projects_authenticated_all on public.projects
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'messages_authenticated_all') then
    create policy messages_authenticated_all on public.project_messages
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'files_authenticated_all') then
    create policy files_authenticated_all on public.project_files
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'approvals_authenticated_all') then
    create policy approvals_authenticated_all on public.project_approvals
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- policies de storage

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'project_files_select_authenticated') then
    create policy project_files_select_authenticated
      on storage.objects for select to authenticated
      using (bucket_id = 'project-files');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'project_files_insert_authenticated') then
    create policy project_files_insert_authenticated
      on storage.objects for insert to authenticated
      with check (bucket_id = 'project-files');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'project_files_update_authenticated') then
    create policy project_files_update_authenticated
      on storage.objects for update to authenticated
      using (bucket_id = 'project-files')
      with check (bucket_id = 'project-files');
  end if;
end $$;
