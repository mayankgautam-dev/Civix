// Real-time APIs for Udaipur city data
import { CityVitals } from '../types';

// API Keys - set in environment or use fallback
// OpenWeatherMap API (Free tier: 1000 calls/day)
const OPENWEATHER_API_KEY = 'demo'; // Set VITE_OPENWEATHER_API_KEY if available
const UDAIPUR_LAT = 24.5854;
const UDAIPUR_LON = 73.7125;

// AQICN API (Free tier available)
const AQICN_API_KEY = 'demo'; // Set VITE_AQICN_API_KEY if available

interface WeatherResponse {
    main: { temp: number; humidity: number };
    weather: Array<{ main: string; description: string }>;
    wind: { speed: number };
}

interface AqiResponse {
    status: string;
    data: {
        aqi: number;
        city: { name: string };
        dominentpol: string;
    };
}

/**
 * Fetch real-time weather data for Udaipur from OpenWeatherMap API
 */
export async function fetchWeatherData(): Promise<{ temperature: string; condition: string } | null> {
    try {
        // Try OpenWeatherMap API
        if (OPENWEATHER_API_KEY !== 'demo') {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${UDAIPUR_LAT}&lon=${UDAIPUR_LON}&appid=${OPENWEATHER_API_KEY}&units=metric`
            );
            if (response.ok) {
                const data: WeatherResponse = await response.json();
                return {
                    temperature: `${Math.round(data.main.temp)}°C`,
                    condition: data.weather[0]?.main || 'Clear'
                };
            }
        }

        // Fallback: Use wttr.in (free, no API key needed)
        const wttrResponse = await fetch(`https://wttr.in/Udaipur?format=%t|%C`);
        if (wttrResponse.ok) {
            const text = await wttrResponse.text();
            const [temp, condition] = text.split('|');
            return {
                temperature: temp.trim(),
                condition: condition?.trim() || 'Clear'
            };
        }

        return null;
    } catch (error) {
        console.error('Weather API error:', error);
        return null;
    }
}

/**
 * Fetch real-time AQI data for Udaipur
 */
export async function fetchAqiData(): Promise<number | null> {
    try {
        // Try AQICN API
        if (AQICN_API_KEY !== 'demo') {
            const response = await fetch(
                `https://api.waqi.info/feed/udaipur/?token=${AQICN_API_KEY}`
            );
            if (response.ok) {
                const data: AqiResponse = await response.json();
                if (data.status === 'ok') {
                    return data.data.aqi;
                }
            }
        }

        // Fallback: Use a CORS proxy with public AQI data
        // In production, you'd use your own proxy or backend
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://api.waqi.info/feed/udaipur/?token=demo')}`;
        const proxyResponse = await fetch(proxyUrl);
        if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            const aqiData = JSON.parse(proxyData.contents);
            if (aqiData.status === 'ok') {
                return aqiData.data.aqi;
            }
        }

        return null;
    } catch (error) {
        console.error('AQI API error:', error);
        return null;
    }
}

/**
 * Get traffic estimate based on time of day (heuristic for demo)
 * In production, integrate with Google Maps Traffic API or similar
 */
export function getTrafficEstimate(): 'Low' | 'Medium' | 'High' {
    const now = new Date();
    const hour = now.getHours();

    // Peak hours in Udaipur
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        return 'High';
    } else if ((hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 22)) {
        return 'Medium';
    }
    return 'Low';
}

/**
 * Get water supply status (simulated based on typical schedule)
 * In production, integrate with PHED/municipal water supply API
 */
export function getWaterStatus(): string {
    const now = new Date();
    const hour = now.getHours();

    // Typical Udaipur water supply timings
    if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
        return 'Active';
    }
    return 'Normal';
}

/**
 * Fetch all city vitals with real-time data where possible
 */
export async function fetchCityVitals(): Promise<CityVitals> {
    // Fetch weather and AQI in parallel
    const [weatherData, aqiValue] = await Promise.all([
        fetchWeatherData(),
        fetchAqiData()
    ]);

    const traffic = getTrafficEstimate();
    const waterStatus = getWaterStatus();

    return {
        temperature: weatherData?.temperature || '15°C',
        condition: weatherData?.condition || 'Clear',
        aqi: aqiValue?.toString() || '85',
        traffic,
        waterStatus
    };
}

/**
 * Get AQI category and color based on value
 */
export function getAqiCategory(aqi: number): { label: string; color: string; bgColor: string } {
    if (aqi <= 50) return { label: 'Good', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (aqi <= 150) return { label: 'Unhealthy (S)', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-600', bgColor: 'bg-purple-50' };
    return { label: 'Hazardous', color: 'text-rose-700', bgColor: 'bg-rose-50' };
}
