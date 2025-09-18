-- Create role enum for the task management system
CREATE TYPE public.app_role AS ENUM ('admin', 'team_lead', 'bench_employee');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points > 0),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    verified_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_submissions table for tracking completion details
CREATE TABLE public.task_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_notes TEXT,
    files_url TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "All authenticated users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and team leads can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'team_lead')
);

CREATE POLICY "Task creators and admins can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by OR 
  public.has_role(auth.uid(), 'admin') OR
  (public.has_role(auth.uid(), 'team_lead') AND status != 'verified')
);

-- RLS Policies for task_submissions
CREATE POLICY "Users can view submissions for tasks they created or submitted"
ON public.task_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_submissions.task_id 
    AND tasks.created_by = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'team_lead')
);

CREATE POLICY "Users can create their own submissions"
ON public.task_submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions if task not verified"
ON public.task_submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_submissions.task_id 
    AND tasks.status != 'verified'
  )
);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update user points when task is verified
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- If task status changed to verified, add points to user
    IF OLD.status != 'verified' AND NEW.status = 'verified' AND NEW.assigned_to IS NOT NULL THEN
        UPDATE public.profiles 
        SET total_points = total_points + NEW.points
        WHERE user_id = NEW.assigned_to;
    END IF;
    
    -- If task status changed from verified to something else, subtract points
    IF OLD.status = 'verified' AND NEW.status != 'verified' AND NEW.assigned_to IS NOT NULL THEN
        UPDATE public.profiles 
        SET total_points = GREATEST(0, total_points - NEW.points)
        WHERE user_id = NEW.assigned_to;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_points_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_points();