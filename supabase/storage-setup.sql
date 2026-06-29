-- Storage setup for task-attachments bucket
-- Run this in Supabase SQL Editor if the bucket was created via Dashboard UI

-- Ensure bucket exists with correct config (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  5242880,  -- 5MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/heic'];

-- Allow authenticated users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated can upload'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated can upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'task-attachments');
  END IF;
END $$;

-- Allow anyone to read files (needed for signed URLs to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public read access'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'task-attachments');
  END IF;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated can delete own files'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated can delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'task-attachments');
  END IF;
END $$;
