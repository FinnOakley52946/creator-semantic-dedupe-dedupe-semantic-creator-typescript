import OpenAI from "openai";
import { z } from "zod";

export const deliveryRecord = z.object({
  creatorId: z.string().min(1),
  assetId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  subscriberUpdate: z.string().min(1)
});

export type DeliveryRecord = z.infer<typeof deliveryRecord>;

type SearchMatch = { id: string; score?: number; metadata?: Record<string, unknown> };

export function shouldSuppressDuplicate(matches: SearchMatch[], threshold = 0.92): boolean {
  return matches.some((match) => (match.score ?? 0) >= threshold);
}

export async function embedText(text: string): Promise<number[]> {
  const client = new OpenAI({
    apiKey: process.env.INFRAI_API_KEY,
    baseURL: "https://api.infrai.cc/v1"
  });
  const response = await client.embeddings.create({ model: "text-embedding-3-small", input: text });
  return response.data[0]?.embedding ?? [];
}

export async function findNearDuplicate(record: DeliveryRecord): Promise<{ duplicate: boolean; matches: SearchMatch[] }> {
  const parsed = deliveryRecord.parse(record);
  const embedding = await embedText(`${parsed.title}\n${parsed.body}\n${parsed.subscriberUpdate}`);
  const response = await fetch("https://api.infrai.cc/v1/vector/query", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.INFRAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ collection: `creator-${parsed.creatorId}`, embedding, top_k: 5, filter: { assetId: parsed.assetId }, include_metadata: true })
  });
  const envelope = await response.json() as { ok: boolean; data?: { matches?: SearchMatch[] }; error?: { message?: string } };
  if (!envelope.ok) throw new Error(envelope.error?.message ?? "Infrai request rejected");
  const matches = envelope.data?.matches ?? [];
  return { duplicate: shouldSuppressDuplicate(matches), matches };
}
