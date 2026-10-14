/**
 * Google Maps Configuration Helper
 * Safely extracts a clean Google Maps API key from environment variables.
 * Handles:
 * - Direct API key (AIzaSy...)
 * - Accidental full script URLs (extracts key query param or AIzaSy token)
 * - VITE_GOOGLE_MAPS_API_KEY from AI Studio secret store
 */

export function getGoogleMapsApiKey(): string {
  // 1. Check VITE_GOOGLE_MAPS_API_KEY first as provisioned by AI Studio GHP/Demo Key
  const viteKey =
    typeof process !== 'undefined'
      ? (process.env.VITE_GOOGLE_MAPS_API_KEY || (process.env as any).NEXT_PUBLIC_VITE_GOOGLE_MAPS_API_KEY)
      : '';

  if (viteKey && typeof viteKey === 'string' && viteKey.includes('AIzaSy')) {
    const token = viteKey.match(/AIzaSy[A-Za-z0-9_-]+/);
    if (token) return token[0].trim();
  }

  // 2. Fallback to provisioned demo key if configured
  const demoKey = 'AIzaSyB5IGsaUNsyzqsr0PVstp5wPFmEgQK-iNg';

  const rawKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  if (!rawKey) {
    return demoKey;
  }

  // If rawKey is a full URL, extract the 'key' param
  if (rawKey.startsWith('http://') || rawKey.startsWith('https://')) {
    try {
      const parsed = new URL(rawKey);
      const k = parsed.searchParams.get('key');
      if (k && k.includes('AIzaSy')) return k.trim();
    } catch {
      const match = rawKey.match(/[?&]key=([^&]+)/);
      if (match && match[1]) return match[1].trim();
    }
  }

  // Extract clean AIzaSy token if embedded
  const tokenMatch = rawKey.match(/AIzaSy[A-Za-z0-9_-]+/);
  if (tokenMatch) {
    // If the token matches the unactivated legacy key, prefer the active demo key
    if (tokenMatch[0].includes('AOVYRIgupAurZup5y1PRh8Ismb1A3lLao')) {
      return demoKey;
    }
    return tokenMatch[0].trim();
  }

  return demoKey;
}
