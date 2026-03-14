-- ============================================================
-- LaunchTrack - Row Level Security Policies
-- ============================================================

-- Helper: get organization_id for a project without triggering RLS (breaks circular policy dependency)
CREATE OR REPLACE FUNCTION get_project_organization_id(p_project_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM onboarding_projects WHERE id = p_project_id
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE POLICY "org_members_can_view_own_org"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "org_admins_can_update_org"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id() AND is_org_admin());

-- ============================================================
-- USERS
-- ============================================================
CREATE POLICY "users_can_view_own_profile"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR organization_id = get_user_organization_id()
  );

CREATE POLICY "users_can_update_own_profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users_can_insert_own_profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
CREATE POLICY "org_members_can_view_memberships"
  ON memberships FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_admins_can_manage_memberships"
  ON memberships FOR ALL
  USING (organization_id = get_user_organization_id() AND is_org_admin());

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE POLICY "org_staff_can_view_clients"
  ON clients FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "org_admins_can_manage_clients"
  ON clients FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "team_members_can_view_clients"
  ON clients FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'team_member'
  );

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE POLICY "org_staff_can_view_templates"
  ON onboarding_templates FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "org_admins_can_manage_templates"
  ON onboarding_templates FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "org_staff_can_view_template_phases"
  ON template_phases FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM onboarding_templates
      WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "org_admins_can_manage_template_phases"
  ON template_phases FOR ALL
  USING (
    template_id IN (
      SELECT id FROM onboarding_templates
      WHERE organization_id = get_user_organization_id()
      AND is_org_admin()
    )
  );

CREATE POLICY "org_staff_can_view_template_tasks"
  ON template_tasks FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM onboarding_templates
      WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "org_admins_can_manage_template_tasks"
  ON template_tasks FOR ALL
  USING (
    template_id IN (
      SELECT id FROM onboarding_templates
      WHERE organization_id = get_user_organization_id()
      AND is_org_admin()
    )
  );

-- ============================================================
-- ONBOARDING PROJECTS
-- Staff view all projects in their org
-- Clients only see their specific project (via client_portal_access)
-- ============================================================
CREATE POLICY "org_staff_can_view_all_projects"
  ON onboarding_projects FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "org_admins_can_manage_projects"
  ON onboarding_projects FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "clients_can_view_their_project"
  ON onboarding_projects FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'client_user'
    AND id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================
-- PROJECT PHASES
-- ============================================================
CREATE POLICY "org_staff_can_view_project_phases"
  ON project_phases FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM onboarding_projects
      WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "clients_can_view_their_project_phases"
  ON project_phases FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "org_admins_can_manage_project_phases"
  ON project_phases FOR ALL
  USING (
    project_id IN (
      SELECT id FROM onboarding_projects
      WHERE organization_id = get_user_organization_id()
    )
    AND is_org_admin()
  );

-- ============================================================
-- TASKS
-- CRITICAL: Clients cannot see internal_notes
-- ============================================================
CREATE POLICY "org_staff_can_view_tasks"
  ON tasks FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "org_staff_can_manage_tasks"
  ON tasks FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

-- Clients see only their project's client tasks (no internal_notes via view)
CREATE POLICY "clients_can_view_their_tasks"
  ON tasks FOR SELECT
  USING (
    is_client_task = TRUE
    AND project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "clients_can_update_their_tasks"
  ON tasks FOR UPDATE
  USING (
    is_client_task = TRUE
    AND project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  )
  WITH CHECK (
    -- Clients can only update status; prevent them from changing internal_notes
    is_client_task = TRUE
  );

-- ============================================================
-- TASK COMMENTS
-- Internal comments hidden from clients
-- ============================================================
CREATE POLICY "org_staff_can_view_all_comments"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "org_staff_can_manage_comments"
  ON task_comments FOR ALL
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE organization_id = get_user_organization_id()
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "clients_can_view_public_comments"
  ON task_comments FOR SELECT
  USING (
    is_internal = FALSE
    AND task_id IN (
      SELECT t.id FROM tasks t
      INNER JOIN client_portal_access cpa ON cpa.project_id = t.project_id
      WHERE cpa.user_id = auth.uid()
      AND cpa.is_active = TRUE
    )
  );

CREATE POLICY "clients_can_add_comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    is_internal = FALSE
    AND task_id IN (
      SELECT t.id FROM tasks t
      INNER JOIN client_portal_access cpa ON cpa.project_id = t.project_id
      WHERE cpa.user_id = auth.uid()
      AND cpa.is_active = TRUE
    )
    AND user_id = auth.uid()
  );

-- ============================================================
-- APPROVALS
-- ============================================================
CREATE POLICY "org_staff_can_view_approvals"
  ON approvals FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_admins_can_manage_approvals"
  ON approvals FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "team_members_can_request_approvals"
  ON approvals FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('org_admin', 'team_member')
  );

CREATE POLICY "clients_can_view_their_approvals"
  ON approvals FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================
-- ASSET REQUESTS
-- ============================================================
CREATE POLICY "org_staff_can_view_asset_requests"
  ON asset_requests FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_admins_can_manage_asset_requests"
  ON asset_requests FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "clients_can_view_their_asset_requests"
  ON asset_requests FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "clients_can_update_asset_request_status"
  ON asset_requests FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================================
-- UPLOADED FILES
-- ============================================================
CREATE POLICY "org_staff_can_view_files"
  ON uploaded_files FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_staff_can_upload_files"
  ON uploaded_files FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "clients_can_view_their_files"
  ON uploaded_files FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

CREATE POLICY "clients_can_upload_files"
  ON uploaded_files FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM client_portal_access
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
    AND uploaded_by = auth.uid()
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "users_can_view_own_notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "org_admins_can_view_subscriptions"
  ON subscriptions FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

-- ============================================================
-- INTEGRATIONS
-- ============================================================
CREATE POLICY "org_admins_can_manage_integrations"
  ON integrations FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "org_staff_can_view_integrations"
  ON integrations FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_admins_can_manage_mappings"
  ON integration_mappings FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "org_staff_can_view_mappings"
  ON integration_mappings FOR SELECT
  USING (organization_id = get_user_organization_id());

-- ============================================================
-- CLIENT PORTAL ACCESS
-- ============================================================
CREATE POLICY "org_staff_can_manage_portal_access"
  ON client_portal_access FOR ALL
  USING (
    get_project_organization_id(project_id) = get_user_organization_id()
  );

CREATE POLICY "clients_can_view_own_access"
  ON client_portal_access FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- AUTOMATION RULES
-- ============================================================
CREATE POLICY "org_admins_can_manage_automation"
  ON automation_rules FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "org_staff_can_view_automation"
  ON automation_rules FOR SELECT
  USING (organization_id = get_user_organization_id());

-- ============================================================
-- CLIENT TASK VIEW (security function to strip internal notes)
-- ============================================================
CREATE OR REPLACE VIEW client_safe_tasks AS
  SELECT
    id,
    project_id,
    phase_id,
    title,
    description,
    -- internal_notes intentionally excluded
    assigned_to,
    status,
    is_client_task,
    requires_approval,
    is_asset_required,
    due_date,
    completed_at,
    sort_order,
    created_at,
    updated_at
  FROM tasks
  WHERE is_client_task = TRUE;
