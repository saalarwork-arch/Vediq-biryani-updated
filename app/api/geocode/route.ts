import { NextRequest, NextResponse } from 'next/server';
import { getGoogleMapsApiKey } from '@/lib/googleMapsConfig';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    const apiKey = getGoogleMapsApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API Key not configured' },
        { status: 500 }
      );
    }

    let url = '';
    if (lat && lng) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=in`;
    } else if (address) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=in`;
    } else {
      return NextResponse.json(
        { error: 'lat & lng or address parameter required' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Geocoding request failed' },
      { status: 500 }
    );
  }
}
