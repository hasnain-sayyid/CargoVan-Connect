import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Paper, Typography, Box, Alert } from '@mui/material';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: '100%', minHeight: '400px' };
const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // Fallback (NYC)

function Map({ pickup, dropoff, setPickup, setDropoff, setDistance, activeBooking }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });
  const mapRef = useRef(null);
  const onLoad = useCallback(map => { mapRef.current = map; }, []);
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [tripInfo, setTripInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Get User Location on Mount
  useEffect(() => {
    if (navigator.geolocation && !pickup && !dropoff && !activeBooking) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => console.log('Geolocation permission denied or error')
      );
    }
  }, [pickup, dropoff, activeBooking]);

  // Geocode address using OpenStreetMap (Nominatim)
  const geocodeAddress = async (address) => {
    if (!address) return null;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    }
    return null;
  };

  // Reverse Geocode (Lat/Lng -> Address)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) {
      console.error("Reverse geocoding failed:", e);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Handle Map Click
  const onMapClick = async (e) => {
    if (!setPickup || !setDropoff) return; // Read-only mode

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await reverseGeocode(lat, lng);

    if (!pickup) {
      setPickup(address);
    } else if (!dropoff) {
      setDropoff(address);
    }
  };

  // Fetch route and trip info from OSRM
  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0],
        }));
        setRoutePath(coordinates);
        const distMiles = (route.distance / 1609.34).toFixed(1);
        setTripInfo({
          distance: distMiles, // meters to miles
          duration: Math.round(route.duration / 60), // seconds to minutes
        });
        if (setDistance) setDistance(distMiles);
      }
    } catch (error) {
      console.error("Routing failed:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const targetPickup = pickup || activeBooking?.pickup_location;

    (async () => {
      if (targetPickup) {
        const coord = await geocodeAddress(targetPickup);
        if (!cancelled) setPickupCoord(coord);
      } else {
        setPickupCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pickup, activeBooking]);

  useEffect(() => {
    let cancelled = false;
    const targetDropoff = dropoff || activeBooking?.dropoff_location;

    (async () => {
      if (targetDropoff) {
        const coord = await geocodeAddress(targetDropoff);
        if (!cancelled) setDropoffCoord(coord);
      } else {
        setDropoffCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [dropoff, activeBooking]);

  useEffect(() => {
    if (pickupCoord && dropoffCoord) {
      fetchRoute(pickupCoord, dropoffCoord);
    } else {
      setRoutePath([]);
      setTripInfo(null);
    }
  }, [pickupCoord, dropoffCoord]);

  // Fit Bounds
  useEffect(() => {
    if (mapRef.current && pickupCoord && dropoffCoord && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickupCoord);
      bounds.extend(dropoffCoord);
      mapRef.current.fitBounds(bounds);
    } else if (mapRef.current && userLocation && !pickupCoord && !dropoffCoord) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(13);
    }
  }, [pickupCoord, dropoffCoord, userLocation]);


  const isViewingActive = !pickup && !dropoff && activeBooking;
  const status = isViewingActive ? activeBooking.status : 'default';

  const getMarkerIcon = (type) => {
    if (isViewingActive) {
      switch (status) {
        case 'pending': return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
        case 'accepted': return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
        default: return "http://maps.google.com/mapfiles/ms/icons/green-dot.png"; // completed
      }
    }
    return type === 'pickup'
      ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      : "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
  };

  const getPolylineOptions = () => {
    let color = '#2563eb'; // blue default
    if (isViewingActive) {
      switch (status) {
        case 'pending': color = '#f59e0b'; break; // orange
        case 'accepted': color = '#2563eb'; break; // blue
        case 'completed': color = '#10b981'; break; // green 
        default: color = '#64748b';
      }
    }
    return {
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 5,
    };
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: '400px' }}>
      {/* Trip Info Overlay */}
      {tripInfo && (
        <Paper elevation={3} sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Est. Trip</Typography>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>{tripInfo.duration} min</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{tripInfo.distance} miles</Typography>
        </Paper>
      )}

      {/* Guide Overlay for Empty State */}
      {!pickup && !dropoff && !activeBooking && (
        <Alert severity="info" sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          Tap map to set <strong>Pickup</strong> location
        </Alert>
      )}
      {pickup && !dropoff && !activeBooking && (
        <Alert severity="warning" sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          Tap map to set <strong>Drop-off</strong> location
        </Alert>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={11}
        onLoad={onLoad}
        onClick={onMapClick}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {pickupCoord && <Marker position={pickupCoord} icon={getMarkerIcon('pickup')} />}
        {dropoffCoord && <Marker position={dropoffCoord} icon={getMarkerIcon('dropoff')} />}

        {/* Show User Location */}
        {userLocation && !pickupCoord && (
          <Marker
            position={userLocation}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            title="You are here"
          />
        )}

        {routePath.length > 0 && (
          <Polyline path={routePath} options={getPolylineOptions()} />
        )}
      </GoogleMap>
    </Box>
  );
}

export default Map;
