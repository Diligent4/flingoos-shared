import { z } from 'zod';

export const PRIORITY_CREDENTIAL_FIELDS = [
  'pat_token',
  'oauth_token_url',
  'oauth_client_id',
  'oauth_client_secret',
  'oauth_scope',
  'username',
  'password',
] as const;

export const PRIORITY_SENSITIVE_FIELDS = [
  ...PRIORITY_CREDENTIAL_FIELDS,
  'app_id',
  'app_key',
] as const;

export const PriorityCredentialsSchema = z
  .object({
    pat_token: z.string().optional(),
    oauth_token_url: z.string().optional(),
    oauth_client_id: z.string().optional(),
    oauth_client_secret: z.string().optional(),
    oauth_scope: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .default({});

export const PriorityConfigSchema = z.object({
  deployment_type: z.enum(['cloud', 'on_premise', 'not_sure']),
  base_url: z.string().min(1),
  version: z.string().optional(),
  auth_method: z.enum(['pat', 'oauth2', 'basic', 'not_sure']),
  credentials: PriorityCredentialsSchema,
  app_id: z.string().optional(),
  app_key: z.string().optional(),
  company_code: z.string().optional(),
  language: z.string().optional(),
  network_access: z.enum(['internet', 'vpn', 'not_sure']),
  configured_by: z.string().optional(),
  configured_at: z.unknown().optional(),
  updated_at: z.unknown().optional(),
  credentials_in_sm: z.boolean().optional(),
  enabled_tools: z.array(z.string()).optional(),
});

export type PriorityConfig = z.infer<typeof PriorityConfigSchema>;
