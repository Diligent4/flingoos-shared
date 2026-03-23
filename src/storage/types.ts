/**
 * Storage Types
 *
 * Canonical type definitions for organization storage configuration.
 * Used across all services that access GCS (or S3/Azure for BYOB customers).
 */

// ---------------------------------------------------------------------------
// Provider Types
// ---------------------------------------------------------------------------

export type StorageProvider = 'default' | 'gcs' | 'aws_s3' | 'azure_blob';

export interface GcsStorageConfig {
  bucket_name: string;
  project_id?: string;
  /** @deprecated Legacy key-based auth — retained for backward compatibility only. */
  service_account_key?: string;
  /** 'iam' = cross-project IAM (default for new configs), 'service_account_key' = legacy */
  auth_method?: 'iam' | 'service_account_key';
}

export interface AwsS3StorageConfig {
  bucket_name: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
}

export interface AzureBlobStorageConfig {
  container_name: string;
  account_name: string;
  account_key: string;
}

export interface OrgStorageConfig {
  provider: StorageProvider;
  enabled: boolean;
  /** Custom path prefix within the bucket (e.g. "recordings/2026/"). Defaults to "{org_id}/" if empty. */
  path_prefix?: string;
  gcs?: GcsStorageConfig;
  aws_s3?: AwsS3StorageConfig;
  azure_blob?: AzureBlobStorageConfig;
  configured_at?: string;
  configured_by?: string;
}

// ---------------------------------------------------------------------------
// Resolved Storage
// ---------------------------------------------------------------------------

export interface ResolvedStorage {
  provider: 'gcs' | 'aws_s3' | 'azure_blob';
  /** Bucket/container name */
  bucket: string;
  /** Full config from Firestore */
  config: OrgStorageConfig;
}

// ---------------------------------------------------------------------------
// Client Options
// ---------------------------------------------------------------------------

export interface StorageClientOptions {
  /** Email of the platform bucket SA to impersonate */
  bucketSaEmail: string;
}
