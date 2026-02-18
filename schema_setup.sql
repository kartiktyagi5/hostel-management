-- 1. Create mess_menu table
CREATE TABLE IF NOT EXISTS public.mess_menu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week TEXT NOT NULL UNIQUE,
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    snacks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for mess_menu
ALTER TABLE public.mess_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.mess_menu
    FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for admins and wardens" ON public.mess_menu
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'warden'));

-- 2. Insert sample mess menu
INSERT INTO public.mess_menu (day_of_week, breakfast, lunch, dinner, snacks)
VALUES 
('Monday', 'Poha & Tea', 'Thali Special', 'Veg Biryani', 'Samosa'),
('Tuesday', 'Idli Sambar', 'Rajma Chawal', 'Egg Curry / Paneer', 'Biscuits'),
('Wednesday', 'Paratha', 'Chole Bhature', 'Chicken / Mushroom Curry', 'Tea'),
('Thursday', 'Upma', 'Dal Makhani', 'Fried Rice', 'Pakora'),
('Friday', 'Puri Bhaji', 'Kadhi Pakora', 'Fish / Kofta Curry', 'Coffee'),
('Saturday', 'Dosa', 'Khichdi', 'Pizza / Pasta', 'Chips'),
('Sunday', 'Omlette / Toast', 'Special Thali', 'Biryani Feast', 'Cake')
ON CONFLICT (day_of_week) DO NOTHING;


-- 3. Populate existing tables with dummy data
-- ROOMS (Matches user schema: room_no, block, capacity, occupied, status)
INSERT INTO public.rooms (room_no, block, capacity, occupied, status)
VALUES 
('A-101', 'A', 2, 0, 'available'),
('A-102', 'A', 2, 0, 'available'),
('B-201', 'B', 3, 0, 'available')
ON CONFLICT DO NOTHING; -- No unique constraint on room_no given in schema? Schema says room_no is NOT NULL but no UNIQUE constraint explicitly mentioned in CREATE TABLE statement provided, but usually it should be. If it fails due to duplicates, it fails.
-- User schema doesn't show UNIQUE constraint on room_no, but best practice is unique.

-- NOTICES (Matches user schema: title, message, created_at)
INSERT INTO public.notices (title, message)
VALUES 
('Welcome to Hostel Management', 'The new system is live!'),
('Maintenance Alert', 'WiFi maintenance on Sunday 2am.');


-- 4. Automatic Profile Creation Trigger
-- This ensures that when a user signs up, a row is created in public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data ->> 'first_name' || ' ' || new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'role');
  return new;
end;
$$;

-- trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Dummy Students for Admin Dashboard Preview
-- Matches user schema: name, course, parent_phone. user_id is nullable.
INSERT INTO public.students (name, course, parent_phone)
VALUES 
('Dua Lipa', 'B.Tech CS', '+91 9876543210'),
('Shawn Mendes', 'B.Tech ME', '+91 9876543211');

