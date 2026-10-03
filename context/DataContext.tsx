'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  MenuItem,
  CustomerOrder,
  CategoryItem,
  GalleryItem,
  HeroContent,
  SiteSettings,
  OfferItem,
  MediaItem,
} from '@/types/supabase';
import {
  MENU_ITEMS,
  DEFAULT_CATEGORIES,
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_HERO_CONTENT,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_OFFERS,
  syncAndNormalizeMenu,
  REGULAR_TO_JAIN_MAP,
  JAIN_TO_REGULAR_MAP,
} from '@/data/menuData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { resolveImageUrl } from '@/lib/storageUpload';

interface DataContextType {
  // Products
  menuItems: MenuItem[];
  filteredMenuItems: MenuItem[];
  saveMenuItem: (item: MenuItem) => Promise<{ success: boolean; error?: string }>;
  deleteMenuItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleMenuItemActive: (id: string, active: boolean) => Promise<{ success: boolean; error?: string }>;

  // Categories
  categories: CategoryItem[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  saveCategory: (category: CategoryItem) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Gallery / Portfolio
  galleryItems: GalleryItem[];
  saveGalleryItem: (item: GalleryItem) => Promise<{ success: boolean; error?: string }>;
  deleteGalleryItem: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Hero Content
  heroContent: HeroContent;
  saveHeroContent: (content: HeroContent) => Promise<{ success: boolean; error?: string }>;

  // Site Settings
  siteSettings: SiteSettings;
  saveSiteSettings: (settings: SiteSettings) => Promise<{ success: boolean; error?: string }>;

  // Offers
  offers: OfferItem[];
  saveOffer: (offer: OfferItem) => Promise<{ success: boolean; error?: string }>;
  deleteOffer: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Media
  mediaItems: MediaItem[];
  addMediaItem: (item: MediaItem) => void;
  deleteMediaItem: (id: string) => void;

  // Filters & Public UI
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isVegOnly: boolean;
  setIsVegOnly: (val: boolean) => void;
  isJainOnly: boolean;
  setIsJainOnly: (val: boolean) => void;
  trackOrderModalOpen: boolean;
  setTrackOrderModalOpen: (open: boolean) => void;
  activeTrackingOrderNumber: string;
  setActiveTrackingOrderNumber: (num: string) => void;
  orderSuccessData: CustomerOrder | null;
  setOrderSuccessData: (order: CustomerOrder | null) => void;

  // Refresh
  refreshAllData: () => Promise<void>;
  isLoadingData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [offers, setOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [isJainOnly, setIsJainOnly] = useState<boolean>(false);
  const [trackOrderModalOpen, setTrackOrderModalOpen] = useState<boolean>(false);
  const [activeTrackingOrderNumber, setActiveTrackingOrderNumber] = useState<string>('');
  const [orderSuccessData, setOrderSuccessData] = useState<CustomerOrder | null>(null);

  // --------------------------------------------------------------------------
  // Initialize from LocalStorage (fast hydrate) & Seed Initial Media
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      const MENU_VERSION_KEY = 'vediq_menu_v11_exact_4_jain_and_raita_first_pair_second';
      const storedVersion = localStorage.getItem(MENU_VERSION_KEY);

      if (storedVersion !== 'true') {
        // Enforce fresh menu data replacement with synced catalog and correct add-ons order
        const syncedDefaults = syncAndNormalizeMenu(MENU_ITEMS);
        localStorage.removeItem('vediq_cms_menu');
        localStorage.removeItem('vediq_cms_categories');
        localStorage.setItem(MENU_VERSION_KEY, 'true');
        localStorage.setItem('vediq_cms_menu', JSON.stringify(syncedDefaults));
        localStorage.setItem('vediq_cms_categories', JSON.stringify(DEFAULT_CATEGORIES));
        setMenuItems(syncedDefaults);
        setCategories(DEFAULT_CATEGORIES);
      } else {
        const storedMenu = localStorage.getItem('vediq_cms_menu');
        if (storedMenu) {
          const parsed = JSON.parse(storedMenu);
          // Safety check: ensure 4 authentic jain items and add-ons are correctly normalized
          const hasJainVeg = parsed.some((item: any) => item.id === 'biryani-jain-veg');
          const hasPerfectPair = parsed.some((item: any) => item.id === 'sep-perfect-pair');
          const hasJainAloo = parsed.some((item: any) => item.id === 'biryani-jain-aloo');
          if (!hasJainVeg || !hasPerfectPair || hasJainAloo) {
            const synced = syncAndNormalizeMenu(MENU_ITEMS);
            setMenuItems(synced);
            localStorage.setItem('vediq_cms_menu', JSON.stringify(synced));
          } else {
            const normalizedStored = syncAndNormalizeMenu(parsed);
            setMenuItems(normalizedStored);
          }
        } else {
          setMenuItems(syncAndNormalizeMenu(MENU_ITEMS));
        }

        const storedCats = localStorage.getItem('vediq_cms_categories');
        if (storedCats) {
          setCategories(JSON.parse(storedCats));
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      }

      const storedGallery = localStorage.getItem('vediq_cms_gallery');
      if (storedGallery) setGalleryItems(JSON.parse(storedGallery));

      const storedHero = localStorage.getItem('vediq_cms_hero');
      if (storedHero) setHeroContent(JSON.parse(storedHero));

      const storedSettings = localStorage.getItem('vediq_cms_settings');
      if (storedSettings) setSiteSettings(JSON.parse(storedSettings));

      const storedOffers = localStorage.getItem('vediq_cms_offers');
      if (storedOffers) setOffers(JSON.parse(storedOffers));

      const storedMedia = localStorage.getItem('vediq_cms_media');
      if (storedMedia) {
        setMediaItems(JSON.parse(storedMedia));
      } else {
        // Collect existing default images for initial media library
        const initialMedia: MediaItem[] = [
          {
            id: 'med-hero-1',
            name: 'Royal Shahi Dum Handi (Hero)',
            url: DEFAULT_HERO_CONTENT.hero_image_url,
            category: 'hero',
            created_at: new Date().toISOString(),
          },
          ...MENU_ITEMS.map((item, idx) => ({
            id: `med-prod-${idx}`,
            name: `${item.name} Dish`,
            url: item.image_url,
            category: 'product',
            created_at: new Date().toISOString(),
          })),
          ...DEFAULT_GALLERY_ITEMS.map((g) => ({
            id: `med-gal-${g.id}`,
            name: g.title,
            url: g.image_url,
            category: 'gallery',
            created_at: new Date().toISOString(),
          })),
        ];
        setMediaItems(initialMedia);
      }
    } catch (e) {
      console.error('LocalStorage hydration error:', e);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Fetch from Supabase (if configured and tables exist)
  // --------------------------------------------------------------------------
  const refreshAllData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setIsLoadingData(true);

    try {
      // 1. Fetch menu items
      const { data: menuData, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (!menuErr && menuData && menuData.length > 0) {
        const normalized = (menuData as any[]).map((item) => {
          const resolvedPrimary = resolveImageUrl(item.image_url, item.images);
          const resolvedImages = Array.isArray(item.images) && item.images.length > 0
            ? item.images.map((img: string) => resolveImageUrl(img))
            : (resolvedPrimary ? [resolvedPrimary] : []);
          return {
            ...item,
            image_url: resolvedPrimary,
            images: resolvedImages,
          };
        });
        // Merge any items from MENU_ITEMS not yet stored in Supabase
        const dbIds = new Set(normalized.map((i: any) => i.id));
        const missingDefaults = MENU_ITEMS.filter((item) => !dbIds.has(item.id));
        const rawFullMenu = [...normalized, ...missingDefaults];
        const fullMenu = syncAndNormalizeMenu(rawFullMenu as MenuItem[]);

        setMenuItems(fullMenu);
        localStorage.setItem('vediq_cms_menu', JSON.stringify(fullMenu));
      }

      // 2. Fetch categories
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (!catErr && catData && catData.length > 0) {
        setCategories(catData as unknown as CategoryItem[]);
        localStorage.setItem('vediq_cms_categories', JSON.stringify(catData));
      }

      // 3. Fetch gallery items
      const { data: galData, error: galErr } = await supabase
        .from('gallery_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (!galErr && galData && galData.length > 0) {
        const normalizedGal = (galData as any[]).map((item) => ({
          ...item,
          image_url: resolveImageUrl(item.image_url),
        }));
        setGalleryItems(normalizedGal as GalleryItem[]);
        localStorage.setItem('vediq_cms_gallery', JSON.stringify(normalizedGal));
      }

      // 4. Fetch hero content
      const { data: heroData, error: heroErr } = await supabase
        .from('hero_content')
        .select('*')
        .eq('id', 'main_hero')
        .maybeSingle();
      if (!heroErr && heroData) {
        setHeroContent(heroData as unknown as HeroContent);
        localStorage.setItem('vediq_cms_hero', JSON.stringify(heroData));
      }

      // 5. Fetch site settings
      const { data: settsData, error: settsErr } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'main_settings')
        .maybeSingle();
      if (!settsErr && settsData) {
        setSiteSettings(settsData as unknown as SiteSettings);
        localStorage.setItem('vediq_cms_settings', JSON.stringify(settsData));
      }

      // 6. Fetch offers
      const { data: offersData, error: offersErr } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!offersErr && offersData && offersData.length > 0) {
        setOffers(offersData as unknown as OfferItem[]);
        localStorage.setItem('vediq_cms_offers', JSON.stringify(offersData));
      }
    } catch (err) {
      console.warn('Data sync with Supabase skipped or completed with defaults:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // --------------------------------------------------------------------------
  // CMS MUTATION HELPERS (Syncs to Supabase + LocalStorage)
  // --------------------------------------------------------------------------

  // Save / Update Menu Item
  const saveMenuItem = async (item: MenuItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const rawPrimary = (item.image_url || (Array.isArray(item.images) ? item.images[0] : '') || '').trim();
      const rawImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (rawPrimary ? [rawPrimary] : []);

      const resolvedPrimary = resolveImageUrl(rawPrimary, rawImages);
      let resolvedImages = rawImages.map((img) => resolveImageUrl(img));

      // Guarantee resolvedImages[0] matches resolvedPrimary
      if (resolvedPrimary && (resolvedImages.length === 0 || resolvedImages[0] !== resolvedPrimary)) {
        resolvedImages = [resolvedPrimary, ...resolvedImages.filter((img) => img !== resolvedPrimary)];
      }

      const cleanItem: MenuItem = {
        ...item,
        image_url: resolvedPrimary,
        images: resolvedImages,
      };

      // Optimistically update local state & LocalStorage with price sync
      setMenuItems((prev) => {
        const correspondingJainId = !cleanItem.is_jain ? REGULAR_TO_JAIN_MAP[cleanItem.id] : undefined;
        const exists = prev.some((m) => m.id === cleanItem.id);
        let updated = exists
          ? prev.map((m) => (m.id === cleanItem.id ? { ...cleanItem, updated_at: new Date().toISOString() } : m))
          : [{ ...cleanItem, created_at: new Date().toISOString() }, ...prev];

        // Enforce price sync for corresponding Jain biryani
        if (correspondingJainId && cleanItem.sizes && cleanItem.sizes.length > 0) {
          updated = updated.map((m) =>
            m.id === correspondingJainId
              ? {
                  ...m,
                  sizes: JSON.parse(JSON.stringify(cleanItem.sizes)),
                  updated_at: new Date().toISOString(),
                }
              : m
          );
        }

        const normalized = syncAndNormalizeMenu(updated);
        try {
          localStorage.setItem('vediq_cms_menu', JSON.stringify(normalized));
        } catch {}
        return normalized;
      });

      if (isSupabaseConfigured()) {
        const payload = {
          id: cleanItem.id,
          name: cleanItem.name,
          tagline: cleanItem.tagline || '',
          description: cleanItem.description || '',
          category: cleanItem.category,
          badge: cleanItem.badge || '',
          is_veg: cleanItem.is_veg,
          is_jain: cleanItem.is_jain,
          spicy_level: cleanItem.spicy_level || 2,
          preparation_time_minutes: cleanItem.preparation_time_minutes || 30,
          image_url: cleanItem.image_url,
          images: cleanItem.images,
          sizes: cleanItem.sizes,
          popular: Boolean(cleanItem.popular),
          is_active: cleanItem.is_active !== false,
          display_order: cleanItem.display_order || 0,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('menu_items').upsert(payload);

        if (error) {
          console.error('[saveMenuItem] Supabase upsert error:', error.message);
          return { success: false, error: `Database save failed: ${error.message}` };
        }

        // Also sync price to corresponding Jain counterpart in database
        const correspondingJainId = !cleanItem.is_jain ? REGULAR_TO_JAIN_MAP[cleanItem.id] : undefined;
        if (correspondingJainId && cleanItem.sizes && cleanItem.sizes.length > 0) {
          try {
            await supabase.from('menu_items').update({
              sizes: cleanItem.sizes,
              updated_at: new Date().toISOString(),
            }).eq('id', correspondingJainId);
          } catch (syncErr) {
            console.warn('[saveMenuItem] Warning syncing Jain price to DB:', syncErr);
          }
        }

        // Re-query database record to verify database persistence & update local state with saved record
        const { data: freshItem, error: fetchErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', cleanItem.id)
          .maybeSingle();

        if (fetchErr || !freshItem) {
          console.warn('[saveMenuItem] Could not re-fetch updated product from Supabase:', fetchErr?.message);
        } else {
          let parsedImages: string[] = [];
          if (Array.isArray(freshItem.images)) {
            parsedImages = freshItem.images.map((img: string) => resolveImageUrl(img));
          } else if (typeof freshItem.images === 'string') {
            try {
              const jsonParsed = JSON.parse(freshItem.images);
              if (Array.isArray(jsonParsed)) {
                parsedImages = jsonParsed.map((img: string) => resolveImageUrl(img));
              }
            } catch {
              parsedImages = [resolveImageUrl(freshItem.images)];
            }
          }

          const freshPrimary = resolveImageUrl(freshItem.image_url, parsedImages);
          if (parsedImages.length === 0 && freshPrimary) {
            parsedImages = [freshPrimary];
          }

          const freshNormalized: MenuItem = {
            ...(freshItem as any),
            image_url: freshPrimary,
            images: parsedImages,
          };

          // Verify saved database data contains the new image reference
          const freshImagesArr = freshNormalized.images || [];
          if (freshNormalized.image_url !== cleanItem.image_url && !freshImagesArr.includes(cleanItem.image_url)) {
            console.error('[saveMenuItem] Saved product in database does not match new image reference!', {
              expected: cleanItem.image_url,
              receivedInDb: freshNormalized.image_url,
            });
            return {
              success: false,
              error: 'Database save completed, but saved data did not contain the new image reference.',
            };
          }

          setMenuItems((prev) => {
            const updated = prev.map((m) => (m.id === freshNormalized.id ? freshNormalized : m));
            try {
              localStorage.setItem('vediq_cms_menu', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save product' };
    }
  };

  // Delete Menu Item
  const deleteMenuItem = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = menuItems.filter((m) => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('vediq_cms_menu', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('menu_items').delete().eq('id', id);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete product' };
    }
  };

  // Toggle Menu Item Active
  const toggleMenuItemActive = async (id: string, active: boolean): Promise<{ success: boolean; error?: string }> => {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return { success: false, error: 'Product not found' };
    return saveMenuItem({ ...item, is_active: active });
  };

  // Save / Update Category
  const saveCategory = async (category: CategoryItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = categories.some((c) => c.id === category.id)
        ? categories.map((c) => (c.id === category.id ? category : c))
        : [...categories, category];

      setCategories(updated);
      localStorage.setItem('vediq_cms_categories', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('categories').upsert(category);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save category' };
    }
  };

  // Delete Category
  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (id === 'all') {
        return { success: false, error: 'Cannot delete default "All Delights" category' };
      }
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      localStorage.setItem('vediq_cms_categories', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('categories').delete().eq('id', id);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete category' };
    }
  };

  // Save / Update Gallery Item
  const saveGalleryItem = async (item: GalleryItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanItem: GalleryItem = {
        ...item,
        image_url: resolveImageUrl(item.image_url),
      };

      const updated = galleryItems.some((g) => g.id === cleanItem.id)
        ? galleryItems.map((g) => (g.id === cleanItem.id ? cleanItem : g))
        : [...galleryItems, cleanItem];

      setGalleryItems(updated);
      localStorage.setItem('vediq_cms_gallery', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('gallery_items').upsert(cleanItem);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save gallery item' };
    }
  };

  // Delete Gallery Item
  const deleteGalleryItem = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = galleryItems.filter((g) => g.id !== id);
      setGalleryItems(updated);
      localStorage.setItem('vediq_cms_gallery', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('gallery_items').delete().eq('id', id);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete gallery item' };
    }
  };

  // Save Hero Content
  const saveHeroContent = async (content: HeroContent): Promise<{ success: boolean; error?: string }> => {
    try {
      const heroPayload = { ...content, id: 'main_hero' };
      setHeroContent(heroPayload);
      localStorage.setItem('vediq_cms_hero', JSON.stringify(heroPayload));

      if (isSupabaseConfigured()) {
        await supabase.from('hero_content').upsert(heroPayload);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save hero content' };
    }
  };

  // Save Site Settings
  const saveSiteSettings = async (settings: SiteSettings): Promise<{ success: boolean; error?: string }> => {
    try {
      const settingsPayload = { ...settings, id: 'main_settings' };
      setSiteSettings(settingsPayload);
      localStorage.setItem('vediq_cms_settings', JSON.stringify(settingsPayload));

      if (isSupabaseConfigured()) {
        await supabase.from('site_settings').upsert(settingsPayload);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save site settings' };
    }
  };

  // Save / Update Offer
  const saveOffer = async (offer: OfferItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = offers.some((o) => o.id === offer.id)
        ? offers.map((o) => (o.id === offer.id ? offer : o))
        : [offer, ...offers];

      setOffers(updated);
      localStorage.setItem('vediq_cms_offers', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('offers').upsert(offer);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to save offer' };
    }
  };

  // Delete Offer
  const deleteOffer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = offers.filter((o) => o.id !== id);
      setOffers(updated);
      localStorage.setItem('vediq_cms_offers', JSON.stringify(updated));

      if (isSupabaseConfigured()) {
        await supabase.from('offers').delete().eq('id', id);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to delete offer' };
    }
  };

  // Media Library Helpers
  const addMediaItem = (item: MediaItem) => {
    const updated = [item, ...mediaItems];
    setMediaItems(updated);
    try {
      localStorage.setItem('vediq_cms_media', JSON.stringify(updated));
    } catch {}
  };

  const deleteMediaItem = (id: string) => {
    const updated = mediaItems.filter((m) => m.id !== id);
    setMediaItems(updated);
    try {
      localStorage.setItem('vediq_cms_media', JSON.stringify(updated));
    } catch {}
  };

  // --------------------------------------------------------------------------
  // Public Menu Filtering (Only Active Products on Customer Site)
  // --------------------------------------------------------------------------
  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        // Must be active for public menu
        if (item.is_active === false) {
          return false;
        }
        // Hide complimentary items from the main menu catalog
        if (
          item.category === 'included-with-biryani' ||
          item.id.startsWith('inc-') ||
          item.badge?.toLowerCase() === 'complimentary'
        ) {
          return false;
        }
        // The main catalog strictly displays regular biryanis and add-ons.
        // Jain Satvik biryanis are exclusively displayed in the dedicated "100% Jain Satvik Biryani" section.
        if (item.is_jain && item.category === 'biryani') {
          return false;
        }
        // Ensure separate Jain Satvik Raita item remains completely REMOVED
        if (
          item.id === 'sep-jain-raita' ||
          item.id === 'sep-jain-mint-raita' ||
          (item.name?.toLowerCase().includes('jain') && item.name?.toLowerCase().includes('raita'))
        ) {
          return false;
        }
        // Shahi Tukda is part of The Perfect Pair combo, never a standalone product card
        if (
          item.id === 'sep-shahi-tukda' ||
          item.id === 'extra-shahi-tukda' ||
          item.name?.toLowerCase().includes('shahi tukda')
        ) {
          return false;
        }
        // Category filter
        if (activeCategory !== 'all' && item.category !== activeCategory) {
          return false;
        }
        // Veg filter
        if (isVegOnly && !item.is_veg) {
          return false;
        }
        // Search filter
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchName = item.name.toLowerCase().includes(term);
          const matchTagline = item.tagline?.toLowerCase().includes(term);
          const matchDesc = item.description?.toLowerCase().includes(term);
          if (!matchName && !matchTagline && !matchDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [menuItems, activeCategory, isVegOnly, searchTerm]);

  return (
    <DataContext.Provider
      value={{
        // Products
        menuItems,
        filteredMenuItems,
        saveMenuItem,
        deleteMenuItem,
        toggleMenuItemActive,

        // Categories
        categories,
        activeCategory,
        setActiveCategory,
        saveCategory,
        deleteCategory,

        // Gallery
        galleryItems,
        saveGalleryItem,
        deleteGalleryItem,

        // Hero
        heroContent,
        saveHeroContent,

        // Site Settings
        siteSettings,
        saveSiteSettings,

        // Offers
        offers,
        saveOffer,
        deleteOffer,

        // Media
        mediaItems,
        addMediaItem,
        deleteMediaItem,

        // Filters & Modals
        searchTerm,
        setSearchTerm,
        isVegOnly,
        setIsVegOnly,
        isJainOnly,
        setIsJainOnly,
        trackOrderModalOpen,
        setTrackOrderModalOpen,
        activeTrackingOrderNumber,
        setActiveTrackingOrderNumber,
        orderSuccessData,
        setOrderSuccessData,

        // Refresh
        refreshAllData,
        isLoadingData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

