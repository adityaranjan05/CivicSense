-- ==============================================================================
-- CivicFix / CivicSense - Complete Supabase Full-Stack Database Schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  department TEXT,
  phone TEXT,
  ward TEXT DEFAULT 'Central Bengaluru',
  karma_points INTEGER DEFAULT 100,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. GRIEVANCES / ISSUES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
  id TEXT PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Submitted',
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_url TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT DEFAULT '',
  department TEXT DEFAULT 'BBMP Road Infrastructure',
  assigned_team JSONB,
  eta TEXT DEFAULT 'Awaiting triage',
  upvotes INTEGER DEFAULT 1,
  reporter JSONB NOT NULL DEFAULT '{}'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  triage_metadata JSONB DEFAULT '{}'::jsonb,
  feedback JSONB,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Issues are viewable by everyone" ON public.issues;
CREATE POLICY "Issues are viewable by everyone" 
  ON public.issues 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Issues can be inserted by anyone" ON public.issues;
CREATE POLICY "Issues can be inserted by anyone" 
  ON public.issues 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Issues can be updated by anyone" ON public.issues;
CREATE POLICY "Issues can be updated by anyone" 
  ON public.issues 
  FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Issues can be deleted by anyone" ON public.issues;
CREATE POLICY "Issues can be deleted by anyone" 
  ON public.issues 
  FOR DELETE 
  USING (true);

-- Helpful indexes for search & filter performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_department ON public.issues(department);
CREATE INDEX IF NOT EXISTS idx_issues_urgency ON public.issues(urgency);
CREATE INDEX IF NOT EXISTS idx_issues_reported_at ON public.issues(reported_at DESC);

-- Optional dispatch columns for grievance forwarding
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS dispatch_status TEXT DEFAULT 'Pending Verification';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS dispatched_to TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS dispatch_department TEXT;

-- ------------------------------------------------------------------------------
-- 3. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TEXT,
  type TEXT DEFAULT 'info',
  ticket_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications are viewable by everyone" ON public.notifications;
CREATE POLICY "Notifications are viewable by everyone" 
  ON public.notifications 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Notifications can be inserted" ON public.notifications;
CREATE POLICY "Notifications can be inserted" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications can be updated" ON public.notifications;
CREATE POLICY "Notifications can be updated" 
  ON public.notifications 
  FOR UPDATE 
  USING (true);

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: AUTO-CREATE PROFILE ON USER SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    phone,
    ward
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'ward', 'Central Bengaluru')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. REALTIME REPLICATION (Safe idempotent add)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- 6. GRANT PERMISSIONS TO SUPABASE ROLES (anon, authenticated, service_role)
-- Crucial for enabling client-side API reads, inserts, and cross-tab realtime updates
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
