
-- Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    name TEXT PRIMARY KEY
);

-- Insert the available roles
INSERT INTO public.roles (name)
VALUES
    ('superadmin'),
    ('admin'),
    ('user')
ON CONFLICT (name) DO NOTHING;

-- Create the users table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user'
        REFERENCES public.roles(name),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view available roles
CREATE POLICY "Authenticated users can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Automatically create a user profile after registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, role)
    VALUES (NEW.id, 'user');

    RETURN NEW;
END;
$$;

-- Create the signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
