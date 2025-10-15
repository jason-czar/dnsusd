-- Fix profiles table RLS policy to prevent public email exposure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));