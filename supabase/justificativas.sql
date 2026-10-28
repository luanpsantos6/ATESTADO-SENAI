-- =====================================================================
-- MÓDULO "JUSTIFICAR ATRASO"  —  rode UMA vez no SQL Editor do Supabase
-- (pode rodar de novo sem problemas: usa IF NOT EXISTS)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.justificativas_atraso (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  data_atraso     DATE NOT NULL,
  horario_chegada TIME NOT NULL,
  categoria       VARCHAR(30) NOT NULL
                  CHECK (categoria IN ('transporte','saude','familiar','trabalho','clima','outro')),
  descricao       TEXT NOT NULL,
  arquivo_url     TEXT,                       -- comprovante (opcional)
  status          VARCHAR(20) NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','aprovada','rejeitada')),
  motivo_rejeicao TEXT,
  analisado_por   UUID REFERENCES public.users(id),
  analisado_em    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_just_atraso_aluno  ON public.justificativas_atraso(aluno_id);
CREATE INDEX IF NOT EXISTS idx_just_atraso_status ON public.justificativas_atraso(status);
CREATE INDEX IF NOT EXISTS idx_just_atraso_data   ON public.justificativas_atraso(data_atraso);

-- O sistema acessa esta tabela SOMENTE pelo servidor (chave de serviço).
-- RLS ligado e sem políticas = nenhum acesso direto pelo navegador.
ALTER TABLE public.justificativas_atraso ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.justificativas_atraso TO service_role;

NOTIFY pgrst, 'reload schema';

-- Conferência: deve retornar 0 linhas e nenhum erro
SELECT count(*) AS justificativas FROM public.justificativas_atraso;
