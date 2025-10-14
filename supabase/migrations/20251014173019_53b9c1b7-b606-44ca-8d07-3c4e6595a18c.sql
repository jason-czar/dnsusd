-- Create API usage tracking table
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Policies for api_usage
CREATE POLICY "Users can view their own usage"
  ON public.api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON public.api_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all usage"
  ON public.api_usage
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_api_usage_user_created ON public.api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage(endpoint, created_at DESC);