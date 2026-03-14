/**
 * Notification service for in-app and email notifications.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildEmailHtml } from '@/lib/resend/client'
import type { NotificationType } from '@/types'

interface CreateNotificationParams {
  organizationId: string
  userId: string
  title: string
  message: string
  type: NotificationType | string
  referenceId?: string
  referenceType?: string
}

/**
 * Create an in-app notification for a user.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase.from('notifications').insert({
    organization_id: params.organizationId,
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    reference_id: params.referenceId ?? null,
    reference_type: params.referenceType ?? null,
  })

  if (error) {
    console.error('[Notification] Failed to create:', error.message)
  }
}

interface SendProjectWelcomeEmailParams {
  clientEmail: string
  clientName: string
  agencyName: string
  projectName: string
  portalUrl: string
}

export async function sendProjectWelcomeEmail(
  params: SendProjectWelcomeEmailParams
): Promise<void> {
  await sendEmail({
    to: params.clientEmail,
    subject: `Your ${params.projectName} project is ready — let's get started!`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.clientName,
      heading: `Welcome to your onboarding portal`,
      body: `
        <p>Great news — your project <strong>${params.projectName}</strong> has been created and is ready to go.</p>
        <p>We've set up a dedicated portal where you can:</p>
        <ul style="padding-left:20px;">
          <li>Track your project progress</li>
          <li>Complete required tasks</li>
          <li>Upload assets and documents</li>
          <li>Review and approve milestones</li>
        </ul>
        <p>Click the button below to access your portal and get started.</p>
      `,
      ctaLabel: 'View My Project Portal',
      ctaUrl: params.portalUrl,
    }),
  })
}

interface SendTaskAssignedEmailParams {
  userEmail: string
  userName: string
  agencyName: string
  taskTitle: string
  projectName: string
  dueDate: string | null
  taskUrl: string
}

export async function sendTaskAssignedEmail(
  params: SendTaskAssignedEmailParams
): Promise<void> {
  await sendEmail({
    to: params.userEmail,
    subject: `Task assigned: ${params.taskTitle}`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.userName,
      heading: 'You have a new task',
      body: `
        <p>A task has been assigned to you in the project <strong>${params.projectName}</strong>.</p>
        <p><strong>Task:</strong> ${params.taskTitle}</p>
        ${params.dueDate ? `<p><strong>Due:</strong> ${params.dueDate}</p>` : ''}
      `,
      ctaLabel: 'View Task',
      ctaUrl: params.taskUrl,
    }),
  })
}

interface SendTaskOverdueEmailParams {
  userEmail: string
  userName: string
  agencyName: string
  taskTitle: string
  projectName: string
  daysOverdue: number
  taskUrl: string
}

export async function sendTaskOverdueEmail(
  params: SendTaskOverdueEmailParams
): Promise<void> {
  await sendEmail({
    to: params.userEmail,
    subject: `Task overdue: ${params.taskTitle}`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.userName,
      heading: 'A task is overdue',
      body: `
        <p>The following task in <strong>${params.projectName}</strong> is <strong>${params.daysOverdue} day${params.daysOverdue !== 1 ? 's' : ''} overdue</strong>.</p>
        <p><strong>Task:</strong> ${params.taskTitle}</p>
        <p>Please complete this task as soon as possible to keep your project on track.</p>
      `,
      ctaLabel: 'Complete Task',
      ctaUrl: params.taskUrl,
    }),
  })
}

interface SendAssetReminderEmailParams {
  clientEmail: string
  clientName: string
  agencyName: string
  assetTitle: string
  projectName: string
  portalUrl: string
}

export async function sendAssetReminderEmail(
  params: SendAssetReminderEmailParams
): Promise<void> {
  await sendEmail({
    to: params.clientEmail,
    subject: `Action required: ${params.assetTitle} needed for ${params.projectName}`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.clientName,
      heading: 'Asset upload reminder',
      body: `
        <p>We're still waiting on the following asset to continue your project <strong>${params.projectName}</strong>:</p>
        <p style="padding:12px 16px;background:#f8fafc;border-left:3px solid #3b82f6;border-radius:4px;">
          <strong>${params.assetTitle}</strong>
        </p>
        <p>Please log into your project portal to upload this asset. If you have any questions, reply to this email.</p>
      `,
      ctaLabel: 'Upload Now',
      ctaUrl: params.portalUrl,
    }),
  })
}

interface SendApprovalRequiredEmailParams {
  approverEmail: string
  approverName: string
  agencyName: string
  taskTitle: string
  projectName: string
  approvalUrl: string
}

export async function sendApprovalRequiredEmail(
  params: SendApprovalRequiredEmailParams
): Promise<void> {
  await sendEmail({
    to: params.approverEmail,
    subject: `Approval needed: ${params.taskTitle}`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.approverName,
      heading: 'Your approval is needed',
      body: `
        <p>A task in <strong>${params.projectName}</strong> is waiting for your approval before work can continue.</p>
        <p><strong>Task:</strong> ${params.taskTitle}</p>
        <p>Please review and approve or request changes.</p>
      `,
      ctaLabel: 'Review & Approve',
      ctaUrl: params.approvalUrl,
    }),
  })
}

interface SendProjectCompletedEmailParams {
  clientEmail: string
  clientName: string
  agencyName: string
  projectName: string
  portalUrl: string
}

export async function sendProjectCompletedEmail(
  params: SendProjectCompletedEmailParams
): Promise<void> {
  await sendEmail({
    to: params.clientEmail,
    subject: `🎉 ${params.projectName} is complete!`,
    html: buildEmailHtml({
      agencyName: params.agencyName,
      clientName: params.clientName,
      heading: 'Your project is complete!',
      body: `
        <p>We're thrilled to let you know that <strong>${params.projectName}</strong> has been completed successfully!</p>
        <p>Thank you for your collaboration throughout this process. You can access your project portal to review everything.</p>
      `,
      ctaLabel: 'View Project',
      ctaUrl: params.portalUrl,
    }),
  })
}
