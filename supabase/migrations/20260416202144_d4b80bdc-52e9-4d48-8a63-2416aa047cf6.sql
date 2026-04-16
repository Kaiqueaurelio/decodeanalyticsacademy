-- Add RA support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ra text,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'email';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_ra_unique ON public.profiles(ra) WHERE ra IS NOT NULL;

-- Update handle_new_user to capture RA and account_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ra text;
  _account_type text;
BEGIN
  _ra := NULLIF(NEW.raw_user_meta_data->>'ra', '');
  _account_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type', ''), 'email');

  INSERT INTO public.profiles (user_id, full_name, email, ra, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
      CASE WHEN _ra IS NOT NULL THEN 'Aluno UNIP ' || _ra ELSE split_part(NEW.email, '@', 1) END),
    COALESCE(NEW.email, ''),
    _ra,
    _account_type
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();