/**
 * Clustering Document Schema
 *
 * Shared types for the organizations/{orgId}/clustering/latest document.
 */
import { z } from 'zod';

export const ClusterEntrySchema = z.object({
  session_ids: z.array(z.string()),
  medoid_session_id: z.string(),
  provisional_name: z.string(),
  llm_label: z.string().nullable(),
  llm_label_generated_at: z.string().nullable(),
});

export type ClusterEntry = z.infer<typeof ClusterEntrySchema>;

export const OrgClusterEntrySchema = z.object({
  session_ids: z.array(z.string()),
  project_ids: z.array(z.string()),
  medoid_id: z.string(),
  medoid_kind: z.enum(['session', 'project']),
  provisional_name: z.string(),
  llm_label: z.string().nullable(),
  llm_label_generated_at: z.string().nullable(),
});

export type OrgClusterEntry = z.infer<typeof OrgClusterEntrySchema>;

export const SidebarClustersSchema = z.object({
  phase: z.enum(['flat', 'topics']),
  clusters: z.record(z.string(), ClusterEntrySchema),
  unclustered_session_ids: z.array(z.string()),
});

export type SidebarClusters = z.infer<typeof SidebarClustersSchema>;

export const OrgClustersSchema = z.object({
  phase: z.enum(['flat', 'topics']),
  clusters: z.record(z.string(), OrgClusterEntrySchema),
  unclustered_session_ids: z.array(z.string()),
  unclustered_project_ids: z.array(z.string()),
});

export type OrgClusters = z.infer<typeof OrgClustersSchema>;

export const ClusteringDocumentSchema = z.object({
  version: z.literal(1),
  org_id: z.string(),
  computed_at: z.string(),
  threshold: z.number(),
  sidebar_clusters: SidebarClustersSchema,
  org_clusters: OrgClustersSchema,
  name_overrides: z.record(z.string(), z.string()),
});

export type ClusteringDocument = z.infer<typeof ClusteringDocumentSchema>;
