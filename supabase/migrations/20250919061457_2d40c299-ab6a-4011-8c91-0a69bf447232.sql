-- First, let's check if the role assignment exists and fix it
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get the user record
    SELECT * INTO user_record FROM profiles WHERE email = 'komal+1@logiciel.io';
    
    IF user_record.user_id IS NOT NULL THEN
        -- Delete any existing role for this user
        DELETE FROM user_roles WHERE user_id = user_record.user_id;
        
        -- Insert the admin role
        INSERT INTO user_roles (user_id, role, assigned_by)
        VALUES (user_record.user_id, 'admin'::app_role, user_record.user_id);
        
        RAISE NOTICE 'Admin role assigned to user: %', user_record.email;
    ELSE
        RAISE NOTICE 'User not found with email: komal+1@logiciel.io';
    END IF;
END $$;