-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

-- 1) CRÍTICO: impedir que qualquer usuário vire admin editando o próprio perfil.
--    (a policy antiga permitia UPDATE da própria linha, inclusive da coluna role)
DROP POLICY IF EXISTS "Users can update own profile (limited)" ON public.users;
-- Admin continua editando tudo pela policy "Admin can manage all users".

-- 2) Aluno só pode inserir atestado como 'pendente' (antes podia se auto-aprovar)
DROP POLICY IF EXISTS "Aluno insert own atestados" ON public.atestados;
CREATE POLICY "Aluno insert own atestados"
  ON public.atestados FOR INSERT
  WITH CHECK (
    aluno_id = auth.uid()
    AND public.get_user_role() = 'aluno'
    AND status = 'pendente'
    AND aprovado_por IS NULL
    AND aprovado_em IS NULL
    AND motivo_rejeicao IS NULL
    AND arquivo_url LIKE auth.uid()::text || '/%'
  );

-- 3) Storage: upload só na própria pasta
DROP POLICY IF EXISTS "Aluno pode fazer upload" ON storage.objects;
CREATE POLICY "Aluno pode fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'atestados'
    AND auth.role() = 'authenticated'
    AND public.get_user_role() = 'aluno'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Storage: professor só vê arquivos de atestados aprovados das suas unidades
--    (antes via TODOS os arquivos do bucket). A subconsulta respeita o RLS de atestados.
DROP POLICY IF EXISTS "Professor pode ver arquivos aprovados" ON storage.objects;
CREATE POLICY "Professor pode ver arquivos aprovados"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'atestados'
    AND public.get_user_role() = 'professor'
    AND EXISTS (
      SELECT 1 FROM public.atestados a WHERE a.arquivo_url = storage.objects.name
    )
  );

-- 5) Usuário desativado perde as permissões de admin/professor/aluno mesmo com sessão aberta
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND active = true;
$$;
