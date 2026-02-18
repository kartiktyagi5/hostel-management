-- Add unique constraint to attendance table to enable UPSERT
-- First, identifying duplicate records if any (optional cleanup, but good practice)
-- For now, we assume clean slate or we can delete duplicates simply.

-- simple deduplication (optional, remove if not needed or if table is large)
DELETE FROM public.attendance a USING public.attendance b
WHERE a.id < b.id AND a.student_id = b.student_id AND a.date = b.date;

-- Add the unique constraint
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_date_key UNIQUE (student_id, date);
