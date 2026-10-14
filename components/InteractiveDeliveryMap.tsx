'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  useMap,
  ControlPosition,
  MapControl,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Crosshair,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { isCoordinateInDelhiNcr, DELHI_NCR_UNSUPPORTED_MESSAGE } from '@/lib/delhiNcrValidation';
import { reverseGeocodeCoordinates } from '@/lib/addressStorage';
import { getGoogleMapsApiKey } from '@/lib/googleMapsConfig';

interface InteractiveDeliveryMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelected: (location: {
    lat: number;
    lng: number;
    formatted_address: string;
    road_area_colony?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isValidDeliveryArea: boolean;
  }) => void;
  heightClass?: string;
}

// Default center: Connaught Place, New Delhi (core Delhi NCR)
const DEFAULT_CENTER = {
  lat: 28.6139,
  lng: 77.2090,
};

function MapEventHandler({
  onCenterChange,
  onMapClick,
}: {
  onCenterChange: (lat: number, lng: number) => void;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const idleListener = map.addListener('idle', () => {
      const center = map.getCenter();
      if (center) {
        onCenterChange(center.lat(), center.lng());
      }
    });

    const clickListener = map.addListener('click', (e: any) => {
      if (e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      if (idleListener?.remove) idleListener.remove();
      else if (typeof google !== 'undefined' && google.maps?.event?.removeListener) {
        google.maps.event.removeListener(idleListener);
      }
      if (clickListener?.remove) clickListener.remove();
      else if (typeof google !== 'undefined' && google.maps?.event?.removeListener) {
        google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, onCenterChange, onMapClick]);

  return null;
}

export default function InteractiveDeliveryMap({
  initialLat,
  initialLng,
  onLocationSelected,
  heightClass = 'h-[360px] sm:h-[420px]',
}: InteractiveDeliveryMapProps) {
  const apiKey = getGoogleMapsApiKey();

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || DEFAULT_CENTER.lat,
    lng: initialLng || DEFAULT_CENTER.lng,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressDetails, setAddressDetails] = useState<{
    formatted_address: string;
    road_area_colony?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isValid: boolean;
  } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onLocationSelectedRef = useRef(onLocationSelected);
  onLocationSelectedRef.current = onLocationSelected;

  // Perform reverse geocoding and boundary check
  const handleCoordsUpdate = useCallback(async (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
    setIsGeocoding(true);

    try {
      const geo = await reverseGeocodeCoordinates(lat, lng);
      const isValid = isCoordinateInDelhiNcr(lat, lng);

      const details = {
        formatted_address: geo.formatted_address,
        road_area_colony: geo.road_area_colony,
        city: geo.city,
        state: geo.state,
        pincode: geo.pincode,
        isValid,
      };

      setAddressDetails(details);

      onLocationSelectedRef.current({
        lat,
        lng,
        formatted_address: geo.formatted_address,
        road_area_colony: geo.road_area_colony,
        city: geo.city,
        state: geo.state,
        pincode: geo.pincode,
        isValidDeliveryArea: isValid,
      });
    } catch (err) {
      console.warn('[Vediq] Map reverse geocode error:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Trigger initial geocoding on mount
  useEffect(() => {
    const lat = initialLat || DEFAULT_CENTER.lat;
    const lng = initialLng || DEFAULT_CENTER.lng;
    handleCoordsUpdate(lat, lng);
  }, [initialLat, initialLng, handleCoordsUpdate]);

  // Handle map center change with debounce
  const onMapCenterChange = useCallback(
    (lat: number, lng: number) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        handleCoordsUpdate(lat, lng);
      }, 500);
    },
    [handleCoordsUpdate]
  );

  // Handle click on map to move center
  const onMapClick = useCallback(
    (lat: number, lng: number) => {
      handleCoordsUpdate(lat, lng);
    },
    [handleCoordsUpdate]
  );

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-slate-100`}>
      <APIProvider apiKey={apiKey} libraries={['places', 'geometry']}>
        <Map
          defaultCenter={currentCoords}
          defaultZoom={16}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          <MapEventHandler
            onCenterChange={onMapCenterChange}
            onMapClick={onMapClick}
          />
        </Map>
      </APIProvider>

      {/* Swiggy/Zomato Style Center Pin Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 -translate-y-6">
        <div className="flex flex-col items-center">
          {/* Tooltip speech bubble */}
          <div className="mb-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 border border-white/20 animate-bounce duration-1000">
            {isGeocoding ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#E2C56B]" />
                <span>Locating address...</span>
              </>
            ) : addressDetails?.isValid === false ? (
              <span className="text-red-400">Outside Delhi NCR</span>
            ) : (
              <span>Order will be delivered here</span>
            )}
          </div>

          {/* Luxury Pin Icon */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C9A24A] to-[#B89033] shadow-[0_4px_16px_rgba(201,162,74,0.6)] flex items-center justify-center border-2 border-white text-slate-900">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            {/* Pointer needle tip */}
            <div className="w-2 h-3 bg-[#B89033] mx-auto -mt-0.5 clip-triangle" />
            {/* Ground shadow circle */}
            <div className="w-3.5 h-1.5 rounded-full bg-black/30 mx-auto mt-0.5 filter blur-[0.5px]" />
          </div>
        </div>
      </div>

      {/* Instruction pill at top */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 text-slate-800 text-[11px] font-bold shadow-md border border-gray-200 backdrop-blur-xs flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-[#B8860B]" />
          <span>Move the map to set your exact delivery location</span>
        </div>
      </div>

      {/* Quick Delhi NCR Zone Chips */}
      <div className="absolute top-11 left-2 right-2 z-20 flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar justify-center">
        {[
          { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
          { name: 'Cyber Hub Gurgaon', lat: 28.4907, lng: 77.0890 },
          { name: 'Noida Sec 18', lat: 28.5708, lng: 77.3260 },
          { name: 'Saket', lat: 28.5244, lng: 77.2167 },
          { name: 'Indirapuram', lat: 28.6415, lng: 77.3714 },
        ].map((zone) => (
          <button
            key={zone.name}
            type="button"
            onClick={() => handleCoordsUpdate(zone.lat, zone.lng)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-[#C9A24A] text-white hover:text-slate-950 text-[10px] font-semibold border border-white/20 shadow-md backdrop-blur-xs transition cursor-pointer"
          >
            {zone.name}
          </button>
        ))}
      </div>

      {/* Delivery Area Status Pill at Bottom Left */}
      <div className="absolute bottom-4 left-3 right-3 sm:right-auto z-20 pointer-events-auto">
        {addressDetails && (
          <div
            className={`p-2.5 sm:p-3 rounded-xl border text-xs shadow-lg backdrop-blur-md max-w-sm ${
              addressDetails.isValid
                ? 'bg-white/95 border-emerald-500/30 text-emerald-950'
                : 'bg-red-50/95 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-start gap-2">
              {addressDetails.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] uppercase tracking-wider">
                  {addressDetails.isValid ? '✓ Within Delhi NCR Delivery Area' : '⚠️ Location Not Supported'}
                </p>
                <p className="text-[11px] text-gray-700 line-clamp-1">
                  {addressDetails.formatted_address}
                </p>
                {!addressDetails.isValid && (
                  <p className="text-[11px] font-semibold text-red-700">
                    {DELHI_NCR_UNSUPPORTED_MESSAGE}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
