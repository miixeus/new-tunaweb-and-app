# Supabase setup do Mural do Projeto

## 1) Migração principal
Execute o SQL em:

- `supabase/migrations/20260428_final_auth_and_access.sql`

Ele cria/ajusta schema, RLS, policies de acesso e policies de `storage.objects` para o bucket `project-files`.

## 2) Bucket de arquivos
No painel do Supabase Storage:

1. Crie o bucket `project-files`.
2. Marque como **Private**.
3. Depois rode a migração SQL para aplicar as policies do bucket.

## 3) Regra do admin
O email oficial `tunawebadm@gmail.com` é forçado como `role = admin` no `profiles` por trigger SQL e também reforçado no frontend (`ensureCurrentUserProfile`).

## 4) Fluxo de convite
- Admin cria projeto.
- Ao enviar convite, o app cria vínculo direto em `project_members` (se profile já existe) ou cria `project_invites` pendente.
- O cliente recebe magic link.
- No primeiro login, o app aceita convites pendentes e cria os `project_members` automaticamente.
