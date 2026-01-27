
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: 400 };
const defaultCenter = { lat: 40.7128, lng: -74.0060 };

function Map({ pickup, dropoff }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });
  const mapRef = useRef(null);
  const onLoad = useCallback(map => { mapRef.current = map; }, []);
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);

  // Geocode address to lat/lng
  const geocodeAddress = async (address) => {
    if (!address) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (pickup) {
        const coord = await geocodeAddress(pickup);
        if (!cancelled) setPickupCoord(coord);
      } else {
        setPickupCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pickup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (dropoff) {
        const coord = await geocodeAddress(dropoff);
        if (!cancelled) setDropoffCoord(coord);
      } else {
        setDropoffCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [dropoff]);

  // Center map between pickup and dropoff if both exist
  let mapCenter = defaultCenter;
  if (pickupCoord && dropoffCoord) {
    mapCenter = {
      lat: (pickupCoord.lat + dropoffCoord.lat) / 2,
      lng: (pickupCoord.lng + dropoffCoord.lng) / 2,
    };
  } else if (pickupCoord) {
    mapCenter = pickupCoord;
  } else if (dropoffCoord) {
    mapCenter = dropoffCoord;
  }

  if (!MAPS_API_KEY) {
    return (
      <div style={{ width: '100%', height: 400, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
        Google Maps API key missing. Set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file.
      </div>
    );
  }
  if (loadError) {
    return (
      <div style={{ width: '100%', height: 400, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
        Failed to load Google Maps: {loadError.message}
      </div>
    );
  }
  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={10}
      onLoad={onLoad}
    >
      {pickupCoord && <Marker position={pickupCoord} label="P" />}
      {dropoffCoord && <Marker position={dropoffCoord} label="D" />}
    </GoogleMap>
  ) : (
    <div style={{ width: '100%', height: 400, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span>Loading map...</span>
    </div>
  );
}

export default Map;
