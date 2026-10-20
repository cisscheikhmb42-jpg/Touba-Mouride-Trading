-- =====================================================================
-- Tests RLS / commandes / stock — exécutés dans une transaction annulée.
-- Usage : psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_and_orders.sql
-- Chaque assertion lève une exception en cas d'échec.
-- =====================================================================
begin;

-- ---------- Préparation (rôle postgres) ----------
insert into auth.users (id, email, aud, role, instance_id)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'client@test.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
insert into public.admin_users (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.products (id, category_id, name_fr, name_wo, slug, price, stock_quantity, track_inventory, is_published)
select 'aaaaaaaa-0000-0000-0000-000000000001', id, 'Chapelet test', 'Kurus test', 'chapelet-test', 15000, 2, true, true
from public.categories where slug = 'chapelets';
insert into public.products (id, name_fr, name_wo, slug, price, is_published)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'Parfum sans prix', 'Parfum', 'parfum-sans-prix', null, true);
insert into public.products (id, name_fr, name_wo, slug, price, is_published)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'Brouillon', 'Brouillon', 'brouillon', 1000, false);
insert into public.products (id, name_fr, name_wo, slug, price, stock_quantity, track_inventory, is_published)
values ('aaaaaaaa-0000-0000-0000-000000000004', 'Jallabe test', 'Jallabe test', 'jallabe-test', 20000, 0, true, true);
insert into public.product_variants (id, product_id, size, price, stock_quantity)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004', 'M', null, 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 'XL', 22000, 5);
update public.delivery_zones set fee = 2000 where name = 'Dakar';

create temp table t_ctx (key text primary key, value text);
grant all on t_ctx to anon, authenticated;
insert into t_ctx select 'dakar', id::text from public.delivery_zones where name = 'Dakar';
insert into t_ctx select 'regions', id::text from public.delivery_zones where name = 'Autres régions du Sénégal';
insert into t_ctx select 'pickup', id::text from public.delivery_zones where is_pickup;

-- ---------- Visiteur anonyme ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare n int; q jsonb; r jsonb; failed boolean;
begin
  select count(*) into n from public.products where slug = 'brouillon';
  assert n = 0, 'anon ne doit pas voir un produit non publié';

  select count(*) into n from public.delivery_zones where is_pickup;
  assert n = 0, 'anon ne doit pas voir une zone inactive';

  select count(*) into n from public.categories;
  assert n = 10, 'anon doit voir les 10 catégories, vu ' || n;

  -- Devis : prix calculés en base
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":2},
                           {"product_id":"aaaaaaaa-0000-0000-0000-000000000004","variant_id":"bbbbbbbb-0000-0000-0000-000000000002","quantity":1}]',
                         (select value::uuid from t_ctx where key = 'dakar'));
  assert (q ->> 'priced_subtotal')::numeric = 52000, 'sous-total attendu 52000, obtenu ' || (q ->> 'priced_subtotal');
  assert (q ->> 'delivery_fee')::numeric = 2000, 'frais Dakar attendus 2000';
  assert (q ->> 'total')::numeric = 54000, 'total attendu 54000';
  assert (q ->> 'has_issues')::boolean = false, 'aucun problème attendu';

  -- Prix manquant : pas de total
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000002","quantity":1}]',
                         (select value::uuid from t_ctx where key = 'dakar'));
  assert (q ->> 'has_unpriced_items')::boolean, 'article sans prix détecté';
  assert q -> 'subtotal' = 'null'::jsonb and q -> 'total' = 'null'::jsonb, 'pas de total si prix inconnu';

  -- Frais inconnus : pas de total
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":1}]',
                         (select value::uuid from t_ctx where key = 'regions'));
  assert q ->> 'delivery_fee_status' = 'to_confirm', 'frais à confirmer';
  assert q -> 'total' = 'null'::jsonb, 'pas de total si frais inconnus';
  assert (q ->> 'subtotal')::numeric = 15000, 'sous-total connu 15000';

  -- Stock insuffisant / variante obligatoire / produit non publié
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":3}]', null);
  assert q -> 'lines' -> 0 ->> 'issue' = 'insufficient_stock', 'stock insuffisant attendu';
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000004","quantity":1}]', null);
  assert q -> 'lines' -> 0 ->> 'issue' = 'variant_required', 'variante obligatoire attendue';
  q := public.quote_cart('[{"product_id":"aaaaaaaa-0000-0000-0000-000000000003","quantity":1}]', null);
  assert q -> 'lines' -> 0 ->> 'issue' = 'not_found', 'produit non publié refusé';

  -- Création d'une demande de commande
  r := public.create_order(jsonb_build_object(
    'order_number', 'TMT-261020-AB12',
    'customer_name', 'Client Test',
    'customer_phone', '77 123 45 67',
    'delivery_zone_id', (select value from t_ctx where key = 'dakar'),
    'delivery_address', 'Liberté 6',
    'locale', 'fr',
    'whatsapp_message', 'test',
    'expected_priced_subtotal', 52000,
    'expected_delivery_fee', 2000,
    'items', '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":2, "unit_price": 1},
               {"product_id":"aaaaaaaa-0000-0000-0000-000000000004","variant_id":"bbbbbbbb-0000-0000-0000-000000000002","quantity":1}]'::jsonb
  ));
  assert r ->> 'status' = 'awaiting_confirmation', 'statut initial awaiting_confirmation';
  insert into t_ctx values ('order', r ->> 'order_id');

  -- Le prix envoyé par le navigateur est ignoré ; un récapitulatif obsolète est refusé
  failed := false;
  begin
    perform public.create_order(jsonb_build_object(
      'order_number', 'TMT-261020-CD34', 'customer_name', 'Client Test', 'customer_phone', '771234567',
      'delivery_zone_id', (select value from t_ctx where key = 'dakar'), 'delivery_address', 'Liberté 6',
      'expected_priced_subtotal', 1,
      'items', '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":1}]'::jsonb));
  exception when others then
    failed := sqlerrm = 'PRICE_CHANGED';
  end;
  assert failed, 'PRICE_CHANGED attendu';

  -- Stock insuffisant refusé
  failed := false;
  begin
    perform public.create_order(jsonb_build_object(
      'order_number', 'TMT-261020-EF56', 'customer_name', 'Client Test', 'customer_phone', '771234567',
      'delivery_zone_id', (select value from t_ctx where key = 'dakar'), 'delivery_address', 'Liberté 6',
      'items', '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":5}]'::jsonb));
  exception when others then
    failed := sqlerrm = 'CART_INVALID';
  end;
  assert failed, 'CART_INVALID attendu';

  -- Zone inactive refusée
  failed := false;
  begin
    perform public.create_order(jsonb_build_object(
      'order_number', 'TMT-261020-GH78', 'customer_name', 'Client Test', 'customer_phone', '771234567',
      'delivery_zone_id', (select value from t_ctx where key = 'pickup'), 'delivery_address', 'Liberté 6',
      'items', '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":1}]'::jsonb));
  exception when others then
    failed := sqlerrm = 'ZONE_INVALID';
  end;
  assert failed, 'ZONE_INVALID attendu';

  -- Téléphone invalide refusé
  failed := false;
  begin
    perform public.create_order(jsonb_build_object(
      'order_number', 'TMT-261020-IJ90', 'customer_name', 'Client Test', 'customer_phone', 'abc',
      'delivery_zone_id', (select value from t_ctx where key = 'dakar'), 'delivery_address', 'Liberté 6',
      'items', '[{"product_id":"aaaaaaaa-0000-0000-0000-000000000001","quantity":1}]'::jsonb));
  exception when others then
    failed := sqlerrm = 'PHONE_INVALID';
  end;
  assert failed, 'PHONE_INVALID attendu';

  -- Aucune lecture des commandes pour anon
  failed := false;
  begin
    select count(*) into n from public.orders;
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'anon ne doit pas pouvoir lire les commandes';

  -- Aucune écriture directe
  failed := false;
  begin
    insert into public.orders (order_number, customer_name, customer_phone, delivery_zone_name, delivery_address, delivery_fee_status)
    values ('TMT-261020-ZZZZ', 'x', '771234567', 'Dakar', 'x', 'known');
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'anon ne doit pas insérer de commande directement';

  failed := false;
  begin
    update public.products set price = 1 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'anon ne doit pas modifier un prix';

  failed := false;
  begin
    perform public.admin_update_order_status((select value::uuid from t_ctx where key = 'order'), 'confirmed');
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'anon ne doit pas exécuter les fonctions admin';

  raise notice 'OK : tests visiteur anonyme';
end $$;

-- ---------- Utilisateur connecté NON administrateur ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

do $$
declare n int; failed boolean;
begin
  assert not public.is_admin(), 'le client ne doit pas être admin';
  select count(*) into n from public.orders;
  assert n = 0, 'un utilisateur connecté non admin ne voit aucune commande';
  update public.products set price = 1 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'un utilisateur connecté non admin ne modifie pas les prix';
  select count(*) into n from public.products where slug = 'brouillon';
  assert n = 0, 'brouillon invisible pour un non admin';
  failed := false;
  begin
    perform public.admin_update_order_status((select value::uuid from t_ctx where key = 'order'), 'confirmed');
  exception when insufficient_privilege then failed := sqlerrm = 'FORBIDDEN';
  end;
  assert failed, 'FORBIDDEN attendu pour un non admin';
  failed := false;
  begin
    insert into public.admin_users (user_id) values ('22222222-2222-2222-2222-222222222222');
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'impossible de se déclarer admin';
  raise notice 'OK : tests utilisateur connecté non admin';
end $$;

-- ---------- Administrateur ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

do $$
declare n int; s int; o jsonb; failed boolean; v_order uuid := (select value::uuid from t_ctx where key = 'order');
begin
  assert public.is_admin(), 'admin reconnu';
  insert into public.products (name_fr, name_wo, slug, price) values ('Produit admin', 'Produit admin', 'produit-admin', 5000);
  select count(*) into n from public.products where slug = 'produit-admin' and search_text like '%produit admin%';
  assert n = 1, 'insertion admin + index de recherche';
  select count(*) into n from public.orders where id = v_order;
  assert n = 1, 'admin voit la commande';
  select count(*) into n from public.order_items where order_id = v_order;
  assert n = 2, 'deux lignes de commande';
  select unit_price into s from public.order_items where order_id = v_order and product_name = 'Chapelet test';
  assert s = 15000, 'prix instantané = prix base (pas celui du navigateur)';

  -- Ouverture WhatsApp / demande : stock intact
  select stock_quantity into s from public.products where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert s = 2, 'stock intact avant confirmation';

  -- Statut direct interdit (doit passer par la fonction)
  failed := false;
  begin
    update public.orders set status = 'confirmed' where id = v_order;
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'changement de statut direct interdit';

  o := public.admin_update_order_status(v_order, 'confirmed');
  select stock_quantity into s from public.products where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert s = 0, 'stock produit décrémenté à la confirmation, obtenu ' || s;
  select stock_quantity into s from public.product_variants where id = 'bbbbbbbb-0000-0000-0000-000000000002';
  assert s = 4, 'stock variante décrémenté';

  -- Pas de double décrément
  o := public.admin_update_order_status(v_order, 'preparing');
  select stock_quantity into s from public.products where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert s = 0, 'pas de double décrément';

  o := public.admin_update_order_status(v_order, 'cancelled');
  select stock_quantity into s from public.products where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert s = 2, 'stock restitué à l''annulation';
  select stock_quantity into s from public.product_variants where id = 'bbbbbbbb-0000-0000-0000-000000000002';
  assert s = 5, 'stock variante restitué';

  -- Stock jamais négatif
  update public.products set stock_quantity = 1 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  failed := false;
  begin
    o := public.admin_update_order_status(v_order, 'confirmed');
  exception when others then failed := sqlerrm = 'INSUFFICIENT_STOCK';
  end;
  assert failed, 'INSUFFICIENT_STOCK attendu';
  select stock_quantity into s from public.products where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert s = 1, 'stock inchangé après échec';

  failed := false;
  begin
    update public.products set stock_quantity = -1 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  exception when check_violation then failed := true;
  end;
  assert failed, 'stock négatif refusé';

  failed := false;
  begin
    update public.products set compare_at_price = 100 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  exception when check_violation then failed := true;
  end;
  assert failed, 'prix barré inférieur refusé';

  -- Frais de livraison fixés ensuite
  o := public.admin_set_order_delivery_fee(v_order, 3000);
  assert (o ->> 'total')::numeric = 55000, 'total recalculé avec frais';

  -- L'admin peut modifier un prix ; l'historique de commande ne change pas
  update public.products set price = 99000, name_fr = 'Nouveau nom' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  select unit_price into s from public.order_items where order_id = v_order and product_name = 'Chapelet test';
  assert s = 15000, 'instantané de commande conservé';

  raise notice 'OK : tests administrateur et stock';
end $$;

-- Recherche sans accents
reset role;
do $$
declare n int;
begin
  select count(*) into n from public.products where slug = 'jallabe-test' and search_text like '%' || private.normalize_search('JALLABÉ') || '%';
  assert n = 1, 'recherche insensible aux accents';
  raise notice 'OK : recherche';
end $$;

rollback;
