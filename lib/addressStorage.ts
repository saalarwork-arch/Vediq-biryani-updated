import { SavedDeliveryAddress, AddressTag } from '@/types/supabase';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isCoordinateInDelhiNcr } from './delhiNcrValidation';

const STORAGE_KEY = 'vediq_saved_addresses';

export const INITIAL_SAVED_ADDRESSES: SavedDeliveryAddress[] = [
  {
    id: 'addr-home-1',
    tag: 'Home',
    house_building: 'Flat 402, Royal Palms, Tower C',
    road_area_colony: 'Ahinsa Khand 2, Indirapuram',
    landmark: 'Near DPS Indirapuram',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201014',
    formatted_address: 'Ahinsa Khand 2, Indirapuram, Ghaziabad, Uttar Pradesh 201014',
    latitude: 28.6415,
    longitude: 77.3712,
    delivery_instructions: 'Please ring bell and leave with security guard if unavailable.',
    is_default: true,
    is_delhi_ncr: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'addr-work-2',
    tag: 'Work',
    house_building: 'Suite 601, Statesman House, 6th Floor',
    road_area_colony: 'Barakhamba Road, Connaught Place',
    landmark: 'Near Barakhamba Metro Gate 3',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    formatted_address: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi 110001',
    latitude: 28.6304,
    longitude: 77.2273,
    delivery_instructions: 'Handover at reception desk on 6th floor.',
    is_default: false,
    is_delhi_ncr: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

/**
 * Retrieve saved delivery addresses from localStorage and Supabase
 */
export async function getSavedAddresses(): Promise<SavedDeliveryAddress[]> {
  let localList: SavedDeliveryAddress[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localList = JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    if (!localList || localList.length === 0) {
      localList = INITIAL_SAVED_ADDRESSES;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));
      } catch {
        // ignore
      }
    }
  }

  // If Supabase configured, attempt to sync/fetch
  if (isSupabaseConfigured()) {
    try {
      const { data: remoteData, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(remoteData) && remoteData.length > 0) {
        // Merge without duplicate IDs
        const remoteIds = new Set(remoteData.map((r: any) => r.id));
        const merged = [
          ...remoteData,
          ...localList.filter((l) => !remoteIds.has(l.id)),
        ];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch {
      // ignore table absence or network error
    }
  }

  return localList;
}

/**
 * Save or update a delivery address
 */
export async function saveDeliveryAddress(
  addr: Omit<SavedDeliveryAddress, 'id' | 'created_at'> & { id?: string }
): Promise<SavedDeliveryAddress> {
  const existingList = await getSavedAddresses();
  const nowIso = new Date().toISOString();

  const id = addr.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `addr-${Date.now()}`);

  const completeRecord: SavedDeliveryAddress = {
    ...addr,
    id,
    is_delhi_ncr: isCoordinateInDelhiNcr(addr.latitude, addr.longitude),
    created_at: nowIso,
    updated_at: nowIso,
  };

  // If this address is set as default, clear default flag from others
  const updatedList = existingList
    .map((item) => {
      if (item.id === id) return completeRecord;
      if (completeRecord.is_default) return { ...item, is_default: false };
      return item;
    });

  const exists = existingList.some((item) => item.id === id);
  const finalList = exists ? updatedList : [completeRecord, ...updatedList];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalList));
  }

  // Sync to Supabase if available
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('customer_addresses')
        .upsert([completeRecord]);
    } catch {
      // ignore
    }
  }

  return completeRecord;
}

/**
 * Delete a saved address by ID
 */
export async function deleteDeliveryAddress(id: string): Promise<void> {
  const existingList = await getSavedAddresses();
  const filtered = existingList.filter((a) => a.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);
    } catch {
      // ignore
    }
  }
}

/**
 * Reverse geocode coordinates using modern Geocoding REST API proxy
 * (Complies with Google Maps Zero-Legacy mandate by avoiding deprecated JS Geocoder class)
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{
  formatted_address: string;
  road_area_colony?: string;
  city?: string;
  state?: string;
  pincode?: string;
}> {
  // 1. Fetch via Server-side Geocoding REST API proxy (avoids CORS and legacy JS class errors)
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'OK' && json.results?.length > 0) {
        const top = json.results[0];
        let roadArea = '';
        let city = '';
        let state = '';
        let pincode = '';

        top.address_components.forEach((comp: any) => {
          const types = comp.types as string[];
          if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            roadArea = comp.long_name;
          } else if (!roadArea && types.includes('route')) {
            roadArea = comp.long_name;
          }
          if (types.includes('locality')) {
            city = comp.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = comp.long_name;
          }
          if (types.includes('postal_code')) {
            pincode = comp.long_name;
          }
        });

        return {
          formatted_address: top.formatted_address,
          road_area_colony: roadArea || undefined,
          city: city || 'Delhi NCR',
          state: state || 'Delhi',
          pincode: pincode || undefined,
        };
      }
    }
  } catch (err) {
    console.warn('[Vediq] /api/geocode proxy error:', err);
  }

  // 2. Fallback coordinate descriptor (graceful fallback)
  return {
    formatted_address: `Pin Location (${lat.toFixed(5)}, ${lng.toFixed(5)}), Delhi NCR`,
    city: 'Delhi NCR',
    state: 'Delhi',
  };
}
