"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Redimensionne une image (côté max 1600 px) et la convertit en WebP
 * avant l'envoi : fichiers plus légers, chargement plus rapide.
 */
export async function optimizeImage(file: File, maxSide = 1600): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Conversion impossible");
  return { blob, width, height };
}

export async function uploadToStorage(bucket: "media" | "videos", path: string, body: Blob, contentType: string) {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function randomName(ext: string) {
  return `${crypto.randomUUID()}.${ext}`;
}
