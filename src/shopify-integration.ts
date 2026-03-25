import { z } from 'zod';

export const SHOPIFY_CREDENTIAL_FIELDS = ['access_token'] as const;

export const SHOPIFY_SENSITIVE_FIELDS = [...SHOPIFY_CREDENTIAL_FIELDS] as const;

export const ShopifyCredentialsSchema = z
  .object({
    access_token: z.string().optional(),
  })
  .default({});

export const ShopifyConfigSchema = z.object({
  shop: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, 'Shop must be a valid Shopify store slug (alphanumeric and hyphens, cannot end with a hyphen)'),
  api_version: z.string().default('2025-01'),
  credentials: ShopifyCredentialsSchema,
  configured_by: z.string().optional(),
  configured_at: z.unknown().optional(),
  updated_at: z.unknown().optional(),
  credentials_in_sm: z.boolean().optional(),
  enabled_tools: z.array(z.string()).optional(),
});

export type ShopifyConfig = z.infer<typeof ShopifyConfigSchema>;
