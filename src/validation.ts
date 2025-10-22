/**
 * Flingoos Shared Validation Utilities
 * 
 * Runtime validation functions and utilities using Zod schemas.
 */

import { z } from 'zod';
import * as schemas from './schemas.js';
import { STAGES, TOTAL_STAGES } from './constants.js';
import type { StageExecution, JobProgress, Stage } from './types.js';
import { getStageLabel } from './stage-messages.js';

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: z.ZodError;
  message: string;
};

// ============================================================================
// Safe Parse Wrapper
// ============================================================================

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      error: result.error,
      message: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    };
  }
}

// ============================================================================
// Common Validation Functions
// ============================================================================

export function validateSessionStartResponse(data: unknown): ValidationResult<z.infer<typeof schemas.SessionStartResponseSchema>> {
  return safeParse(schemas.SessionStartResponseSchema, data);
}

export function validateForgeJobResponse(data: unknown): ValidationResult<z.infer<typeof schemas.ForgeJobResponseSchema>> {
  return safeParse(schemas.ForgeJobResponseSchema, data);
}

export function validateBridgeCommandRequest(data: unknown): ValidationResult<z.infer<typeof schemas.BridgeCommandRequestSchema>> {
  return safeParse(schemas.BridgeCommandRequestSchema, data);
}

export function validateSessionInternalState(data: unknown): ValidationResult<z.infer<typeof schemas.SessionInternalStateSchema>> {
  return safeParse(schemas.SessionInternalStateSchema, data);
}

export function validateStageExecution(data: unknown): ValidationResult<z.infer<typeof schemas.StageExecutionSchema>> {
  return safeParse(schemas.StageExecutionSchema, data);
}

// ============================================================================
// Progress Calculation Utilities
// ============================================================================

/**
 * Calculate progress from stage executions array
 * Based on actual Forge pipeline behavior from COMPLETE_PAYLOAD_EXTRACTION.md
 */
export function calculateProgress(stage_executions: StageExecution[]): JobProgress {
  const completedStages = stage_executions.filter(s => s.status === 'completed');
  const progressPercent = Math.round((completedStages.length / TOTAL_STAGES) * 100);
  
  // Determine current stage (last started stage)
  const sortedByStartTime = [...stage_executions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  const currentStage = sortedByStartTime[sortedByStartTime.length - 1]?.stage as Stage || 'A';
  
  // Calculate stage durations
  const stageDurations: Record<string, number> = {};
  for (const execution of stage_executions) {
    if (execution.completed_at) {
      const startTime = new Date(execution.started_at).getTime();
      const endTime = new Date(execution.completed_at).getTime();
      stageDurations[execution.stage] = (endTime - startTime) / 1000; // seconds
    }
  }
  
  // Calculate elapsed time from first stage start
  const firstStage = sortedByStartTime[0];
  const elapsedSeconds = firstStage 
    ? Math.floor((Date.now() - new Date(firstStage.started_at).getTime()) / 1000)
    : 0;
  
  const processing_id = stage_executions[0]?.stage || 'unknown'; // This should come from manifest
  
  return {
    processing_id,
    progress_percent: progressPercent,
    current_stage: currentStage,
    stage_name: getStageLabel(currentStage),
    stages_completed: completedStages.map(s => s.stage),
    stages_total: TOTAL_STAGES,
    elapsed_seconds: elapsedSeconds,
    stage_durations: stageDurations
  };
}

/**
 * Check if all stages are completed
 */
export function isProcessingComplete(stage_executions: StageExecution[]): boolean {
  const completedStages = stage_executions.filter(s => s.status === 'completed');
  return completedStages.length === TOTAL_STAGES;
}

/**
 * Get failed stages
 */
export function getFailedStages(stage_executions: StageExecution[]): StageExecution[] {
  return stage_executions.filter(s => s.status === 'failed');
}

// ============================================================================
// Smoke Test Function (for acceptance testing)
// ============================================================================

/**
 * Run smoke tests against canonical payloads from COMPLETE_PAYLOAD_EXTRACTION.md
 */
export function runSmokeTests(): { passed: number; failed: number; results: Array<{test: string; success: boolean; error?: string}> } {
  const results: Array<{test: string; success: boolean; error?: string}> = [];
  
  // Test 1: Session Start Response
  const sessionStartPayload = {
    success: true,
    session_id: "550e8400-e29b-41d4-a716-446655440000",
    status: "recording",
    message: "Session started successfully"
  };
  
  const sessionStartResult = validateSessionStartResponse(sessionStartPayload);
  results.push({
    test: "Session Start Response",
    success: sessionStartResult.success,
    error: sessionStartResult.success ? undefined : sessionStartResult.message
  });
  
  // Test 2: Bridge Command Request
  const bridgeCommandPayload = {
    command: "audio_start",
    timestamp: 1642271400.123
  };
  
  const bridgeResult = validateBridgeCommandRequest(bridgeCommandPayload);
  results.push({
    test: "Bridge Command Request", 
    success: bridgeResult.success,
    error: bridgeResult.success ? undefined : bridgeResult.message
  });
  
  // Test 3: Stage Execution
  const stageExecutionPayload = {
    stage: "A",
    status: "completed",
    started_at: "2025-09-08T08:32:23.872689Z",
    completed_at: "2025-09-08T08:32:24.985952Z",
    error_message: null,
    artifacts_produced: ["stage_a_raw_data"]
  };
  
  const stageResult = validateStageExecution(stageExecutionPayload);
  results.push({
    test: "Stage Execution",
    success: stageResult.success, 
    error: stageResult.success ? undefined : stageResult.message
  });
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  return { passed, failed, results };
}

// Run smoke tests if this module is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Flingoos Shared validation smoke tests...\n');
  
  const testResults = runSmokeTests();
  
  testResults.results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n📊 Results: ${testResults.passed} passed, ${testResults.failed} failed`);
  
  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All validation tests passed!');
  }
}
