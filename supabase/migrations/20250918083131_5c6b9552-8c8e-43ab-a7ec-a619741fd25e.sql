-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.update_user_points();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recreate update_user_points function with proper search_path
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate the triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_points();