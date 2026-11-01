-- Zone International : la boutique livre aussi hors du Sénégal.
-- Frais NULL = « à confirmer sur WhatsApp » : aucun tarif inventé.
-- N'ajoute la zone que si elle n'existe pas déjà (aucune donnée modifiée).
insert into public.delivery_zones (name, name_wo, description, description_wo, fee, is_pickup, is_active, sort_order)
select 'International', 'Bitim-réew',
  'Livraison hors du Sénégal. Indiquez votre pays et votre ville : frais et délai confirmés sur WhatsApp.',
  'Yóbbu ci bitim-réew. Bindal sa réew ak sa dëkk : njëgu yóbbu bi ak diir bi dinañu ko wax ci WhatsApp.',
  null, false, true, 40
where not exists (select 1 from public.delivery_zones where lower(name) = 'international');
