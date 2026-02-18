-- 1. Create Fees Table
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid
    due_date DATE,
    payment_date TIMESTAMPTZ,
    payment_type TEXT, -- '6_months', 'yearly'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add email and phone to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. RLS for Fees
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read fees" ON public.fees;
CREATE POLICY "Read fees" ON public.fees 
    FOR SELECT USING (
        (select role from public.profiles where id = auth.uid()) IN ('admin', 'warden') 
        OR 
        student_id IN (select id from public.students where user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Manage fees" ON public.fees;
CREATE POLICY "Manage fees" ON public.fees 
    FOR ALL USING ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- 4. Sync Email from Auth (Optional, run once manually or trigger)
-- For now, we rely on the frontend to populate/update this or triggers. 
-- Let's just allow it to be nullable for now.

-- 5. Insert Dummy Fees Data
INSERT INTO public.fees (student_id, amount, status, due_date, payment_type)
SELECT id, 45000, 'pending', CURRENT_DATE + INTERVAL '30 days', '6_months'
FROM public.students
WHERE NOT EXISTS (SELECT 1 FROM public.fees WHERE student_id = public.students.id)
LIMIT 5;
