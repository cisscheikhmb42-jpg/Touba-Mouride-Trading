-- =====================================================================
-- Durcissement : Supabase accorde par défaut EXECUTE au rôle anon sur
-- les fonctions du schéma public. Les fonctions d'administration
-- vérifient déjà is_admin(), mais on retire aussi ce droit aux visiteurs.
-- Restent appelables sans connexion (volontairement) : quote_cart,
-- create_order (validation complète en base) et is_admin.
-- =====================================================================
revoke execute on function public.admin_dashboard_stats() from anon;
revoke execute on function public.admin_set_order_delivery_fee(uuid, numeric) from anon;
revoke execute on function public.admin_update_order_status(uuid, public.order_status) from anon;
