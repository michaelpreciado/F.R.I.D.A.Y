import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity: number;
  windSpeed: number;
  demo?: boolean;
  error?: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const getLocationAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Call the backend weather API
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude
        }),
      });

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      setWeather(data);
      
      // Set appropriate error message if using demo data
      if (data.demo) {
        if (data.error) {
          setError(`API Error: ${data.error}`);
        } else {
          setError('Using demo weather data');
        }
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      // Enhanced fallback with location info if available
      if (err instanceof GeolocationPositionError || (err as any).code) {
        setError('Location access denied');
      } else {
        setError('Weather service unavailable');
      }
      
      // Fallback to mock data when everything fails
      setWeather({
        temperature: 22,
        condition: 'partly cloudy',
        icon: '02d',
        location: 'Unknown Location',
        humidity: 65,
        windSpeed: 3.2,
        demo: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    // Map weather icons to emoji or custom icons
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-neural-gray/20 backdrop-blur-md border border-neon-blue/30 rounded-lg p-3 min-w-[200px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-white text-sm">Loading weather...</span>
        </div>
      </motion.div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <motion.div 
      className="bg-neural-gray/20 backdrop-blur-md border border-neon-blue/30 rounded-lg p-3 min-w-[200px] hover:bg-neural-gray/30 transition-all duration-300"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Weather Icon and Temperature */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getWeatherIcon(weather.icon)}</span>
          <div>
            <div className="text-white font-bold text-lg">
              {weather.temperature}°C
            </div>
            <div className="text-neon-blue text-xs capitalize">
              {weather.condition}
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center space-x-1 mb-2">
        <svg className="w-3 h-3 text-neon-blue" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="text-gray-300 text-xs truncate">
          {weather.location}
        </span>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-neon-blue">💧</span>
          <span className="text-gray-300">{weather.humidity}%</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-neon-blue">💨</span>
          <span className="text-gray-300">{weather.windSpeed} m/s</span>
        </div>
      </div>

      {/* Error indicator */}
      {error && (
        <div className="mt-2 text-xs text-yellow-400 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Refresh button */}
      <motion.button
        onClick={getLocationAndWeather}
        className="mt-2 w-full text-xs text-neon-blue hover:text-white transition-colors p-1 rounded"
        whileTap={{ scale: 0.95 }}
      >
        🔄 Refresh
      </motion.button>
    </motion.div>
  );
} 