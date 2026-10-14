/**
 * Delhi NCR Delivery Area Validation
 * Restricts Vediq Biryani delivery strictly to Delhi NCR:
 * - National Capital Territory of Delhi (All districts)
 * - Gurugram (Gurgaon), Haryana
 * - Noida & Greater Noida, Uttar Pradesh
 * - Faridabad, Haryana
 * - Ghaziabad, Uttar Pradesh
 * - Associated core NCR zones
 */

export const DELHI_NCR_UNSUPPORTED_MESSAGE =
  'Sorry, we currently deliver only within Delhi NCR.';

// Geographical Bounding Box for Delhi NCR
export const DELHI_NCR_BOUNDS = {
  // Latitude boundaries (North to South)
  minLat: 28.05,
  maxLat: 29.15,
  // Longitude boundaries (West to East)
  minLng: 76.65,
  maxLng: 77.85,
};

// Recognized Delhi NCR Postal Code Prefixes
export const DELHI_NCR_PINCODE_PREFIXES = [
  '110', // All Delhi NCT (110001 - 110096)
  '122', // Gurugram / Gurgaon (122001 - 122505)
  '121', // Faridabad (121001 - 121102)
  '2013', // Noida & Greater Noida (201301 - 201318)
  '2010', // Ghaziabad (201001 - 201017)
  '124', // Jhajjar / Bahadurgarh
  '131', // Sonipat
];

// Recognized Delhi NCR City & Area Keywords
export const DELHI_NCR_LOCATION_KEYWORDS = [
  'delhi',
  'new delhi',
  'noida',
  'greater noida',
  'gurugram',
  'gurgaon',
  'faridabad',
  'ghaziabad',
  'indore', // intentionally excluded!
  'sonipat',
  'sonepat',
  'bahadurgarh',
  'sahibabad',
  'indirapuram',
  'vaishali',
  'vasundhara',
  'crossings republik',
  'dwarka',
  'rohini',
  'saket',
  'connaught place',
  'south extension',
  'hauz khas',
  'janakpuri',
  'karol bagh',
  'vasant kunj',
  'pitampura',
  'ncr',
];

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  matchedZone?: string;
}

/**
 * Checks if geographic coordinates fall within the Delhi NCR bounding zone
 */
export function isCoordinateInDelhiNcr(lat: number, lng: number): boolean {
  return (
    lat >= DELHI_NCR_BOUNDS.minLat &&
    lat <= DELHI_NCR_BOUNDS.maxLat &&
    lng >= DELHI_NCR_BOUNDS.minLng &&
    lng <= DELHI_NCR_BOUNDS.maxLng
  );
}

/**
 * Validates delivery address against Delhi NCR service area
 */
export async function validateDeliveryAddress(params: {
  address: string;
  lat?: number;
  lng?: number;
  pincode?: string;
  city?: string;
}): Promise<ValidationResult> {
  const { address, lat, lng, pincode, city } = params;

  // 1. Coordinate-based check (Highest precision from Google Maps Autocomplete)
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    const isWithinBounds = isCoordinateInDelhiNcr(lat, lng);
    if (!isWithinBounds) {
      return {
        isValid: false,
        message: DELHI_NCR_UNSUPPORTED_MESSAGE,
        lat,
        lng,
      };
    }
    return {
      isValid: true,
      lat,
      lng,
      matchedZone: 'Delhi NCR (Verified Coordinates)',
    };
  }

  // 2. Postal Code Check
  const cleanedPincode = (pincode || '').replace(/\D/g, '');
  if (cleanedPincode.length === 6) {
    const isPincodeMatched = DELHI_NCR_PINCODE_PREFIXES.some((prefix) =>
      cleanedPincode.startsWith(prefix)
    );
    if (isPincodeMatched) {
      return {
        isValid: true,
        matchedZone: `Delhi NCR (Pincode: ${cleanedPincode})`,
      };
    }
  }

  // 3. Textual Address / City Check
  const textToInspect = `${address} ${city || ''}`.toLowerCase();
  const hasMatchedKeyword = DELHI_NCR_LOCATION_KEYWORDS.some((kw) =>
    textToInspect.includes(kw)
  );

  // If outside of Delhi NCR explicitly or no match
  if (!hasMatchedKeyword) {
    return {
      isValid: false,
      message: DELHI_NCR_UNSUPPORTED_MESSAGE,
    };
  }

  return {
    isValid: true,
    matchedZone: 'Delhi NCR (Address Matched)',
  };
}
