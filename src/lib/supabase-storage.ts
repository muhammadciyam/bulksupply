import { createClient } from "@supabase/supabase-js";

// Server-only client using the secret key — full access, bypasses RLS.
// Never import this from client components.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export const PUBLIC_BUCKET = "public-uploads";
export const PAYMENT_SLIP_BUCKET = "payment-slips";

export async function uploadToBucket(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export function getPublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function removeFromBucket(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

export async function downloadFromBucket(bucket: string, path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Download failed: ${error?.message ?? "not found"}`);
  return Buffer.from(await data.arrayBuffer());
}

// Extracts the storage path from a public URL previously returned by getPublicUrl,
// so callers can remove the old file when replacing an image.
export function publicUrlToPath(bucket: string, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
