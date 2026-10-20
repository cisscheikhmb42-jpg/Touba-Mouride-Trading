"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { addProductImage } from "@/app/admin/actions";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, optimizeImage, randomName, uploadToStorage } from "./upload";

/** Ajout de plusieurs photos à un produit (optimisées puis envoyées dans Storage). */
export function ProductImageUploader({ productId, defaultAlt }: { productId: string; defaultAlt: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ ok: boolean; text: string }[]>([]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const results: { ok: boolean; text: string }[] = [];
    for (const file of Array.from(files)) {
      try {
        if (!IMAGE_TYPES.includes(file.type)) throw new Error("format non accepté (JPEG, PNG, WebP, AVIF)");
        if (file.size > 20 * 1024 * 1024) throw new Error("fichier trop volumineux (20 Mo max avant optimisation)");
        const { blob, width, height } = await optimizeImage(file);
        if (blob.size > MAX_IMAGE_BYTES) throw new Error("image trop lourde même après optimisation");
        const path = `products/${productId}/${randomName("webp")}`;
        const url = await uploadToStorage("media", path, blob, "image/webp");
        const res = await addProductImage({ productId, imageUrl: url, storagePath: path, width, height, altFr: defaultAlt });
        if (!res?.ok) throw new Error(res?.message ?? "enregistrement impossible");
        results.push({ ok: true, text: `${file.name} : ajoutée` });
      } catch (e) {
        results.push({ ok: false, text: `${file.name} : ${(e as Error).message}` });
      }
    }
    setMessages(results);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-8 text-center transition hover:border-brand-600">
        {busy ? <Loader2 className="size-6 animate-spin text-brand-700" aria-hidden="true" /> : <Upload className="size-6 text-brand-700" aria-hidden="true" />}
        <span className="font-semibold">{busy ? "Envoi en cours…" : "Ajouter des photos"}</span>
        <span className="text-xs text-muted">JPEG, PNG, WebP ou AVIF — redimensionnées à 1600 px et converties en WebP</span>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          multiple
          disabled={busy}
          onChange={(e) => onFiles(e.target.files)}
          className="sr-only"
        />
      </label>
      {messages.length > 0 && (
        <ul role="status" className="mt-3 space-y-1 text-sm">
          {messages.map((m, i) => (
            <li key={i} className={m.ok ? "text-success" : "text-danger"}>
              {m.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
