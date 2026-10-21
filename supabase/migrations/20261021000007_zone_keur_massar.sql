-- Zone Keur Massar (localisation communiquée par la boutique).
-- Frais NULL = « à confirmer sur WhatsApp » : aucun tarif inventé.
-- N'ajoute la zone que si elle n'existe pas déjà (aucune donnée modifiée).
insert into public.delivery_zones (name, name_wo, description, description_wo, fee, is_pickup, is_active, sort_order)
select 'Keur Massar', 'Keur Massar',
  'Livraison à Keur Massar. Frais à confirmer sur WhatsApp.',
  'Yóbbu ci Keur Massar. Njëgu yóbbu bi dinañu ko leen wax ci WhatsApp.',
  null, false, true, 15
where not exists (select 1 from public.delivery_zones where lower(name) = 'keur massar');
