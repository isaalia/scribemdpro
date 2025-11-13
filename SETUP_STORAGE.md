# Setup Supabase Storage for File Uploads

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **ScribeMDPro** project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `patient-files`
   - **Public bucket**: ✅ **UNCHECKED** (Keep private for HIPAA compliance)
   - **File size limit**: 10 MB (or your preferred limit)
   - **Allowed MIME types**: Leave empty to allow all types, or specify:
     ```
     application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     ```
6. Click **Create bucket**

## Step 2: Set Up Storage Policies

Run this SQL in the Supabase SQL Editor:

```sql
-- Storage policies for patient-files bucket
-- Users can upload files to their practice's folder
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

-- Users can view files in their practice
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

-- Users can delete files in their practice
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

-- Verify policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%patient-files%';
```

## Step 3: Test File Upload

After setting up the bucket and policies, test file uploads in the application:
1. Navigate to an encounter detail page
2. Click "Upload Files" in the Attachments section
3. Select a file and verify it uploads successfully

## Storage Structure

Files are stored with this path structure:
```
patient-files/
  {practice_id}/
    encounters/
      {encounter_id}/
        {timestamp}-{index}-{filename}
```

This ensures:
- Practice-level isolation
- Encounter-level organization
- Unique file names

## Security Notes

- Files are stored in a private bucket (not public)
- RLS policies ensure users can only access files from their practice
- File URLs are generated using `getPublicUrl()` but require authentication to access
- For true private access, use signed URLs instead of public URLs

