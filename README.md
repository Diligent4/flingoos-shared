# @flingoos/shared

Shared types, schemas, and validation for Flingoos services. This package prevents schema drift by providing a single source of truth for all data contracts across the Flingoos ecosystem.

## Design Principles

- **Reality-Aligned**: All types match actual extracted payloads from production services
- **Schemas First**: Zod schemas are the source of truth; TypeScript types are inferred
- **No Business Logic**: Pure data contracts and validation only
- **Zero Dependencies**: Minimal runtime footprint with only essential validation

## Installation

Published to Google Artifact Registry. Both npm and Python packages are available.

### npm (TypeScript/JavaScript services)

```bash
# 1. Set up ADC (one-time — creates a refresh token that doesn't expire)
gcloud auth application-default login

# 2. Generate npm auth token (expires after 1 hour — re-run when you get 401 errors)
npx google-artifactregistry-auth

# 3. Install
npm install @flingoos/shared
```

Your project needs an `.npmrc` pointing to AR:
```
@flingoos:registry=https://me-west1-npm.pkg.dev/flingoos-production/flingoos-npm/
```

### Python (Pydantic models)

```bash
# Install with storage extras (for GCS impersonation)
pip install flingoos-shared-models[storage] \
  --index-url https://me-west1-python.pkg.dev/flingoos-production/flingoos-python/simple/ \
  --extra-index-url https://pypi.org/simple/

# Or with uv
UV_EXTRA_INDEX_URL="https://me-west1-python.pkg.dev/flingoos-production/flingoos-python/simple/" \
  uv add flingoos-shared-models[storage]
```

### Version pinning

```json
// package.json — accept minor updates (recommended)
"@flingoos/shared": "^2.0.0"

// package.json — pin exact version
"@flingoos/shared": "2.0.0"
```

```toml
# pyproject.toml — accept compatible updates
"flingoos-shared-models>=2.0.0"

# pyproject.toml — pin exact version
"flingoos-shared-models==2.0.0"
```

### Local development (testing unreleased changes)

```bash
# npm — link to local checkout
cd flingoos-shared && npm run build && npm link
cd ../flingoos-mcp && npm link @flingoos/shared

# Python — editable install
cd flingoos-video-forge
uv pip install -e ../flingoos-shared/python/flingoos_shared_models
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
import { STAGES, TOTAL_STAGES, getStageLabel } from '@flingoos/shared';

console.log(`Pipeline has ${TOTAL_STAGES} stages:`, STAGES);
console.log('Stage A label:', getStageLabel('A')); // "Uploading data"
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

# Generate JSON schemas + Python models
npm run build:schemas

# Clean build artifacts
npm run clean
```

## Publishing a new version

Both npm and Python packages share the same version number.

```bash
# 1. Bump version in both files (keep in sync)
#    - package.json: "version": "2.1.0"
#    - python/flingoos_shared_models/pyproject.toml: version = "2.1.0"

# 2. Commit and tag
git commit -am "chore: bump version to 2.1.0"
git tag v2.1.0
git push origin main --tags

# 3. CI (publish.yml) auto-publishes both packages to Artifact Registry
```

Consumers update with:
```bash
# npm
npm update @flingoos/shared

# Python
uv lock --upgrade-package flingoos-shared-models
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
