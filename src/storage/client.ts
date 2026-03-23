/**
 * Storage Client Factory
 *
 * Creates GCS clients using SA impersonation. The platform bucket SA
 * (flingoos-bucket-sa) is impersonated by each service's runtime SA,
 * producing short-lived tokens with no distributed keys.
 *
 * Uses google-auth-library's Impersonated class resolved from
 * @google-cloud/storage's own dependency tree, ensuring version compatibility
 * for both data operations and signed URL generation (IAM signBlob).
 */

import type { StorageClientOptions } from './types.js';

// Use `any` for the cached client to avoid top-level import of @google-cloud/storage
let _impersonatedClient: any | null = null;
let _impersonatedClientPromise: Promise<any> | null = null;

/**
 * Get a GCS Storage client authenticated via SA impersonation.
 *
 * The runtime SA (e.g. flingoos-video-forge-sa) impersonates the platform
 * bucket SA, which has objectAdmin on the target buckets.
 *
 * Supports read, write, delete, AND signed URL generation (via IAM signBlob).
 * The client is cached as a singleton — safe to call repeatedly.
 */
export async function getImpersonatedStorageClient(
  options: StorageClientOptions,
): Promise<any> {
  if (_impersonatedClient) return _impersonatedClient;

  // Deduplicate concurrent init calls
  if (_impersonatedClientPromise) return _impersonatedClientPromise;

  _impersonatedClientPromise = (async () => {
    const storageModule = await import('@google-cloud/storage');
    const { Storage } = storageModule;

    // Resolve google-auth-library from Storage's own dependency tree
    // to avoid version mismatch (Impersonated must be instanceof AuthClient
    // from the same package that Storage uses internally).
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const galPath = require.resolve('google-auth-library', {
      paths: [require.resolve('@google-cloud/storage')],
    });
    const { GoogleAuth, Impersonated } = require(galPath);

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const sourceClient = await auth.getClient();

    const impersonated = new Impersonated({
      sourceClient,
      targetPrincipal: options.bucketSaEmail,
      targetScopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
      lifetime: 3600,
    });

    _impersonatedClient = new Storage({ authClient: impersonated });
    _impersonatedClientPromise = null;
    return _impersonatedClient;
  })();

  return _impersonatedClientPromise;
}

/**
 * Get a GCS Storage client from a service account key JSON string.
 * @deprecated Legacy path for orgs that haven't migrated to IAM impersonation.
 */
export async function getLegacyStorageClient(
  serviceAccountKeyJson: string,
  projectId?: string,
): Promise<any> {
  const { Storage } = await import('@google-cloud/storage');

  const credentials = JSON.parse(serviceAccountKeyJson);
  return new Storage({
    credentials,
    projectId: projectId ?? credentials.project_id,
  });
}

/**
 * Reset the cached impersonated client. For testing only.
 */
export function resetStorageClient(): void {
  _impersonatedClient = null;
  _impersonatedClientPromise = null;
}
