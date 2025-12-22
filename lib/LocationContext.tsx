'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type LocationPermission = 'always' | 'while_using' | 'never' | 'not_set';

interface LocationData {
  latitude: number;
  longitude: number;
  district?: string;
  neighborhood?: string;
}

interface LocationContextType {
  permission: LocationPermission;
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  setPermission: (perm: LocationPermission) => void;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_LOCATION: LocationData = {
  latitude: 41.0082,
  longitude: 28.9784,
  district: 'İstanbul',
  neighborhood: 'Merkez'
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermissionState] = useState<LocationPermission>('not_set');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage'dan izin tercihini yükle
  useEffect(() => {
    const savedPermission = localStorage.getItem('location_permission') as LocationPermission;
    if (savedPermission) {
      setPermissionState(savedPermission);
      
      // "always" veya "while_using" ise otomatik konum al
      if (savedPermission === 'always' || savedPermission === 'while_using') {
        requestLocation();
      } else if (savedPermission === 'never') {
        setLocation(DEFAULT_LOCATION);
      }
    }
  }, []);

  const setPermission = (perm: LocationPermission) => {
    setPermissionState(perm);
    localStorage.setItem('location_permission', perm);
    
    if (perm === 'never') {
      setLocation(DEFAULT_LOCATION);
    } else if (perm === 'always' || perm === 'while_using') {
      requestLocation();
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum özelliğini desteklemiyor');
      setLocation(DEFAULT_LOCATION);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 dakika cache
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding ile mahalle/ilçe bilgisi al
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=tr`
        );
        const data = await response.json();
        
        setLocation({
          latitude,
          longitude,
          district: data.address?.suburb || data.address?.district || data.address?.city_district || 'Bilinmiyor',
          neighborhood: data.address?.neighbourhood || data.address?.quarter || ''
        });
      } catch {
        setLocation({ latitude, longitude });
      }
    } catch (err: any) {
      if (err.code === 1) {
        setError('Konum izni reddedildi');
        setPermissionState('never');
        localStorage.setItem('location_permission', 'never');
      } else {
        setError('Konum alınamadı');
      }
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setPermissionState('not_set');
    localStorage.removeItem('location_permission');
  };

  return (
    <LocationContext.Provider
      value={{
        permission,
        location,
        loading,
        error,
        setPermission,
        requestLocation,
        clearLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
