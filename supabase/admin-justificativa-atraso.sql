BEGIN;

-- Documentos dos alunos com acesso restrito.
CREATE TABLE IF NOT EXISTS public.alunos_documentos (
    aluno_id UUID PRIMARY KEY
        REFERENCES public.users(id) ON DELETE CASCADE,

    cpf VARCHAR(11) NOT NULL UNIQUE
        CHECK (cpf ~ '^[0-9]{11}$'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alunos_documentos
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.alunos_documentos
    FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.alunos_documentos
    TO service_role;

-- Identifica quem registrou a justificativa.
ALTER TABLE public.justificativas_atraso
    ADD COLUMN IF NOT EXISTS solicitado_por UUID
    REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_atraso_solicitante
    ON public.justificativas_atraso(solicitado_por);

NOTIFY pgrst, 'reload schema';

COMMIT;
