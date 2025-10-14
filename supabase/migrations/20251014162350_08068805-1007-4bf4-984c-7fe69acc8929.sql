-- Add verification and trust fields to aliases table
ALTER TABLE aliases 
  ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (verification_method IN ('dns', 'https', 'both')),
  ADD COLUMN IF NOT EXISTS dns_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS https_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dnssec_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMPTZ;

-- Create monitoring rules table
CREATE TABLE IF NOT EXISTS monitoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alias_id UUID REFERENCES aliases(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  alert_email BOOLEAN DEFAULT TRUE,
  alert_webhook_url TEXT,
  trust_threshold INTEGER DEFAULT 50 CHECK (trust_threshold >= 0 AND trust_threshold <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias_id)
);

-- Enable RLS for monitoring_rules
ALTER TABLE monitoring_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for monitoring_rules
CREATE POLICY "Users can view their own monitoring rules"
  ON monitoring_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitoring rules"
  ON monitoring_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring rules"
  ON monitoring_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitoring rules"
  ON monitoring_rules FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all monitoring rules"
  ON monitoring_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for monitoring_rules updated_at
CREATE TRIGGER update_monitoring_rules_updated_at
  BEFORE UPDATE ON monitoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_aliases_updated_at();