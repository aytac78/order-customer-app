'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import type { Place } from '@/lib/places'

interface MapViewProps {
  places: Place[]
  center: { lat: number; lon: number }
  onMarkerClick?: (place: Place) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
]

export default function MapView({ places, center, onMarkerClick }: MapViewProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const onMapClick = useCallback(() => {
    setSelectedPlace(null)
  }, [])

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place)
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-red-500">Harita yüklenemedi</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Harita yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: center.lat, lng: center.lon }}
      zoom={14}
      onClick={onMapClick}
      options={{
        styles: darkMapStyle,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        }
      }}
    >
      {/* Kullanıcı Konumu */}
      <Marker
        position={{ lat: center.lat, lng: center.lon }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        }}
      />

      {/* Mekan Markerları */}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={{ lat: place.lat, lng: place.lon }}
          onClick={() => handleMarkerClick(place)}
          icon={{
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <rect x="4" y="4" width="32" height="32" rx="8" fill="#1a1a1a" stroke="#f97316" stroke-width="2"/>
                <text x="20" y="26" text-anchor="middle" font-size="16">${place.emoji}</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          }}
        />
      ))}

      {/* Seçili Mekan Info Window */}
      {selectedPlace && (
        <InfoWindow
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lon }}
          onCloseClick={() => setSelectedPlace(null)}
        >
          <div 
            className="p-2 min-w-[150px] cursor-pointer"
            onClick={() => onMarkerClick && onMarkerClick(selectedPlace)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{selectedPlace.emoji}</span>
              <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
            </div>
            <p className="text-gray-600 text-sm">{selectedPlace.category}</p>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-amber-500">★ {selectedPlace.rating}</span>
              <span className="text-gray-500">{selectedPlace.distance} km</span>
            </div>
            <p className="text-orange-500 text-xs mt-2">Detaylar için tıkla →</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}