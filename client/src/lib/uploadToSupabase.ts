/**
 * Unified media upload utility.
 *
 * Uploads are sent to the server-side media endpoint. The browser must never
 * receive a Supabase service-role key; the server validates the request and
 * forwards the file to Supabase Storage.
 */

const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const UPLOAD_ENDPOINT = API_BASE ? `${API_BASE}/images/upload` : "/api/images/upload";

function getAdminHeaders(): Record<string, string> {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadToSupabase(
  file: File,
  _folder: string = "uploads",
  _customName?: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!file || file.size === 0) throw new Error("Choose a file before uploading");

  const form = new FormData();
  form.append("file", file, file.name);
  onProgress?.(10);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    headers: getAdminHeaders(),
    body: form,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error || `Upload failed with status ${response.status}`);
  }

  onProgress?.(100);
  return String(payload.domain_url || payload.secure_url);
}

/**
 * Kept for backwards compatibility with existing admin components. Bucket
 * provisioning is now handled by the server-side upload service.
 */
export async function ensureMediaBucket(): Promise<void> {
  return undefined;
}
