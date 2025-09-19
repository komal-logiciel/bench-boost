-- Create admin user account
-- Note: This creates the user record, but the actual auth user needs to be created through signup
-- We'll insert a profile and role for an admin user that will be created via signup

-- First, let's create a sample admin profile (this will be updated when the actual user signs up)
INSERT INTO public.profiles (id, user_id, full_name, email, total_points) 
VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- This will be updated when actual user signs up
  'Admin User',
  'admin@company.com',
  0
) ON CONFLICT DO NOTHING;

-- We'll need to add the role after the user signs up through the auth system
-- For now, let's just prepare the system to handle admin users