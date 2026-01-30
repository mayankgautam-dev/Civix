import { GoogleGenAI, Type } from "@google/genai";
import { REPORT_ANALYSIS_INSTRUCTION } from "../constants";
import { AIReportAnalysis, LocationData, CityVitals } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the report analysis
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
    department: { type: Type.STRING },
    officialSummary: { type: Type.STRING },
    estimatedAction: { type: Type.STRING },
  },
  required: ["category", "urgency", "department", "officialSummary", "estimatedAction"],
};

export const analyzeCivicReport = async (
  description: string,
  images: string[],
  location: LocationData | null
): Promise<AIReportAnalysis> => {
  try {
    const parts: any[] = [];

    // Add Text context
    let promptText = `Description: ${description || "No text description provided."}\n`;
    if (location) {
      promptText += `Location: Lat ${location.latitude}, Lng ${location.longitude}\n`;
    }
    parts.push({ text: promptText });

    // Add All Images
    if (images && images.length > 0) {
      images.forEach(imgBase64 => {
        // Remove data URL prefix if present
        const cleanBase64 = imgBase64.split(',')[1] || imgBase64;
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        });
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: { parts: parts },
      config: {
        systemInstruction: REPORT_ANALYSIS_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: reportSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIReportAnalysis;
    }
    throw new Error("Empty response from AI");

  } catch {
    // Fallback for demo purposes if AI fails
    return {
      category: "General Issue",
      urgency: "Medium",
      department: "City Administration",
      officialSummary: "Report received. Pending manual review.",
      estimatedAction: "Ticket #UD-" + Math.floor(Math.random() * 10000)
    };
  }
};

// Helper to fetch real weather from wttr.in (free, no API key, reliable)
const fetchLiveWeather = async (): Promise<{ temperature: string; condition: string } | null> => {
  try {
    const response = await fetch('https://wttr.in/Udaipur,Rajasthan?format=%t|%C');
    if (response.ok) {
      const text = await response.text();
      const [temp, condition] = text.split('|');
      return {
        temperature: temp.trim().replace('+', ''),
        condition: condition?.trim() || 'Clear'
      };
    }
    return null;
  } catch {
    return null;
  }
};

// Helper to fetch AQI from Gemini with Google Search (grounding)
const fetchLiveAQI = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `What is the current real-time Air Quality Index (AQI) for Udaipur, Rajasthan, India right now? 
Search the web for the latest AQI value. Return ONLY the AQI number (e.g., "156" or "85"), nothing else.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    if (response.text) {
      // Extract just the number from response
      const match = response.text.match(/\d+/);
      if (match) {
        return match[0];
      }
    }
    return "50"; // Default moderate AQI
  } catch {
    return "50";
  }
};

// Get traffic estimate based on current time in IST
const getLiveTraffic = (): 'Low' | 'Medium' | 'High' => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  
  // Peak hours in Udaipur
  if ((istHour >= 8 && istHour <= 10) || (istHour >= 17 && istHour <= 20)) {
    return 'High';
  } else if ((istHour >= 11 && istHour <= 16) || (istHour >= 21 && istHour <= 22)) {
    return 'Medium';
  }
  return 'Low';
};

// Get water supply status based on typical Udaipur timings
const getLiveWaterStatus = (): string => {
  const now = new Date();
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  
  // Typical water supply timings in Udaipur
  if ((istHour >= 6 && istHour <= 9) || (istHour >= 17 && istHour <= 20)) {
    return 'Active';
  }
  return 'Normal';
};

export const fetchRealTimeVitals = async (): Promise<CityVitals> => {
  // Fetch weather and AQI in parallel for faster loading
  const [weatherData, aqiValue] = await Promise.all([
    fetchLiveWeather(),
    fetchLiveAQI()
  ]);

  const traffic = getLiveTraffic();
  const waterStatus = getLiveWaterStatus();

  return {
    temperature: weatherData?.temperature || '18°C',
    condition: weatherData?.condition || 'Cloudy',
    aqi: aqiValue,
    traffic: traffic,
    waterStatus: waterStatus
  };
};

// City Assistant Chatbot Function
export const askCityAssistant = async (query: string, language: 'en' | 'hi' = 'en'): Promise<string> => {
  try {
    const systemPrompt = `
You are the Smart Udaipur City Assistant, an AI helper for citizens of Udaipur.

You help with:
1. City services information (timings, locations, documents required)
2. Report civic issues guidance
3. Government schemes and benefits
4. Local transport information
5. Emergency contacts and helplines
6. Tourist information

Important Udaipur contacts:
- Police Control Room: 100
- Fire Brigade: 101
- Ambulance: 108
- Nagar Nigam: 0294-2528801
- Water Supply (PHED): 0294-2413073
- Electricity (JVVNL): 1800-180-6515

Common services:
- Property Tax: Nagar Nigam Office, City Palace Road
- Water Connection: PHED Office, Bhuwana
- Building Permission: UIT Office, Fateh Sagar

Be helpful, concise, and always provide actionable information.
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
Keep responses short and useful - around 2-4 sentences for simple queries.
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }]
      }
    });

    if (response.text) {
      return response.text;
    }
    throw new Error("No response from AI");
  } catch {
    return language === 'hi'
      ? "क्षमा करें, अभी मैं आपकी मदद नहीं कर पा रहा। कृपया बाद में पुनः प्रयास करें।"
      : "Sorry, I couldn't process your request. Please try again later.";
  }
};
