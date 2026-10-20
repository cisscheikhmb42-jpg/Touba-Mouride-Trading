-- =====================================================================
-- Supabase Storage
-- ---------------------------------------------------------------------
-- Bucket "media"  : images publiques (dossiers products/, categories/,
--                   brand/, blog/). 5 Mo max, formats image web.
-- Bucket "videos" : vidéos publiques courtes. 50 Mo max par fichier
--                   (limite par fichier du plan gratuit Supabase).
-- Lecture : publique via l'URL publique (pas de listing anonyme).
-- Écriture / suppression : administrateurs uniquement.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('videos', 'videos', true, 52428800,
    array['video/mp4', 'video/webm'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "storage: lecture admin des fichiers de la boutique"
on storage.objects for select to authenticated
using (bucket_id in ('media', 'videos') and (select public.is_admin()));

create policy "storage: envoi admin"
on storage.objects for insert to authenticated
with check (bucket_id in ('media', 'videos') and (select public.is_admin()));

create policy "storage: modification admin"
on storage.objects for update to authenticated
using (bucket_id in ('media', 'videos') and (select public.is_admin()))
with check (bucket_id in ('media', 'videos') and (select public.is_admin()));

create policy "storage: suppression admin"
on storage.objects for delete to authenticated
using (bucket_id in ('media', 'videos') and (select public.is_admin()));
