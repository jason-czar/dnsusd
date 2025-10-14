-- Create alerts table to track alert history
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alias_id UUID NOT NULL REFERENCES public.aliases(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.monitoring_rules(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'trust_score_drop', 'verification_failed', 'address_change'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
  email_sent BOOLEAN DEFAULT false,
  webhook_sent BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts"
ON public.alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own alerts (mark as resolved)
CREATE POLICY "Users can update their own alerts"
ON public.alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage alerts
CREATE POLICY "Service role can manage alerts"
ON public.alerts
FOR ALL
USING (true);

-- Create index for performance
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_alias_id ON public.alerts(alias_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);