-- Drop the unique constraint on alias_string to allow multiple users to claim the same domain
-- Only successful verification will activate the alias
ALTER TABLE public.aliases DROP CONSTRAINT IF EXISTS aliases_alias_string_key;