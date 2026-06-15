-- ============================================
-- Supabase Storage Bucket Configuration
-- ============================================
-- This script defines the storage buckets needed for TOQY.
-- Buckets must be created via Supabase Dashboard or API.

-- REQUIRED BUCKETS (Create in Supabase Dashboard):

-- 1. logos
--    Purpose: Store organization and biosite logos
--    Visibility: Public (for serving logos on biosites)
--    Max file size: 10 MB
--    Allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml

-- 2. backgrounds
--    Purpose: Store background images for biosite themes
--    Visibility: Public (for serving on biosites)
--    Max file size: 25 MB
--    Allowed MIME types: image/png, image/jpeg, image/webp

-- 3. catalogs
--    Purpose: Store product/service images for catalogs
--    Visibility: Public (for serving catalog items)
--    Max file size: 20 MB
--    Allowed MIME types: image/png, image/jpeg, image/webp

-- 4. profiles
--    Purpose: Store user profile images
--    Visibility: Private (access controlled)
--    Max file size: 10 MB
--    Allowed MIME types: image/png, image/jpeg, image/webp

-- ============================================
-- Storage Policies (RLS for Storage)
-- ============================================

-- Example bucket policy setup (execute after bucket creation):
-- 
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('logos', 'logos', true);
--
-- CREATE POLICY "Public Access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'logos');
--
-- CREATE POLICY "Authenticated users can upload logos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- ============================================
-- CDN Configuration
-- ============================================
-- For each bucket, enable CDN caching:
-- - logos: 1 week cache
-- - backgrounds: 2 weeks cache  
-- - catalogs: 2 weeks cache
-- - profiles: 1 week cache

-- Public URLs will be formatted as:
-- https://ljsdkegxfcwrwqosbjsm.supabase.co/storage/v1/object/public/{bucket}/{path}

-- ============================================
-- Migration Instructions
-- ============================================
-- Step 1: Go to Supabase Dashboard > Storage
-- Step 2: Create the 4 buckets above with specified settings
-- Step 3: Enable CDN for each bucket
-- Step 4: Update storage policies as needed for your auth model
-- Step 5: Test uploads with sample files
