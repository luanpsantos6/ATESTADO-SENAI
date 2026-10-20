# SENAI MT — Sistema de Atestados Médicos

Sistema web para gerenciamento de atestados médicos de alunos, com abono de faltas e fluxo de aprovação controlado pelo Administrador.

## Stack

- **Next.js 15** (App Router)
- **Supabase** (Auth + PostgreSQL + Storage)
- **Tailwind CSS**
- **TypeScript**
- **Vercel** (deploy)

## Perfis

| Perfil     | Permissões                                              |
|------------|---------------------------------------------------------|
| Admin      | Gerencia usuários, turmas, aprova/rejeita atestados, associa faltas |
| Professor  | Visualiza atestados aprovados dos alunos das suas unidades |
| Aluno      | Envia atestados e acompanha status                      |

## Unidades (MT)

Cuiabá (Sede, Faculdade de Tecnologia, Instituto de Tecnologia), Várzea Grande, Rondonópolis, Sinop, Sorriso, Cáceres, Juína, Alta Floresta, Alto Araguaia, Aripuanã, Barra do Bugres, Campo Verde, Lucas do Rio Verde, Nova Mutum.

## Setup local

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha as 3 variáveis
3. No SQL Editor do Supabase, execute **nesta ordem**:
   1. `supabase/schema.sql` (projeto novo)
   2. `supabase/fix-criar-usuario.sql` e `supabase/fix-seguranca.sql` (projeto que já tinha o schema antigo)
4. `npm run dev`

## Deploy na Vercel

1. Suba o projeto no GitHub e importe na Vercel
2. Em **Environment Variables** (Production e Preview) adicione, **antes** do primeiro deploy:
   - `NEXT_PUBLIC_SUPABASE_URL` (com `https://`, sem aspas)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy. Se alterar variáveis depois, faça **Redeploy** (elas só valem em deploys novos).

### Erro `500 MIDDLEWARE_INVOCATION_FAILED`

Quase sempre é variável de ambiente ausente/errada na Vercel. O middleware agora não derruba mais o site,
mas o erro real aparece em *Deployments → Runtime Logs* (procure `[middleware]`).

## Criar o primeiro Admin

Faça o cadastro em `/register` e depois, no SQL Editor:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
```

Depois disso, novos usuários são criados pelo painel do admin (sem envio de e-mail).

## Estrutura

- `src/lib/auth.ts`: `requireRole()` protege cada página (autenticado + ativo + perfil)
- `src/lib/supabase/middleware.ts`: renova a sessão e redireciona; nunca lança exceção
- `src/app/actions/admin.ts`: criação de usuário pelo admin (service role, só servidor)
- `src/app/auth/signout`: encerra sessão de usuário desativado (evita loop de redirecionamento)

## Branding

Logo oficial do SENAI incluída em `public/senai-logo.png`.
Título: **SENAI MT — Sistema de Atestados Médicos**
