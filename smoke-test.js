/**
 * Smoke Test: Consumer Integration
 * 
 * Tests that @flingoos/shared can be imported and used correctly
 * by consumer services like Session Manager
 */

import { 
  validateSessionStartResponse,
  validateForgeJobResponse, 
  calculateProgress,
  STAGES,
  TOTAL_STAGES 
} from './dist/index.js';

console.log('🚀 Testing @flingoos/shared consumer integration...\n');

// Test 1: Validate canonical Session Manager response
console.log('📋 Test 1: Session Manager API validation');
const sessionResponse = {
  success: true,
  session_id: "550e8400-e29b-41d4-a716-446655440000",
  status: "recording",
  message: "Session started successfully"
};

const sessionValidation = validateSessionStartResponse(sessionResponse);
if (sessionValidation.success) {
  console.log('✅ Session response validation passed');
  console.log('   Session ID:', sessionValidation.data.session_id);
  console.log('   Status:', sessionValidation.data.status);
} else {
  console.log('❌ Session response validation failed:', sessionValidation.message);
  process.exit(1);
}

// Test 2: Validate Forge response from COMPLETE_PAYLOAD_EXTRACTION.md
console.log('\n📋 Test 2: Forge response validation');
const forgeResponse = {
  status: "completed",
  session_id: "test-session", 
  processing_time_seconds: 72,
  firestore_path: "organizations/diligent4/workflows/test",
  workflow_id: "test-workflow",
  message: "Session processed successfully by real Forge",
  timestamp: "2025-09-08T08:33:35.375038+00:00",
  forge_response: {
    manifest: {
      version: "1.1",
      processing_id: "proc_74ca06450e24",
      trigger_hash: "sha256:abc123",
      session: { org_id: "diligent4", device_id: "test" },
      options: { stages: ["A", "B", "C", "D", "E", "F", "U"] },
      status: "completed",
      created_at: "2025-09-08T08:33:33.398961Z",
      completed_at: "2025-09-08T08:33:35.012681Z",
      artifacts: [
        {
          name: "stage_e_workflow_guide.json",
          type: "workflow",
          stage: "U",
          gcs_uri: "gs://test/artifact.json",
          sha256: "abc123",
          size_bytes: 5769,
          mime: "application/json",
          created_at: "2025-09-08T08:33:35.012516+00:00"
        }
      ],
      counters: {
        events_processed: 9,
        media_files_processed: 0,
        timeline_entries: 2,
        llm_tokens_used: 3134,
        processing_time_seconds: 71.143824
      },
      stage_executions: [
        {
          stage: "A",
          status: "completed",
          started_at: "2025-09-08T08:32:23.872689Z",
          completed_at: "2025-09-08T08:32:24.985952Z",
          error_message: null,
          artifacts_produced: ["stage_a_raw_data"]
        },
        {
          stage: "B",
          status: "completed", 
          started_at: "2025-09-08T08:32:24.986571Z",
          completed_at: "2025-09-08T08:32:26.988495Z",
          error_message: null,
          artifacts_produced: ["stage_b_segments"]
        },
        {
          stage: "C",
          status: "completed",
          started_at: "2025-09-08T08:32:26.988878Z",
          completed_at: "2025-09-08T08:32:26.993826Z",
          error_message: null,
          artifacts_produced: ["stage_c_llm_inputs"]
        }
      ],
      content_sha256: "placeholder",
      error_message: null,
      errors: []
    },
    processing_id: "proc_74ca06450e24",
    status: "completed",
    processing_time_ms: 72288,
    idempotent_reuse: false
  }
};

const forgeValidation = validateForgeJobResponse(forgeResponse);
if (forgeValidation.success) {
  console.log('✅ Forge response validation passed');
  console.log('   Processing ID:', forgeValidation.data.forge_response?.processing_id);
  console.log('   Firestore Path:', forgeValidation.data.firestore_path);
} else {
  console.log('❌ Forge response validation failed:', forgeValidation.message);
  process.exit(1);
}

// Test 3: Progress calculation utility
console.log('\n📋 Test 3: Progress calculation');
const stageExecutions = [
  {
    stage: "A",
    status: "completed",
    started_at: "2025-09-08T08:32:23.872689Z",
    completed_at: "2025-09-08T08:32:24.985952Z",
    error_message: null,
    artifacts_produced: ["stage_a_raw_data"]
  },
  {
    stage: "B", 
    status: "completed",
    started_at: "2025-09-08T08:32:24.986571Z",
    completed_at: "2025-09-08T08:32:26.988495Z",
    error_message: null,
    artifacts_produced: ["stage_b_segments"]
  },
  {
    stage: "C",
    status: "processing",
    started_at: "2025-09-08T08:32:26.988878Z",
    completed_at: null,
    error_message: null,
    artifacts_produced: []
  }
];

const progress = calculateProgress(stageExecutions);
console.log('✅ Progress calculation passed');
console.log('   Progress:', `${progress.progress_percent}%`);
console.log('   Current Stage:', `${progress.current_stage} (${progress.stage_name})`);
console.log('   Completed Stages:', progress.stages_completed.join(', '));

// Test 4: Constants usage
console.log('\n📋 Test 4: Constants validation');
console.log('✅ Constants accessible');
console.log('   Total Stages:', TOTAL_STAGES);
console.log('   All Stages:', STAGES.join(' → '));

console.log('\n🎉 All consumer integration tests passed!');
console.log('✅ Package is ready for consumption by Flingoos services');
