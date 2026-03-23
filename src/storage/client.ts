/**
 * Storage Client Factory
 *
 * Creates GCS clients using SA impersonation. The platform bucket SA
 * (flingoos-bucket-sa) is impersonated by each service's runtime SA,
 * producing short-lived tokens with no distributed keys.
 *
 * Uses google-auth-library's Impersonated class which supports both data
 * operations and signed URL generation (via IAM signBlob).
 *
 * IMPORTANT: Consumers must ensure google-auth-library is deduplicated
 * (single version) so Impersonated passes instanceof AuthClient checks.
 * Add an npm override if @google-cloud/storage bundles a different version.
 */

import { Storage } from '@google-cloud/storage';
import { GoogleAuth, Impersonated } from 'google-auth-library';
import type { StorageClientOptions } from './types.js';

let _impersonatedClient: Storage | null = null;
let _impersonatedClientPromise: Promise<Storage> | null = null;

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
): Promise<Storage> {
  if (_impersonatedClient) return _impersonatedClient;
  if (_impersonatedClientPromise) return _impersonatedClientPromise;

  _impersonatedClientPromise = (async () => {
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

    _impersonatedClient = new Storage({ authClient: impersonated as any });
    _impersonatedClientPromise = null;
    return _impersonatedClient!;
  })();

  return _impersonatedClientPromise;
}

/**
 * Get a GCS Storage client from a service account key JSON string.
 * @deprecated Legacy path for orgs that haven't migrated to IAM impersonation.
 */
export function getLegacyStorageClient(
  serviceAccountKeyJson: string,
  projectId?: string,
): Storage {
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
