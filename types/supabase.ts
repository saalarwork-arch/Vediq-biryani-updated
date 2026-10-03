export interface AdminUser {
  id?: string;
  user_id: string;
  email: string;
  active: boolean;
  role?: string;
  created_at?: string;
}

export interface MenuItemSize {
  name: string;
  portion: string;
  serves: string;
  price: number;
  sale_price?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  badge?: string;
  is_veg: boolean;
  is_jain: boolean;
  spicy_level: 1 | 2 | 3;
  preparation_time_minutes: number;
  image_url: string;
  images?: string[];
  sizes: MenuItemSize[];
  popular?: boolean;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  subtitle?: string;
  caption?: string;
  tag?: string;
  featured?: boolean;
  is_featured?: boolean;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  subtitle?: string;
  is_active: boolean;
}

export interface HeroContent {
  id?: string;
  badge_text: string;
  headline_line1?: string;
  headline_line2?: string;
  heading_line1?: string;
  heading_line2?: string;
  subheading?: string;
  description?: string;
  cta_primary_text?: string;
  cta_primary_link?: string;
  primary_btn_text?: string;
  primary_btn_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  secondary_btn_text?: string;
  secondary_btn_link?: string;
  hero_image_url: string;
  card_badge?: string;
  card_title?: string;
  card_desc?: string;
  card_price?: number;
  feature_tag_1?: string;
  feature_tag_2?: string;
  feature_tag_3?: string;
  feature_tags?: { icon: string; title: string }[];
  slides?: HeroSlide[];
}

export interface SiteSettings {
  id?: string;
  restaurant_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_hours: string;
  delivery_charge: number;
  free_delivery_above?: number;
  free_delivery_threshold?: number;
  estimated_delivery_time?: string;
  minimum_order_amount?: number;
  is_open_now?: boolean;
  instagram_url?: string;
  facebook_url?: string;
  announcement_banner?: string;
  is_accepting_orders?: boolean;
  footer_text?: string;
}

export interface OfferItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  min_order_value?: number;
  max_discount_amount?: number;
  is_active: boolean;
  valid_until?: string;
  created_at?: string;
}

export interface MediaItem {
  id: string;
  title?: string;
  name?: string;
  url: string;
  category: string;
  size?: string;
  created_at: string;
}

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  total: number;
  image_url?: string;
}

export interface OrderExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export interface CustomerOrder {
  id: string;
  order_number: string;
  tracking_code?: string;
  customer_name: string;
  phone: string;
  email?: string;
  full_address: string;
  house_building?: string;
  road_area_colony?: string;
  city?: string;
  state?: string;
  pincode?: string;
  delivery_date?: string;
  delivery_time?: string;
  items: OrderItem[];
  extras?: OrderExtra[];
  complimentary_items?: { name: string; quantityText: string }[];
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  order_status: OrderStatus;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_notes?: string;
  status_history?: { status: OrderStatus; timestamp: string; note?: string }[];
  notify_email?: boolean;
  notification_email?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  rating: number; // 1 to 5
  review: string;
  is_approved: boolean;
  created_at?: string;
  updated_at?: string;
}
