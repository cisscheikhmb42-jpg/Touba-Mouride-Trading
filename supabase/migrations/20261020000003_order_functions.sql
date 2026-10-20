-- =====================================================================
-- Fonctions métier : calcul du panier, commandes, stock
-- ---------------------------------------------------------------------
-- RÈGLE DE GESTION DU STOCK (documentée dans docs/STOCK.md) :
-- 1. Une demande de commande (statut awaiting_confirmation) NE retire
--    PAS de stock. Ouvrir WhatsApp ne réserve rien.
-- 2. Le stock est décrémenté atomiquement quand un administrateur passe
--    la commande à « confirmed » (ou preparing/shipped/delivered) pour
--    la première fois. Si le stock est insuffisant, l'opération échoue.
-- 3. Si une commande dont le stock a été retiré est annulée (ou remise
--    en attente), le stock est restitué.
-- 4. Seuls les produits avec track_inventory = true sont concernés.
-- =====================================================================

-- ---------------------------------------------------------------------
-- private.compute_cart : source de vérité des prix et disponibilités.
-- p_items : [{ "product_id": uuid, "variant_id": uuid|null, "quantity": int }]
-- ---------------------------------------------------------------------
create or replace function private.compute_cart(p_items jsonb, p_zone_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_has_variants boolean;
  v_issue text;
  v_available integer;
  v_unit_price numeric(12, 0);
  v_line_total numeric(12, 0);
  v_variant_label text;
  v_image text;
  v_lines jsonb := '[]'::jsonb;
  v_priced_subtotal numeric(12, 0) := 0;
  v_has_unpriced boolean := false;
  v_has_issues boolean := false;
  v_zone public.delivery_zones%rowtype;
  v_zone_json jsonb := null;
  v_fee_status text := 'to_confirm';
  v_subtotal numeric(12, 0);
  v_total numeric(12, 0);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'CART_MALFORMED' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'CART_EMPTY' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'CART_TOO_LARGE' using errcode = 'P0001';
  end if;

  for v_item in
    with raw as (
      select
        (elem ->> 'product_id') as product_id_text,
        nullif(elem ->> 'variant_id', '') as variant_id_text,
        (elem ->> 'quantity') as quantity_text
      from jsonb_array_elements(p_items) as elem
    ),
    parsed as (
      select
        case when product_id_text ~* '^[0-9a-f-]{36}$' then product_id_text::uuid end as product_id,
        case when variant_id_text ~* '^[0-9a-f-]{36}$' then variant_id_text::uuid end as variant_id,
        variant_id_text is not null and variant_id_text !~* '^[0-9a-f-]{36}$' as bad_variant,
        case when quantity_text ~ '^[0-9]{1,3}$' then quantity_text::integer end as quantity
      from raw
    )
    select product_id, variant_id, bool_or(bad_variant) as bad_variant,
           sum(quantity)::integer as quantity, bool_or(quantity is null) as bad_quantity
    from parsed
    group by product_id, variant_id
  loop
    v_issue := null;
    v_available := null;
    v_unit_price := null;
    v_line_total := null;
    v_variant_label := null;
    v_image := null;
    v_product := null;
    v_variant := null;

    if v_item.product_id is null or v_item.bad_variant then
      raise exception 'CART_MALFORMED' using errcode = 'P0001';
    end if;

    select * into v_product from public.products
    where id = v_item.product_id and is_published;

    if not found then
      v_issue := 'not_found';
    else
      select exists (select 1 from public.product_variants where product_id = v_product.id)
      into v_has_variants;

      if v_item.variant_id is not null then
        select * into v_variant from public.product_variants
        where id = v_item.variant_id and product_id = v_product.id;
        if not found then
          v_issue := 'not_found';
        else
          v_variant_label := concat_ws(' / ', nullif(trim(v_variant.size), ''), nullif(trim(v_variant.color), ''));
        end if;
      elsif v_has_variants then
        v_issue := 'variant_required';
      end if;

      if v_issue is null and (v_item.bad_quantity or v_item.quantity < 1 or v_item.quantity > 99) then
        v_issue := 'invalid_quantity';
      end if;

      if v_issue is null and (not v_product.is_available
          or (v_variant.id is not null and not v_variant.is_available)) then
        v_issue := 'unavailable';
      end if;

      if v_product.track_inventory then
        v_available := case when v_variant.id is not null then v_variant.stock_quantity
                            else v_product.stock_quantity end;
        if v_issue is null and v_available = 0 then
          v_issue := 'out_of_stock';
        elsif v_issue is null and v_item.quantity > v_available then
          v_issue := 'insufficient_stock';
        end if;
      end if;

      v_unit_price := coalesce(v_variant.price, v_product.price);
      if v_unit_price is not null and v_item.quantity between 1 and 99 then
        v_line_total := v_unit_price * v_item.quantity;
      end if;

      select image_url into v_image from public.product_images
      where product_id = v_product.id order by position, created_at limit 1;
    end if;

    if v_issue is not null then
      v_has_issues := true;
    elsif v_unit_price is null then
      v_has_unpriced := true;
    else
      v_priced_subtotal := v_priced_subtotal + v_line_total;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_item.product_id,
      'variant_id', v_item.variant_id,
      'quantity', v_item.quantity,
      'name_fr', v_product.name_fr,
      'name_wo', v_product.name_wo,
      'slug', v_product.slug,
      'sku', coalesce(v_variant.sku, v_product.sku),
      'variant_label', v_variant_label,
      'unit_price', v_unit_price,
      'line_total', v_line_total,
      'image_url', v_image,
      'track_inventory', coalesce(v_product.track_inventory, false),
      'available_quantity', v_available,
      'issue', v_issue
    );
  end loop;

  if p_zone_id is not null then
    select * into v_zone from public.delivery_zones where id = p_zone_id and is_active;
    if found then
      v_zone_json := jsonb_build_object(
        'id', v_zone.id, 'name', v_zone.name, 'name_wo', v_zone.name_wo,
        'fee', v_zone.fee, 'is_pickup', v_zone.is_pickup
      );
      if v_zone.fee is not null then
        v_fee_status := 'known';
      end if;
    end if;
  end if;

  v_subtotal := case when v_has_unpriced or v_has_issues then null else v_priced_subtotal end;
  v_total := case when v_subtotal is not null and v_fee_status = 'known'
                  then v_subtotal + v_zone.fee end;

  return jsonb_build_object(
    'lines', v_lines,
    'priced_subtotal', v_priced_subtotal,
    'subtotal', v_subtotal,
    'has_unpriced_items', v_has_unpriced,
    'has_issues', v_has_issues,
    'zone', v_zone_json,
    'delivery_fee', case when v_fee_status = 'known' then v_zone.fee end,
    'delivery_fee_status', v_fee_status,
    'total', v_total,
    'currency', 'XOF'
  );
end;
$$;

revoke all on function private.compute_cart(jsonb, uuid) from public;

-- ---------------------------------------------------------------------
-- public.quote_cart : devis en lecture seule pour l'affichage du panier.
-- ---------------------------------------------------------------------
create or replace function public.quote_cart(p_items jsonb, p_delivery_zone_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.compute_cart(p_items, p_delivery_zone_id);
$$;

revoke all on function public.quote_cart(jsonb, uuid) from public;
grant execute on function public.quote_cart(jsonb, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- public.create_order : enregistre une DEMANDE de commande.
-- Recalcule tout côté base ; ne fait confiance à aucun prix envoyé.
-- Statut initial : awaiting_confirmation. Aucun retrait de stock.
-- ---------------------------------------------------------------------
create or replace function public.create_order(p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order_number text := p_payload ->> 'order_number';
  v_name text := trim(coalesce(p_payload ->> 'customer_name', ''));
  v_phone_raw text := trim(coalesce(p_payload ->> 'customer_phone', ''));
  v_phone text;
  v_address text := trim(coalesce(p_payload ->> 'delivery_address', ''));
  v_notes text := nullif(trim(coalesce(p_payload ->> 'customer_notes', '')), '');
  v_locale text := coalesce(nullif(p_payload ->> 'locale', ''), 'fr');
  v_message text := p_payload ->> 'whatsapp_message';
  v_zone_text text := p_payload ->> 'delivery_zone_id';
  v_zone_id uuid;
  v_cart jsonb;
  v_line jsonb;
  v_order_id uuid;
  v_recent integer;
begin
  -- Validation des champs
  if v_order_number is null or v_order_number !~ '^TMT-[0-9]{6}-[A-Z0-9]{4}$' then
    raise exception 'ORDER_NUMBER_INVALID' using errcode = 'P0001';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'NAME_INVALID' using errcode = 'P0001';
  end if;
  v_phone := regexp_replace(v_phone_raw, '[\s.\-()]', '', 'g');
  if v_phone !~ '^\+?[0-9]{7,15}$' then
    raise exception 'PHONE_INVALID' using errcode = 'P0001';
  end if;
  if char_length(v_address) < 2 or char_length(v_address) > 300 then
    raise exception 'ADDRESS_INVALID' using errcode = 'P0001';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'NOTES_TOO_LONG' using errcode = 'P0001';
  end if;
  if v_locale not in ('fr', 'wo') then
    v_locale := 'fr';
  end if;
  if v_message is not null and char_length(v_message) > 6000 then
    raise exception 'MESSAGE_TOO_LONG' using errcode = 'P0001';
  end if;
  if v_zone_text is null or v_zone_text !~* '^[0-9a-f-]{36}$' then
    raise exception 'ZONE_INVALID' using errcode = 'P0001';
  end if;
  v_zone_id := v_zone_text::uuid;

  -- Limitation anti-abus
  select count(*) into v_recent from public.orders
  where customer_phone = v_phone and created_at > now() - interval '15 minutes';
  if v_recent >= 5 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  select count(*) into v_recent from public.orders
  where created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  -- Recalcul complet
  v_cart := private.compute_cart(p_payload -> 'items', v_zone_id);

  if v_cart -> 'zone' = 'null'::jsonb then
    raise exception 'ZONE_INVALID' using errcode = 'P0001';
  end if;
  if (v_cart ->> 'has_issues')::boolean then
    raise exception 'CART_INVALID' using errcode = 'P0001', detail = v_cart::text;
  end if;

  -- Le récapitulatif affiché au client doit correspondre aux montants réels.
  if p_payload ? 'expected_priced_subtotal'
     and (p_payload ->> 'expected_priced_subtotal')::numeric is distinct from (v_cart ->> 'priced_subtotal')::numeric then
    raise exception 'PRICE_CHANGED' using errcode = 'P0001', detail = v_cart::text;
  end if;
  if p_payload ? 'expected_delivery_fee'
     and (p_payload ->> 'expected_delivery_fee')::numeric is distinct from (v_cart ->> 'delivery_fee')::numeric then
    raise exception 'PRICE_CHANGED' using errcode = 'P0001', detail = v_cart::text;
  end if;

  insert into public.orders (
    order_number, customer_name, customer_phone, delivery_zone_id, delivery_zone_name,
    delivery_address, delivery_fee, delivery_fee_status, priced_subtotal, subtotal,
    has_unpriced_items, total, currency, status, customer_notes, whatsapp_message, locale
  ) values (
    v_order_number, v_name, v_phone, v_zone_id, v_cart -> 'zone' ->> 'name',
    v_address, (v_cart ->> 'delivery_fee')::numeric,
    (v_cart ->> 'delivery_fee_status')::public.delivery_fee_status,
    (v_cart ->> 'priced_subtotal')::numeric, (v_cart ->> 'subtotal')::numeric,
    (v_cart ->> 'has_unpriced_items')::boolean, (v_cart ->> 'total')::numeric,
    'XOF', 'awaiting_confirmation', v_notes, v_message, v_locale
  )
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(v_cart -> 'lines')
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_sku,
      variant_description, quantity, unit_price, line_total
    ) values (
      v_order_id,
      (v_line ->> 'product_id')::uuid,
      nullif(v_line ->> 'variant_id', '')::uuid,
      v_line ->> 'name_fr',
      v_line ->> 'sku',
      v_line ->> 'variant_label',
      (v_line ->> 'quantity')::integer,
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'line_total')::numeric
    );
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'awaiting_confirmation',
    'cart', v_cart
  );
exception
  when unique_violation then
    raise exception 'ORDER_NUMBER_TAKEN' using errcode = 'P0001';
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- public.admin_update_order_status : change le statut et applique la
-- règle de stock de façon atomique (verrous de ligne).
-- ---------------------------------------------------------------------
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_deducting public.order_status[] := array['confirmed', 'preparing', 'shipped', 'delivered']::public.order_status[];
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_order.status = 'cancelled' and p_status in ('shipped', 'delivered') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  -- Retrait du stock à la première confirmation
  if p_status = any (v_deducting) and not v_order.stock_deducted then
    for v_item in
      select oi.id, oi.product_id, oi.variant_id, oi.quantity, oi.product_name, p.track_inventory
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order.id and p.track_inventory
      order by oi.product_id, oi.variant_id
    loop
      if v_item.variant_id is not null then
        update public.product_variants
        set stock_quantity = stock_quantity - v_item.quantity
        where id = v_item.variant_id and stock_quantity >= v_item.quantity;
        get diagnostics v_updated = row_count;
        if v_updated = 0 then
          raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001', detail = v_item.product_name;
        end if;
        update public.order_items set stock_deducted_from = 'variant' where id = v_item.id;
      else
        update public.products
        set stock_quantity = stock_quantity - v_item.quantity
        where id = v_item.product_id and stock_quantity >= v_item.quantity;
        get diagnostics v_updated = row_count;
        if v_updated = 0 then
          raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001', detail = v_item.product_name;
        end if;
        update public.order_items set stock_deducted_from = 'product' where id = v_item.id;
      end if;
    end loop;
    update public.orders set stock_deducted = true where id = v_order.id;
  end if;

  -- Restitution du stock en cas d'annulation ou de retour en attente
  if p_status in ('cancelled', 'pending', 'awaiting_confirmation') and v_order.stock_deducted then
    for v_item in
      select id, product_id, variant_id, quantity, stock_deducted_from
      from public.order_items
      where order_id = v_order.id and stock_deducted_from is not null
      order by product_id, variant_id
    loop
      if v_item.stock_deducted_from = 'variant' and v_item.variant_id is not null then
        update public.product_variants set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.variant_id;
      elsif v_item.stock_deducted_from = 'product' and v_item.product_id is not null then
        update public.products set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.product_id;
      end if;
      update public.order_items set stock_deducted_from = null where id = v_item.id;
    end loop;
    update public.orders set stock_deducted = false where id = v_order.id;
  end if;

  update public.orders set status = p_status where id = v_order.id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

revoke all on function public.admin_update_order_status(uuid, public.order_status) from public;
grant execute on function public.admin_update_order_status(uuid, public.order_status) to authenticated;

-- ---------------------------------------------------------------------
-- public.admin_set_order_delivery_fee : fixe les frais une fois connus
-- (ex. après échange WhatsApp) et recalcule le total.
-- ---------------------------------------------------------------------
create or replace function public.admin_set_order_delivery_fee(
  p_order_id uuid,
  p_fee numeric
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_fee is not null and (p_fee < 0 or p_fee <> trunc(p_fee)) then
    raise exception 'FEE_INVALID' using errcode = 'P0001';
  end if;

  update public.orders
  set delivery_fee = p_fee,
      delivery_fee_status = case when p_fee is null then 'to_confirm' else 'known' end::public.delivery_fee_status,
      total = case when p_fee is not null and subtotal is not null then subtotal + p_fee end
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  return to_jsonb(v_order);
end;
$$;

revoke all on function public.admin_set_order_delivery_fee(uuid, numeric) from public;
grant execute on function public.admin_set_order_delivery_fee(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- Tableau de bord : statistiques (admin uniquement)
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products_total', (select count(*) from public.products),
    'products_published', (select count(*) from public.products where is_published),
    'products_available', (select count(*) from public.products where is_published and is_available),
    'products_unavailable', (select count(*) from public.products where not is_available),
    'products_without_price', (select count(*) from public.products where price is null),
    'products_without_image', (
      select count(*) from public.products p
      where not exists (select 1 from public.product_images i where i.product_id = p.id)
    ),
    'low_stock', (
      select count(*) from public.products p
      where p.track_inventory and (
        (not exists (select 1 from public.product_variants v where v.product_id = p.id)
          and p.stock_quantity <= p.low_stock_threshold)
        or exists (
          select 1 from public.product_variants v
          where v.product_id = p.id and v.stock_quantity <= p.low_stock_threshold
        )
      )
    ),
    'orders_by_status', coalesce((
      select jsonb_object_agg(status, n) from (
        select status, count(*) as n from public.orders group by status
      ) s
    ), '{}'::jsonb),
    'orders_last_7_days', (
      select count(*) from public.orders where created_at > now() - interval '7 days'
    )
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
