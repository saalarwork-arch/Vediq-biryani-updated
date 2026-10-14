'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Loader2,
  Navigation,
} from 'lucide-react';
import {
  isCoordinateInDelhiNcr,
  validateDeliveryAddress,
  DELHI_NCR_UNSUPPORTED_MESSAGE,
  DELHI_NCR_ANCHORS,
} from '@/lib/delhiNcrValidation';
import { getGoogleMapsApiKey } from '@/lib/googleMapsConfig';

export interface AddressSelectionData {
  fullAddress: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  pincode?: string;
  isValidDeliveryArea: boolean;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect: (data: AddressSelectionData) => void;
  onValidationChange?: (isValid: boolean) => void;
  required?: boolean;
}

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onValidationChange,
  required = true,
}: GoogleAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      lat?: number;
      lng?: number;
      city?: string;
      state?: string;
      pincode?: string;
      place?: any;
    }>
  >([]);
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    message: string;
    zoneName?: string;
  }>({
    status: 'idle',
    message: '',
  });

  const sessionTokenRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddressSelectRef = useRef(onAddressSelect);
  onAddressSelectRef.current = onAddressSelect;
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate raw address
  const handleValidateRaw = useCallback(async (text: string) => {
    if (!text || text.trim().length < 3) {
      setValidationState({ status: 'idle', message: '' });
      if (onValidationChangeRef.current) onValidationChangeRef.current(false);
      return;
    }

    const res = await validateDeliveryAddress({ address: text });
    if (res.isValid) {
      setValidationState({
        status: 'valid',
        message: '✓ Delivery Available in Delhi NCR',
        zoneName: res.matchedZone || 'Delhi NCR Region',
      });
      onAddressSelectRef.current({
        fullAddress: text,
        isValidDeliveryArea: true,
      });
      if (onValidationChangeRef.current) onValidationChangeRef.current(true);
    } else {
      setValidationState({
        status: 'invalid',
        message: DELHI_NCR_UNSUPPORTED_MESSAGE,
      });
      onAddressSelectRef.current({
        fullAddress: text,
        isValidDeliveryArea: false,
      });
      if (onValidationChangeRef.current) onValidationChangeRef.current(false);
    }
  }, []);

  // Search logic: uses Places API (New) if available, otherwise Delhi NCR anchors & localities
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.trim().length < 2) {
      setSuggestions([]);
      setIsOpenSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      // 1. Try modern Places API (New) AutocompleteSuggestion if loaded
      const gPlaces = window.google?.maps?.places;
      if (gPlaces?.AutocompleteSuggestion) {
        if (!sessionTokenRef.current && gPlaces.AutocompleteSessionToken) {
          sessionTokenRef.current = new gPlaces.AutocompleteSessionToken();
        }

        const request: any = {
          input,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['in'],
        };

        const res = await gPlaces.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (res?.suggestions?.length > 0) {
          const mapped = res.suggestions.slice(0, 5).map((s: any, idx: number) => ({
            id: `gmp_sugg_${idx}`,
            title: s.placePrediction?.mainText?.toString() || s.placePrediction?.text?.toString() || '',
            subtitle: s.placePrediction?.secondaryText?.toString() || 'Delhi NCR',
            place: s.placePrediction?.toPlace ? s.placePrediction.toPlace() : null,
          }));

          setSuggestions(mapped);
          setIsOpenSuggestions(true);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // Fall through to Delhi NCR curated anchors
    }

    // 2. Curated Delhi NCR local search (always works, offline/quota-resilient)
    const lower = input.toLowerCase();
    const matched = DELHI_NCR_ANCHORS.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.road.toLowerCase().includes(lower) ||
        a.city.toLowerCase().includes(lower) ||
        a.pincode.includes(lower)
    ).slice(0, 6);

    const fallbackList = matched.map((a, idx) => ({
      id: `local_anchor_${idx}`,
      title: `${a.name}, ${a.road}`,
      subtitle: `${a.city}, ${a.state} ${a.pincode}`,
      lat: a.lat,
      lng: a.lng,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    }));

    setSuggestions(fallbackList);
    setIsOpenSuggestions(fallbackList.length > 0);
    setIsSearching(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
      if (val.length >= 4) {
        handleValidateRaw(val);
      }
    }, 250);
  };

  const handleSelectSuggestion = async (item: (typeof suggestions)[0]) => {
    setIsOpenSuggestions(false);
    let fullAddr = `${item.title}, ${item.subtitle}`;
    let lat = item.lat;
    let lng = item.lng;
    let city = item.city;
    let state = item.state;
    let pincode = item.pincode;

    // If suggestion came from Google Places API (New), fetch fields
    if (item.place) {
      try {
        await item.place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        if (item.place.formattedAddress) {
          fullAddr = item.place.formattedAddress;
        }
        if (item.place.location) {
          lat = typeof item.place.location.lat === 'function' ? item.place.location.lat() : item.place.location.lat;
          lng = typeof item.place.location.lng === 'function' ? item.place.location.lng() : item.place.location.lng;
        }
        if (item.place.addressComponents) {
          for (const comp of item.place.addressComponents) {
            const types = comp.types || [];
            if (types.includes('locality')) city = comp.longText;
            if (types.includes('administrative_area_level_1')) state = comp.longText;
            if (types.includes('postal_code')) pincode = comp.longText;
          }
        }
      } catch (err) {
        console.warn('[Vediq] place.fetchFields error:', err);
      } finally {
        // Reset session token as per GMP best practices
        sessionTokenRef.current = null;
      }
    }

    onChange(fullAddr);

    const isCoordValid = lat && lng ? isCoordinateInDelhiNcr(lat, lng) : true;
    const finalValidation = await validateDeliveryAddress({
      address: fullAddr,
      lat,
      lng,
      city,
      pincode,
    });

    const isValid = isCoordValid && finalValidation.isValid;

    if (isValid) {
      setValidationState({
        status: 'valid',
        message: '✓ Delivery Available in Delhi NCR',
        zoneName: city ? `${city}, Delhi NCR` : 'Delhi NCR',
      });
      onAddressSelect({
        fullAddress: fullAddr,
        lat,
        lng,
        city: city || 'Delhi NCR',
        state: state || 'Delhi',
        pincode,
        isValidDeliveryArea: true,
      });
      if (onValidationChange) onValidationChange(true);
    } else {
      setValidationState({
        status: 'invalid',
        message: DELHI_NCR_UNSUPPORTED_MESSAGE,
      });
      onAddressSelect({
        fullAddress: fullAddr,
        lat,
        lng,
        city,
        state,
        pincode,
        isValidDeliveryArea: false,
      });
      if (onValidationChange) onValidationChange(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-200">
          Delivery Address (Delhi NCR Only) *
        </label>
        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          Delhi NCR Coverage
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <MapPin className="w-4 h-4 text-[#C59A3F]" />
        </div>

        <input
          type="text"
          required={required}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpenSuggestions(true);
          }}
          placeholder="Search colony, sector, landmark in Delhi, Noida, Gurgaon..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0B1728] border border-[#1C2D4A] text-xs text-[#F5F1E8] placeholder-gray-500 focus:outline-none focus:border-[#C59A3F] focus:ring-1 focus:ring-[#C59A3F] shadow-xs transition"
          autoComplete="off"
        />

        {isSearching && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E2C56B]" />
          </div>
        )}

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpenSuggestions(false);
              setValidationState({ status: 'idle', message: '' });
              if (onValidationChange) onValidationChange(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpenSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#0F223D] border border-[#1C2D4A] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#1C2D4A]/50">
          <div className="px-3 py-1.5 bg-[#0B1728] text-[10px] font-bold text-[#AAB4C2] uppercase tracking-wider flex items-center justify-between">
            <span>Suggested Delhi NCR Locations</span>
            <span className="text-[#E2C56B]">Fast Select</span>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#162B4D] transition flex items-start gap-2.5 group cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#C9A24A] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F5F1E8] truncate group-hover:text-[#E2C56B]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#7E8B9B] truncate">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Status Indicator */}
      {validationState.status === 'valid' && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{validationState.message}</span>
          </div>
          {validationState.zoneName && (
            <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 font-bold">
              {validationState.zoneName}
            </span>
          )}
        </div>
      )}

      {validationState.status === 'invalid' && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{validationState.message}</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
              We currently accept royal biryani orders only across{' '}
              <strong>Delhi NCT, Noida, Greater Noida, Gurugram, Faridabad, and Ghaziabad</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
