/**
 * Distance Calculation Utility
 * 
 * Calculates distance between user and repairer for location-based matching
 * Key feature: Ultra-close distance (<2km) gets special badge
 * 
 * NOTE: This is a simplified simulation using Euclidean distance
 * Production should use:
 * - Haversine formula for accurate lat/lng distance
 * - Google Maps Distance Matrix API
 * - Kakao/Naver Maps API (Korean services)
 */

// Sample coordinates for Seoul districts
// In production, use real geocoding service
const districtCoordinates: { [key: string]: { lat: number; lng: number } } = {
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '송파구': { lat: 37.5145, lng: 127.1059 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '동작구': { lat: 37.5124, lng: 126.9393 },
  '마포구': { lat: 37.5663, lng: 126.9019 },
  '분당구': { lat: 37.3826, lng: 127.1188 },
  '노원구': { lat: 37.6542, lng: 127.0568 },
  '안양시 만안구': { lat: 37.3896, lng: 126.9278 },
};

/**
 * Calculate distance between two districts
 * @param district1 - First district name
 * @param district2 - Second district name
 * @returns Distance in kilometers (rounded to 1 decimal)
 */
export function calculateDistance(district1: string, district2: string): number {
  const coord1 = districtCoordinates[district1];
  const coord2 = districtCoordinates[district2];

  if (!coord1 || !coord2) {
    return 999; // Unknown region - return large number
  }

  // Simple Euclidean distance approximation (km)
  // 1 degree latitude ≈ 111km
  const latDiff = coord1.lat - coord2.lat;
  const lngDiff = coord1.lng - coord2.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Format distance for display
 * @param km - Distance in kilometers
 * @returns Formatted string (e.g., "500m" or "2.5km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;  // Show in meters if < 1km
  }
  return `${km}km`;
}