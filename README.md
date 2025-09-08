# @flingoos/shared

Shared types, schemas, and validation for Flingoos services. This package prevents schema drift by providing a single source of truth for all data contracts across the Flingoos ecosystem.

## Design Principles

- **Reality-Aligned**: All types match actual extracted payloads from production services
- **Schemas First**: Zod schemas are the source of truth; TypeScript types are inferred
- **No Business Logic**: Pure data contracts and validation only
- **Zero Dependencies**: Minimal runtime footprint with only essential validation

## Installation

```bash
# Install from git (pinned to exact commit/tag)
npm install git+https://github.com/tslilon/flingoos-shared.git#v0.1.0
```

## Usage

### Basic Types

```typescript
import { Session, ForgeJob, JobProgress } from '@flingoos/shared';

// Use inferred types
const session: Session = {
  session_id: "uuid-here",
  status: "recording",
  start_time: "2025-01-15T14:30:00.000Z"
};
```

### Runtime Validation

```typescript
import { validateSessionStartResponse, validateForgeJobResponse } from '@flingoos/shared';

// Validate API responses
const result = validateSessionStartResponse(apiResponse);
if (result.success) {
  console.log('Valid session:', result.data);
} else {
  console.error('Validation failed:', result.message);
}
```

### Progress Calculation

```typescript
import { calculateProgress, STAGES } from '@flingoos/shared';

// Calculate progress from stage executions
const progress = calculateProgress(stageExecutions);
console.log(`${progress.progress_percent}% complete, current stage: ${progress.stage_name}`);
```

### Constants

```typescript
import { STAGES, TOTAL_STAGES, STAGE_NAMES } from '@flingoos/shared';

console.log(`Pipeline has ${TOTAL_STAGES} stages:`, STAGES);
console.log('Stage A name:', STAGE_NAMES['A']); // "Data Collection"
```

## Schema Sources

All schemas are based on actual payloads extracted from:
- Session Manager API responses
- Forge pipeline outputs  
- Bridge command interfaces
- WebSocket event messages
- Firestore document structures

See `COMPLETE_PAYLOAD_EXTRACTION.md` for canonical examples.

## Validation

Run the built-in smoke tests:

```bash
npm run validate
```

This tests all schemas against canonical payloads to ensure correctness.

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run validation tests
npm run test

# Clean build artifacts
npm run clean
```

## Field Name Conventions

This package uses exact field names from extracted payloads:

- `session_id` (not `sessionId`)
- `processing_id` (not `job_id`)  
- `start_time`, `stop_time` (not `created_at`/`updated_at`)
- `firestore_path`, `workflow_id`
- `stage_executions[]`

## Consumer Integration

### Session Manager Example

```typescript
import { validateSessionStartResponse, Session } from '@flingoos/shared';

// In your API handler
const response = await startSession();
const validation = validateSessionStartResponse(response);

if (!validation.success) {
  throw new Error(`Invalid session response: ${validation.message}`);
}

// Type-safe access
const session: Session = validation.data;
```

### Error Handling

```typescript
import { StandardErrorResponse, ErrorEnvelope } from '@flingoos/shared';

// Current error format (validated from extractions)
const currentError: StandardErrorResponse = {
  success: false,
  error: "Bridge service is not running"
};

// Future standardized format (pending confirmation)
const futureError: ErrorEnvelope = {
  error_code: 'BRIDGE_DOWN',
  error_message: 'Bridge service is not running',
  correlation_id: 'uuid-here',
  timestamp: new Date().toISOString()
};
```

## License

MIT
