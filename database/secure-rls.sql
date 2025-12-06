-- =========================================
-- SECURE RLS POLICIES (AUTHENTICATED ONLY)
-- =========================================

-- 1. Catering Orders
ALTER TABLE public.catering_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access - INSERT" ON public.catering_orders;
DROP POLICY IF EXISTS "Public access - SELECT" ON public.catering_orders;
DROP POLICY IF EXISTS "Public access - UPDATE" ON public.catering_orders;
DROP POLICY IF EXISTS "Public access - DELETE" ON public.catering_orders;

-- Allow read access only to authenticated users
CREATE POLICY "Auth access - SELECT on orders"
  ON public.catering_orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow write access only to authenticated users
CREATE POLICY "Auth access - INSERT on orders"
  ON public.catering_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Auth access - UPDATE on orders"
  ON public.catering_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth access - DELETE on orders"
  ON public.catering_orders
  FOR DELETE
  TO authenticated
  USING (true);


-- 2. Products (Allow public read for menu display if needed, but strict write)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.products;

-- Public READ (Assuming frontend might need to display products without login on a landing page?)
-- If this is purely an admin panel, change TO authenticated
CREATE POLICY "Auth access - SELECT on products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Auth access - ALL on products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Email Templates & Logs
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth access - ALL on email_templates" ON public.email_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access - ALL on email_logs" ON public.email_logs FOR ALL TO authenticated USING (true);
