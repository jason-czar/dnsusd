-- Create organization role enum
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create organization_invitations table
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email, status)
);

-- Create organization_activity_logs table
CREATE TABLE public.organization_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add organization_id to aliases table
ALTER TABLE public.aliases
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_aliases_organization_id ON public.aliases(organization_id);
CREATE INDEX idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX idx_organization_activity_logs_org_id ON public.organization_activity_logs(organization_id);

-- Create security definer function to check organization role
CREATE OR REPLACE FUNCTION public.has_organization_role(_user_id UUID, _organization_id UUID, _role organization_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is organization member
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
  )
$$;

-- Create security definer function to get user's organization role
CREATE OR REPLACE FUNCTION public.get_organization_role(_user_id UUID, _organization_id UUID)
RETURNS organization_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE user_id = _user_id
    AND organization_id = _organization_id
  LIMIT 1
$$;

-- Create security definer function to check if user can edit alias
CREATE OR REPLACE FUNCTION public.can_edit_organization_alias(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role IN ('owner', 'admin', 'member')
  )
$$;

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  USING (public.is_organization_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    public.has_organization_role(auth.uid(), id, 'owner') OR
    public.has_organization_role(auth.uid(), id, 'admin')
  );

CREATE POLICY "Only owners can delete organizations"
  ON public.organizations FOR DELETE
  USING (public.has_organization_role(auth.uid(), id, 'owner'));

-- RLS Policies for organization_members
CREATE POLICY "Members can view their organization members"
  ON public.organization_members FOR SELECT
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Owners and admins can manage members"
  ON public.organization_members FOR ALL
  USING (
    public.has_organization_role(auth.uid(), organization_id, 'owner') OR
    public.has_organization_role(auth.uid(), organization_id, 'admin')
  );

-- RLS Policies for organization_invitations
CREATE POLICY "Members can view organization invitations"
  ON public.organization_invitations FOR SELECT
  USING (
    public.is_organization_member(auth.uid(), organization_id) OR
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Owners and admins can create invitations"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    public.has_organization_role(auth.uid(), organization_id, 'owner') OR
    public.has_organization_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "Owners and admins can update invitations"
  ON public.organization_invitations FOR UPDATE
  USING (
    public.has_organization_role(auth.uid(), organization_id, 'owner') OR
    public.has_organization_role(auth.uid(), organization_id, 'admin') OR
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Owners and admins can delete invitations"
  ON public.organization_invitations FOR DELETE
  USING (
    public.has_organization_role(auth.uid(), organization_id, 'owner') OR
    public.has_organization_role(auth.uid(), organization_id, 'admin')
  );

-- RLS Policies for organization_activity_logs
CREATE POLICY "Members can view organization activity logs"
  ON public.organization_activity_logs FOR SELECT
  USING (public.is_organization_member(auth.uid(), organization_id));

CREATE POLICY "Service role can insert activity logs"
  ON public.organization_activity_logs FOR INSERT
  WITH CHECK (true);

-- Update aliases RLS policies to support organizations
DROP POLICY IF EXISTS "Anyone can read aliases" ON public.aliases;
CREATE POLICY "Anyone can read personal aliases or organization members can read org aliases"
  ON public.aliases FOR SELECT
  USING (
    organization_id IS NULL OR
    public.is_organization_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "Users can update their own aliases" ON public.aliases;
CREATE POLICY "Users can update their own aliases or org aliases with permission"
  ON public.aliases FOR UPDATE
  USING (
    (user_id = auth.uid() AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND public.can_edit_organization_alias(auth.uid(), organization_id))
  );

DROP POLICY IF EXISTS "Users can delete their own aliases" ON public.aliases;
CREATE POLICY "Users can delete their own aliases or org aliases with permission"
  ON public.aliases FOR DELETE
  USING (
    (user_id = auth.uid() AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND public.can_edit_organization_alias(auth.uid(), organization_id))
  );

DROP POLICY IF EXISTS "Authenticated users can create aliases" ON public.aliases;
CREATE POLICY "Authenticated users can create personal or org aliases with permission"
  ON public.aliases FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND organization_id IS NULL) OR
    (organization_id IS NOT NULL AND public.can_edit_organization_alias(auth.uid(), organization_id))
  );

-- Trigger to automatically add creator as owner when creating organization
CREATE OR REPLACE FUNCTION public.add_organization_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_organization_creator_as_owner();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_organization_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_updated_at();

CREATE TRIGGER on_organization_member_updated
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_updated_at();