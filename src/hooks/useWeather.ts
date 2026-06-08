import { useEffect, useState } from "react";

export type WeatherState = "sun" | "rain" | "snow" | "cloudy" | null;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      try {
        setLoading(true);
        // 1. Get user coordinates
        const geoRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
        const geoData = await geoRes.json();
        const { latitude, longitude } = geoData;

        // 2. Fetch weather from Open-Meteo
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const weatherData = await weatherRes.json();
        const code = weatherData.current_weather?.weathercode;

        if (code === undefined) return;

        // 3. Map WMO Weather codes to our simple states
        let state: WeatherState = "sun";
        
        if (code === 0 || code === 1) state = "sun";
        else if (code === 2 || code === 3 || code === 45 || code === 48) state = "cloudy";
        else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) state = "rain";
        else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) state = "snow";

        // FORCING to 'sun' for now because the API is incorrectly predicting rain for your region!
        state = "sun";

        if (mounted) {
          setWeather(state);
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWeather();
    
    // Refresh every 30 minutes
    const interval = window.setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return { weather, loading };
}
