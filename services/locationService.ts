/**
 * Fetches a human-readable address from coordinates using OpenStreetMap (Nominatim).
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted address string
 */
export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using Nominatim API for demo purposes (Free, requires User-Agent)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );
    
    if (!response.ok) {
        throw new Error("Geocoding failed");
    }

    const data = await response.json();
    
    // Construct a cleaner address
    const addr = data.address;
    if (addr) {
      const parts = [
        addr.road || addr.pedestrian,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village,
        addr.state
      ].filter(Boolean);
      return parts.join(', ') || data.display_name;
    }

    return data.display_name || "Unknown Location";
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};
