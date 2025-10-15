-- Step 1: Add user_id to webhooks table and fix RLS policies

-- Add user_id column to webhooks table
ALTER TABLE webhooks ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Populate user_id for existing webhooks by joining through aliases
UPDATE webhooks w
SET user_id = a.user_id
FROM aliases a
WHERE w.alias_id = a.id AND a.user_id IS NOT NULL;

-- Make user_id required for new webhooks
ALTER TABLE webhooks ALTER COLUMN user_id SET NOT NULL;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read their webhooks" ON webhooks;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own webhooks"
ON webhooks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhooks"
ON webhooks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON webhooks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON webhooks FOR DELETE
USING (auth.uid() = user_id);