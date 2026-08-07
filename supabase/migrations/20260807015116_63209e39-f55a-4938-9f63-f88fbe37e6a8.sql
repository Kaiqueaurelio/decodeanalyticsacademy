-- Função para atualizar a ordem dos materiais de forma atômica
CREATE OR REPLACE FUNCTION public.update_materials_order(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    UPDATE public.apostila_materials
    SET sort_order = (item->>'sort_order')::int
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_materials_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_materials_order(jsonb) TO service_role;
