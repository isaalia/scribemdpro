-- SETUP STORAGE POLICIES FOR PATIENT FILES
-- Run this in Supabase SQL Editor AFTER creating the 'patient-files' bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload files to their practice" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their practice" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in their practice" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their practice" ON storage.objects;

-- INSERT Policy: Users can upload files to their practice folder
CREATE POLICY "Users can upload files to their practice"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] IN (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- SELECT Policy: Users can view files in their practice
CREATE POLICY "Users can view files in their practice"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] IN (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Users can update files in their practice
CREATE POLICY "Users can update files in their practice"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] IN (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] IN (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Users can delete files in their practice
CREATE POLICY "Users can delete files in their practice"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'patient-files' AND
    (storage.foldername(name))[1] IN (
      SELECT practice_id::text 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- VERIFY POLICIES
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%patient-files%'
ORDER BY cmd, policyname;

