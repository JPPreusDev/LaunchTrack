-- ============================================================
-- LaunchTrack - Service Categories
-- ============================================================

-- Service categories (org-scoped, custom + default)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Link template tasks to a service category
ALTER TABLE template_tasks
  ADD COLUMN service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- Link project tasks to a service category (copied from template on project creation)
ALTER TABLE tasks
  ADD COLUMN service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- Category assignments: which team members belong to a category,
-- and whether they get notified when a client completes a task in that category
CREATE TABLE category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify_on_client_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_category_id, user_id)
);

-- Indexes
CREATE INDEX idx_service_categories_org ON service_categories(organization_id);
CREATE INDEX idx_category_assignments_category ON category_assignments(service_category_id);
CREATE INDEX idx_category_assignments_user ON category_assignments(user_id);
CREATE INDEX idx_template_tasks_category ON template_tasks(service_category_id);
CREATE INDEX idx_tasks_category ON tasks(service_category_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_assignments ENABLE ROW LEVEL SECURITY;

-- All org staff can view and manage categories
CREATE POLICY "org_staff_can_manage_service_categories"
  ON service_categories FOR ALL
  USING (organization_id = get_user_organization_id());

-- Admins manage assignments; staff can view
CREATE POLICY "org_admins_can_manage_category_assignments"
  ON category_assignments FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_org_admin()
  );

CREATE POLICY "org_staff_can_view_category_assignments"
  ON category_assignments FOR SELECT
  USING (organization_id = get_user_organization_id());
