-- Create aliases table to store current state of each alias
CREATE TABLE public.aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_string TEXT NOT NULL UNIQUE,
  current_address TEXT,
  current_currency TEXT,
  current_source TEXT,
  last_resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alias_history table to track address changes over time
CREATE TABLE public.alias_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID NOT NULL REFERENCES public.aliases(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  currency TEXT NOT NULL,
  source_type TEXT NOT NULL,
  raw_data JSONB,
  confidence DECIMAL(3,2),
  resolved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhooks table for change notifications
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID NOT NULL REFERENCES public.aliases(id) ON DELETE CASCADE,
  callback_url TEXT NOT NULL,
  secret_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alias_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Public read access for aliases and history (lookup service)
CREATE POLICY "Anyone can read aliases"
ON public.aliases FOR SELECT USING (true);

CREATE POLICY "Anyone can read alias_history"
ON public.alias_history FOR SELECT USING (true);

-- Service role can manage aliases and history
CREATE POLICY "Service role can manage aliases"
ON public.aliases FOR ALL USING (true);

CREATE POLICY "Service role can manage alias_history"
ON public.alias_history FOR ALL USING (true);

-- Public can register webhooks
CREATE POLICY "Anyone can insert webhooks"
ON public.webhooks FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read their webhooks"
ON public.webhooks FOR SELECT USING (true);

CREATE POLICY "Service role can manage webhooks"
ON public.webhooks FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_aliases_alias_string ON public.aliases(alias_string);
CREATE INDEX idx_alias_history_alias_id ON public.alias_history(alias_id);
CREATE INDEX idx_alias_history_resolved_at ON public.alias_history(resolved_at DESC);
CREATE INDEX idx_webhooks_alias_id ON public.webhooks(alias_id);
CREATE INDEX idx_webhooks_is_active ON public.webhooks(is_active) WHERE is_active = true;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_aliases_updated_at
BEFORE UPDATE ON public.aliases
FOR EACH ROW
EXECUTE FUNCTION public.update_aliases_updated_at();