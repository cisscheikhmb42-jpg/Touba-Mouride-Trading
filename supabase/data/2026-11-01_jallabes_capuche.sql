-- Premiers produits fournis par la boutique (photos dans public/produits).
-- Prix communiqués par la boutique : Jezner 70 000 FCFA, simple 30 000 FCFA.
-- Idempotent : n'ajoute un produit que si son slug n'existe pas encore.
-- À exécuter APRÈS la migration 20261101000009_subcategories.sql.
with items(slug, name, category_slug, price, description, images) as (
  values
    ('jallabe-avec-capuche-jezner-vert-olive', 'Jallabe avec capuche Jezner — Vert olive', 'jallabe-avec-capuche-jezner', 70000,
      'Jallabe avec capuche en tissu Jezner, couleur vert olive.',
      array['/produits/jallabe-capuche-jezner-vert-olive.webp']),
    ('jallabe-avec-capuche-jezner-bleu-indigo', 'Jallabe avec capuche Jezner — Bleu indigo', 'jallabe-avec-capuche-jezner', 70000,
      'Jallabe avec capuche en tissu Jezner, couleur bleu indigo.',
      array['/produits/jallabe-capuche-jezner-bleu-indigo.webp']),
    ('jallabe-avec-capuche-jezner-bleu-ciel', 'Jallabe avec capuche Jezner — Bleu ciel', 'jallabe-avec-capuche-jezner', 70000,
      'Jallabe avec capuche en tissu Jezner, couleur bleu ciel.',
      array['/produits/jallabe-capuche-jezner-bleu-ciel-1.webp', '/produits/jallabe-capuche-jezner-bleu-ciel-2.webp']),
    ('jallabe-avec-capuche-vert', 'Jallabe avec capuche — Vert', 'jallabe-avec-capuche-simple', 30000,
      'Jallabe avec capuche, couleur verte.',
      array['/produits/jallabe-capuche-vert.webp'])
),
inserted as (
  insert into public.products (category_id, name_fr, name_wo, slug, description_fr, price, is_available, is_published, track_inventory)
  select c.id, i.name, i.name, i.slug, i.description, i.price, true, true, false
  from items i
  join public.categories c on c.slug = i.category_slug
  where not exists (select 1 from public.products p where p.slug = i.slug)
  returning id, slug, name_fr
)
insert into public.product_images (product_id, image_url, alt_text_fr, position)
select ins.id, img.url, ins.name_fr, img.pos - 1
from inserted ins
join items i on i.slug = ins.slug
cross join lateral unnest(i.images) with ordinality as img(url, pos);
