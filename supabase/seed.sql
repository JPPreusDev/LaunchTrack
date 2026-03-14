-- ============================================================
-- LaunchTrack - Seed Data
-- Run AFTER schema + RLS migrations
-- NOTE: Creates demo data with placeholder auth.users IDs
-- In real setup, create users via Supabase Auth first, then run this
-- ============================================================

-- 0. Auth users (must exist before public.users due to FK constraint)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'admin@apexdigital.com', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', 'sarah@apexdigital.com',  NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, 'authenticated'),
  ('00000000-0000-0000-0000-000000000012', 'client@brightstar.com',  NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, 'authenticated')
ON CONFLICT DO NOTHING;

-- 1. Demo Organization
INSERT INTO organizations (id, name, slug, plan, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Apex Digital Agency',
  'apex-digital',
  'growth',
  'active'
);

-- 2. Demo Users (these UUIDs must match auth.users after signup)
-- In a real setup: sign up via /register, then update organization_id
-- For seeding: insert placeholder profiles (auth.users must exist first)

-- Admin user profile
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'admin@apexdigital.com',
  'Alex Johnson',
  'org_admin'
) ON CONFLICT DO NOTHING;

-- Team member profile
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'sarah@apexdigital.com',
  'Sarah Chen',
  'team_member'
) ON CONFLICT DO NOTHING;

-- Client user profile
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'client@brightstar.com',
  'Mike Reynolds',
  'client_user'
) ON CONFLICT DO NOTHING;

-- 2b. Default service categories for demo org
INSERT INTO service_categories (organization_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Website Development'),
  ('00000000-0000-0000-0000-000000000001', 'Search Engine Optimization'),
  ('00000000-0000-0000-0000-000000000001', 'Programmatic Advertising'),
  ('00000000-0000-0000-0000-000000000001', 'Social Media'),
  ('00000000-0000-0000-0000-000000000001', 'Email Marketing'),
  ('00000000-0000-0000-0000-000000000001', 'Graphic Design'),
  ('00000000-0000-0000-0000-000000000001', 'Content Writing'),
  ('00000000-0000-0000-0000-000000000001', 'Print')
ON CONFLICT DO NOTHING;

-- 3. Memberships
INSERT INTO memberships (organization_id, user_id, role, accepted_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'org_admin', NOW()),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'team_member', NOW())
ON CONFLICT DO NOTHING;

-- 4. Demo Client
INSERT INTO clients (id, organization_id, name, company_name, email, website)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Mike Reynolds',
  'Brightstar Retail',
  'client@brightstar.com',
  'https://brightstar.com'
);

-- 5. Onboarding Template
INSERT INTO onboarding_templates (id, organization_id, name, description, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000001',
  'Standard Website Launch',
  'Full website build and launch onboarding process',
  '00000000-0000-0000-0000-000000000010'
);

-- Template Phases
INSERT INTO template_phases (id, template_id, name, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000030', 'Discovery & Setup', 0),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000030', 'Design & Content', 1),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000030', 'Development', 2),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000030', 'Review & Launch', 3);

-- Template Tasks
INSERT INTO template_tasks (template_id, phase_id, title, description, is_client_task, requires_approval, is_asset_required, default_due_days, sort_order)
VALUES
  -- Discovery
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000031', 'Kickoff call scheduled', 'Schedule and complete the project kickoff call', FALSE, FALSE, FALSE, 2, 0),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000031', 'Brand questionnaire completed', 'Complete the brand and business questionnaire', TRUE, FALSE, FALSE, 5, 1),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000031', 'Logo & brand assets uploaded', 'Upload logo files (SVG/PNG) and brand guidelines', TRUE, FALSE, TRUE, 7, 2),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000031', 'Domain access provided', 'Provide domain registrar access or DNS credentials', TRUE, FALSE, TRUE, 7, 3),
  -- Design
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000032', 'Homepage wireframe created', 'Internal team creates homepage wireframe', FALSE, FALSE, FALSE, 14, 0),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000032', 'Design mockup approval', 'Client reviews and approves homepage design', TRUE, TRUE, FALSE, 18, 1),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000032', 'Website copy submitted', 'Client provides all website copy and content', TRUE, FALSE, TRUE, 21, 2),
  -- Development
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000033', 'Development environment setup', 'Set up staging environment', FALSE, FALSE, FALSE, 25, 0),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000033', 'Core pages built', 'Build all core website pages', FALSE, FALSE, FALSE, 35, 1),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000033', 'Client review on staging', 'Client reviews staging site and provides feedback', TRUE, FALSE, FALSE, 38, 2),
  -- Launch
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000034', 'Final approval sign-off', 'Client gives final approval to launch', TRUE, TRUE, FALSE, 42, 0),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000034', 'Site goes live', 'Deploy site to production', FALSE, FALSE, FALSE, 45, 1),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000034', 'Post-launch check', 'Verify everything works post-launch', FALSE, FALSE, FALSE, 46, 2);

-- 6. Sample Onboarding Project
INSERT INTO onboarding_projects (id, organization_id, client_id, template_id, name, status, start_date, estimated_launch_date, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000030',
  'Brightstar Website Launch',
  'in_progress',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '35 days',
  '00000000-0000-0000-0000-000000000010'
);

-- Project Phases
INSERT INTO project_phases (id, project_id, name, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000040', 'Discovery & Setup', 0),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000040', 'Design & Content', 1),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000040', 'Development', 2),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000040', 'Review & Launch', 3);

-- Sample Tasks
INSERT INTO tasks (project_id, phase_id, organization_id, title, description, assigned_to, status, is_client_task, due_date, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Kickoff call scheduled', 'Schedule and complete the project kickoff call', '00000000-0000-0000-0000-000000000011', 'completed', FALSE, CURRENT_DATE - INTERVAL '8 days', 0),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Brand questionnaire completed', 'Complete the brand and business questionnaire', '00000000-0000-0000-0000-000000000012', 'completed', TRUE, CURRENT_DATE - INTERVAL '5 days', 1),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Logo & brand assets uploaded', 'Upload logo files (SVG/PNG) and brand guidelines', '00000000-0000-0000-0000-000000000012', 'waiting_on_client', TRUE, CURRENT_DATE - INTERVAL '3 days', 2),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Domain access provided', 'Provide domain registrar access or DNS credentials', '00000000-0000-0000-0000-000000000012', 'not_started', TRUE, CURRENT_DATE + INTERVAL '4 days', 3),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Homepage wireframe created', 'Internal team creates homepage wireframe', '00000000-0000-0000-0000-000000000011', 'in_progress', FALSE, CURRENT_DATE + INTERVAL '7 days', 0),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Design mockup approval', 'Client reviews and approves homepage design', '00000000-0000-0000-0000-000000000012', 'not_started', TRUE, CURRENT_DATE + INTERVAL '11 days', 1);

-- Asset Requests
INSERT INTO asset_requests (project_id, organization_id, title, description, asset_type, is_required, status)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Company Logo', 'Please upload your logo in SVG and PNG format (transparent background preferred)', 'logo', TRUE, 'pending'),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Brand Guidelines', 'Color codes, fonts, and any brand style guide documents', 'document', FALSE, 'pending'),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Domain Registrar Access', 'Login credentials or delegate access to your domain registrar', 'credentials', TRUE, 'pending');

-- Client Portal Access
INSERT INTO client_portal_access (project_id, client_id, user_id)
VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000012'
);

-- Default Automation Rules
INSERT INTO automation_rules (organization_id, name, trigger_type, trigger_config, action_type, action_config)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Asset Reminder - 3 Days Pending',
    'asset_pending',
    '{"days_pending": 3}',
    'send_email',
    '{"template": "asset_reminder", "recipient": "client"}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Task Overdue Alert',
    'task_overdue',
    '{"days_overdue": 1}',
    'notify_team',
    '{"template": "task_overdue"}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Stuck Project Alert',
    'project_stuck',
    '{"days_stuck": 5}',
    'send_slack',
    '{"channel": "general", "template": "project_stuck"}'
  );
