import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
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

async function persist(productId: string, buffer: Buffer, ext: string, currentImageUrl?: string | null): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${productId}.${ext}`;
  const newUrl = `/uploads/products/${fileName}`;

  if (currentImageUrl && currentImageUrl !== newUrl) {
    await unlink(path.join(process.cwd(), "public", currentImageUrl)).catch(() => {});
  }

  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  return newUrl;
}

// Saves a product image from either an uploaded file ("imageFile") or, if no
// file was given, a pasted image URL ("imageUrl") that gets downloaded server-side.
// Returns the new local image URL, or undefined if neither field was provided.
export async function saveProductImage(
  productId: string,
  formData: FormData,
  currentImageUrl?: string | null
): Promise<string | undefined> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_SIZE) throw new Error("Image must be 5MB or smaller");
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) throw new Error("Only JPG, PNG, or WEBP images are allowed");
    const buffer = Buffer.from(await file.arrayBuffer());
    return persist(productId, buffer, ext, currentImageUrl);
  }

  const url = String(formData.get("imageUrl") ?? "").trim();
  if (!url) return undefined;

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

  return persist(productId, buffer, ext, currentImageUrl);
}
