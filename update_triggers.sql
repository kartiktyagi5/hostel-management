-- 0. Schema Updates (Idempotent)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.students ADD COLUMN blood_group TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column blood_group already exists in students.';
    END;
    
    BEGIN
        ALTER TABLE public.students ADD COLUMN address TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column address already exists in students.';
    END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN assigned_block TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column assigned_block already exists in profiles.';
    END;
END $$;

-- 1. Enhanced User Creation Trigger
-- Automatically creates a Student record when a user signs up with role 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 1. Create Profile (Existing logic)
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );

  -- 2. Create Student Record if Role is Student
  IF (NEW.raw_user_meta_data ->> 'role') = 'student' THEN
    INSERT INTO public.students (user_id, name, course, parent_phone)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), 
        'Not Assigned', 
        'Not Provided'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Room Occupancy Trigger
-- Automatically updates the 'occupied' count in 'rooms' table whenever a student is assigned or moved.
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- HANDLE INSERT (New Student Assigned)
    IF TG_OP = 'INSERT' AND NEW.room_id IS NOT NULL THEN
        UPDATE public.rooms 
        SET occupied = occupied + 1 
        WHERE id = NEW.room_id;
    END IF;

    -- HANDLE UPDATE (Student Moved Rooms)
    IF TG_OP = 'UPDATE' THEN
        -- If room changed
        IF NEW.room_id IS DISTINCT FROM OLD.room_id THEN
            -- Decrease old room occupancy
            IF OLD.room_id IS NOT NULL THEN
                UPDATE public.rooms 
                SET occupied = occupied - 1 
                WHERE id = OLD.room_id;
            END IF;
            -- Increase new room occupancy
            IF NEW.room_id IS NOT NULL THEN
                UPDATE public.rooms 
                SET occupied = occupied + 1 
                WHERE id = NEW.room_id;
            END IF;
        END IF;
    END IF;

    -- HANDLE DELETE (Student Removed)
    IF TG_OP = 'DELETE' AND OLD.room_id IS NOT NULL THEN
        UPDATE public.rooms 
        SET occupied = occupied - 1 
        WHERE id = OLD.room_id;
    END IF;

    RETURN NEW; -- Important for BEFORE/AFTER triggers, though mostly for BEFORE. For AFTER it doesn't matter but good practice.
END;
$$ LANGUAGE plpgsql;

-- Bind Trigger to Students Table
DROP TRIGGER IF EXISTS trg_update_room_occupancy ON public.students;
CREATE TRIGGER trg_update_room_occupancy
AFTER INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_room_occupancy();
