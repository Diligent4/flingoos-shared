/**
 * Storage Client Factory
 *
 * Creates GCS clients using SA impersonation. The platform bucket SA
 * (flingoos-bucket-sa) is impersonated by each service's runtime SA,
 * producing short-lived tokens with no distributed keys.
 *
 * Dependencies (@google-cloud/storage, google-auth-library) are loaded
 * dynamically so non-storage consumers of @flingoos/shared don't pull them in.
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
 * The client is cached as a singleton — safe to call repeatedly.
 */
export async function getImpersonatedStorageClient(
  options: StorageClientOptions,
): Promise<any> {
  if (_impersonatedClient) return _impersonatedClient;

  // Deduplicate concurrent init calls
  if (_impersonatedClientPromise) return _impersonatedClientPromise;

  _impersonatedClientPromise = (async () => {
    const { GoogleAuth, Impersonated } = await import('google-auth-library');
    const { Storage } = await import('@google-cloud/storage');

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

    // Impersonated implements the auth interface at runtime but the TS types
    // don't extend AuthClient — cast is safe per google-auth-library docs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _impersonatedClient = new Storage({ authClient: impersonated as any });
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
