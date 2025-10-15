-- Step 2: Fix aliases RLS policy to require authentication for personal aliases

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read personal aliases or organization members can re" ON aliases;

-- Create policy that requires authentication for personal aliases
CREATE POLICY "Users can read their own aliases or org aliases"
ON aliases FOR SELECT
USING (
  (user_id = auth.uid() AND organization_id IS NULL)
  OR
  (organization_id IS NOT NULL AND is_organization_member(auth.uid(), organization_id))
);

-- Allow admins to read all aliases
CREATE POLICY "Admins can read all aliases"
ON aliases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));