/**
 * @flingoos/shared - Entry Point
 * 
 * Shared types, schemas, and validation for Flingoos services.
 * Reality-aligned contracts based on extracted payloads.
 */

// Re-export everything for convenient imports
export * from './constants.js';
export * from './types.js';
export * from './schemas.js';
export * from './validation.js';
export * from './stage-messages.js';
export * from './video-artifacts.js';
export * from './session-translations.js';
export * from './project.js';
export * from './edit-history.js';
export * from './plan.js';
export * from './priority-integration.js';
export * from './security.js';
export * from './uploaded-artifact.js';
export * from './clustering.js';

// Usage logging module (explicit namespace to avoid conflicts)
export * as UsageLogging from './usage-logging/index.js';

// Named exports for specific use cases
export {
  // Constants
  STAGES,
  TOTAL_STAGES,
  SESSION_STATUSES,
  PROCESSING_STATUSES
} from './constants.js';

export type {
  // Core types
  Session,
  SessionInternalState,
  ForgeJob,
  ForgeJobResponse,
  JobProgress,
  StageExecution,
  
  // API response types  
  SessionStartResponse,
  SessionStopResponse,
  BridgeCommandRequest,
  BridgeCommandResponse,
  
  // Device authentication types
  DeviceProofRequest,
  DeviceProofResponse,
  DeviceProofPayload,
  
  // JWT authentication types
  AuthTokenResponse,
  AuthClaims,
  
  // Utility types
  Stage,
  SessionStatus,
  ProcessingStatus
} from './types.js';

export type {
  ValidationResult
} from './validation.js';

export {
  // Validation functions
  safeParse,
  validateSessionStartResponse,
  validateForgeJobResponse,
  validateBridgeCommandRequest,
  validateSessionInternalState,

  // Utility functions
  calculateProgress,
  isProcessingComplete,
  getFailedStages,
  runSmokeTests
} from './validation.js';

export {
  // Stage message utilities
  getStageMessage,
  getAllStageMessages,
  isValidStageCode,
  getStageLabel,
  getStageNumber,
  getAllStageCodes,
  STAGE_MESSAGES,
  STAGE_LABELS
} from './stage-messages.js';

export type {
  StageCode,
  StageMessageMap
} from './stage-messages.js';

export {
  // Key schemas for runtime validation
  SessionStartResponseSchema,
  SessionInternalStateSchema,
  ForgeJobResponseSchema,
  BridgeCommandRequestSchema,
  StageExecutionSchema,
  JobProgressSchema,
  
  // Device authentication schemas (Phase 1.5)
  DeviceProofRequestSchema,
  DeviceProofResponseSchema,
  DeviceProofPayloadSchema,
  
  // JWT authentication schemas (Phase 2)
  AuthTokenResponseSchema,
  AuthClaimsSchema,
  
  // Presence schemas (Phase 14)
  PresenceIntentResponseSchema,
  PresenceStatusResponseSchema
} from './schemas.js';

// Video artifact types for favorites and usage tracking
export type {
  UserFavorite,
  FirestoreVideoDocument,
  VideoWorkflowGuideContent,
  KnowledgeBaseContent,
  StageVMetadata,
  OutputLanguage
} from './video-artifacts.js';

export {
  UserFavoriteSchema,
  FirestoreVideoDocumentSchema,
  VideoWorkflowGuideContentSchema,
  KnowledgeBaseContentSchema,
  StageVMetadataSchema,
  OutputLanguageSchema,
  LANGUAGE_DISPLAY_NAMES,
  RTL_LANGUAGES,
  getTextDirection,
  getEffectiveLanguage,
  getLanguageBaseTag
} from './video-artifacts.js';

export {
  TranslationStatusSchema,
  TranslationEntrySchema,
  SessionTranslationsSchema,
  FreshnessStatusSchema,
  getCanonicalContent,
  getResolvedContent
} from './session-translations.js';

export type {
  TranslationStatus,
  TranslationEntry,
  SessionTranslations,
  SessionContentDoc,
  FreshnessStatus,
  ResolvedContentResult
} from './session-translations.js';

// Project types for domain grouping
export type {
  Project,
  ProjectWithId,
  ProjectWithStats,
  ProjectVisibility,
  CreateProject,
  UpdateProject,
  SessionProjectField,
  UpdateSessionProject,
  ListProjectsResponse,
  GetProjectResponse,
  // MCP types (Phase 2.5)
  ProjectSessionSummary,
  ProjectSessionWithContent,
  MCPProjectResponse,
  KnowledgeMatch,
  // Context-first API types (Phase 3)
  ContextKind,
  SessionType,
  ContextBase,
  SessionContext,
  ProjectContext,
  Context,
  ContextSearchResult,
  ContextListOutput
} from './project.js';

export type { EditHistorySource, EditHistoryVersion } from './edit-history.js';
export { EDIT_HISTORY_CAP } from './edit-history.js';

// Plan Mode types
export type {
  PlanPhase,
  PlanStatus,
  PlanGoal,
  PlanAssetType,
  PlanAsset,
  PlanStep,
  PlanWorkstream,
  PlanBlueprint,
  ProducedArtifactType,
  ProducedArtifactStatus,
  PlanProducedArtifact,
  PlanAgentabilityResult,
  PlanDocument,
  CreatePlan,
  UpdatePlan,
  PlanSummary,
  ListPlansResponse,
} from './plan.js';

export {
  PlanPhaseSchema,
  PlanStatusSchema,
  PlanGoalSchema,
  PlanAssetTypeSchema,
  PlanAssetSchema,
  PlanStepSchema,
  PlanWorkstreamSchema,
  PlanBlueprintSchema,
  ProducedArtifactTypeSchema,
  ProducedArtifactStatusSchema,
  PlanProducedArtifactSchema,
  PlanAgentabilityResultSchema,
  PlanDocumentSchema,
  CreatePlanSchema,
  UpdatePlanSchema,
  PlanSummarySchema,
  ListPlansResponseSchema,
} from './plan.js';

export {
  ProjectSchema,
  ProjectWithIdSchema,
  ProjectWithStatsSchema,
  ProjectVisibilitySchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  SessionProjectFieldSchema,
  UpdateSessionProjectSchema,
  ListProjectsResponseSchema,
  GetProjectResponseSchema,
  // MCP schemas (Phase 2.5)
  ProjectSessionSummarySchema,
  ProjectSessionWithContentSchema,
  MCPProjectResponseSchema,
  KnowledgeMatchSchema,
  // Context-first API schemas (Phase 3)
  ContextKindSchema,
  SessionTypeSchema,
  ContextBaseSchema,
  SessionContextSchema,
  ProjectContextSchema,
  ContextSchema,
  ContextSearchResultSchema,
  ContextListOutputSchema
} from './project.js';

// Uploaded artifact types
export type {
  UploadedArtifact,
  CreateUploadedArtifact,
  UpdateUploadedArtifact,
  ReplaceUploadedArtifact,
  ArtifactCategory,
} from './uploaded-artifact.js';

export {
  UploadedArtifactSchema,
  CreateUploadedArtifactSchema,
  CreateUploadedArtifactFileSchema,
  CreateUploadedArtifactLinkSchema,
  UpdateUploadedArtifactSchema,
  ReplaceUploadedArtifactSchema,
  ACCEPTED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_SIGNED_URL_EXPIRY_MINUTES,
  DOWNLOAD_SIGNED_URL_EXPIRY_MINUTES,
  UPLOADED_ARTIFACTS_BUCKET,
  getUploadedArtifactsBucket,
  INLINE_UPLOAD_CONTENT_TYPES,
  ARTIFACT_CATEGORIES,
  ARTIFACT_CATEGORY_LABELS,
  ARTIFACT_CATEGORY_DESCRIPTIONS,
  SHAREPOINT_LINK_CONTENT_TYPE,
  GENERATED_ARTIFACT_NAMES,
  isInlineUploadContentType,
  isSharePointLink,
  buildUploadStoragePath,
  sanitizeFilename,
} from './uploaded-artifact.js';

export type {
  GeneratedArtifactName,
} from './uploaded-artifact.js';
