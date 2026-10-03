import {
  MenuItem,
  ExtraItem,
  CategoryItem,
  GalleryItem,
  HeroContent,
  SiteSettings,
  OfferItem,
} from '@/types/supabase';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All Items', is_active: true, display_order: 1 },
  { id: 'biryani', label: 'Biryani', description: 'Royal dum biryanis slow-cooked with saffron Basmati, packed in natural banana leaf', is_active: true, display_order: 2 },
  { id: 'order-separately', label: 'Order Them Separately', description: 'Paid add-on items to complement your meal', is_active: true, display_order: 3 },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Heritage Dum Layers',
    caption: 'Slow dum-cooked with saffron and fresh ingredients',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'gal-2',
    title: 'Veg Dum Biryani',
    caption: 'Slow-cooked seasonal vegetables with saffron Basmati',
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop',
    is_featured: true,
    is_active: true,
    display_order: 2,
  },
  {
    id: 'gal-3',
    title: 'Soya Chaap Biryani',
    caption: 'Tender marinated soya chaap layered in golden rice',
    image_url: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?q=80&w=800&auto=format&fit=crop',
    is_featured: true,
    is_active: true,
    display_order: 3,
  },
  {
    id: 'gal-4',
    title: 'Fresh Paneer Dum Biryani',
    caption: 'Soft marinated paneer layered with saffron-scented rice',
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=800&auto=format&fit=crop',
    is_featured: true,
    is_active: true,
    display_order: 4,
  },
];

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge_text: 'Authentic Dum Biryanis & Royal Delicacies',
  heading_line1: 'Slow-Cooked on Royal Dum.',
  heading_line2: 'Sealed with Pure Heritage.',
  description: 'Experience aged long-grain Basmati rice, slow-simmered Kashmiri saffron milk, and farm-fresh ingredients packed in natural banana leaf (Kele ka Patta) for an unmistakable aroma.',
  primary_btn_text: 'Explore Full Menu',
  primary_btn_link: '#menu',
  secondary_btn_text: '100% Jain Satvik Menu',
  secondary_btn_link: '#jain-specials',
  hero_image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
  card_badge: "Chef's Special",
  card_title: 'Veg Biryani (The Diplomat)',
  card_desc: 'Fragrant Basmati & Slow-Cooked Vegetables',
  card_price: 469,
  feature_tags: [
    { icon: 'Leaf', title: 'Natural Banana Leaf' },
    { icon: 'ShieldCheck', title: '100% Plastic-Free' },
    { icon: 'Clock', title: 'Fresh Hot Delivery' },
  ],
  slides: [
    {
      id: 'slide-1',
      title: 'Veg Biryani (The Diplomat)',
      subtitle: 'Layers of fragrant basmati & slow-cooked seasonal vegetables',
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
      is_active: true,
    },
    {
      id: 'slide-2',
      title: 'Paneer Biryani (The Charmer)',
      subtitle: 'Soft paneer marinated in house blend, layered with saffron rice',
      image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1200&auto=format&fit=crop',
      is_active: true,
    },
    {
      id: 'slide-3',
      title: 'Chaap Biryani – Whole (The Rebel)',
      subtitle: 'Soya chaap grilled whole on a skewer into signature dum biryani',
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      is_active: true,
    },
  ],
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  restaurant_name: 'Vediq Biryani',
  tagline: 'Authentic Dum Biryanis & Royal Delicacies Packed in Natural Banana Leaf',
  phone: '+91 87440 44994',
  whatsapp: '+91 87440 44994',
  email: 'vediqbiryani@gmail.com',
  address: 'Ek-92, Eklavya Vihar, Sector 9, Vasundhara, Ghaziabad',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  pincode: '201012',
  opening_hours: 'Open 24 hours',
  delivery_charge: 49,
  free_delivery_above: 499,
  instagram_url: 'https://instagram.com/vediqbiryani',
  facebook_url: 'https://facebook.com/vediqbiryani',
  announcement_banner: '✨ Every Biryani includes complimentary Mint Raita, Shahi Tukda & Healthy Surprise in your cart!',
  is_accepting_orders: true,
};

export const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: 'offer-vediq50',
    code: 'VEDIQ50',
    title: 'Flat ₹50 Off on First Order',
    description: 'Get instant ₹50 discount on your order above ₹449',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 449,
    is_active: true,
    valid_until: '2026-12-31',
  },
];

export const MAIN_BIRYANI_ORDER = [
  'biryani-aloo',
  'biryani-veg',
  'biryani-chaap-pieces',
  'biryani-chaap-whole',
  'biryani-paneer',
  'biryani-mushroom-button',
  'biryani-mushroom-king-oyster',
];

export const JAIN_BIRYANI_ORDER = [
  'biryani-jain-veg',
  'biryani-jain-chaap',
  'biryani-jain-whole-chaap',
  'biryani-jain-paneer',
];

export const JAIN_TO_REGULAR_MAP: Record<string, string> = {
  'biryani-jain-veg': 'biryani-veg',
  'biryani-jain-chaap': 'biryani-chaap-pieces',
  'biryani-jain-chaap-pieces': 'biryani-chaap-pieces',
  'biryani-jain-whole-chaap': 'biryani-chaap-whole',
  'biryani-jain-paneer': 'biryani-paneer',
};

export const REGULAR_TO_JAIN_MAP: Record<string, string> = {
  'biryani-veg': 'biryani-jain-veg',
  'biryani-chaap-pieces': 'biryani-jain-chaap',
  'biryani-chaap-whole': 'biryani-jain-whole-chaap',
  'biryani-paneer': 'biryani-jain-paneer',
};

export const CANONICAL_PRODUCT_NAMES: Record<string, string> = {
  'biryani-aloo': 'Aloo Biryani',
  'biryani-veg': 'Veg Biryani',
  'biryani-chaap-pieces': 'Chaap Pieces Biryani',
  'biryani-chaap-whole': 'Chaap Whole Biryani',
  'biryani-paneer': 'Paneer Biryani',
  'biryani-mushroom-button': 'Button Mushroom Biryani',
  'biryani-mushroom-king-oyster': 'Tiger Mushroom Biryani',

  'biryani-jain-veg': 'Jain Veg Biryani',
  'biryani-jain-chaap': 'Jain Chaap Pieces Biryani',
  'biryani-jain-chaap-pieces': 'Jain Chaap Pieces Biryani',
  'biryani-jain-whole-chaap': 'Jain Chaap Whole Biryani',
  'biryani-jain-paneer': 'Jain Paneer Biryani',
};

export const getCanonicalDisplayOrder = (item: { id: string; name?: string; is_jain?: boolean }): number => {
  const id = item.id;
  const isJain = Boolean(item.is_jain);

  if (!isJain) {
    if (id === 'biryani-aloo') return 1;
    if (id === 'biryani-veg') return 2;
    if (id === 'biryani-chaap-pieces') return 3;
    if (id === 'biryani-chaap-whole') return 4;
    if (id === 'biryani-paneer') return 5;
    if (id === 'biryani-mushroom-button') return 6;
    if (id === 'biryani-mushroom-king-oyster') return 7;
    // Add-ons sequence:
    // 1. Signature Mint Raita — FIRST / ABOVE
    // 2. The Perfect Pair — SECOND / BELOW
    if (id === 'sep-mint-raita') return 8;
    if (id === 'sep-perfect-pair') return 9;
    if (id === 'sep-shahi-tukda') return 10;
    return 50;
  } else {
    // If it's an add-on item with is_jain: true, maintain the exact add-on ordering
    if (id === 'sep-mint-raita') return 8;
    if (id === 'sep-perfect-pair') return 9;
    if (id === 'sep-shahi-tukda') return 10;

    // Jain Satvik Biryani sequence:
    // 1. Jain Veg Biryani
    // 2. Jain Chaap Pieces Biryani
    // 3. Jain Chaap Whole Biryani
    // 4. Jain Paneer Biryani
    if (id === 'biryani-jain-veg') return 11;
    if (id === 'biryani-jain-chaap' || id === 'biryani-jain-chaap-pieces') return 12;
    if (id === 'biryani-jain-whole-chaap') return 13;
    if (id === 'biryani-jain-paneer') return 14;
    return 999;
  }
};

/**
 * Synchronizes portion sizes & rates from regular biryanis to their corresponding Jain versions,
 * ensures canonical naming and order sequence.
 */
export const syncAndNormalizeMenu = (items: MenuItem[]): MenuItem[] => {
  // 1. Gather latest regular sizes from database/state
  const regularSizesMap: Record<string, any[]> = {};
  for (const item of items) {
    if (!item.is_jain && item.sizes && item.sizes.length > 0) {
      regularSizesMap[item.id] = item.sizes;
    }
  }

  // 2. Normalize and synchronize each item
  const normalized = items
    .filter((item) => {
      // Ensure separate Jain Satvik Raita item remains completely REMOVED
      const idLower = item.id.toLowerCase();
      const nameLower = (item.name || '').toLowerCase();
      if (
        idLower === 'sep-jain-raita' ||
        idLower === 'sep-jain-mint-raita' ||
        (nameLower.includes('jain') && nameLower.includes('raita'))
      ) {
        return false;
      }

      // Ensure Jain Satvik Biryani options contain ONLY the 4 authentic items:
      // Exclude any Jain Aloo or Jain Mushroom options from the Jain section
      if (item.is_jain && item.category === 'biryani') {
        if (
          idLower.includes('aloo') ||
          nameLower.includes('aloo') ||
          idLower.includes('mushroom') ||
          nameLower.includes('mushroom')
        ) {
          return false;
        }
      }

      return true;
    })
    .map((item) => {
      let sizes = item.sizes;
      let name = item.name;
      let imageUrl = item.image_url;
      let images = item.images;
      let isActive = item.is_active;

      // Standardize canonical name if known
      if (CANONICAL_PRODUCT_NAMES[item.id]) {
        name = CANONICAL_PRODUCT_NAMES[item.id];
      }

      // If it's a Jain product, enforce exact same sizes & prices from regular counterpart
      if (item.is_jain && item.category === 'biryani') {
        const regId = JAIN_TO_REGULAR_MAP[item.id];
        if (regId && regularSizesMap[regId] && regularSizesMap[regId].length > 0) {
          sizes = JSON.parse(JSON.stringify(regularSizesMap[regId]));
        }
      }

      // Add-on 1: Signature Mint Raita
      if (item.id === 'sep-mint-raita') {
        name = 'Signature Mint Raita';
        return {
          ...item,
          name,
          display_order: 8,
          is_active: true,
        };
      }

      // Add-on 2: The Perfect Pair (Use single combined product image showing both Raita + Shahi Tukda)
      if (item.id === 'sep-perfect-pair') {
        name = 'The Perfect Pair';
        imageUrl = '/images/the-perfect-pair.jpg';
        images = ['/images/the-perfect-pair.jpg'];
        return {
          ...item,
          name,
          image_url: imageUrl,
          images,
          display_order: 9,
          is_active: true,
          sizes: [
            { name: 'Pair (200ml Raita + 4 pcs Shahi Tukda)', portion: 'Pair', serves: 'Serves 1-2', price: 169 },
          ],
        };
      }

      // The Encore (Shahi Tukda) standalone card should not clutter the 2-item add-ons section
      if (item.id === 'sep-shahi-tukda') {
        isActive = false;
      }

      const order = getCanonicalDisplayOrder(item);

      return {
        ...item,
        name,
        image_url: imageUrl,
        images,
        sizes,
        is_active: isActive,
        display_order: order,
      };
    });

  // 3. Sort strictly by canonical display_order
  return normalized.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
};

export const MENU_ITEMS: MenuItem[] = [
  // 1. Aloo Biryani (The Underdog)
  {
    id: 'biryani-aloo',
    name: 'Aloo Biryani',
    tagline: 'The Underdog',
    description: 'Baby potatoes, slow-roasted and layered into fragrant dum rice with whole spices. Simple on paper, the dish everyone secretly reorders.',
    category: 'biryani',
    badge: 'The Underdog',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573924208_p2bw8_12469.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573924208_p2bw8_12469.jpg'],
    popular: true,
    is_active: true,
    display_order: 1,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 449 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 619 },
    ],
  },
  // 2. Veg Biryani (The Diplomat)
  {
    id: 'biryani-veg',
    name: 'Veg Biryani',
    tagline: 'The Diplomat',
    description: 'Layers of fragrant basmati, slow-cooked seasonal vegetables, and whole spices, sealed and finished on dum. No meat, no shortcuts — just proof that veg biryani was always the real deal.',
    category: 'biryani',
    badge: 'The Diplomat',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573944324_1fvf9_12457.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573944324_1fvf9_12457.jpg'],
    popular: true,
    is_active: true,
    display_order: 2,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 3. Chaap Pieces Biryani (The Loyalist)
  {
    id: 'biryani-chaap-pieces',
    name: 'Chaap Pieces Biryani',
    tagline: 'The Loyalist',
    description: 'Tender soya chaap pieces, marinated and layered into golden dum-cooked rice. Comfort food that never lets you down.',
    category: 'biryani',
    badge: 'The Loyalist',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 40,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574005204_bx00j_12472.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574005204_bx00j_12472.jpg'],
    popular: true,
    is_active: true,
    display_order: 3,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 4. Chaap Whole Biryani (The Rebel)
  {
    id: 'biryani-chaap-whole',
    name: 'Chaap Whole Biryani',
    tagline: 'The Rebel',
    description: 'Soya chaap grilled whole on the skewer, then layered into our signature dum biryani. Same soul, different swagger — made to be seen before it\'s eaten.',
    category: 'biryani',
    badge: 'The Rebel',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 40,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573977508_m5zrh_12460.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789573977508_m5zrh_12460.jpg'],
    popular: true,
    is_active: true,
    display_order: 4,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 5. Paneer Biryani (The Charmer)
  {
    id: 'biryani-paneer',
    name: 'Paneer Biryani',
    tagline: 'The Charmer',
    description: 'Soft paneer marinated in our house blend, layered with saffron-scented rice and finished on slow dum. Rich, generous, and impossible to say no to.',
    category: 'biryani',
    badge: 'The Charmer',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574054081_alivu_12475.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574054081_alivu_12475.jpg'],
    popular: true,
    is_active: true,
    display_order: 5,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 479 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 679 },
    ],
  },
  // 6. Button Mushroom Biryani (The Quiet One)
  {
    id: 'biryani-mushroom-button',
    name: 'Button Mushroom Biryani',
    tagline: 'The Quiet One',
    description: 'Button mushrooms layered into slow dum-cooked basmati with warm whole spices. Earthy, understated, and quietly unforgettable.',
    category: 'biryani',
    badge: 'The Quiet One',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574079687_6a5zh_12466.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574079687_6a5zh_12466.jpg'],
    popular: false,
    is_active: true,
    display_order: 6,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 479 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 679 },
    ],
  },
  // 7. Tiger Mushroom Biryani (The Heavyweight)
  {
    id: 'biryani-mushroom-king-oyster',
    name: 'Tiger Mushroom Biryani',
    tagline: 'The Heavyweight',
    description: 'Meaty King Oyster & tiger mushrooms, roasted and layered into rich dum biryani. Bold texture, deep flavor — the premium pick that speaks for itself.',
    category: 'biryani',
    badge: 'The Heavyweight',
    is_veg: true,
    is_jain: false,
    spicy_level: 2,
    preparation_time_minutes: 40,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574113817_pk81k_12463.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1789574113817_pk81k_12463.jpg'],
    popular: true,
    is_active: true,
    display_order: 7,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 599 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 899 },
    ],
  },

  // 8. ORDER SEPARATELY: Signature Mint Raita (FIRST / ABOVE)
  {
    id: 'sep-mint-raita',
    name: 'Signature Mint Raita',
    tagline: 'Cooling Refreshment',
    description: 'Cooling, refreshing & made fresh in-house.',
    category: 'order-separately',
    badge: '200 ml',
    is_veg: true,
    is_jain: true,
    spicy_level: 1,
    preparation_time_minutes: 10,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790680162153_oqd2j_15011.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790680162153_oqd2j_15011.jpg'],
    popular: true,
    is_active: true,
    display_order: 8,
    sizes: [
      { name: '200 ml', portion: '200 ml', serves: 'Serves 1-2', price: 69 },
    ],
  },
  // 9. ORDER SEPARATELY: The Perfect Pair (SECOND / BELOW - Combined Image showing both)
  {
    id: 'sep-perfect-pair',
    name: 'The Perfect Pair',
    tagline: 'Signature Mint Raita + The Encore',
    description: 'Both, together — because one\'s never quite enough.',
    category: 'order-separately',
    badge: 'Combo Special',
    is_veg: true,
    is_jain: true,
    spicy_level: 1,
    preparation_time_minutes: 15,
    image_url: '/images/the-perfect-pair.jpg',
    images: ['/images/the-perfect-pair.jpg'],
    popular: true,
    is_active: true,
    display_order: 9,
    sizes: [
      { name: 'Pair (200ml Raita + 4 pcs Shahi Tukda)', portion: 'Pair', serves: 'Serves 1-2', price: 169 },
    ],
  },
  // 10. ORDER SEPARATELY: The Encore (Shahi Tukda) - kept in data but inactive to keep only Raita and The Perfect Pair in add-ons
  {
    id: 'sep-shahi-tukda',
    name: 'The Encore (Shahi Tukda)',
    tagline: 'Warm & Buttery Dessert',
    description: 'Warm, buttery & made to melt in every bite.',
    category: 'order-separately',
    badge: '4 pcs',
    is_veg: true,
    is_jain: true,
    spicy_level: 1,
    preparation_time_minutes: 15,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696707994_tyfch_15044.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696707994_tyfch_15044.jpg'],
    popular: false,
    is_active: false,
    display_order: 10,
    sizes: [
      { name: '4 pcs', portion: '4 pcs', serves: 'Serves 1-2', price: 119 },
    ],
  },

  // ==========================================================================
  // 100% JAIN SATVIK BIRYANI (4 authentic options without onion, garlic, or root vegetables)
  // ==========================================================================
  // 1. Jain Veg Biryani (synced with Veg Biryani)
  {
    id: 'biryani-jain-veg',
    name: 'Jain Veg Biryani',
    tagline: '100% Satvik Dum Feast',
    description: 'Pure Jain-friendly seasonal vegetables layered with saffron Basmati, slow-steamed without onion or garlic in accordance with strict satvik principles.',
    category: 'biryani',
    badge: '100% Jain Satvik',
    is_veg: true,
    is_jain: true,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696948256_98cw1_12457.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696948256_98cw1_12457.jpg'],
    popular: true,
    is_active: true,
    display_order: 11,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 2. Jain Chaap Pieces Biryani (synced with Chaap Pieces Biryani)
  {
    id: 'biryani-jain-chaap',
    name: 'Jain Chaap Pieces Biryani',
    tagline: '100% Satvik Dum Feast',
    description: 'Tender soya chaap pieces marinated in house satvik spices, layered with golden dum rice. Pure comfort food without onion or garlic.',
    category: 'biryani',
    badge: '100% Jain Satvik',
    is_veg: true,
    is_jain: true,
    spicy_level: 2,
    preparation_time_minutes: 40,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696889193_vl4d2_12472.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696889193_vl4d2_12472.jpg'],
    popular: true,
    is_active: true,
    display_order: 12,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 3. Jain Chaap Whole Biryani (synced with Chaap Whole Biryani)
  {
    id: 'biryani-jain-whole-chaap',
    name: 'Jain Chaap Whole Biryani',
    tagline: '100% Satvik Dum Feast',
    description: 'Whole soya chaap marinated in pure satvik blend, slow dum-cooked with fragrant long-grain Basmati without onion or garlic.',
    category: 'biryani',
    badge: '100% Jain Satvik',
    is_veg: true,
    is_jain: true,
    spicy_level: 2,
    preparation_time_minutes: 40,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696925772_kwuo6_12460.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696925772_kwuo6_12460.jpg'],
    popular: true,
    is_active: true,
    display_order: 13,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 469 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 649 },
    ],
  },
  // 4. Jain Paneer Biryani (synced with Paneer Biryani)
  {
    id: 'biryani-jain-paneer',
    name: 'Jain Paneer Biryani',
    tagline: '100% Satvik Dum Feast',
    description: 'Fresh malai paneer cubes marinated in satvik whole spices and saffron milk, slow-steamed on royal dum without onion or garlic.',
    category: 'biryani',
    badge: '100% Jain Satvik',
    is_veg: true,
    is_jain: true,
    spicy_level: 2,
    preparation_time_minutes: 35,
    image_url: 'https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696972091_4thvx_12475.jpg',
    images: ['https://vjfoacxdihwseoeorohg.supabase.co/storage/v1/object/public/restaurant_assets/products/1790696972091_4thvx_12475.jpg'],
    popular: true,
    is_active: true,
    display_order: 14,
    sizes: [
      { name: '500g', portion: '500g', serves: 'Serves 1-2', price: 479 },
      { name: '1kg', portion: '1kg', serves: 'Serves 2-3', price: 679 },
    ],
  },
];

export const EXTRA_ITEMS: ExtraItem[] = [
  { id: 'extra-mint-raita', name: 'Signature Mint Raita (200 ml)', price: 69 },
  { id: 'extra-perfect-pair', name: 'The Perfect Pair (Raita + Shahi Tukda)', price: 169 },
];
