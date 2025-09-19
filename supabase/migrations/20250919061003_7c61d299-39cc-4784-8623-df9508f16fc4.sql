-- Assign admin role to the user with email komal+1@logiciel.io
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
    p.user_id,
    'admin'::app_role,
    p.user_id  -- Self-assigned for bootstrap
FROM public.profiles p
WHERE p.email = 'komal+1@logiciel.io'
ON CONFLICT (user_id, role) DO NOTHING;