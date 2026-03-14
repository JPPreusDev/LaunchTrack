/**
 * LaunchTrack - Core Type Definitions
 */

export type UserRole = 'org_admin' | 'team_member' | 'client_user'

export type ProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting_on_client'
  | 'completed'
  | 'on_hold'

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting_on_client'
  | 'completed'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type AssetRequestStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export type SubscriptionPlan = 'starter' | 'growth' | 'scale'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export type IntegrationProvider = 'clickup' | 'teamwork' | 'monday' | 'slack' | 'github' | 'jira'

export type AutomationTrigger =
  | 'task_overdue'
  | 'asset_pending'
  | 'project_stuck'
  | 'task_completed'

export type AutomationAction = 'send_email' | 'send_slack' | 'notify_team'

export type NotificationType =
  | 'task_assigned'
  | 'task_overdue'
  | 'asset_submitted'
  | 'approval_required'
  | 'project_completed'
  | 'comment_added'

// ============================================================
// DATABASE ROW TYPES
// ============================================================

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: SubscriptionPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  organization_id: string
  user_id: string
  role: 'org_admin' | 'team_member'
  invited_by: string | null
  invite_email: string | null
  invite_token: string | null
  accepted_at: string | null
  created_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  company_name: string | null
  email: string
  phone: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TemplatePhase {
  id: string
  template_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface TemplateTask {
  id: string
  template_id: string
  phase_id: string | null
  title: string
  description: string | null
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  default_due_days: number
  sort_order: number
  service_category_id: string | null
  created_at: string
}

export interface OnboardingProject {
  id: string
  organization_id: string
  client_id: string
  template_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string
  estimated_launch_date: string | null
  actual_launch_date: string | null
  waiting_since: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProjectPhase {
  id: string
  project_id: string
  template_phase_id: string | null
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  phase_id: string | null
  template_task_id: string | null
  organization_id: string
  title: string
  description: string | null
  internal_notes: string | null
  assigned_to: string | null
  status: TaskStatus
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  due_date: string | null
  completed_at: string | null
  completed_by: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  is_internal: boolean
  created_at: string
}

export interface Approval {
  id: string
  task_id: string
  project_id: string
  organization_id: string
  requested_by: string | null
  approved_by: string | null
  status: ApprovalStatus
  notes: string | null
  requested_at: string
  resolved_at: string | null
}

export interface AssetRequest {
  id: string
  project_id: string
  organization_id: string
  title: string
  description: string | null
  asset_type: string
  is_required: boolean
  status: AssetRequestStatus
  submitted_at: string | null
  approved_at: string | null
  approved_by: string | null
  reminder_sent_at: string | null
  reminder_count: number
  created_at: string
  updated_at: string
}

export interface UploadedFile {
  id: string
  organization_id: string
  project_id: string | null
  task_id: string | null
  asset_request_id: string | null
  uploaded_by: string | null
  file_name: string
  file_type: string | null
  file_size: number | null
  storage_path: string
  public_url: string | null
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  title: string
  message: string
  type: string
  reference_id: string | null
  reference_type: string | null
  is_read: boolean
  created_at: string
}

export interface Integration {
  id: string
  organization_id: string
  provider: IntegrationProvider
  token_expiry: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface IntegrationMapping {
  id: string
  organization_id: string
  provider: string
  launchtrack_project_id: string | null
  external_project_id: string
  mapping_type: string
  metadata: Record<string, unknown>
  sync_enabled: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface AutomationRule {
  id: string
  organization_id: string
  name: string
  trigger_type: AutomationTrigger
  trigger_config: Record<string, unknown>
  action_type: AutomationAction
  action_config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// JOINED / ENRICHED TYPES
// ============================================================

export interface ProjectWithDetails extends OnboardingProject {
  client: Client
  completion_percentage: number
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  days_since_start: number
  days_stuck: number | null
}

export interface TaskWithAssignee extends Task {
  assignee: User | null
  phase: ProjectPhase | null
}

export interface TaskWithComments extends TaskWithAssignee {
  comments: (TaskComment & { user: User })[]
}

export interface ServiceCategory {
  id: string
  organization_id: string
  name: string
  created_at: string
}

export interface CategoryAssignment {
  id: string
  organization_id: string
  service_category_id: string
  user_id: string
  notify_on_client_complete: boolean
  created_at: string
}

export interface TemplateWithPhases extends OnboardingTemplate {
  phases: (TemplatePhase & { tasks: TemplateTask[] })[]
}

export interface ProjectWithPhases extends OnboardingProject {
  phases: (ProjectPhase & { tasks: TaskWithAssignee[] })[]
  asset_requests: AssetRequest[]
  client: Client
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ============================================================
// PLAN LIMITS
// ============================================================

export const PLAN_LIMITS: Record<SubscriptionPlan, { max_projects: number; price_monthly: number }> = {
  starter: { max_projects: 5, price_monthly: 49 },
  growth: { max_projects: 20, price_monthly: 149 },
  scale: { max_projects: 999999, price_monthly: 299 },
}

export const STATUS_LABELS: Record<ProjectStatus | TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  waiting_on_client: 'Waiting on Client',
  completed: 'Completed',
  on_hold: 'On Hold',
}

export const STATUS_COLORS: Record<ProjectStatus | TaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_on_client: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-red-100 text-red-700',
}
