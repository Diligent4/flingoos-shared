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
  data: 'Data',
  reference: 'Reference Doc',
  image: 'Image / Diagram',
  other: 'Other',
};

export const ARTIFACT_CATEGORY_DESCRIPTIONS: Record<ArtifactCategory, string> = {
  template: 'SOPs, checklists, forms, reusable templates',
  script: 'Scripts, code snippets, automation files',
  data: 'Spreadsheets, CSVs, data exports',
  reference: 'Policies, guidelines, specs, manuals',
  image: 'Screenshots, diagrams, visual aids',
  other: 'Other files',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ACCEPTED_UPLOAD_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // xlsx
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/json',
  'text/markdown',
  'application/xml',
  'text/xml',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const UPLOAD_SIGNED_URL_EXPIRY_MINUTES = 30;
export const DOWNLOAD_SIGNED_URL_EXPIRY_MINUTES = 15;

export const UPLOADED_ARTIFACTS_BUCKET = 'flingoos-uploaded-artifacts';

// Content types that can be returned inline (text-based)
export const INLINE_UPLOAD_CONTENT_TYPES = [
  'text/plain',
  'text/csv',
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

  // Ownership
  uploaded_by: z.string(),

  // Timestamps
  created_at: z.string(),
  updated_at: z.string(),
});

export type UploadedArtifact = z.infer<typeof UploadedArtifactSchema>;

/** API input for creating an uploaded artifact (initiating upload). */
export const CreateUploadedArtifactSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(ARTIFACT_CATEGORIES).default('other'),
  description: z.string().max(1000).default(''),
  filename: z.string().min(1),
  content_type: z.string().refine(
    (ct) => (ACCEPTED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(ct),
    { message: 'Unsupported file type' }
  ),
  file_size: z.number().min(1).max(MAX_UPLOAD_SIZE_BYTES, {
    message: `File size must not exceed ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`,
  }),
});

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
  filename: z.string().min(1),
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
// Helpers
// ---------------------------------------------------------------------------

/** Check if a content type is text-based (can be returned inline). */
export function isInlineUploadContentType(contentType: string): boolean {
  return (INLINE_UPLOAD_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/** Build the GCS storage path for an uploaded artifact. */
export function buildUploadStoragePath(
  orgId: string,
  sessionId: string,
  artifactId: string,
  filename: string,
): string {
  return `${orgId}/${sessionId}/${artifactId}/${filename}`;
}
