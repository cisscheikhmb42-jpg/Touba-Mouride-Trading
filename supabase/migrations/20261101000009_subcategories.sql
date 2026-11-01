-- Sous-catégories : une catégorie peut appartenir à une catégorie parente.
-- Utilisé pour séparer « Jallabe avec capuche » en deux parties
-- (Jezner et simple) afin que les clients voient clairement les prix.
alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_parent_not_self') then
    alter table public.categories
      add constraint categories_parent_not_self check (parent_id is null or parent_id <> id);
  end if;
end $$;

create index if not exists categories_parent_idx on public.categories (parent_id);

-- Les deux parties demandées par la boutique (ajoutées seulement si absentes).
insert into public.categories (name_fr, name_wo, slug, description_fr, description_wo, parent_id, sort_order)
select 'Jallabe avec capuche Jezner', 'Jallabe avec capuche Jezner', 'jallabe-avec-capuche-jezner',
  'Jallabes avec capuche en tissu Jezner.', 'Jallabe avec capuche ci tissu Jezner.',
  p.id, 1
from public.categories p
where p.slug = 'jallabe-avec-capuche'
  and not exists (select 1 from public.categories where slug = 'jallabe-avec-capuche-jezner');

insert into public.categories (name_fr, name_wo, slug, description_fr, description_wo, parent_id, sort_order)
select 'Jallabe avec capuche simple', 'Jallabe avec capuche simple', 'jallabe-avec-capuche-simple',
  'Jallabes avec capuche, modèle simple.', 'Jallabe avec capuche, modèle simple.',
  p.id, 2
from public.categories p
where p.slug = 'jallabe-avec-capuche'
  and not exists (select 1 from public.categories where slug = 'jallabe-avec-capuche-simple');
