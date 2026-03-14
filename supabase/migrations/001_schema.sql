-- ============================================================
-- LaunchTrack - Full Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- Each agency = one organization
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'growth', 'scale')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (profile table linked to auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'team_member'
    CHECK (role IN ('org_admin', 'team_member', 'client_user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEMBERSHIPS (user <-> organization)
-- ============================================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'team_member'
    CHECK (role IN ('org_admin', 'team_member')),
  invited_by UUID REFERENCES users(id),
  invite_email TEXT,
  invite_token TEXT UNIQUE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ONBOARDING TEMPLATES
-- ============================================================
CREATE TABLE onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES template_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_client_task BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_asset_required BOOLEAN NOT NULL DEFAULT FALSE,
  default_due_days INTEGER NOT NULL DEFAULT 7,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ONBOARDING PROJECTS
-- ============================================================
CREATE TABLE onboarding_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'waiting_on_client', 'completed', 'on_hold')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_launch_date DATE,
  actual_launch_date DATE,
  waiting_since TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  template_phase_id UUID REFERENCES template_phases(id),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  template_task_id UUID REFERENCES template_tasks(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'waiting_on_client', 'completed')),
  is_client_task BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_asset_required BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVALS
-- ============================================================
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- ASSET REQUESTS
-- ============================================================
CREATE TABLE asset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL DEFAULT 'file',
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPLOADED FILES
-- ============================================================
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  asset_request_id UUID REFERENCES asset_requests(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTEGRATIONS
-- Tokens encrypted using pgcrypto + app-level key
-- ============================================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL
    CHECK (provider IN ('clickup', 'teamwork', 'monday', 'slack')),
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_expiry TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  launchtrack_project_id UUID REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  external_project_id TEXT NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'project'
    CHECK (mapping_type IN ('project', 'task', 'status', 'user')),
  metadata JSONB NOT NULL DEFAULT '{}',
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENT PORTAL ACCESS (magic-link / token-based)
-- ============================================================
CREATE TABLE client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTOMATION RULES
-- ============================================================
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL
    CHECK (trigger_type IN ('task_overdue', 'asset_pending', 'project_stuck', 'task_completed')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL
    CHECK (action_type IN ('send_email', 'send_slack', 'notify_team')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_memberships_organization_id ON memberships(organization_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_projects_organization_id ON onboarding_projects(organization_id);
CREATE INDEX idx_projects_client_id ON onboarding_projects(client_id);
CREATE INDEX idx_projects_status ON onboarding_projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_asset_requests_project_id ON asset_requests(project_id);
CREATE INDEX idx_uploaded_files_project_id ON uploaded_files(project_id);
CREATE INDEX idx_uploaded_files_asset_request_id ON uploaded_files(asset_request_id);
CREATE INDEX idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX idx_integration_mappings_organization_id ON integration_mappings(organization_id);
CREATE INDEX idx_integration_mappings_project_id ON integration_mappings(launchtrack_project_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON onboarding_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_requests_updated_at
  BEFORE UPDATE ON asset_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get organization for current user
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is org_admin
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'org_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user belongs to an organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND accepted_at IS NOT NULL
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-calculate project completion percentage
CREATE OR REPLACE FUNCTION project_completion_percentage(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  completed_required INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_required
  FROM tasks
  WHERE project_id = project_uuid
  AND is_client_task = TRUE;

  IF total_required = 0 THEN
    SELECT COUNT(*) INTO total_required
    FROM tasks WHERE project_id = project_uuid;
  END IF;

  IF total_required = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO completed_required
  FROM tasks
  WHERE project_id = project_uuid
  AND status = 'completed';

  RETURN ROUND((completed_required::DECIMAL / total_required::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Plan limits check
CREATE OR REPLACE FUNCTION check_plan_project_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_plan TEXT;
  active_count INTEGER;
  max_projects INTEGER;
BEGIN
  SELECT plan INTO current_plan FROM organizations WHERE id = org_id;

  SELECT COUNT(*) INTO active_count
  FROM onboarding_projects
  WHERE organization_id = org_id
  AND status NOT IN ('completed');

  max_projects := CASE current_plan
    WHEN 'starter' THEN 5
    WHEN 'growth' THEN 20
    WHEN 'scale' THEN 999999
    ELSE 5
  END;

  RETURN active_count < max_projects;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
