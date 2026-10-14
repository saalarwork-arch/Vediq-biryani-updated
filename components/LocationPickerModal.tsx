'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Home,
  Briefcase,
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
} from 'lucide-react';
import { SavedDeliveryAddress, AddressTag } from '@/types/supabase';
import { isCoordinateInDelhiNcr, DELHI_NCR_UNSUPPORTED_MESSAGE } from '@/lib/delhiNcrValidation';
import { reverseGeocodeCoordinates, saveDeliveryAddress } from '@/lib/addressStorage';
import InteractiveDeliveryMap from './InteractiveDeliveryMap';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressConfirmed: (address: SavedDeliveryAddress) => void;
  initialAddress?: SavedDeliveryAddress | null;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onAddressConfirmed,
  initialAddress,
}: LocationPickerModalProps) {
  // Step 1: Pinpoint on Map / Search | Step 2: Fill House/Apartment Details
  const [step, setStep] = useState<'map' | 'details'>('map');

  // Search Input & Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // GPS Location State
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Selected Pin Coordinates & Geocoded Data
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialAddress?.latitude || 28.6139,
    lng: initialAddress?.longitude || 77.2090,
  });

  const [geocodedData, setGeocodedData] = useState<{
    formatted_address: string;
    road_area_colony?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isValidDeliveryArea: boolean;
  }>({
    formatted_address: initialAddress?.formatted_address || 'Connaught Place, New Delhi',
    road_area_colony: initialAddress?.road_area_colony || 'Connaught Place',
    city: initialAddress?.city || 'New Delhi',
    state: initialAddress?.state || 'Delhi',
    pincode: initialAddress?.pincode || '110001',
    isValidDeliveryArea: true,
  });

  // Step 2 Detailed Form Fields
  const [houseBuilding, setHouseBuilding] = useState(initialAddress?.house_building || '');
  const [roadArea, setRoadArea] = useState(initialAddress?.road_area_colony || '');
  const [landmark, setLandmark] = useState(initialAddress?.landmark || '');
  const [pincode, setPincode] = useState(initialAddress?.pincode || '');
  const [tag, setTag] = useState<AddressTag>(initialAddress?.tag || 'Home');
  const [customTag, setCustomTag] = useState(initialAddress?.custom_tag || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    initialAddress?.delivery_instructions || ''
  );
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize Places Autocomplete Service on demand
  const getPlacesServices = () => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      if (!placesServiceRef.current) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      }
      return {
        autocomplete: autocompleteServiceRef.current,
        places: placesServiceRef.current,
      };
    }
    return null;
  };

  useEffect(() => {
    getPlacesServices();
  }, []);

  // Update form inputs when geocoded data updates
  useEffect(() => {
    if (geocodedData.road_area_colony && !roadArea) {
      setRoadArea(geocodedData.road_area_colony);
    }
    if (geocodedData.pincode && !pincode) {
      setPincode(geocodedData.pincode);
    }
  }, [geocodedData, roadArea, pincode]);

  if (!isOpen) return null;

  // 1. "Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedCoords({ lat, lng });

        try {
          const geo = await reverseGeocodeCoordinates(lat, lng);
          const isValid = isCoordinateInDelhiNcr(lat, lng);

          setGeocodedData({
            formatted_address: geo.formatted_address,
            road_area_colony: geo.road_area_colony,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            isValidDeliveryArea: isValid,
          });

          if (geo.road_area_colony) setRoadArea(geo.road_area_colony);
          if (geo.pincode) setPincode(geo.pincode);
        } catch {
          // ignore
        } finally {
          setIsLocatingGPS(false);
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            'Location permission denied. Please search your area or drop the pin manually on the map.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('GPS location unavailable. Please search your address manually.');
        } else {
          setGpsError('Unable to fetch GPS coordinates. Please search your area manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 2. Search Query Autocomplete Debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const services = getPlacesServices();
    if (services?.autocomplete) {
      setIsSearching(true);
      // Bias search results to Delhi NCR
      const delhiBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(28.05, 76.65),
        new window.google.maps.LatLng(29.15, 77.85)
      );

      services.autocomplete.getPlacePredictions(
        {
          input: text,
          bounds: delhiBounds,
          componentRestrictions: { country: 'in' },
        },
        (predictions: any, status: any) => {
          setIsSearching(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchSuggestions(predictions);
          } else {
            setSearchSuggestions([]);
          }
        }
      );
    }
  };

  // 3. Select Place Suggestion
  const handleSelectSuggestion = (placeId: string, description: string) => {
    setSearchQuery(description);
    setSearchSuggestions([]);

    const services = getPlacesServices();
    if (services?.places) {
      services.places.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'address_components'] },
        (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setSelectedCoords({ lat, lng });

            const isValid = isCoordinateInDelhiNcr(lat, lng);
            let road = '';
            let city = '';
            let state = '';
            let pin = '';

            (place.address_components || []).forEach((c: any) => {
              if (c.types.includes('sublocality_level_1') || c.types.includes('route')) {
                road = c.long_name;
              }
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pin = c.long_name;
            });

            setGeocodedData({
              formatted_address: place.formatted_address || description,
              road_area_colony: road || undefined,
              city: city || 'Delhi NCR',
              state: state || 'Delhi',
              pincode: pin || undefined,
              isValidDeliveryArea: isValid,
            });

            if (road) setRoadArea(road);
            if (pin) setPincode(pin);
          }
        }
      );
    }
  };

  // 4. Save and Confirm Delivery Address
  const handleFinalSaveAndDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!houseBuilding.trim()) {
      setFormError('Please enter your House / Flat / Floor / Building Number.');
      return;
    }

    if (!roadArea.trim()) {
      setFormError('Please enter your Road / Street / Area Name.');
      return;
    }

    if (!geocodedData.isValidDeliveryArea) {
      setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
      return;
    }

    setIsSaving(true);
    try {
      const formatted = `${houseBuilding.trim()}, ${roadArea.trim()}${
        landmark.trim() ? `, Near ${landmark.trim()}` : ''
      }, ${geocodedData.city || 'Delhi NCR'}${pincode ? ` - ${pincode}` : ''}`;

      const addressPayload = {
        id: initialAddress?.id,
        tag,
        custom_tag: tag === 'Other' ? customTag : undefined,
        house_building: houseBuilding.trim(),
        road_area_colony: roadArea.trim(),
        landmark: landmark.trim() || undefined,
        city: geocodedData.city || 'Delhi NCR',
        state: geocodedData.state || 'Delhi',
        pincode: pincode.trim() || geocodedData.pincode || '110001',
        formatted_address: formatted,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        delivery_instructions: deliveryInstructions.trim() || undefined,
        is_default: true,
        is_delhi_ncr: true,
      };

      if (saveForFuture) {
        await saveDeliveryAddress(addressPayload);
      }

      onAddressConfirmed({
        ...addressPayload,
        id: addressPayload.id || `addr-${Date.now()}`,
        created_at: new Date().toISOString(),
      });

      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save delivery address.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            {step === 'details' && (
              <button
                type="button"
                onClick={() => setStep('map')}
                className="p-1.5 -ml-1 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                title="Back to Map"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-[#C9A24A]/15 text-[#B8860B] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                {step === 'map' ? 'Select Delivery Location' : 'Enter Complete Address'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {step === 'map'
                  ? 'Pinpoint your exact delivery doorstep in Delhi NCR'
                  : 'Add house details for seamless dum delivery'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close location modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {step === 'map' ? (
            <>
              {/* 1. Search Bar & "Use Current Location" Button */}
              <div className="space-y-2.5">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search area, apartment, street, landmark, or pincode..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {searchSuggestions.map((s) => (
                        <button
                          key={s.place_id}
                          type="button"
                          onClick={() => handleSelectSuggestion(s.place_id, s.description)}
                          className="w-full text-left px-4 py-2.5 hover:bg-amber-50/60 border-b border-gray-100 text-xs flex items-start gap-2.5 transition cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {s.structured_formatting?.main_text || s.description}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {s.structured_formatting?.secondary_text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prominent "Use My Current Location" Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocatingGPS}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-[#B8860B] hover:text-[#996515] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                >
                  {isLocatingGPS ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#B8860B]" />
                      <span>Detecting your GPS location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-[#B8860B]" />
                      <span>Use My Current Location (GPS)</span>
                    </>
                  )}
                </button>

                {/* GPS error notice */}
                {gpsError && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{gpsError}</span>
                  </div>
                )}
              </div>

              {/* 2. Interactive Map */}
              <InteractiveDeliveryMap
                initialLat={selectedCoords.lat}
                initialLng={selectedCoords.lng}
                onLocationSelected={(loc) => {
                  setSelectedCoords({ lat: loc.lat, lng: loc.lng });
                  setGeocodedData({
                    formatted_address: loc.formatted_address,
                    road_area_colony: loc.road_area_colony,
                    city: loc.city,
                    state: loc.state,
                    pincode: loc.pincode,
                    isValidDeliveryArea: loc.isValidDeliveryArea,
                  });
                  if (loc.road_area_colony) setRoadArea(loc.road_area_colony);
                  if (loc.pincode) setPincode(loc.pincode);
                }}
              />

              {/* 3. Detected Address Summary Card */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    Delivery Location Selected
                  </span>
                  {geocodedData.isValidDeliveryArea ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delhi NCR Zone</span>
                    </span>
                  ) : (
                    <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Outside Delivery Area</span>
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 leading-relaxed text-xs">
                  {geocodedData.formatted_address}
                </p>
                {!geocodedData.isValidDeliveryArea && (
                  <p className="text-[11px] font-bold text-red-700 pt-1">
                    {DELHI_NCR_UNSUPPORTED_MESSAGE}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Step 2: Fill House/Apartment Details Form */
            <form onSubmit={handleFinalSaveAndDeliver} id="address-details-form" className="space-y-4">
              {/* Confirmed Pin Area Box */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[10px] uppercase text-[#B8860B] tracking-wider">
                    Pinned Delivery Location
                  </span>
                  <p className="text-gray-900 font-medium text-xs">
                    {geocodedData.formatted_address}
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* House / Flat No & Floor */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  House / Flat / Floor / Building Number *
                </label>
                <input
                  type="text"
                  required
                  value={houseBuilding}
                  onChange={(e) => setHouseBuilding(e.target.value)}
                  placeholder="e.g. Flat 402, Tower B, Oberoi Springs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                />
              </div>

              {/* Road / Street / Area */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  Road / Street / Area / Colony *
                </label>
                <input
                  type="text"
                  required
                  value={roadArea}
                  onChange={(e) => setRoadArea(e.target.value)}
                  placeholder="e.g. Ahinsa Khand 2, Indirapuram"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                />
              </div>

              {/* Landmark & Pincode Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Metro Gate 3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Address Tag (Home / Work / Other) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-gray-800">
                  Save Address As
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTag('Home')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      tag === 'Home'
                        ? 'bg-[#C9A24A] text-slate-900 border-[#B8860B] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTag('Work')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      tag === 'Work'
                        ? 'bg-[#C9A24A] text-slate-900 border-[#B8860B] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Work</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTag('Other')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      tag === 'Other'
                        ? 'bg-[#C9A24A] text-slate-900 border-[#B8860B] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Other</span>
                  </button>
                </div>

                {tag === 'Other' && (
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="e.g. Parents' House, Friend's Villa"
                    className="w-full mt-2 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                  />
                )}
              </div>

              {/* Delivery Instructions */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800">
                  Delivery Instructions for Valet (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Ring bell, leave with security guard, do not call"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A24A] focus:bg-white transition"
                />
              </div>

              {/* Save Address Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  className="w-4 h-4 rounded text-[#B8860B] accent-[#C9A24A] border-gray-300 focus:ring-[#C9A24A]"
                />
                <span className="text-xs font-medium text-gray-700">
                  Save this address to my profile for faster checkout next time
                </span>
              </label>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
          {step === 'map' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!geocodedData.isValidDeliveryArea}
                onClick={() => setStep('details')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Confirm Location &amp; Enter House Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('map')}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Pin</span>
              </button>

              <button
                type="submit"
                form="address-details-form"
                disabled={isSaving || !geocodedData.isValidDeliveryArea}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] disabled:opacity-50 text-slate-900 font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Address...</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Deliver Here</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
