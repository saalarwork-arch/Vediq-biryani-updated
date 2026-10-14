import { NextRequest, NextResponse } from 'next/server';
import { getGoogleMapsApiKey } from '@/lib/googleMapsConfig';
import {
  approximateDelhiNcrAddress,
  isCoordinateInDelhiNcr,
  DELHI_NCR_ANCHORS,
} from '@/lib/delhiNcrValidation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const address = searchParams.get('address');

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    const apiKey = getGoogleMapsApiKey();

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // If we have API key, try the official Google Geocoding API
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=in`;
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          const data = await res.json();

          // If Google returns OK, forward the results
          if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
            return NextResponse.json(data);
          }
        } catch (fetchErr) {
          console.warn('[Vediq Geocode] Primary API call failed, using Delhi NCR fallback:', fetchErr);
        }
      }

      // Fallback: If Geocoding API is not enabled on project or quota exhausted,
      // approximate using accurate Delhi NCR anchors
      const approx = approximateDelhiNcrAddress(lat, lng);
      return NextResponse.json({
        status: 'OK',
        results: [
          {
            formatted_address: approx.formatted_address,
            address_components: [
              { long_name: approx.road_area_colony, short_name: approx.road_area_colony, types: ['sublocality', 'sublocality_level_1'] },
              { long_name: approx.city, short_name: approx.city, types: ['locality'] },
              { long_name: approx.state, short_name: approx.state, types: ['administrative_area_level_1'] },
              { long_name: 'India', short_name: 'IN', types: ['country'] },
              { long_name: approx.pincode, short_name: approx.pincode, types: ['postal_code'] },
            ],
            geometry: {
              location: { lat, lng },
              location_type: 'APPROXIMATE',
            },
            place_id: `vediq_approx_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            types: ['establishment'],
          },
        ],
      });
    }

    if (address) {
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=in`;
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          const data = await res.json();
          if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
            return NextResponse.json(data);
          }
        } catch (fetchErr) {
          console.warn('[Vediq Geocode] Address geocoding error:', fetchErr);
        }
      }

      // Address text fallback: match nearest anchor or return Delhi NCR default
      const lower = address.toLowerCase();
      const matchedAnchor = DELHI_NCR_ANCHORS.find((a) =>
        lower.includes(a.name.toLowerCase()) || lower.includes(a.city.toLowerCase())
      ) || DELHI_NCR_ANCHORS[0];

      return NextResponse.json({
        status: 'OK',
        results: [
          {
            formatted_address: `${address}, ${matchedAnchor.city}, ${matchedAnchor.state} ${matchedAnchor.pincode}`,
            address_components: [
              { long_name: matchedAnchor.name, short_name: matchedAnchor.name, types: ['sublocality'] },
              { long_name: matchedAnchor.city, short_name: matchedAnchor.city, types: ['locality'] },
              { long_name: matchedAnchor.state, short_name: matchedAnchor.state, types: ['administrative_area_level_1'] },
              { long_name: matchedAnchor.pincode, short_name: matchedAnchor.pincode, types: ['postal_code'] },
            ],
            geometry: {
              location: { lat: matchedAnchor.lat, lng: matchedAnchor.lng },
            },
          },
        ],
      });
    }

    return NextResponse.json(
      { error: 'lat & lng or address parameter required' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Geocoding request failed' },
      { status: 500 }
    );
  }
}
