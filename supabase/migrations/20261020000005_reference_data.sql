-- =====================================================================
-- Données de référence confirmées par le propriétaire
-- ---------------------------------------------------------------------
-- Aucune donnée inventée : pas de prix, pas de frais de livraison,
-- pas d'horaires, pas d'adresse exacte. Les zones sont créées avec
-- des frais NULL (= « à confirmer sur WhatsApp »).
-- Les textes wolof sont à faire relire par un locuteur natif.
-- =====================================================================

insert into public.store_settings (
  id, business_name, phone_display, phone_international, whatsapp_number, email,
  locations, instagram_url, tiktok_url, announcement_enabled, announcement_fr, announcement_wo
) values (
  1,
  'TOUBA MOURIDE TRADING',
  '77 094 12 31',
  '+221770941231',
  '221770941231',
  'pbsking98@gmail.com',
  array['Liberté 5, Dakar', 'Keur Massar'],
  'https://www.instagram.com/touba__mouride__trading',
  'https://www.tiktok.com/@touba_mouride_trading',
  true,
  array[
    'Bienvenue chez TOUBA MOURIDE TRADING',
    'Découvrez notre collection d''accessoires mourides',
    'Retrouvez nos produits et contactez-nous sur WhatsApp'
  ],
  array[
    'Dalal ak jàmm ci TOUBA MOURIDE TRADING',
    'Xoolal sunu jumtukaay yu mouride yi',
    'Xoolal sunu produit yi te jokkoo ak nun ci WhatsApp'
  ]
)
on conflict (id) do nothing;

-- Les noms sont ceux fournis par le propriétaire, identiques en wolof.
insert into public.categories (name_fr, name_wo, slug, description_fr, description_wo, sort_order)
values
  ('Jallabe avec capuche', 'Jallabe avec capuche', 'jallabe-avec-capuche',
    'Découvrez notre sélection de jallabes avec capuche.',
    'Xoolal sunu jallabe yu am capuche yi.', 10),
  ('Jallabe sans capuche', 'Jallabe sans capuche', 'jallabe-sans-capuche',
    'Découvrez notre sélection de jallabes sans capuche.',
    'Xoolal sunu jallabe yu amul capuche yi.', 20),
  ('Sérigne Souhaïbou', 'Sérigne Souhaïbou', 'serigne-souhaibou',
    'Découvrez les articles de la catégorie Sérigne Souhaïbou.',
    'Xoolal li nekk ci Sérigne Souhaïbou.', 30),
  ('Baye Lahad', 'Baye Lahad', 'baye-lahad',
    'Découvrez les articles de la catégorie Baye Lahad.',
    'Xoolal li nekk ci Baye Lahad.', 40),
  ('Chaussures orthopédiques', 'Chaussures orthopédiques', 'chaussures-orthopediques',
    'Découvrez notre sélection de chaussures orthopédiques.',
    'Xoolal sunu dàll yu orthopédique yi.', 50),
  ('Marakiss double talon', 'Marakiss double talon', 'marakiss-double-talon',
    'Découvrez notre sélection de marakiss double talon.',
    'Xoolal sunu marakiss double talon yi.', 60),
  ('Parfums', 'Parfums', 'parfums',
    'Découvrez notre sélection de parfums.',
    'Xoolal sunu parfum yi.', 70),
  ('Xassaïdes', 'Xassaïdes', 'xassaides',
    'Découvrez notre sélection de Xassaïdes.',
    'Xoolal sunu Xassaïdes yi.', 80),
  ('Deer', 'Deer', 'deer',
    'Découvrez les articles de la catégorie Deer.',
    'Xoolal li nekk ci Deer.', 90),
  ('Chapelets', 'Chapelets', 'chapelets',
    'Découvrez notre sélection de chapelets.',
    'Xoolal sunu kurus yi.', 100)
on conflict (slug) do nothing;

insert into public.delivery_zones (name, name_wo, description, description_wo, fee, is_pickup, is_active, sort_order)
values
  ('Dakar', 'Dakar',
    'Livraison dans la région de Dakar. Frais à confirmer sur WhatsApp.',
    'Yóbbu ci diiwaanu Dakar. Njëgu yóbbu bi dinañu ko leen wax ci WhatsApp.',
    null, false, true, 10),
  ('Autres régions du Sénégal', 'Yeneen diiwaan yi ci Senegaal',
    'Livraison hors de Dakar. Frais et délai à confirmer sur WhatsApp.',
    'Yóbbu ci biti Dakar. Njëg ak diir dinañu ko leen wax ci WhatsApp.',
    null, false, true, 20),
  ('Retrait', 'Jëli ko',
    'Option de retrait à confirmer par la boutique.',
    'Jëli ko sa bopp : butig bi dina ko dëggal.',
    null, true, false, 30);
