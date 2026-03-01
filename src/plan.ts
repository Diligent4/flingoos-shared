/**
 * Plan Mode Schemas
 *
 * Zod schemas for Plan Mode documents.
 * Plans are persistent planning documents that produce workflows, knowledge docs, and scripts.
 *
 * Firestore path: /organizations/{org_id}/plans/{plan_id}
 */

import { z } from 'zod';
import { ProjectVisibilitySchema } from './project.js';
import { StepTypeSchema } from './video-artifacts.js';

// ============================================================================
// Plan Lifecycle
// ============================================================================

export const PlanPhaseSchema = z.enum([
  'exploring',
  'grounding',
  'assessing',
  'drafting',
  'refining',
  'converting',
]);
export type PlanPhase = z.infer<typeof PlanPhaseSchema>;

export const PlanStatusSchema = z.enum(['active', 'completed', 'archived']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

// ============================================================================
// Blueprint Sub-schemas
// ============================================================================

export const PlanGoalSchema = z.object({
  statement: z.string(),
  success_criteria: z.array(z.string()),
  constraints: z.array(z.string()),
});
export type PlanGoal = z.infer<typeof PlanGoalSchema>;

export const PlanAssetTypeSchema = z.enum(['file', 'url', 'text', 'session_reference']);
export type PlanAssetType = z.infer<typeof PlanAssetTypeSchema>;

export const PlanAssetSchema = z.object({
  asset_id: z.string(),
  name: z.string(),
  type: PlanAssetTypeSchema,
  mime_type: z.string().optional(),
  size_bytes: z.number().optional(),
  storage_path: z.string().optional(),
  summary: z.string().optional(),
  extracted_structure: z.record(z.unknown()).optional(),
  added_at: z.string(),
});
export type PlanAsset = z.infer<typeof PlanAssetSchema>;

export const PlanStepSchema = z.object({
  step_number: z.number(),
  title: z.string(),
  description: z.string(),
  step_type: StepTypeSchema.optional(),
  target_system: z.string().optional(),
  automation_notes: z.string().optional(),
});
export type PlanStep = z.infer<typeof PlanStepSchema>;

export const PlanWorkstreamSchema = z.object({
  workstream_id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(PlanStepSchema),
  automation_approach: z.string().optional(),
  approach_reasoning: z.string().optional(),
  estimated_effort: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});
export type PlanWorkstream = z.infer<typeof PlanWorkstreamSchema>;

export const PlanBlueprintSchema = z.object({
  schema_version: z.enum(['1.0']).default('1.0'),
  goal: PlanGoalSchema.optional(),
  open_questions: z.array(z.string()),
  assumptions: z.array(z.string()),
  workstreams: z.array(PlanWorkstreamSchema),
  notes: z.string().optional(),
});
export type PlanBlueprint = z.infer<typeof PlanBlueprintSchema>;

// ============================================================================
// Produced Artifacts
// ============================================================================

export const ProducedArtifactTypeSchema = z.enum([
  'workflow_draft',
  'knowledge_doc',
  'script_draft',
]);
export type ProducedArtifactType = z.infer<typeof ProducedArtifactTypeSchema>;

export const ProducedArtifactStatusSchema = z.enum([
  'pending',
  'generating',
  'ready',
  'failed',
]);
export type ProducedArtifactStatus = z.infer<typeof ProducedArtifactStatusSchema>;

export const PlanProducedArtifactSchema = z.object({
  artifact_id: z.string(),
  type: ProducedArtifactTypeSchema,
  target_session_id: z.string().optional(),
  target_project_id: z.string().optional(),
  workstream_id: z.string().optional(),
  name: z.string(),
  status: ProducedArtifactStatusSchema,
  created_at: z.string(),
});
export type PlanProducedArtifact = z.infer<typeof PlanProducedArtifactSchema>;

// ============================================================================
// Agentability Results
// ============================================================================

export const PlanAgentabilityResultSchema = z.object({
  session_id: z.string(),
  assessed_at: z.string(),
  result_summary: z.record(z.unknown()),
});
export type PlanAgentabilityResult = z.infer<typeof PlanAgentabilityResultSchema>;

// ============================================================================
// Plan Document (Full Firestore shape)
// ============================================================================

export const PlanDocumentSchema = z.object({
  plan_id: z.string(),
  org_id: z.string(),
  owner_id: z.string(),
  title: z.string(),
  status: PlanStatusSchema,
  plan_phase: PlanPhaseSchema,
  visibility: ProjectVisibilitySchema,
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),

  blueprint: PlanBlueprintSchema,
  assets: z.array(PlanAssetSchema),
  produced_artifacts: z.array(PlanProducedArtifactSchema),
  agentability_results: z.array(PlanAgentabilityResultSchema).optional(),
  conversation_summary: z.string().optional(),

  embedding: z.array(z.number()).optional(),
  embedding_model: z.string().optional(),
  embedding_updated_at: z.string().optional(),
  searchPartitions: z.array(z.string()).optional(),
});
export type PlanDocument = z.infer<typeof PlanDocumentSchema>;

// ============================================================================
// API Request/Response Schemas
// ============================================================================

export const CreatePlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  visibility: ProjectVisibilitySchema.default('private'),
});
export type CreatePlan = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  visibility: ProjectVisibilitySchema.optional(),
  status: PlanStatusSchema.optional(),
  editors: z.array(z.string()).optional(),
  viewers: z.array(z.string()).optional(),
});
export type UpdatePlan = z.infer<typeof UpdatePlanSchema>;

export const PlanSummarySchema = z.object({
  plan_id: z.string(),
  title: z.string(),
  status: PlanStatusSchema,
  plan_phase: PlanPhaseSchema,
  visibility: ProjectVisibilitySchema,
  owner_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  workstream_count: z.number(),
  artifact_count: z.number(),
});
export type PlanSummary = z.infer<typeof PlanSummarySchema>;

export const ListPlansResponseSchema = z.object({
  plans: z.array(PlanSummarySchema),
  total: z.number(),
});
export type ListPlansResponse = z.infer<typeof ListPlansResponseSchema>;
