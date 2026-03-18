/**
 * Seeds all starter templates for a newly created organization.
 * Called automatically during organization registration.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { STARTER_TEMPLATES } from './starter-templates'

export async function seedOrgTemplates(
  supabase: SupabaseClient,
  organizationId: string
): Promise<void> {
  for (const template of STARTER_TEMPLATES) {
    // Insert the template
    const { data: insertedTemplate, error: templateError } = await supabase
      .from('onboarding_templates')
      .insert({
        organization_id: organizationId,
        name: template.name,
        description: template.description,
        is_active: true,
      })
      .select('id')
      .single()

    if (templateError || !insertedTemplate) {
      console.error(`[SeedTemplates] Failed to insert template "${template.name}":`, templateError?.message)
      continue
    }

    // Insert phases
    const { data: insertedPhases, error: phasesError } = await supabase
      .from('template_phases')
      .insert(
        template.phases.map((phase) => ({
          template_id: insertedTemplate.id,
          name: phase.name,
          sort_order: phase.sort_order,
        }))
      )
      .select('id, name')

    if (phasesError || !insertedPhases) {
      console.error(`[SeedTemplates] Failed to insert phases for "${template.name}":`, phasesError?.message)
      continue
    }

    // Build a name→id map for phases
    const phaseIdByName = Object.fromEntries(
      insertedPhases.map((p) => [p.name, p.id])
    )

    // Insert tasks for each phase
    const allTasks = template.phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        template_id: insertedTemplate.id,
        phase_id: phaseIdByName[phase.name],
        title: task.title,
        description: task.description,
        is_client_task: task.is_client_task,
        requires_approval: task.requires_approval,
        is_asset_required: task.is_asset_required,
        default_due_days: task.default_due_days,
        sort_order: task.sort_order,
      }))
    )

    const { error: tasksError } = await supabase
      .from('template_tasks')
      .insert(allTasks)

    if (tasksError) {
      console.error(`[SeedTemplates] Failed to insert tasks for "${template.name}":`, tasksError.message)
    }
  }

  console.log(`[SeedTemplates] Seeded ${STARTER_TEMPLATES.length} templates for org ${organizationId}`)
}
