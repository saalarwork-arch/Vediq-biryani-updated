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

declare global {
  interface Window {
    google?: any;
    initGoogleMapsAutocomplete?: () => void;
  }
}

export default function GoogleAddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onValidationChange,
  required = true,
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [validationState, setValidationState] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    message: string;
    zoneName?: string;
  }>({
    status: 'idle',
    message: '',
  });

  const apiKey = getGoogleMapsApiKey();

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddressSelectRef = useRef(onAddressSelect);
  onAddressSelectRef.current = onAddressSelect;
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  // Load Google Maps JavaScript API with Places library
  useEffect(() => {
    if (!apiKey) {
      console.warn('[Vediq] Google Maps API key is not configured.');
      return;
    }

    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&region=IN&language=en`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('[Vediq] Google Maps script failed to load.');
    };
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize Autocomplete once script and input are ready
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    try {
      // Delhi NCR Geographic Bounds bias
      const delhiNcrBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(28.15, 76.75), // Southwest
        new window.google.maps.LatLng(28.95, 77.65) // Northeast
      );

      const options = {
        bounds: delhiNcrBounds,
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
        strictBounds: false,
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      );
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry) {
          // User pressed enter on raw text without selecting
          handleRawAddressValidationRef.current(inputRef.current?.value || '');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';

        // Extract components
        let city = '';
        let state = '';
        let pincode = '';

        if (place.address_components) {
          for (const comp of place.address_components) {
            const types = comp.types;
            if (types.includes('locality')) {
              city = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = comp.long_name;
            } else if (types.includes('postal_code')) {
              pincode = comp.long_name;
            }
          }
        }

        // Validate coordinates against Delhi NCR boundary
        const isDeliverable = isCoordinateInDelhiNcr(lat, lng);

        onChangeRef.current(formattedAddress);

        if (isDeliverable) {
          setValidationState({
            status: 'valid',
            message: '✓ Delivery Available in Delhi NCR',
            zoneName: city ? `${city}, Delhi NCR` : 'Delhi NCR Region',
          });
          onAddressSelectRef.current({
            fullAddress: formattedAddress,
            lat,
            lng,
            city,
            state,
            pincode,
            isValidDeliveryArea: true,
          });
          if (onValidationChangeRef.current) onValidationChangeRef.current(true);
        } else {
          setValidationState({
            status: 'invalid',
            message: DELHI_NCR_UNSUPPORTED_MESSAGE,
          });
          onAddressSelectRef.current({
            fullAddress: formattedAddress,
            lat,
            lng,
            city,
            state,
            pincode,
            isValidDeliveryArea: false,
          });
          if (onValidationChangeRef.current) onValidationChangeRef.current(false);
        }
      });
    } catch (err) {
      console.warn('[Vediq] Autocomplete initialization error:', err);
    }
  }, [isScriptLoaded]);

  // Fallback / manual address validation
  const handleRawAddressValidation = useCallback(async (text: string) => {
    if (!text.trim()) {
      setValidationState({ status: 'idle', message: '' });
      if (onValidationChangeRef.current) onValidationChangeRef.current(false);
      return;
    }

    const res = await validateDeliveryAddress({ address: text });
    if (res.isValid) {
      setValidationState({
        status: 'valid',
        message: '✓ Delivery Available in Delhi NCR',
        zoneName: res.matchedZone || 'Delhi NCR',
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

  const handleRawAddressValidationRef = useRef(handleRawAddressValidation);
  handleRawAddressValidationRef.current = handleRawAddressValidation;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-800">
          Delivery Address (Delhi NCR Only) *
        </label>
        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          Delhi NCR Coverage
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <MapPin className="w-4 h-4 text-[#C59A3F]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Real-time validation for manual typing
            if (e.target.value.length >= 4) {
              handleRawAddressValidation(e.target.value);
            } else if (e.target.value.length === 0) {
              setValidationState({ status: 'idle', message: '' });
              if (onValidationChange) onValidationChange(false);
            }
          }}
          placeholder="Search colony, society, street or sector in Delhi, Noida, Gurgaon..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C59A3F] focus:ring-2 focus:ring-[#C59A3F]/20 shadow-xs transition"
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setValidationState({ status: 'idle', message: '' });
              if (onValidationChange) onValidationChange(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Validation Status Indicator */}
      {validationState.status === 'valid' && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{validationState.message}</span>
          </div>
          {validationState.zoneName && (
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-800 font-bold">
              {validationState.zoneName}
            </span>
          )}
        </div>
      )}

      {validationState.status === 'invalid' && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{validationState.message}</p>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
              We currently accept royal biryani orders only across <strong>Delhi NCT, Noida, Greater Noida, Gurugram, Faridabad, and Ghaziabad</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
