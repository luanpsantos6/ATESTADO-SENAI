-- Rode no SQL Editor do Supabase (projeto que já tem o schema criado).
-- 1) Trigger robusta (search_path fixo, role validada, sem falhar por duplicidade)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'aluno');
BEGIN
  IF v_role NOT IN ('professor', 'aluno') THEN
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

-- 2) Corrige get_user_role também com search_path fixo
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 3) Cria perfil para quem já existe em auth.users mas ficou sem perfil
INSERT INTO public.users (id, full_name, email, role)
SELECT u.id, COALESCE(NULLIF(u.raw_user_meta_data->>'full_name',''), u.email), u.email, 'aluno'
FROM auth.users u
LEFT JOIN public.users p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT DO NOTHING;
