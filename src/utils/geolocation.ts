/**
 * High-accuracy Geolocation, Reverse Geocoding, and City Filtering Service for Trussets.
 * Uses browser device GPS/high-accuracy positioning and authoritative
 * reverse geocoding to detect genuine locality, neighborhood, city, and district.
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation as CapGeolocation } from '@capacitor/geolocation';
import { POPULAR_CITIES, REGIONAL_CITIES } from '../data/citiesData';
import { PropertyListing } from '../types';

export interface DetectedLocation {
  city: string;
  locality?: string;
  neighborhood?: string;
  district?: string;
  state?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  accuracy: number; // radius in meters
  accuracyLevel: 'exact' | 'approximate' | 'coarse';
  isApproximate: boolean;
  displayName: string;
}

const CITY_ALIASES: Record<string, string[]> = {
  Hyderabad: [
    'hyderabad',
    'secunderabad',
    'ghmc',
    'greater hyderabad',
    'ranga reddy',
    'rangareddy',
    'medchal',
    'malkajgiri',
    'sangareddy',
    'cyberabad',
    'serilingampally',
    'kukatpally',
    'quthbullapur',
    'rajendranagar',
    'shamshabad',
    'patancheru',
    'shankarpally',
    'chevella',
    'moinabad',
    'uppal',
    'lb nagar',
    'hayathnagar',
    'ibrahimpatnam',
    'ghatkesar',
    'keesara',
    'alwal',
    'kapra',
    'malkajgiri',
    'balanagar',
    'amberpet',
    'khairatabad',
    'charminar',
    'golconda',
    'asifnagar',
    'himayatnagar',
    'marredpally',
    'trimulgherry',
    'ameerpet',
    'mythri nagar',
    'madeenaguda',
    'chanda nagar',
    'chandanagar',
    'lingampally',
    'hafeezpet',
    'nizampet',
    'pragathi nagar',
    'beeramguda',
    'ameenpur',
    'narsingi',
    'manchirevula',
    'gandipet',
    'kismathpur',
    'attapur',
    'tolichowki',
    'mehdipatnam',
    'begumpet',
    'somajiguda',
    'panjagutta',
    'tarnaka',
    'habshiguda',
    'nacharam',
    'mallapur',
    'ecill',
    'sainikpuri',
    'yapral',
    'bowenpally',
    'suchitra',
    'medchal-malkajgiri',
  ],
  Bengaluru: [
    'bengaluru',
    'bangalore',
    'bbmp',
    'bruhat bengaluru',
    'bengaluru urban',
    'bangalore urban',
    'bengaluru rural',
    'bangalore rural',
    'devanahalli',
    'hoskote',
    'anekal',
    'nelamangala',
    'kr puram',
    'mahadevapura',
    'bommanahalli',
    'dasarahalli',
    'rr nagar',
    'rajarajeshwari nagar',
  ],
  Mumbai: [
    'mumbai',
    'brihanmumbai',
    'greater mumbai',
    'mumbai suburban',
    'mumbai city',
    'navi mumbai',
    'thane',
    'kalyan',
    'dombivli',
    'mira bhayandar',
    'vasai',
    'virar',
    'ulhasnagar',
    'panvel',
    'kharghar',
    'vashi',
  ],
  Pune: [
    'pune',
    'poona',
    'pimpri',
    'chinchwad',
    'pcmc',
    'pimpri-chinchwad',
    'haveli',
    'mulshi',
    'mawal',
  ],
  'Delhi NCR': [
    'delhi',
    'new delhi',
    'delhi ncr',
    'gurgaon',
    'gurugram',
    'noida',
    'greater noida',
    'faridabad',
    'ghaziabad',
    'gautam buddha nagar',
    'dwarka',
    'rohini',
    'saket',
    'vasant kunj',
    'connaught place',
  ],
  Chennai: [
    'chennai',
    'madras',
    'greater chennai',
    'tambaram',
    'avadi',
    'ambattur',
    'pallavaram',
    'chengalpattu',
    'tiruvallur',
    'kanchipuram',
    'sholinganallur',
    'guindy',
    'mylapore',
  ],
  Ahmedabad: [
    'ahmedabad',
    'amdavad',
    'amc',
    'gandhinagar',
    'gift city',
    'sanand',
    'kalol',
    'daskroi',
  ],
  Visakhapatnam: [
    'visakhapatnam',
    'vishakhapatnam',
    'vizag',
    'gvmc',
    'greater visakhapatnam',
    'bheemunipatnam',
    'bhimili',
    'anakapalli',
    'pendurthi',
    'gopalapatnam',
    'simhachalam',
    'kurmannapalem',
    'duvvada',
  ],
  Vijayawada: [
    'vijayawada',
    'bezawada',
    'vmc',
    'ntr district',
    'krishna district',
    'mangalagiri',
    'tadepalli',
    'ibrahimpatnam',
    'kanuru',
    'penamaluru',
    'ramavarappadu',
    'gollapudi',
    'kondapalli',
  ],
  Mysore: [
    'mysore',
    'mysuru',
    'mcc',
  ],
};

/**
 * Resolves a canonical city name from reverse-geocoded address components or raw location text.
 */
export function resolveCanonicalCity(input: {
  city?: string;
  town?: string;
  municipality?: string;
  cityDistrict?: string;
  district?: string;
  state?: string;
  locality?: string;
  postcode?: string;
  displayName?: string;
}): string {
  const postcode = (input.postcode || '').trim();
  if (/^\d{6}$/.test(postcode)) {
    if (postcode.startsWith('500') || postcode.startsWith('501') || postcode.startsWith('502')) {
      return 'Hyderabad';
    }
    if (postcode.startsWith('560')) return 'Bengaluru';
    if (postcode.startsWith('400')) return 'Mumbai';
    if (postcode.startsWith('411') || postcode.startsWith('412')) return 'Pune';
    if (postcode.startsWith('600')) return 'Chennai';
    if (postcode.startsWith('110') || postcode.startsWith('122') || postcode.startsWith('201') || postcode.startsWith('121')) {
      return 'Delhi NCR';
    }
    if (postcode.startsWith('380') || postcode.startsWith('382')) return 'Ahmedabad';
    if (postcode.startsWith('530')) return 'Visakhapatnam';
    if (postcode.startsWith('520') || postcode.startsWith('521')) return 'Vijayawada';
    if (postcode.startsWith('570')) return 'Mysore';
  }

  const candidateFields = [
    input.city,
    input.town,
    input.municipality,
    input.cityDistrict,
    input.district,
    input.locality,
    input.displayName,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());

  const combinedLower = candidateFields.join(' , ').toLowerCase();

  // 1. Check popular cities and their aliases / micro-markets
  for (const popCity of POPULAR_CITIES) {
    const cityNameLower = popCity.name.toLowerCase();
    const aliases = CITY_ALIASES[popCity.name] || [cityNameLower];
    const places = (popCity.places || []).map((p) => p.toLowerCase());

    for (const field of candidateFields) {
      const fLower = field.toLowerCase();
      if (fLower === cityNameLower || aliases.some((a) => fLower === a || fLower.includes(a))) {
        return popCity.name;
      }
      if (places.some((p) => fLower === p || fLower.includes(p))) {
        return popCity.name;
      }
    }

    if (aliases.some((a) => combinedLower.includes(a))) {
      return popCity.name;
    }
  }

  // 2. Check regional cities across India
  const allRegionalCities = Object.values(REGIONAL_CITIES).flat();
  for (const regCity of allRegionalCities) {
    const regLower = regCity.toLowerCase();
    for (const field of candidateFields) {
      const fLower = field.toLowerCase();
      if (fLower === regLower || fLower.includes(regLower)) {
        // Map Gurgaon/Noida/Delhi to Delhi NCR if needed, or keep regional city
        if (['gurgaon', 'gurugram', 'noida', 'delhi', 'faridabad', 'ghaziabad'].includes(regLower)) {
          return 'Delhi NCR';
        }
        return regCity;
      }
    }
  }

  // 3. Clean fallback from city / town / district before falling back to locality
  const primaryCityCandidate = input.city || input.town || input.municipality || input.district || input.cityDistrict || input.locality || '';
  const cleaned = primaryCityCandidate
    .replace(/\b(Greater|Bruhat|Brihanmumbai)\b/gi, '')
    .replace(/\b(Municipal Corporation|Municipality|District|Urban|Rural|Mandal|Tehsil|Taluk|Sub-District)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Current Location';
}

/**
 * Extracts the canonical city name and optional specific locality/place from a location selection string.
 * Examples:
 * - "Hyderabad" -> { city: "Hyderabad" }
 * - "Hyderabad (Kokapet)" -> { city: "Hyderabad", place: "Kokapet" }
 * - "Kondapur, Hyderabad" -> { city: "Hyderabad" }
 * - "Select Location" | "All Cities" -> { city: null }
 */
export function extractCityAndPlace(locationStr: string): { city: string | null; place?: string } {
  if (!locationStr) return { city: null };
  const trimmed = locationStr.trim();
  const lower = trimmed.toLowerCase();

  if (
    !trimmed ||
    lower === 'select location' ||
    lower === 'all cities' ||
    lower === 'all locations' ||
    lower === 'all india' ||
    lower === 'current location' ||
    lower.startsWith('location (') ||
    lower.startsWith('area (')
  ) {
    return { city: null };
  }

  // Format: "City (Place)" selected from CitySelectorModal
  const parenMatch = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const rawCity = parenMatch[1].trim();
    const rawPlace = parenMatch[2].trim();
    const resolvedCity = resolveCanonicalCity({ city: rawCity, displayName: rawCity });
    return {
      city: resolvedCity && resolvedCity !== 'Current Location' ? resolvedCity : rawCity,
      place: rawPlace.toLowerCase().startsWith('all ') ? undefined : rawPlace,
    };
  }

  // Format: "Locality, City" or "City"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    const lastPart = parts[parts.length - 1];
    const firstPart = parts[0];
    const resolved = resolveCanonicalCity({
      city: lastPart,
      locality: firstPart,
      displayName: trimmed,
    });
    return {
      city: resolved && resolved !== 'Current Location' ? resolved : lastPart,
    };
  }

  const resolved = resolveCanonicalCity({ city: trimmed, displayName: trimmed });
  return {
    city: resolved && resolved !== 'Current Location' ? resolved : trimmed,
  };
}

/**
 * Filters a list of properties so that when a city is detected or selected,
 * ONLY properties belonging to that particular city are returned.
 */
export function filterPropertiesByCity(
  properties: PropertyListing[],
  currentCity: string
): PropertyListing[] {
  const { city: targetCity, place: targetPlace } = extractCityAndPlace(currentCity);
  if (!targetCity) {
    return properties;
  }

  const targetCityLower = targetCity.toLowerCase();

  return properties.filter((p) => {
    const propCanonicalCity = resolveCanonicalCity({
      city: p.city,
      district: p.district,
      locality: p.locality,
      postcode: p.pincode,
    });

    const rawCityLower = (p.city || '').trim().toLowerCase();
    const propCityLower = (propCanonicalCity || rawCityLower).toLowerCase();

    const isCityMatch =
      propCityLower === targetCityLower ||
      rawCityLower === targetCityLower ||
      (rawCityLower && (rawCityLower.includes(targetCityLower) || targetCityLower.includes(rawCityLower)));

    if (!isCityMatch) {
      return false;
    }

    if (targetPlace) {
      const placeLower = targetPlace.toLowerCase();
      const locMatch =
        (p.locality || '').toLowerCase().includes(placeLower) ||
        (p.subtitle || '').toLowerCase().includes(placeLower) ||
        (p.title || '').toLowerCase().includes(placeLower);
      if (!locMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Checks existing browser location permission state without triggering a prompt
 */
export async function checkLocationPermission(): Promise<'granted' | 'prompt' | 'denied'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await CapGeolocation.checkPermissions();
      if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted';
      if (status.location === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
    return 'prompt';
  }
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Detects user's actual physical coordinates using high-accuracy geolocation
 * and reverse geocodes them into human-friendly locality and canonical city names.
 */
export async function detectUserLocation(): Promise<DetectedLocation> {
  return new Promise(async (resolve, reject) => {
    const getCoordinates = async (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
      if (Capacitor.isNativePlatform()) {
        const perm = await CapGeolocation.requestPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
          const err = new Error('Location permission is required to detect your current location. You can also select your location manually.');
          (err as any).code = 1;
          throw err;
        }
        const pos = await CapGeolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 50,
        };
      }

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported by your device. Please select your location manually.');
      }

      return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            res({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          (error) => {
            let errorMsg = 'Location permission is required to detect your current location. You can also select your location manually.';
            if (error.code === error.POSITION_UNAVAILABLE) {
              errorMsg = 'GPS position is currently unavailable on your device. Please select your location manually.';
            } else if (error.code === error.TIMEOUT) {
              errorMsg = 'GPS location request timed out. Please try again or select your location manually.';
            }
            const err = new Error(errorMsg);
            (err as any).code = error.code;
            rej(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      });
    };

    try {
      const { latitude, longitude, accuracy } = await getCoordinates();

        // Categorize accuracy radius
        let accuracyLevel: 'exact' | 'approximate' | 'coarse' = 'exact';
        if (accuracy > 1000) {
          accuracyLevel = 'coarse';
        } else if (accuracy > 150) {
          accuracyLevel = 'approximate';
        }
        const isApproximate = accuracyLevel !== 'exact';

        try {
          // Attempt 1: Call server-side reverse geocoding proxy
          const proxyResp = await fetch(
            `/api/location/reverse-geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          );

          if (proxyResp.ok) {
            const data = await proxyResp.json();
            if (data && data.success) {
              const locality = data.locality || '';
              const rawCity = data.city || data.district || '';
              const district = data.district || '';
              const state = data.state || '';
              const postcode = data.postcode || '';

              const canonicalCity = resolveCanonicalCity({
                city: rawCity,
                district,
                state,
                locality,
                postcode,
                displayName: data.displayName,
              });

              const resolvedCity = canonicalCity && canonicalCity !== 'Current Location'
                ? canonicalCity
                : (rawCity || locality || 'Current Location');

              const displayName = locality && resolvedCity && locality.toLowerCase() !== resolvedCity.toLowerCase()
                ? `${locality}, ${resolvedCity}`
                : (resolvedCity || locality || district || `Area (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);

              resolve({
                city: resolvedCity,
                locality,
                neighborhood: data.neighborhood || '',
                district,
                state,
                postcode,
                latitude,
                longitude,
                accuracy,
                accuracyLevel,
                isApproximate,
                displayName,
              });
              return;
            }
          }
        } catch (err) {
          console.warn('Backend proxy reverse geocode failed, trying client fallback...', err);
        }

        try {
          // Attempt 2: Direct OpenStreetMap Nominatim with detailed address components
          const osmResp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (osmResp.ok) {
            const osmData = await osmResp.json();
            const addr = osmData.address || {};
            const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.quarter || addr.village || '';
            const rawCity = addr.city || addr.town || addr.municipality || addr.city_district || addr.county || addr.state_district || '';
            const district = addr.state_district || addr.county || '';
            const state = addr.state || '';
            const postcode = addr.postcode || '';

            const canonicalCity = resolveCanonicalCity({
              city: addr.city,
              town: addr.town,
              municipality: addr.municipality,
              cityDistrict: addr.city_district,
              district,
              state,
              locality,
              postcode,
            });

            const resolvedCity = canonicalCity && canonicalCity !== 'Current Location'
              ? canonicalCity
              : (rawCity || locality || 'Current Location');

            const displayName = locality && resolvedCity && locality.toLowerCase() !== resolvedCity.toLowerCase()
              ? `${locality}, ${resolvedCity}`
              : (resolvedCity || locality || district || `Area (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);

            resolve({
              city: resolvedCity,
              locality,
              neighborhood: addr.neighbourhood || '',
              district,
              state,
              postcode,
              latitude,
              longitude,
              accuracy,
              accuracyLevel,
              isApproximate,
              displayName,
            });
            return;
          }
        } catch (osmErr) {
          console.warn('Direct reverse geocode failed:', osmErr);
        }

        // If coordinates were captured with high accuracy but geocoder was unreachable
        resolve({
          city: 'Current Location',
          latitude,
          longitude,
          accuracy,
          accuracyLevel,
          isApproximate: true,
          displayName: `Location (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
        });
    } catch (error: any) {
      reject(error);
    }
  });
}
