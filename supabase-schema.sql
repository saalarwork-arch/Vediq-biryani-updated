-- ============================================================================
-- VEDIQ BIRYANI - COMPLETE SUPABASE DATABASE SCHEMA, MIGRATION & RLS POLICIES
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. Admins Table & Authorization
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own admin status" ON public.admins;
CREATE POLICY "Allow users to read their own admin status" 
ON public.admins
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid);

DROP POLICY IF EXISTS "Allow admins to insert/update their admin record" ON public.admins;
CREATE POLICY "Allow admins to insert/update their admin record"
ON public.admins
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid)
WITH CHECK (auth.uid() = user_id OR auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid);

-- Seed primary authorized admin record
INSERT INTO public.admins (user_id, email, active, role)
VALUES ('bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c', 'vediqbiryani@gmail.com', true, 'admin')
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email, active = true, role = 'admin';

-- Helper Function to securely verify active admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
      AND active = true
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, public;

-- ============================================================================
-- 3. Orders Table & Safe Column Migrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  full_address TEXT NOT NULL,
  house_building TEXT,
  road_area_colony TEXT,
  city TEXT DEFAULT 'Ghaziabad',
  state TEXT DEFAULT 'Uttar Pradesh',
  pincode TEXT DEFAULT '201012',
  delivery_date TEXT,
  delivery_time TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  extras JSONB DEFAULT '[]'::jsonb,
  complimentary_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if orders table was previously created with fewer columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS house_building TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS road_area_colony TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Ghaziabad';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Uttar Pradesh';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '201012';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS complimentary_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert of orders" ON public.orders;
CREATE POLICY "Allow public insert of orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public order tracking by order_number" ON public.orders;
CREATE POLICY "Allow public order tracking by order_number"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins full access to orders" ON public.orders;
CREATE POLICY "Allow active admins full access to orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 3B. Order Items Table (Optional Normalization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert of order items" ON public.order_items;
CREATE POLICY "Allow public insert of order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read order items" ON public.order_items;
CREATE POLICY "Allow public read order items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins full access to order items" ON public.order_items;
CREATE POLICY "Allow active admins full access to order items"
ON public.order_items FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 4. Menu Items (Products) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'biryani',
  badge TEXT,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_jain BOOLEAN NOT NULL DEFAULT false,
  spicy_level INT DEFAULT 2,
  preparation_time_minutes INT DEFAULT 30,
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active menu items" ON public.menu_items;
CREATE POLICY "Allow public read active menu items"
ON public.menu_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage menu items" ON public.menu_items;
CREATE POLICY "Allow active admins manage menu items"
ON public.menu_items FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 5. Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active categories" ON public.categories;
CREATE POLICY "Allow public read active categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage categories" ON public.categories;
CREATE POLICY "Allow active admins manage categories"
ON public.categories FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 6. Gallery Items Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active gallery items" ON public.gallery_items;
CREATE POLICY "Allow public read active gallery items"
ON public.gallery_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage gallery items" ON public.gallery_items;
CREATE POLICY "Allow active admins manage gallery items"
ON public.gallery_items FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 7. Hero Content Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hero_content (
  id TEXT PRIMARY KEY DEFAULT 'main_hero',
  badge_text TEXT,
  heading_line1 TEXT,
  heading_line2 TEXT,
  description TEXT,
  primary_btn_text TEXT,
  primary_btn_link TEXT,
  secondary_btn_text TEXT,
  secondary_btn_link TEXT,
  hero_image_url TEXT,
  card_badge TEXT,
  card_title TEXT,
  card_desc TEXT,
  card_price NUMERIC,
  feature_tags JSONB DEFAULT '[]'::jsonb,
  slides JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read hero content" ON public.hero_content;
CREATE POLICY "Allow public read hero content"
ON public.hero_content FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage hero content" ON public.hero_content;
CREATE POLICY "Allow active admins manage hero content"
ON public.hero_content FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 8. Site Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  restaurant_name TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  opening_hours TEXT,
  delivery_charge NUMERIC DEFAULT 40,
  free_delivery_above NUMERIC DEFAULT 499,
  instagram_url TEXT,
  facebook_url TEXT,
  announcement_banner TEXT,
  is_accepting_orders BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site settings" ON public.site_settings;
CREATE POLICY "Allow public read site settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage site settings" ON public.site_settings;
CREATE POLICY "Allow active admins manage site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 9. Offers & Promo Codes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active offers" ON public.offers;
CREATE POLICY "Allow public read active offers"
ON public.offers FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow active admins manage offers" ON public.offers;
CREATE POLICY "Allow active admins manage offers"
ON public.offers FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

-- ============================================================================
-- 10. Supabase Storage: 'restaurant_assets' Bucket & Admin RLS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant_assets',
  'restaurant_assets',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on restaurant_assets" ON storage.objects;
CREATE POLICY "Public Read restaurant_assets"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'restaurant_assets');

DROP POLICY IF EXISTS "Admin Upload restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admins insert to restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Upload restaurant_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE public.admins.user_id = auth.uid()
      AND public.admins.active = true
    )
  )
);

DROP POLICY IF EXISTS "Admin Update restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admins update to restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Update restaurant_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE public.admins.user_id = auth.uid()
      AND public.admins.active = true
    )
  )
)
WITH CHECK (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE public.admins.user_id = auth.uid()
      AND public.admins.active = true
    )
  )
);

DROP POLICY IF EXISTS "Admin Delete restaurant_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow active admins delete from restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Delete restaurant_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE public.admins.user_id = auth.uid()
      AND public.admins.active = true
    )
  )
);

-- ============================================================================
-- 11. Initial Seed Data (Categories, Settings, Hero, Offers & Products)
-- ============================================================================

-- A. Categories
INSERT INTO public.categories (id, label, description, is_active, display_order)
VALUES
  ('all', 'All Items', 'Complete Vediq Biryani & royal delicacy selection', true, 1),
  ('biryani', 'Biryani', 'Royal dum biryanis slow-cooked with saffron Basmati, packed in natural banana leaf', true, 2),
  ('order-separately', 'Order Them Separately', 'Paid add-on items to complement your meal', true, 3)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

-- B. Site Settings
INSERT INTO public.site_settings (
  id, restaurant_name, tagline, phone, whatsapp, email, address, city, state, pincode, opening_hours, delivery_charge, free_delivery_above, announcement_banner, is_accepting_orders
)
VALUES (
  'main_settings',
  'Vediq Biryani',
  'Authentic slow-cooked royal Awadhi and 100% Jain Satvik dum biryanis, packed in natural banana leaf (Kele ka Patta).',
  '+91 87440 44994',
  '+91 87440 44994',
  'vediqbiryani@gmail.com',
  'Ek-92, Eklavya Vihar, Sector 9, Vasundhara, Ghaziabad',
  'Ghaziabad',
  'Uttar Pradesh',
  '201012',
  '11:00 AM – 11:30 PM (All 7 Days)',
  40,
  499,
  '✨ Pure Royal Dum Craft • 100% Plastic-Free • Packed in Natural Banana Leaf',
  true
)
ON CONFLICT (id) DO UPDATE
SET restaurant_name = EXCLUDED.restaurant_name,
    tagline = EXCLUDED.tagline,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    pincode = EXCLUDED.pincode,
    opening_hours = EXCLUDED.opening_hours,
    delivery_charge = EXCLUDED.delivery_charge,
    free_delivery_above = EXCLUDED.free_delivery_above,
    announcement_banner = EXCLUDED.announcement_banner,
    is_accepting_orders = EXCLUDED.is_accepting_orders;

-- C. Hero Content
INSERT INTO public.hero_content (
  id, badge_text, heading_line1, heading_line2, description, primary_btn_text, primary_btn_link, secondary_btn_text, secondary_btn_link, hero_image_url, card_badge, card_title, card_desc, card_price, feature_tags, slides
)
VALUES (
  'main_hero',
  'Authentic Dum Biryanis & Royal Delicacies',
  'Slow-Cooked on Royal Dum.',
  'Sealed with Pure Heritage.',
  'Experience aged long-grain Basmati rice, slow-simmered Kashmiri saffron milk, and farm-fresh ingredients packed in natural banana leaf (Kele ka Patta) for an unmistakable aroma.',
  'Explore Full Menu',
  '#menu',
  '100% Jain Satvik Menu',
  '#jain-specials',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
  'Chef''s Special',
  'Veg Biryani (The Diplomat)',
  'Fragrant Basmati & Slow-Cooked Vegetables',
  469,
  '[{"icon": "Leaf", "title": "Natural Banana Leaf"}, {"icon": "ShieldCheck", "title": "100% Plastic-Free"}, {"icon": "Clock", "title": "Fresh Hot Delivery"}]'::jsonb,
  '[
    {"id": "slide-1", "title": "Veg Biryani (The Diplomat)", "subtitle": "Layers of fragrant basmati & slow-cooked seasonal vegetables", "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop", "is_active": true},
    {"id": "slide-2", "title": "Paneer Biryani (The Charmer)", "subtitle": "Soft paneer marinated in house blend, layered with saffron rice", "image_url": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1200&auto=format&fit=crop", "is_active": true},
    {"id": "slide-3", "title": "Chaap Biryani – Whole (The Rebel)", "subtitle": "Soya chaap grilled whole on a skewer into signature dum biryani", "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop", "is_active": true}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET badge_text = EXCLUDED.badge_text,
    heading_line1 = EXCLUDED.heading_line1,
    heading_line2 = EXCLUDED.heading_line2,
    description = EXCLUDED.description,
    primary_btn_text = EXCLUDED.primary_btn_text,
    primary_btn_link = EXCLUDED.primary_btn_link,
    secondary_btn_text = EXCLUDED.secondary_btn_text,
    secondary_btn_link = EXCLUDED.secondary_btn_link,
    hero_image_url = EXCLUDED.hero_image_url,
    card_badge = EXCLUDED.card_badge,
    card_title = EXCLUDED.card_title,
    card_desc = EXCLUDED.card_desc,
    card_price = EXCLUDED.card_price,
    feature_tags = EXCLUDED.feature_tags,
    slides = EXCLUDED.slides;

-- D. Initial Offers
INSERT INTO public.offers (id, code, title, description, discount_type, discount_value, min_order_amount, is_active)
VALUES
  ('offer-1', 'ROYAL10', 'Flat 10% Off Royal Feast', 'Get 10% discount on all orders above ₹500', 'percentage', 10, 500, true),
  ('offer-2', 'VEDIQ50', 'Flat ₹50 Off Orders Above ₹400', 'Special welcome coupon for first-time royal guests', 'fixed', 50, 400, true)
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    min_order_amount = EXCLUDED.min_order_amount,
    is_active = EXCLUDED.is_active;

-- E. Menu Items (7 Biryanis + 3 Order Separately Items)
INSERT INTO public.menu_items (
  id, name, tagline, description, category, badge, is_veg, is_jain, spicy_level, preparation_time_minutes, image_url, images, sizes, popular, is_active, display_order
)
VALUES
  (
    'biryani-aloo',
    'Aloo Biryani',
    'The Underdog',
    'Baby potatoes, slow-roasted and layered into fragrant dum rice with whole spices. Simple on paper, the dish everyone secretly reorders.',
    'biryani',
    'The Underdog',
    true,
    false,
    2,
    35,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 449}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 619}]'::jsonb,
    true,
    true,
    1
  ),
  (
    'biryani-veg',
    'Veg Biryani',
    'The Diplomat',
    'Layers of fragrant basmati, slow-cooked seasonal vegetables, and whole spices, sealed and finished on dum. No meat, no shortcuts — just proof that veg biryani was always the real deal.',
    'biryani',
    'The Diplomat',
    true,
    false,
    2,
    35,
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 469}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 649}]'::jsonb,
    true,
    true,
    2
  ),
  (
    'biryani-chaap-pieces',
    'Chaap Biryani – Pieces',
    'The Loyalist',
    'Tender soya chaap pieces, marinated and layered into golden dum-cooked rice. Comfort food that never lets you down.',
    'biryani',
    'The Loyalist',
    true,
    false,
    2,
    40,
    'https://images.unsplash.com/photo-1642821373181-696a54913e93?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1642821373181-696a54913e93?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 469}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 649}]'::jsonb,
    true,
    true,
    3
  ),
  (
    'biryani-chaap-whole',
    'Chaap Biryani – Whole',
    'The Rebel',
    'Soya chaap grilled whole on the skewer, then layered into our signature dum biryani. Same soul, different swagger — made to be seen before it''s eaten.',
    'biryani',
    'The Rebel',
    true,
    false,
    2,
    40,
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 469}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 649}]'::jsonb,
    true,
    true,
    4
  ),
  (
    'biryani-paneer',
    'Paneer Biryani',
    'The Charmer',
    'Soft paneer marinated in our house blend, layered with saffron-scented rice and finished on slow dum. Rich, generous, and impossible to say no to.',
    'biryani',
    'The Charmer',
    true,
    false,
    2,
    35,
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 479}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 679}]'::jsonb,
    true,
    true,
    5
  ),
  (
    'biryani-mushroom-button',
    'Mushroom Biryani – Button',
    'The Quiet One',
    'Button mushrooms layered into slow dum-cooked basmati with warm whole spices. Earthy, understated, and quietly unforgettable.',
    'biryani',
    'The Quiet One',
    true,
    false,
    2,
    35,
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 479}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 679}]'::jsonb,
    false,
    true,
    6
  ),
  (
    'biryani-mushroom-king-oyster',
    'Mushroom Biryani – King Oyster',
    'The Heavyweight',
    'Meaty King Oyster mushrooms, roasted and layered into rich dum biryani. Bold texture, deep flavor — the premium pick that speaks for itself.',
    'biryani',
    'The Heavyweight',
    true,
    false,
    2,
    40,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "500g", "portion": "500g", "serves": "Serves 1-2", "price": 599}, {"name": "1kg", "portion": "1kg", "serves": "Serves 2-3", "price": 899}]'::jsonb,
    true,
    true,
    7
  ),
  (
    'sep-mint-raita',
    'Signature Mint Raita',
    'Cooling Refreshment',
    'Cooling, refreshing & made fresh in-house.',
    'order-separately',
    '200 ml',
    true,
    true,
    1,
    10,
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "200 ml", "portion": "200 ml", "serves": "Serves 1-2", "price": 69}]'::jsonb,
    true,
    true,
    8
  ),
  (
    'sep-shahi-tukda',
    'The Encore (Shahi Tukda)',
    'Warm & Buttery Dessert',
    'Warm, buttery & made to melt in every bite.',
    'order-separately',
    '4 pcs',
    true,
    true,
    1,
    15,
    'https://images.unsplash.com/photo-1605197161470-5b82269c5e53?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1605197161470-5b82269c5e53?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "4 pcs", "portion": "4 pcs", "serves": "Serves 1-2", "price": 119}]'::jsonb,
    true,
    true,
    9
  ),
  (
    'sep-perfect-pair',
    'The Perfect Pair',
    'Signature Mint Raita + The Encore',
    'Both, together — because one''s never quite enough.',
    'order-separately',
    'Combo Special',
    true,
    true,
    1,
    15,
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop"]'::jsonb,
    '[{"name": "Pair (200ml Raita + 4 pcs Shahi Tukda)", "portion": "Pair", "serves": "Serves 1-2", "price": 169}]'::jsonb,
    true,
    true,
    10
  ),
  (
    'biryani-jain-paneer',
    'Jain Paneer Biryani',
    '',
    'Pure Jain-friendly biryani options prepared without onion and garlic.',
    'biryani',
    '100% Jain Satvik',
    true,
    true,
    2,
    35,
    '',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    true,
    11
  ),
  (
    'biryani-jain-chaap',
    'Jain Chaap Biryani',
    '',
    'Pure Jain-friendly biryani options prepared without onion and garlic.',
    'biryani',
    '100% Jain Satvik',
    true,
    true,
    2,
    35,
    '',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    true,
    12
  ),
  (
    'biryani-jain-whole-chaap',
    'Jain Whole Chaap Biryani',
    '',
    'Pure Jain-friendly biryani options prepared without onion and garlic.',
    'biryani',
    '100% Jain Satvik',
    true,
    true,
    2,
    35,
    '',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    true,
    13
  ),
  (
    'biryani-jain-veg',
    'Jain Veg Biryani',
    '',
    'Pure Jain-friendly biryani options prepared without onion and garlic.',
    'biryani',
    '100% Jain Satvik',
    true,
    true,
    2,
    35,
    '',
    '[]'::jsonb,
    '[]'::jsonb,
    false,
    true,
    14
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    badge = EXCLUDED.badge,
    is_veg = EXCLUDED.is_veg,
    is_jain = EXCLUDED.is_jain,
    spicy_level = EXCLUDED.spicy_level,
    preparation_time_minutes = EXCLUDED.preparation_time_minutes,
    image_url = EXCLUDED.image_url,
    images = EXCLUDED.images,
    sizes = EXCLUDED.sizes,
    popular = EXCLUDED.popular,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

-- ============================================================================
-- 13. Customer Reviews & Feedback Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert of reviews" ON public.reviews;
CREATE POLICY "Allow public insert of reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read approved reviews" ON public.reviews;
CREATE POLICY "Allow public read approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

DROP POLICY IF EXISTS "Allow active admins manage reviews" ON public.reviews;
CREATE POLICY "Allow active admins manage reviews"
ON public.reviews FOR ALL
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
)
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.user_id = auth.uid()
    AND public.admins.active = true
  )
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved, created_at DESC);

-- ============================================================================
-- 12. Explicit Role Grants & PostgREST Schema Cache Reload
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

