
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{ra}', 
  '"G802144"'
)
WHERE id = '1ea75282-cc92-49a2-92a2-4c54344a6d43';

INSERT INTO public.user_roles (user_id, role)
VALUES ('1ea75282-cc92-49a2-92a2-4c54344a6d43', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles
SET user_id = '1ea75282-cc92-49a2-92a2-4c54344a6d43',
    ra = 'G802144'
WHERE id = '18adb625-cbe3-48cb-888b-51bb7ad00607';
