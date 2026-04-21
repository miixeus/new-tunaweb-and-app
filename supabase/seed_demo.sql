-- Seed de demonstração (opcional)
-- Execute após finalize_supabase.sql

with inserted_client as (
  insert into public.clients (contact_name, business_name, email, phone, notes)
  values ('João Silva', 'Construtora Silva', 'joao@construtora.com', '+55 11 98765-4321', 'Cliente demo para apresentação')
  on conflict (email) do update set business_name = excluded.business_name
  returning id
), inserted_project as (
  insert into public.projects (
    client_id,
    name,
    service_type,
    scope,
    start_date,
    status,
    brand_color,
    next_action
  )
  select
    id,
    'Website Institucional',
    'website',
    'Desenvolvimento de site institucional com 5 páginas',
    current_date,
    'waiting_client',
    '#5f19ea',
    'Aguardando envio de fotos e vídeos da última obra'
  from inserted_client
  returning id
)
insert into public.project_messages (project_id, author_name, author_role, content)
select id, 'Tunaweb', 'admin', 'Projeto criado e kickoff enviado para o cliente.'
from inserted_project;

insert into public.project_approvals (project_id, title, description, status)
select p.id, 'Layout Home', 'Primeira versão do layout da home page', 'pending'
from public.projects p
join public.clients c on c.id = p.client_id
where c.email = 'joao@construtora.com'
on conflict do nothing;
