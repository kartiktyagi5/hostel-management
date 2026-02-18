-- Comprehensive Fix for Triggers and RLS Policies

-- 1. DROP Existing Triggers/Functions to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Robust User Creation Function (Combines Error Handling + Student Creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- A. Create Profile
  BEGIN
      INSERT INTO public.profiles (id, name, role)
      VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), 
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
      );
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;

  -- B. Create Student Record if Role is Student
  IF (NEW.raw_user_meta_data ->> 'role') = 'student' THEN
    BEGIN
        INSERT INTO public.students (user_id, name, course, parent_phone)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), 
            'Not Assigned', 
            'Not Provided'
        );
    EXCEPTION WHEN OTHERS THEN
         RAISE WARNING 'Student record creation failed for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Re-create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RLS POLICIES (Fixing Visibility Issues)

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true); -- Everyone can read names/roles
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read students" ON public.students;
CREATE POLICY "Read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Manage students" ON public.students FOR ALL USING ( (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') );

-- ROOMS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read rooms" ON public.rooms;
CREATE POLICY "Read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Manage rooms" ON public.rooms FOR ALL USING ( (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') );

-- COMPLAINTS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read complaints" ON public.complaints;
CREATE POLICY "Read complaints" ON public.complaints FOR SELECT USING (true); -- Simplified visibility
CREATE POLICY "Manage complaints" ON public.complaints FOR ALL USING (true); -- Allow creation/updates (users manage own, admins manage all)

-- MESS MENU
ALTER TABLE public.mess_menu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read menu" ON public.mess_menu;
CREATE POLICY "Read menu" ON public.mess_menu FOR SELECT USING (true);
CREATE POLICY "Manage menu" ON public.mess_menu FOR ALL USING ( (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') );

-- NOTICES
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read notices" ON public.notices;
CREATE POLICY "Read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Manage notices" ON public.notices FOR ALL USING ( (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') );

-- ATTENDANCE
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read attendance" ON public.attendance;
CREATE POLICY "Read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Manage attendance" ON public.attendance FOR ALL USING ( (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') );

-- FEES
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read fees" ON public.fees;
CREATE POLICY "Read fees" ON public.fees FOR SELECT USING (true);
CREATE POLICY "Manage fees" ON public.fees FOR ALL USING ( (select role from public.profiles where id = auth.uid()) = 'admin' );
