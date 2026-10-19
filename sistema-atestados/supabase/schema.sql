-- =============================================
-- SISTEMA DE ATESTADOS MÉDICOS - SCHEMA COMPLETO
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: public.users
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor', 'aluno')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: unidades
-- =============================================
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL UNIQUE,
  cidade VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: professor_unidades (N:N)
-- =============================================
CREATE TABLE public.professor_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professor_id, unidade_id)
);

-- =============================================
-- TABELA: turmas
-- =============================================
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  ano_letivo INTEGER NOT NULL,
  professor_id UUID REFERENCES public.users(id),
  unidade_id UUID REFERENCES public.unidades(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: matriculas
-- =============================================
CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aluno_id, turma_id)
);

-- =============================================
-- TABELA: atestados
-- =============================================
CREATE TABLE public.atestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacao TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao TEXT,
  aprovado_por UUID REFERENCES public.users(id),
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_datas CHECK (data_fim >= data_inicio)
);

-- =============================================
-- TABELA: faltas_abonadas
-- =============================================
CREATE TABLE public.faltas_abonadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atestado_id UUID NOT NULL REFERENCES public.atestados(id) ON DELETE CASCADE,
  data_falta DATE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id),
  observacao TEXT,
  associado_por UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(active);
CREATE INDEX idx_atestados_aluno ON public.atestados(aluno_id);
CREATE INDEX idx_atestados_status ON public.atestados(status);
CREATE INDEX idx_matriculas_aluno ON public.matriculas(aluno_id);
CREATE INDEX idx_matriculas_turma ON public.matriculas(turma_id);
CREATE INDEX idx_turmas_professor ON public.turmas(professor_id);
CREATE INDEX idx_turmas_unidade ON public.turmas(unidade_id);
CREATE INDEX idx_faltas_atestado ON public.faltas_abonadas(atestado_id);
CREATE INDEX idx_professor_unidades_prof ON public.professor_unidades(professor_id);
CREATE INDEX idx_professor_unidades_unidade ON public.professor_unidades(unidade_id);

-- =============================================
-- FUNÇÃO: criar perfil automaticamente no signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'aluno');
BEGIN
  IF v_role NOT IN ('admin', 'professor', 'aluno') THEN
    v_role := 'aluno';
  END IF;

  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email),
    NEW.email,
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNÇÃO auxiliar de role
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atestados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faltas_abonadas ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.get_user_role() = 'admin');

CREATE POLICY "Admin can manage all users"
  ON public.users FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile (limited)"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- unidades
CREATE POLICY "Authenticated can view unidades"
  ON public.unidades FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access unidades"
  ON public.unidades FOR ALL
  USING (public.get_user_role() = 'admin');

-- professor_unidades
CREATE POLICY "Professor view own unidades"
  ON public.professor_unidades FOR SELECT
  USING (professor_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Admin full access professor_unidades"
  ON public.professor_unidades FOR ALL
  USING (public.get_user_role() = 'admin');

-- turmas
CREATE POLICY "Admin full access turmas"
  ON public.turmas FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Professor view own turmas"
  ON public.turmas FOR SELECT
  USING (
    professor_id = auth.uid()
    OR public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.professor_unidades pu
      WHERE pu.unidade_id = turmas.unidade_id
        AND pu.professor_id = auth.uid()
    )
  );

CREATE POLICY "Aluno view turmas matriculado"
  ON public.turmas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matriculas m
      WHERE m.turma_id = turmas.id AND m.aluno_id = auth.uid()
    )
  );

-- matriculas
CREATE POLICY "Admin full access matriculas"
  ON public.matriculas FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Professor view matriculas das suas unidades"
  ON public.matriculas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.turmas t
      JOIN public.professor_unidades pu ON pu.unidade_id = t.unidade_id
      WHERE t.id = matriculas.turma_id
        AND pu.professor_id = auth.uid()
    )
  );

CREATE POLICY "Aluno view own matriculas"
  ON public.matriculas FOR SELECT
  USING (aluno_id = auth.uid());

-- atestados
CREATE POLICY "Aluno insert own atestados"
  ON public.atestados FOR INSERT
  WITH CHECK (aluno_id = auth.uid() AND public.get_user_role() = 'aluno');

CREATE POLICY "Aluno view own atestados"
  ON public.atestados FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Admin full access atestados"
  ON public.atestados FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Professor view approved atestados das suas unidades"
  ON public.atestados FOR SELECT
  USING (
    status = 'aprovado' AND
    EXISTS (
      SELECT 1
      FROM public.matriculas m
      JOIN public.turmas t ON t.id = m.turma_id
      JOIN public.professor_unidades pu ON pu.unidade_id = t.unidade_id
      WHERE m.aluno_id = atestados.aluno_id
        AND pu.professor_id = auth.uid()
    )
  );

-- faltas_abonadas
CREATE POLICY "Admin full access faltas"
  ON public.faltas_abonadas FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Aluno view own faltas"
  ON public.faltas_abonadas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atestados a
      WHERE a.id = faltas_abonadas.atestado_id AND a.aluno_id = auth.uid()
    )
  );

CREATE POLICY "Professor view faltas das suas unidades"
  ON public.faltas_abonadas FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.atestados a
      JOIN public.matriculas m ON m.aluno_id = a.aluno_id
      JOIN public.turmas t ON t.id = m.turma_id
      JOIN public.professor_unidades pu ON pu.unidade_id = t.unidade_id
      WHERE a.id = faltas_abonadas.atestado_id
        AND a.status = 'aprovado'
        AND pu.professor_id = auth.uid()
    )
  );

-- =============================================
-- STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('atestados', 'atestados', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Aluno pode fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'atestados' AND
    auth.role() = 'authenticated' AND
    public.get_user_role() = 'aluno'
  );

CREATE POLICY "Aluno pode ver seus arquivos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'atestados' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR public.get_user_role() = 'admin')
  );

CREATE POLICY "Admin pode ver todos os arquivos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'atestados' AND public.get_user_role() = 'admin');

CREATE POLICY "Professor pode ver arquivos aprovados"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'atestados' AND
    public.get_user_role() = 'professor'
  );

-- =============================================
-- UNIDADES DO MATO GROSSO
-- =============================================
INSERT INTO public.unidades (nome, cidade) VALUES
  ('Cuiabá - Sede', 'Cuiabá'),
  ('Cuiabá - Faculdade de Tecnologia', 'Cuiabá'),
  ('Cuiabá - Instituto de Tecnologia', 'Cuiabá'),
  ('Várzea Grande', 'Várzea Grande'),
  ('Rondonópolis', 'Rondonópolis'),
  ('Sinop', 'Sinop'),
  ('Sorriso', 'Sorriso'),
  ('Cáceres', 'Cáceres'),
  ('Juína', 'Juína'),
  ('Alta Floresta', 'Alta Floresta'),
  ('Alto Araguaia', 'Alto Araguaia'),
  ('Aripuanã', 'Aripuanã'),
  ('Barra do Bugres', 'Barra do Bugres'),
  ('Campo Verde', 'Campo Verde'),
  ('Lucas do Rio Verde', 'Lucas do Rio Verde'),
  ('Nova Mutum', 'Nova Mutum');
