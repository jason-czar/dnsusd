-- Create lookups table to store resolution history
CREATE TABLE public.lookups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias TEXT NOT NULL,
  chain TEXT NOT NULL,
  resolved_address TEXT,
  alias_type TEXT, -- 'dns' or 'ens'
  confidence TEXT, -- 'high', 'medium', 'low'
  proof_metadata JSONB, -- Store DNS records or ENS resolution details
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making it public for now since it's a lookup service)
ALTER TABLE public.lookups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read lookups (public lookup history)
CREATE POLICY "Anyone can read lookups" 
ON public.lookups 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert lookups (public service)
CREATE POLICY "Anyone can insert lookups" 
ON public.lookups 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups by alias
CREATE INDEX idx_lookups_alias ON public.lookups(alias);
CREATE INDEX idx_lookups_created_at ON public.lookups(created_at DESC);