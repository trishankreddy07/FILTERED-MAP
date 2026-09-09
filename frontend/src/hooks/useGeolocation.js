import { useState, useEffect } from 'react';

// Default fallback coordinates (San Francisco Downtown)
const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: null,
  error: null,
  loading: false
};

export function useGeolocation() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        });
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const setCustomLocation = (lat, lng) => {
    setLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  return { ...location, setCustomLocation };
}
