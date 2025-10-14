-- Add notification and API preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_alerts": true, "webhook_alerts": false, "usage_reports": true}'::jsonb,
ADD COLUMN IF NOT EXISTS api_preferences JSONB DEFAULT '{"rate_limit_notifications": true, "error_notifications": true}'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification settings including email alerts, webhook alerts, and usage reports';
COMMENT ON COLUMN public.profiles.api_preferences IS 'API-related preferences including rate limit and error notifications';