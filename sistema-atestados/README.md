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

1. Clone o repositório
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha as chaves do Supabase
4. Execute o SQL completo no SQL Editor do Supabase (`supabase/schema.sql`)
5. `npm run dev`

## Deploy na Vercel

1. Suba o projeto no GitHub
2. Importe no Vercel
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Criar o primeiro Admin

Após o primeiro cadastro via `/register`, execute no SQL Editor:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
```

## Branding

Logo oficial do SENAI incluída em `public/senai-logo.png`.
Título: **SENAI MT — Sistema de Atestados Médicos**
