-- Tunaweb - Mural do Projeto
-- Execute no SQL Editor do Supabase (adaptar IDs/roles se necessário)

-- 1) Bucket de arquivos
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- 2) Índices de desempenho
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_project_messages_project_id on public.project_messages(project_id);
create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_approvals_project_id on public.project_approvals(project_id);

-- 3) Validação de status (ajuste se já existir)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_status_check'
  ) then
    alter table public.projects
    add constraint projects_status_check
    check (status in ('planning', 'production', 'waiting_client', 'approved', 'published'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_approvals_status_check'
  ) then
    alter table public.project_approvals
    add constraint project_approvals_status_check
    check (status in ('pending', 'approved', 'revision'));
  end if;
end $$;

-- 4) Habilitar RLS
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.project_approvals enable row level security;

-- 5) Policies básicas para usuários autenticados
-- Observação: para ambiente inicial/demonstração, políticas amplas de authenticated.
-- Em produção, restrinja por vínculo de usuário/cliente.

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'clients_authenticated_all') then
    create policy clients_authenticated_all
      on public.clients
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'projects_authenticated_all') then
    create policy projects_authenticated_all
      on public.projects
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'messages_authenticated_all') then
    create policy messages_authenticated_all
      on public.project_messages
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'files_authenticated_all') then
    create policy files_authenticated_all
      on public.project_files
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'approvals_authenticated_all') then
    create policy approvals_authenticated_all
      on public.project_approvals
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- 6) Policies de storage para bucket privado
-- leitura/upload para usuários autenticados

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'project_files_select_authenticated') then
    create policy project_files_select_authenticated
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'project-files');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'project_files_insert_authenticated') then
    create policy project_files_insert_authenticated
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'project-files');
  end if;
end $$;
