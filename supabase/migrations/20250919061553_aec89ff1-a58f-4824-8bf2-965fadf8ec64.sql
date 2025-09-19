-- Create profile and assign admin role for komal+1@logiciel.io
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'komal+1@logiciel.io';
    
    IF auth_user_id IS NOT NULL THEN
        -- Insert profile if it doesn't exist
        INSERT INTO profiles (user_id, full_name, email, total_points)
        VALUES (auth_user_id, 'Admin', 'komal+1@logiciel.io', 0)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Insert admin role
        INSERT INTO user_roles (user_id, role, assigned_by)
        VALUES (auth_user_id, 'admin'::app_role, auth_user_id)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Profile and admin role created for: komal+1@logiciel.io';
    ELSE
        RAISE NOTICE 'Auth user not found for email: komal+1@logiciel.io';
    END IF;
END $$;