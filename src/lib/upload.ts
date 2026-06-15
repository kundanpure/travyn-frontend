import imageCompression from "browser-image-compression";

// ─── Types ───────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadProgress {
  stage: "compressing" | "cropping" | "uploading" | "done" | "error";
  percent: number;
  message: string;
}

// ─── Compression ─────────────────────────────────────────────
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  }
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: options?.maxSizeMB ?? 0.8,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1200,
    useWebWorker: true,
    fileType: file.type as string,
  };

  try {
    const compressed = await imageCompression(file, defaultOptions);
    return compressed;
  } catch {
    // If compression fails, return original
    console.warn("Image compression failed, using original file");
    return file;
  }
}


// ─── Upload via Secure Server Route ──────────────────────────
// Uploads go through /api/upload (Next.js server route) so the
// Supabase service key never touches the browser.
export async function uploadToSupabase(
  bucket: string,
  fileInfo: { name: string; blob: Blob }
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", fileInfo.blob, fileInfo.name);
  formData.append("bucket", bucket);

  // Retrieve auth state from localStorage
  const stored = localStorage.getItem("travyn-auth");
  let token = "";
  if (stored) {
    try {
      token = JSON.parse(stored).state?.accessToken || "";
    } catch (e) {}
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return { url: result.url, path: result.path };
}

// ─── Full Upload Pipeline ────────────────────────────────────
export async function uploadImage(
  file: File,
  bucket: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Step 1: Compress
    onProgress?.({
      stage: "compressing",
      percent: 20,
      message: "Compressing image...",
    });

    const compressed = await compressImage(file);

    // Step 2: Upload
    onProgress?.({
      stage: "uploading",
      percent: 60,
      message: "Uploading to cloud...",
    });

    const result = await uploadToSupabase(
      bucket,
      { name: file.name, blob: compressed }
    );

    onProgress?.({
      stage: "done",
      percent: 100,
      message: "Upload complete!",
    });

    return result;
  } catch (err) {
    onProgress?.({
      stage: "error",
      percent: 0,
      message: err instanceof Error ? err.message : "Upload failed",
    });
    throw err;
  }
}

// ─── Crop Helper ─────────────────────────────────────────────
// Creates a cropped image blob from a source image + crop area
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas crop failed"));
      },
      "image/jpeg",
      0.92
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

// ─── Validation ──────────────────────────────────────────────
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SIZE_MB = 10;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WebP and GIF files are allowed";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File size must be under ${MAX_SIZE_MB}MB`;
  }
  return null;
}
