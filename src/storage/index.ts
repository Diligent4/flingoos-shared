/**
 * @flingoos/shared/storage
 *
 * Centralized GCS storage access via SA impersonation.
 * Import from '@flingoos/shared/storage' — not re-exported from the main entry point.
 *
 * Peer dependency (optional — only needed by services that import this module):
 *   @google-cloud/storage >= 7.14.0
 */

export type {
  StorageProvider,
  GcsStorageConfig,
  AwsS3StorageConfig,
  AzureBlobStorageConfig,
  OrgStorageConfig,
  ResolvedStorage,
  StorageClientOptions,
} from './types.js';

export {
  getImpersonatedStorageClient,
  getLegacyStorageClient,
  resetStorageClient,
} from './client.js';

export type { FirestoreLike } from './org-resolver.js';

export {
  resolveOrgStorage,
  buildVideoUrl,
  getBucketSaEmail,
} from './org-resolver.js';
