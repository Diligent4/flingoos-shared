/**
 * Org Storage Resolver
 *
 * Resolves per-org storage configuration from Firestore.
 * Returns null for orgs using default (Diligent4) storage,
 * or a ResolvedStorage with the BYOB bucket details.
 *
 * The Firestore client is injected to avoid depending on firebase-admin.
 */

import type { OrgStorageConfig, ResolvedStorage } from './types.js';

/** Minimal Firestore-like interface — avoids importing firebase-admin. */
export interface FirestoreLike {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<{ data(): Record<string, any> | undefined }>;
    };
  };
}

/**
 * Read the org's storage settings from Firestore and return the resolved config.
 * Returns null if the org uses default (Diligent4) storage.
 */
export async function resolveOrgStorage(
  db: FirestoreLike,
  orgId: string,
): Promise<ResolvedStorage | null> {
  const orgDoc = await db.collection('organizations').doc(orgId).get();
  const storage: OrgStorageConfig | undefined = orgDoc.data()?.settings?.storage;

  if (!storage?.enabled || storage.provider === 'default') {
    return null;
  }

  let bucket = '';
  if (storage.provider === 'gcs' && storage.gcs) {
    bucket = storage.gcs.bucket_name;
  } else if (storage.provider === 'aws_s3' && storage.aws_s3) {
    bucket = storage.aws_s3.bucket_name;
  } else if (storage.provider === 'azure_blob' && storage.azure_blob) {
    bucket = storage.azure_blob.container_name;
  }

  if (!bucket) return null;

  return { provider: storage.provider, bucket, config: storage };
}

/**
 * Build the canonical video URL for a recording based on the storage provider.
 */
export function buildVideoUrl(
  resolved: ResolvedStorage | null,
  orgId: string,
  sessionId: string,
  extension: string,
  defaultBucket?: string,
): string {
  if (!resolved) {
    const bucket = defaultBucket
      ?? process.env.GCP_RECORDINGS_BUCKET_NAME
      ?? 'flingoos-session-recordings';
    return `gs://${bucket}/${orgId}/${sessionId}.${extension}`;
  }

  const prefix = resolved.config.path_prefix?.replace(/\/+$/, '');
  const blobPath = prefix
    ? `${prefix}/${sessionId}.${extension}`
    : `${orgId}/${sessionId}.${extension}`;

  switch (resolved.provider) {
    case 'gcs':
      return `gs://${resolved.bucket}/${blobPath}`;
    case 'aws_s3':
      return `s3://${resolved.bucket}/${blobPath}`;
    case 'azure_blob': {
      const account = resolved.config.azure_blob?.account_name ?? '';
      return `az://${account}/${resolved.bucket}/${blobPath}`;
    }
    default:
      return `gs://${resolved.bucket}/${blobPath}`;
  }
}

/**
 * Read the platform bucket SA email from environment.
 * All services must set FLINGOOS_BUCKET_SA_EMAIL.
 */
export function getBucketSaEmail(): string {
  const email = process.env.FLINGOOS_BUCKET_SA_EMAIL;
  if (!email) {
    throw new Error('FLINGOOS_BUCKET_SA_EMAIL environment variable is required');
  }
  return email;
}
