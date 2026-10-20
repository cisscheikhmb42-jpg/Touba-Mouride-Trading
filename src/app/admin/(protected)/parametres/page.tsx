import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, Panel, TextArea } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveSettings, setSettingsMedia } from "../../actions";

export const metadata: Metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data: s, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !s) return <p className="text-danger">Paramètres introuvables : {error?.message}</p>;
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-extrabold">Paramètres de la boutique</h1>

      <Panel title="Logo et visuels" description="Le logo est affiché sans déformation. Utilisez de préférence le sac turquoise seul, en PNG à fond transparent.">
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaField label="Logo (symbole)" kind="image" folder="brand" currentUrl={s.logo_url} onSaved={setSettingsMedia.bind(null, "logo_url")} keepFormat maxSide={512} />
          <MediaField label="Image principale de l'accueil" kind="image" folder="brand" currentUrl={s.hero_image_url} onSaved={setSettingsMedia.bind(null, "hero_image_url")} />
          <MediaField label="Vidéo de présentation (MP4, 50 Mo max)" kind="video" folder="brand" currentUrl={s.hero_video_url} onSaved={setSettingsMedia.bind(null, "hero_video_url")} />
        </div>
      </Panel>

      <ActionForm action={saveSettings} submitLabel="Enregistrer les paramètres" className="space-y-6">
        <Panel title="Coordonnées">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom commercial" name="business_name" defaultValue={s.business_name} required />
            <Field label="E-mail" name="email" type="email" defaultValue={s.email} />
            <Field label="Téléphone (affiché)" name="phone_display" defaultValue={s.phone_display} />
            <Field label="Téléphone (international)" name="phone_international" defaultValue={s.phone_international} help="Ex. +221770941231" />
            <Field label="Numéro WhatsApp" name="whatsapp_number" defaultValue={s.whatsapp_number} required help="Chiffres uniquement, avec l'indicatif : 221770941231" />
            <TextArea label="Localisations (une par ligne)" name="locations" defaultValue={(s.locations ?? []).join("\n")} rows={3} />
            <TextArea label="Horaires (français)" name="opening_hours_fr" defaultValue={s.opening_hours_fr} rows={3} help="Laisser vide tant qu'ils ne sont pas confirmés." />
            <TextArea label="Horaires (wolof)" name="opening_hours_wo" defaultValue={s.opening_hours_wo} rows={3} />
          </div>
        </Panel>
        <Panel title="Réseaux sociaux" description="Laissez vide pour masquer un réseau.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram" name="instagram_url" type="url" defaultValue={s.instagram_url} />
            <Field label="TikTok" name="tiktok_url" type="url" defaultValue={s.tiktok_url} />
            <Field label="Facebook" name="facebook_url" type="url" defaultValue={s.facebook_url} />
            <Field label="YouTube" name="youtube_url" type="url" defaultValue={s.youtube_url} />
          </div>
        </Panel>
        <Panel title="Bandeau défilant" description="Un message par ligne. N'annoncez que des informations confirmées.">
          <div className="space-y-4">
            <Checkbox label="Afficher le bandeau" name="announcement_enabled" defaultChecked={s.announcement_enabled} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea label="Messages (français)" name="announcement_fr" defaultValue={(s.announcement_fr ?? []).join("\n")} rows={4} />
              <TextArea label="Messages (wolof)" name="announcement_wo" defaultValue={(s.announcement_wo ?? []).join("\n")} rows={4} />
            </div>
          </div>
        </Panel>
        <Panel title="Référencement (SEO)" description="Description par défaut du site dans les résultats de recherche (≈ 150 caractères).">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextArea label="Meta description (français)" name="seo_description_fr" defaultValue={s.seo_description_fr} rows={3} />
            <TextArea label="Meta description (wolof)" name="seo_description_wo" defaultValue={s.seo_description_wo} rows={3} />
          </div>
        </Panel>
      </ActionForm>
    </div>
  );
}
