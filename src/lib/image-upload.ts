import { PUBLIC_BUCKET, uploadToBucket, removeFromBucket, getPublicUrl, publicUrlToPath } from "./supabase-storage";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "::1") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

async function persist(subdir: string, id: string, buffer: Buffer, ext: string, contentType: string, currentImageUrl?: string | null): Promise<string> {
  const filePath = `${subdir}/${id}.${ext}`;

  if (currentImageUrl) {
    const oldPath = publicUrlToPath(PUBLIC_BUCKET, currentImageUrl);
    if (oldPath && oldPath !== filePath) {
      await removeFromBucket(PUBLIC_BUCKET, oldPath);
    }
  }

  await uploadToBucket(PUBLIC_BUCKET, filePath, buffer, contentType);
  return getPublicUrl(PUBLIC_BUCKET, filePath);
}

// Saves an uploaded File to Supabase Storage, at <subdir>/<id>.<ext>.
export async function saveImageFile(
  subdir: string,
  id: string,
  file: File,
  currentImageUrl?: string | null
): Promise<string> {
  if (file.size > MAX_SIZE) throw new Error("Image must be 5MB or smaller");
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Only JPG, PNG, or WEBP images are allowed");
  const buffer = Buffer.from(await file.arrayBuffer());
  return persist(subdir, id, buffer, ext, file.type, currentImageUrl);
}

// Downloads an image from a pasted URL server-side and saves it the same way.
export async function saveImageFromUrl(
  subdir: string,
  id: string,
  url: string,
  currentImageUrl?: string | null
): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("That URL is not allowed");
  }

  let res: Response;
  try {
    res = await fetch(parsed.toString(), { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error("Could not download that image");
  }
  if (!res.ok) throw new Error("Could not download that image");

  const contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("The URL must point directly to a JPG, PNG, or WEBP image");

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) throw new Error("Image must be 5MB or smaller");

  return persist(subdir, id, buffer, ext, contentType, currentImageUrl);
}

// Saves an image from either an uploaded file ("imageFile") or, if no file was
// given, a pasted image URL ("imageUrl"). Returns the new public image URL, or
// undefined if neither field was provided.
export async function saveUploadedImage(
  subdir: string,
  id: string,
  formData: FormData,
  currentImageUrl?: string | null
): Promise<string | undefined> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return saveImageFile(subdir, id, file, currentImageUrl);
  }

  const url = String(formData.get("imageUrl") ?? "").trim();
  if (!url) return undefined;

  return saveImageFromUrl(subdir, id, url, currentImageUrl);
}

export async function removeUploadedImage(imageUrl: string): Promise<void> {
  const filePath = publicUrlToPath(PUBLIC_BUCKET, imageUrl);
  if (filePath) await removeFromBucket(PUBLIC_BUCKET, filePath);
}
