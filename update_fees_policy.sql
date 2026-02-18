-- Enable RLS on fees table if not already enabled
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own fees
CREATE POLICY "Enable read access for students to their own fees"
ON fees FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Allow users to update their own fees (for mock payment)
CREATE POLICY "Enable update access for students to pay fees"
ON fees FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Policy: Allow admins to view all fees
CREATE POLICY "Enable read access for admins to all fees"
ON fees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Allow admins to insert/update/delete fees
CREATE POLICY "Enable write access for admins to all fees"
ON fees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
