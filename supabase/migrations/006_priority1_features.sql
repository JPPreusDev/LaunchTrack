-- ============================================================
-- LaunchTrack — Priority 1 Features
-- Sub-tasks, Task Dependencies, Chat, CSAT, Engagement,
-- Intake Forms
-- ============================================================

-- ── Sub-tasks ─────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

-- ── Task Dependencies ──────────────────────────────────────
CREATE TABLE task_dependencies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id              UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id   UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- ── Project Messages (in-portal chat) ─────────────────────
CREATE TABLE project_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  is_internal     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON project_messages(created_at);

-- ── CSAT Surveys ──────────────────────────────────────────
CREATE TABLE csat_surveys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  trigger_type    TEXT NOT NULL DEFAULT 'project_complete',
  sent_to_user_id UUID REFERENCES users(id),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csat_surveys_project_id ON csat_surveys(project_id);

CREATE TABLE csat_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   UUID NOT NULL REFERENCES csat_surveys(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment     TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csat_responses_project_id ON csat_responses(project_id);
CREATE INDEX idx_csat_responses_survey_id ON csat_responses(survey_id);

-- ── Client Engagement / Portal Activity Log ────────────────
CREATE TABLE portal_activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action_type     TEXT NOT NULL, -- page_view | task_complete | asset_upload | message_sent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_activity_log_project_id ON portal_activity_log(project_id);
CREATE INDEX idx_portal_activity_log_created_at ON portal_activity_log(created_at);

-- ── Intake Forms ───────────────────────────────────────────
CREATE TABLE intake_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_forms_organization_id ON intake_forms(organization_id);
CREATE INDEX idx_intake_forms_template_id ON intake_forms(template_id);

CREATE TABLE intake_form_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  field_type  TEXT NOT NULL DEFAULT 'text', -- text|textarea|email|phone|select|checkbox|date
  options     JSONB,          -- For select fields: ["Option A", "Option B"]
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_intake_form_fields_form_id ON intake_form_fields(form_id);

CREATE TABLE intake_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  client_name   TEXT,
  client_email  TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_responses_project_id ON intake_responses(project_id);
CREATE INDEX idx_intake_responses_form_id ON intake_responses(form_id);

CREATE TABLE intake_response_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES intake_responses(id) ON DELETE CASCADE,
  field_id    UUID NOT NULL REFERENCES intake_form_fields(id) ON DELETE CASCADE,
  value       TEXT
);

CREATE INDEX idx_intake_response_answers_response_id ON intake_response_answers(response_id);

-- ── RLS for new tables ─────────────────────────────────────

-- task_dependencies: org staff can manage, same org as the tasks
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff manage task dependencies"
  ON task_dependencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN users u ON u.organization_id = (
        SELECT organization_id FROM onboarding_projects p WHERE p.id = t.project_id
      )
      WHERE t.id = task_dependencies.task_id
        AND u.id = auth.uid()
        AND u.role IN ('org_admin','team_member')
    )
  );

-- project_messages: org staff + clients with portal access
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff read write messages"
  ON project_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = project_messages.organization_id
        AND u.role IN ('org_admin','team_member')
    )
  );
CREATE POLICY "clients read non-internal messages"
  ON project_messages FOR SELECT
  USING (
    is_internal = FALSE
    AND EXISTS (
      SELECT 1 FROM client_portal_access cpa
      WHERE cpa.user_id = auth.uid()
        AND cpa.project_id = project_messages.project_id
        AND cpa.is_active = TRUE
    )
  );
CREATE POLICY "clients insert messages"
  ON project_messages FOR INSERT
  WITH CHECK (
    is_internal = FALSE
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM client_portal_access cpa
      WHERE cpa.user_id = auth.uid()
        AND cpa.project_id = project_messages.project_id
        AND cpa.is_active = TRUE
    )
  );

-- csat_surveys: org staff manage, clients can read their own
ALTER TABLE csat_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff manage csat surveys"
  ON csat_surveys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = csat_surveys.organization_id
        AND u.role IN ('org_admin','team_member')
    )
  );
CREATE POLICY "clients read their csat survey"
  ON csat_surveys FOR SELECT
  USING (sent_to_user_id = auth.uid());

-- csat_responses: clients insert, org staff read
ALTER TABLE csat_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff read csat responses"
  ON csat_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM csat_surveys cs
      JOIN users u ON u.organization_id = cs.organization_id
      WHERE cs.id = csat_responses.survey_id
        AND u.id = auth.uid()
        AND u.role IN ('org_admin','team_member')
    )
  );
CREATE POLICY "clients insert csat response"
  ON csat_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM csat_surveys cs
      WHERE cs.id = csat_responses.survey_id
        AND cs.sent_to_user_id = auth.uid()
    )
  );

-- portal_activity_log: org staff read, service role inserts
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff read activity"
  ON portal_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = portal_activity_log.organization_id
        AND u.role IN ('org_admin','team_member')
    )
  );
CREATE POLICY "service role insert activity"
  ON portal_activity_log FOR INSERT
  WITH CHECK (TRUE); -- service role bypasses RLS anyway

-- intake_forms: org staff manage
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org staff manage intake forms"
  ON intake_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = intake_forms.organization_id
        AND u.role IN ('org_admin','team_member')
    )
  );
CREATE POLICY "public read active intake form"
  ON intake_forms FOR SELECT
  USING (is_active = TRUE);

ALTER TABLE intake_form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read intake form fields"
  ON intake_form_fields FOR SELECT
  USING (TRUE);
CREATE POLICY "org staff manage intake form fields"
  ON intake_form_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms f
      JOIN users u ON u.organization_id = f.organization_id
      WHERE f.id = intake_form_fields.form_id
        AND u.id = auth.uid()
        AND u.role IN ('org_admin','team_member')
    )
  );

ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert intake response"
  ON intake_responses FOR INSERT
  WITH CHECK (TRUE);
CREATE POLICY "org staff read intake responses"
  ON intake_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM intake_forms f
      JOIN users u ON u.organization_id = f.organization_id
      WHERE f.id = intake_responses.form_id
        AND u.id = auth.uid()
        AND u.role IN ('org_admin','team_member')
    )
  );

ALTER TABLE intake_response_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert intake answers"
  ON intake_response_answers FOR INSERT
  WITH CHECK (TRUE);
CREATE POLICY "org staff read intake answers"
  ON intake_response_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM intake_responses ir
      JOIN intake_forms f ON f.id = ir.form_id
      JOIN users u ON u.organization_id = f.organization_id
      WHERE ir.id = intake_response_answers.response_id
        AND u.id = auth.uid()
        AND u.role IN ('org_admin','team_member')
    )
  );
