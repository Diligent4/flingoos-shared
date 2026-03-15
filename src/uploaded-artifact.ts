/**
 * Uploaded Artifact Types
 *
 * Schema definitions for user-uploaded artifacts stored in sessions.
 * These are session-scoped files (PDFs, docs, templates) uploaded by users,
 * stored in GCS with metadata in Firestore alongside generated artifacts.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Artifact Categories
// ---------------------------------------------------------------------------

/**
 * Categories for uploaded artifacts — helps users and AI agents
 * understand the purpose of each file at a glance.
 */
export const ARTIFACT_CATEGORIES = [
  'template',      // Reusable templates (SOPs, checklists, forms)
  'script',        // Scripts, code snippets, automation files
  'data',          // Data files (spreadsheets, CSVs, exports)
  'reference',     // Reference docs (policies, guidelines, specs)
  'image',         // Screenshots, diagrams, visual aids
  'other',         // Anything that doesn't fit above
] as const;

export type ArtifactCategory = (typeof ARTIFACT_CATEGORIES)[number];

export const ARTIFACT_CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  template: 'Template',
  script: 'Script / Code',
  data: 'Data / Financials',
  reference: 'Reference Doc',
  image: 'Image / Diagram',
  other: 'Other',
};

export const ARTIFACT_CATEGORY_DESCRIPTIONS: Record<ArtifactCategory, string> = {
  template: 'SOPs, invoices, checklists, budget templates',
  script: 'Scripts, macros, automation files',
  data: 'Spreadsheets, financial statements, P&L, reports',
  reference: 'Policies, compliance docs, regulations, specs',
  image: 'Screenshots, charts, diagrams, org charts',
  other: 'Other files',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ACCEPTED_UPLOAD_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-excel',                                                // xls
  'application/vnd.ms-powerpoint',                                           // ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',    // xltx
  'application/vnd.oasis.opendocument.spreadsheet',                          // ods
  'application/vnd.oasis.opendocument.text',                                 // odt
  'text/csv',
  'text/tab-separated-values',                                               // tsv
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/json',
  'text/markdown',
  'application/xml',
  'text/xml',
] as const;

export const SHAREPOINT_LINK_CONTENT_TYPE = 'application/x-sharepoint-link';

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const UPLOAD_SIGNED_URL_EXPIRY_MINUTES = 30;
export const DOWNLOAD_SIGNED_URL_EXPIRY_MINUTES = 15;

if (!process.env.GCP_ARTIFACTS_BUCKET_NAME) {
  throw new Error('GCP_ARTIFACTS_BUCKET_NAME environment variable is required');
}
export const UPLOADED_ARTIFACTS_BUCKET = process.env.GCP_ARTIFACTS_BUCKET_NAME;

// Content types that can be returned inline (text-based)
export const INLINE_UPLOAD_CONTENT_TYPES = [
  'text/plain',
  'text/csv',
  'text/tab-separated-values',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
] as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Full Firestore document shape for an uploaded artifact. */
export const UploadedArtifactSchema = z.object({
  artifact_id: z.string(),
  source: z.literal('uploaded'),
  status: z.enum(['pending', 'ready']).default('pending'),
  category: z.enum(ARTIFACT_CATEGORIES).default('other'),
  name: z.string().max(200),
  description: z.string().max(1000).default(''),

  // File info (actual file lives in GCS, not Firestore)
  storage_path: z.string(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),

  // Optional: external link (e.g. SharePoint)
  source_url: z.string().url().optional(),

  // Ownership
  uploaded_by: z.string(),

  // Timestamps
  created_at: z.string(),
  updated_at: z.string(),
});

export type UploadedArtifact = z.infer<typeof UploadedArtifactSchema>;

/** Zod refinement: reject filenames containing path separators or traversal sequences. */
const safeFilename = z.string().min(1).refine(
  (f) => !f.includes('/') && !f.includes('\\') && !f.startsWith('.'),
  { message: 'Filename must not contain path separators or start with a dot' },
);

/** API input for creating an uploaded artifact via file upload. */
export const CreateUploadedArtifactFileSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(ARTIFACT_CATEGORIES).default('other'),
  description: z.string().max(1000).default(''),
  filename: safeFilename,
  content_type: z.string().refine(
    (ct) => (ACCEPTED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(ct),
    { message: 'Unsupported file type' }
  ),
  file_size: z.number().min(1).max(MAX_UPLOAD_SIZE_BYTES, {
    message: `File size must not exceed ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`,
  }),
});

/** API input for creating an uploaded artifact via external link (e.g. SharePoint). */
export const CreateUploadedArtifactLinkSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(ARTIFACT_CATEGORIES).default('other'),
  description: z.string().max(1000).default(''),
  source_url: z.string().url(),
});

/** API input for creating an uploaded artifact (file or link). */
export const CreateUploadedArtifactSchema = z.union([
  CreateUploadedArtifactFileSchema,
  CreateUploadedArtifactLinkSchema,
]);

export type CreateUploadedArtifact = z.infer<typeof CreateUploadedArtifactSchema>;

/** API input for updating an uploaded artifact (name/description only). */
export const UpdateUploadedArtifactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(ARTIFACT_CATEGORIES).optional(),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => data.name !== undefined || data.category !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided' }
);

export type UpdateUploadedArtifact = z.infer<typeof UpdateUploadedArtifactSchema>;

/** API input for replacing a file (new upload for existing artifact). */
export const ReplaceUploadedArtifactSchema = z.object({
  filename: safeFilename,
  content_type: z.string().refine(
    (ct) => (ACCEPTED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(ct),
    { message: 'Unsupported file type' }
  ),
  file_size: z.number().min(1).max(MAX_UPLOAD_SIZE_BYTES, {
    message: `File size must not exceed ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`,
  }),
});

export type ReplaceUploadedArtifact = z.infer<typeof ReplaceUploadedArtifactSchema>;

// ---------------------------------------------------------------------------
// Generated Artifact Names (well-known Firestore document IDs)
// ---------------------------------------------------------------------------

/**
 * Well-known artifact document IDs for generated (pipeline-produced) artifacts.
 * These are used as Firestore document IDs in the artifacts subcollection.
 */
export const GENERATED_ARTIFACT_NAMES = {
  SCRIPT_OUTPUT: 'script_output',
  N8N_OUTPUT: 'n8n_output',
  AUTOMATIONS_SCORE: 'automations_score',
} as const;

export type GeneratedArtifactName = (typeof GENERATED_ARTIFACT_NAMES)[keyof typeof GENERATED_ARTIFACT_NAMES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a content type is text-based (can be returned inline). */
export function isInlineUploadContentType(contentType: string): boolean {
  return (INLINE_UPLOAD_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/** Check if an artifact is a SharePoint (or external) link rather than an uploaded file. */
export function isSharePointLink(artifact: { content_type: string; source_url?: string }): boolean {
  return artifact.content_type === SHAREPOINT_LINK_CONTENT_TYPE;
}

/**
 * Sanitize a filename for use in a GCS object key.
 * Strips path separators and traversal sequences to prevent tenant isolation bypass.
 */
export function sanitizeFilename(filename: string): string {
  // Extract basename (strip any directory components)
  const basename = filename.split(/[/\\]/).pop() || 'unnamed';
  // Remove any remaining traversal dots at the start
  const cleaned = basename.replace(/^\.+/, '');
  return cleaned || 'unnamed';
}

/** Build the GCS storage path for an uploaded artifact. */
export function buildUploadStoragePath(
  orgId: string,
  sessionId: string,
  artifactId: string,
  filename: string,
): string {
  return `${orgId}/${sessionId}/${artifactId}/${sanitizeFilename(filename)}`;
}
