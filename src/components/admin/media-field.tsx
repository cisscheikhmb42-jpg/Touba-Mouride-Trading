"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import type { ActionState } from "@/lib/admin/form";
import { IMAGE_TYPES, MAX_VIDEO_BYTES, VIDEO_TYPES, optimizeImage, randomName, uploadToStorage } from "./upload";

/**
 * Envoi d'un fichier unique (logo, image de héro, image de catégorie,
 * vidéo) puis enregistrement de son URL via la Server Action `onSaved`.
 */
export function MediaField({
  label,
  kind,
  folder,
  currentUrl,
  onSaved,
  maxSide = 1600,
  keepFormat = false,
}: {
  label: string;
  kind: "image" | "video";
  folder: string;
  currentUrl: string | null;
  onSaved: (url: string | null, storagePath: string | null) => Promise<ActionState>;
  maxSide?: number;
  /** Conserver le PNG d'origine (logo avec transparence). */
  keepFormat?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const types = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!types.includes(file.type)) throw new Error("Format non accepté.");
      let url: string;
      let path: string;
      if (kind === "image") {
        if (keepFormat && file.size <= 5 * 1024 * 1024) {
          const ext = file.type.split("/")[1].replace("jpeg", "jpg");
          path = `${folder}/${randomName(ext)}`;
          url = await uploadToStorage("media", path, file, file.type);
        } else {
          const { blob } = await optimizeImage(file, maxSide);
          path = `${folder}/${randomName("webp")}`;
          url = await uploadToStorage("media", path, blob, "image/webp");
        }
      } else {
        if (file.size > MAX_VIDEO_BYTES)
          throw new Error("Vidéo trop lourde (50 Mo max). Compressez-la ou utilisez un hébergeur vidéo (voir la documentation).");
        path = `${folder}/${randomName(file.type === "video/webm" ? "webm" : "mp4")}`;
        url = await uploadToStorage("videos", path, file, file.type);
      }
      const res = await onSaved(url, path);
      setMessage({ ok: !!res?.ok, text: res?.message ?? "Erreur" });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="field-label">{label}</p>
      {currentUrl &&
        (kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="mb-3 h-28 w-auto rounded-lg border border-line bg-paper object-contain" />
        ) : (
          <video src={currentUrl} controls preload="none" className="mb-3 h-32 rounded-lg bg-ink" />
        ))}
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn btn-outline cursor-pointer">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          {currentUrl ? "Remplacer" : "Envoyer un fichier"}
          <input type="file" accept={types.join(",")} disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="sr-only" />
        </label>
        {currentUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Retirer ce fichier ?")) return;
              const res = await onSaved(null, null);
              setMessage({ ok: !!res?.ok, text: res?.message ?? "" });
              router.refresh();
            }}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Retirer
          </button>
        )}
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-2 text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
