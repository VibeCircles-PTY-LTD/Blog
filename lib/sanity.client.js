import { createClient } from "@sanity/client";

export function getClient({ draftMode = false } = {}) {
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN;
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    useCdn: !draftMode,
    perspective: draftMode ? "previewDrafts" : "published",
    token: draftMode ? token : undefined,
  });
}
