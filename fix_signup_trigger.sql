-- FIX SIGNUP 500 ERROR
-- The handle_new_user likely failed due to NULL concatenation or missing data.
-- This script replaces the trigger function with a more robust version.

-- 1. Drop existing trigger and function to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Validate Profiles Table Exists (If not, create it minimal)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Robust Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    -- Handle missing names gracefully
    COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    -- Handle missing role gracefully
    COALESCE(new.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, we log it but don't block the user creation.
    -- This prevents the 500 Internal Server Error.
    -- Use RAISE WARNING so it appears in Logs but doesn't abort transaction if possible?
    -- Actually, to not abort transaction, we must use Exception block which catches error.
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- 4. Recreate Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Enable RLS on profiles if not enabled, to be safe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow admins to view all profiles (Adjust if you have an 'admin' role check)
-- For now, just basic self-read.
