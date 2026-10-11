-- The storefront only inserts cart items. Anonymous visitors must not read,
-- change, or delete other visitors' carts.
DROP POLICY IF EXISTS "select_cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "update_cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "delete_cart_items" ON public.cart_items;
