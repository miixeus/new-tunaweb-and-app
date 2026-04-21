# Mural do Projeto — Tunaweb

Portal de comunicação entre equipe Tunaweb (admin) e clientes, com persistência real no Supabase.

## Stack
- React + Vite + TypeScript
- React Router
- Tailwind
- Supabase (Database, Auth OTP, Storage)

## Rodando localmente
1. Instale dependências:
   ```bash
   npm i
   ```
2. Configure `.env` com:
   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_ADMIN_EMAILS=admin@tunaweb.com.br
   VITE_SUPABASE_PROJECT_FILES_BUCKET=project-files
   ```
3. No Supabase SQL Editor, execute na ordem:
   1. `supabase/finalize_supabase.sql`
   2. `supabase/seed_demo.sql` (opcional, para demo)
4. Em **Authentication > Users**, crie usuários de email para:
   - admin (ex: `admin@tunaweb.com.br`)
   - clientes reais que vão acessar o mural
5. Rode o projeto:
   ```bash
   npm run dev
   ```

## Fluxos já implementados
- Login por OTP (Supabase Auth)
- Guardas de rota para admin e cliente
- CRUD real de clientes (criação/listagem/edição/exclusão na camada de serviço)
- CRUD real de projetos (criação/listagem/edição/status/next action na camada de serviço)
- Dashboard admin com dados reais
- Mural admin com mensagens, upload, aprovações e atualização de status
- Mural cliente com mensagens, upload, aprovações e solicitação de revisão
- Upload real em Supabase Storage + metadata em `project_files`

## Comandos úteis
```bash
npm run dev
npm run build
```
