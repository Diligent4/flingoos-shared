/**
 * Flingoos Pipeline Constants
 * 
 * Source of truth for stage definitions and other system constants.
 * Extracted from actual pipeline execution in COMPLETE_PAYLOAD_EXTRACTION.md
 */

export const STAGES = ['A', 'B', 'C', 'D', 'E', 'F', 'U'] as const;
export type Stage = typeof STAGES[number];

export const STAGE_NAMES: Record<Stage, string> = {
  'A': 'Data Collection',
  'B': 'Segmentation', 
  'C': 'LLM Inputs',
  'D': 'Analyses',
  'E': 'Workflow Guide',
  'F': 'Quality Assessment',
  'U': 'Upload'
};

export const TOTAL_STAGES = STAGES.length;

export const SESSION_STATUSES = ['recording', 'processing', 'completed', 'failed'] as const;
export type SessionStatus = typeof SESSION_STATUSES[number];

export const PROCESSING_STATUSES = ['submitted', 'processing', 'completed', 'failed'] as const; 
export type ProcessingStatus = typeof PROCESSING_STATUSES[number];

export const STAGE_EXECUTION_STATUSES = ['started', 'completed', 'failed'] as const;
export type StageExecutionStatus = typeof STAGE_EXECUTION_STATUSES[number];
