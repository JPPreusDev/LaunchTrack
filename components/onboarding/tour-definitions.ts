/**
 * Tour step definitions for the Rampify onboarding guide.
 * Three separate tours: Template, Client, and Project creation.
 */

export type TourId = 'template' | 'client' | 'project'

export interface TourStep {
  title: string
  description: string
  /** Label for the optional CTA link */
  actionLabel?: string
  /** href the CTA link navigates to */
  actionHref?: string
}

export interface TourDefinition {
  id: TourId
  title: string
  subtitle: string
  icon: string
  steps: TourStep[]
}

export const TOURS: Record<TourId, TourDefinition> = {
  template: {
    id: 'template',
    title: 'Create a Template',
    subtitle: 'Define your reusable onboarding workflow',
    icon: '📋',
    steps: [
      {
        title: 'What is a template?',
        description:
          'Templates are reusable onboarding workflows. They define the phases and tasks every new client goes through — so you never have to start from scratch.',
      },
      {
        title: 'Go to Templates',
        description:
          'Head to the Templates section in the sidebar. This is where you manage all your onboarding workflows.',
        actionLabel: 'Open Templates',
        actionHref: '/templates',
      },
      {
        title: 'Create a new template',
        description:
          'Click the "New Template" button in the top right. Give it a name that describes the service — like "Website Redesign Onboarding" or "Marketing Retainer Setup".',
        actionLabel: 'New Template',
        actionHref: '/templates/new',
      },
      {
        title: 'Add phases',
        description:
          'Phases divide your workflow into stages — like Discovery, Design, Development, and Launch. Click "Add Phase" inside your template to get started.',
      },
      {
        title: 'Add tasks to each phase',
        description:
          'Tasks are the individual items that need to be completed. Mark a task as a "Client Task" to make it visible in the client portal — great for collecting assets or approvals.',
      },
    ],
  },
  client: {
    id: 'client',
    title: 'Add Your First Client',
    subtitle: 'Set up a client profile ready for onboarding',
    icon: '👤',
    steps: [
      {
        title: 'What are clients?',
        description:
          "Clients represent the businesses you're onboarding. Each client can have their own secure portal login to track their project progress in real time.",
      },
      {
        title: 'Go to Clients',
        description:
          'Navigate to the Clients section using the sidebar. All your client accounts are managed from here.',
        actionLabel: 'Open Clients',
        actionHref: '/clients',
      },
      {
        title: 'Add a new client',
        description:
          'Click "New Client" and fill in their details — name, company, and email. The email is used to send them a portal invite so they can track their own onboarding.',
        actionLabel: 'New Client',
        actionHref: '/clients/new',
      },
      {
        title: 'Review the client profile',
        description:
          "After saving, you'll see the client's profile page showing their active projects, portal access status, and contact info. You can send a portal invite directly from here.",
      },
    ],
  },
  project: {
    id: 'project',
    title: 'Launch Your First Project',
    subtitle: 'Connect a client to a template and start tracking',
    icon: '🚀',
    steps: [
      {
        title: 'What is a project?',
        description:
          'A project connects a client to an onboarding template and tracks their progress through it. Everything your team does — and everything your client sees — lives inside a project.',
      },
      {
        title: 'Go to Projects',
        description:
          'Navigate to the Projects section in the sidebar. All active and completed onboarding projects are listed here.',
        actionLabel: 'Open Projects',
        actionHref: '/projects',
      },
      {
        title: 'Create a new project',
        description:
          'Click "New Project". Select the client, choose a template, and set a start date. Rampify will automatically generate all phases and tasks from your template.',
        actionLabel: 'New Project',
        actionHref: '/projects/new',
      },
      {
        title: 'Assign tasks to your team',
        description:
          'Inside the project, assign tasks to team members and set due dates. Overdue tasks surface on your main dashboard so nothing slips through the cracks.',
      },
      {
        title: "You're all set!",
        description:
          "The project is now live and tracking. Send your client a portal invite from their profile so they can log in and see their onboarding progress in real time.",
      },
    ],
  },
}

export const TOUR_ORDER: TourId[] = ['template', 'client', 'project']
