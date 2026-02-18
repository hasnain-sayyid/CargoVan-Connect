import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Paper, Typography, Box, Alert } from '@mui/material';

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const containerStyle = { width: '100%', height: '100%', minHeight: '400px' };
const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // Fallback (NYC)

function Map({ pickup, dropoff, setPickup, setDropoff, setDistance, setDuration, activeBooking }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });
  const mapRef = useRef(null);
  const onLoad = useCallback(map => { mapRef.current = map; }, []);
  const [pickupCoord, setPickupCoord] = useState(null);
  const [dropoffCoord, setDropoffCoord] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [tripInfo, setTripInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Helper to compare coordinates
  const isSameCoord = (c1, c2) => {
    if (!c1 && !c2) return true;
    if (!c1 || !c2) return false;
    return Math.abs(c1.lat - c2.lat) < 0.0001 && Math.abs(c1.lng - c2.lng) < 0.0001;
  };

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

  // Geocode address using Google Maps Geocoder API
  // Geocode address using Google Maps Geocoder API with OSM Fallback
  const geocoder = useRef(null);

  const geocodeAddress = async (address) => {
    if (!address) return null;

    // Try Google Maps First
    if (window.google) {
      if (!geocoder.current) geocoder.current = new window.google.maps.Geocoder();
      try {
        const result = await new Promise((resolve, reject) => {
          geocoder.current.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) resolve(results[0]);
            else reject(status);
          });
        });
        const location = result.geometry.location;
        // Normalize to plain object for all services
        return { lat: Number(location.lat()), lng: Number(location.lng()) };
      } catch (e) {
        console.warn("Google Geocoding failed, falling back to OSM:", e);
      }
    }

    // Fallback to OSM (Nominatim)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("OSM Geocoding failed or timed out:", e);
    }
    return null;
  };

  // Reverse Geocode (Lat/Lng -> Address)
  const reverseGeocode = async (lat, lng) => {
    console.log(`Reverse Geocoding: ${lat}, ${lng}`);
    // Try Google Maps First
    if (window.google) {
      console.log("Using Google Maps Geocoder");
      if (!geocoder.current) geocoder.current = new window.google.maps.Geocoder();
      try {
        const result = await new Promise((resolve, reject) => {
          geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) resolve(results[0]);
            else reject(status);
          });
        });
        console.log("Google Geocode Success:", result.formatted_address);
        return result.formatted_address;
      } catch (e) {
        console.warn("Google Reverse Geocoding failed, falling back to OSM:", e);
      }
    } else {
      console.log("Google Maps not available, using OSM");
    }

    // Fallback to OSM (Nominatim)
    try {
      console.log("Fetching from Nominatim...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.display_name) {
        console.log("OSM Success:", data.display_name);
        return data.display_name;
      }
    } catch (e) {
      console.error("OSM Reverse geocoding failed or timed out:", e);
    }

    // Secondary Fallback: BigDataCloud (Free, No Key)
    try {
      console.log("Fetching from BigDataCloud...");
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      if (data && (data.locality || data.city || data.principalSubdivision)) {
        const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
        const address = parts.join(", ");
        console.log("BigDataCloud Success:", address);
        return address;
      }
    } catch (e) {
      console.error("BigDataCloud failed:", e);
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Handle Map Click
  const onMapClick = async (e) => {
    if (!setPickup || !setDropoff) return; // Read-only mode

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await reverseGeocode(lat, lng);

    // Prioritize empty fields
    if (!pickup) {
      setPickup(address);
    } else if (!dropoff) {
      setDropoff(address);
    } else {
      // If both filled, maybe update pickup? Or do nothing? 
      // User experience: click usually sets destination if pickup exists.
      // But if both exist, let's just update dropoff for flexibility
      setDropoff(address);
    }
  };

  // Fetch route and trip info from Google Directions Service
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);

  const fetchRoute = useCallback((start, end) => {
    if (!start || !end) return;

    if (!window.google) {
      console.warn("Google Maps not loaded, skipping to OSRM fallback");
      fetchRouteOSM(start, end);
      return;
    }

    if (!directionsService.current) {
      directionsService.current = new window.google.maps.DirectionsService();
    }

    const request = {
      origin: start,
      destination: end,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsService.current.route(request, (result, status) => {
      console.log(`Google Directions Status: ${status}`);
      if (status === window.google.maps.DirectionsStatus.OK) {
        const leg = result.routes[0].legs[0];
        const distValue = leg.distance.value; // meters
        const durationValue = leg.duration.value; // seconds

        const path = result.routes[0].overview_path.map(pt => ({ lat: pt.lat(), lng: pt.lng() }));
        setRoutePath(path);

        const distMiles = (distValue / 1609.34).toFixed(1);
        const durationMin = Math.round(durationValue / 60);

        setTripInfo({ distance: distMiles, duration: durationMin });
        if (setDistance) {
          console.log("Setting distance (Google):", distMiles);
          setDistance(distMiles);
        }
        if (setDuration) setDuration(durationMin);
      } else {
        console.warn("Google Directions failed, trying OSRM");
        fetchRouteOSM(start, end);
      }
    });
  }, [setDistance, setDuration]);

  // FINAL FALLBACK: Haversine Distance (Straight Line)
  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return (distance * 1.25).toFixed(1); // 1.25x factor for real-world road distance
  };

  // Fallback OSRM Routing
  const fetchRouteOSM = async (start, end) => {
    if (!start || !end) return;
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    try {
      console.log("Fetching route from OSRM...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0],
        }));
        setRoutePath(coordinates);
        const distMiles = (route.distance / 1609.34).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        console.log("OSM Route Found:", { distMiles, durationMin });

        setTripInfo({ distance: distMiles, duration: durationMin });

        if (setDistance) {
          console.log("Setting distance (OSM):", distMiles);
          setDistance(distMiles);
        }
        if (setDuration) setDuration(durationMin);
      } else {
        throw new Error("No OSRM routes found");
      }
    } catch (error) {
      console.error("OSM Routing failed or timed out, using Haversine fallback:", error);
      const estDistance = calculateHaversine(start.lat, start.lng, end.lat, end.lng);
      const estDuration = Math.round(estDistance * 2); // Roughly 2 min per mile

      setRoutePath([start, end]); // Straight line on map
      setTripInfo({ distance: estDistance, duration: estDuration });
      if (setDistance) {
        console.log("Setting distance (Haversine):", estDistance);
        setDistance(estDistance);
      }
      if (setDuration) setDuration(estDuration);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const targetPickup = pickup || activeBooking?.pickup_location;

    (async () => {
      if (targetPickup) {
        const coord = await geocodeAddress(targetPickup);
        if (!cancelled && !isSameCoord(coord, pickupCoord)) {
          console.log("New pickup coord geocoded:", coord);
          setPickupCoord(coord);
        }
      } else {
        if (!cancelled && pickupCoord !== null) setPickupCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pickup, activeBooking, pickupCoord]);

  useEffect(() => {
    let cancelled = false;
    const targetDropoff = dropoff || activeBooking?.dropoff_location;

    (async () => {
      if (targetDropoff) {
        const coord = await geocodeAddress(targetDropoff);
        if (!cancelled && !isSameCoord(coord, dropoffCoord)) {
          console.log("New dropoff coord geocoded:", coord);
          setDropoffCoord(coord);
        }
      } else {
        if (!cancelled && dropoffCoord !== null) setDropoffCoord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [dropoff, activeBooking, dropoffCoord]);

  useEffect(() => {
    if (pickupCoord && dropoffCoord) {
      console.log("Coords updated, fetching route...", { pickupCoord, dropoffCoord });
      fetchRoute(pickupCoord, dropoffCoord);
    } else {
      setRoutePath([]);
      setTripInfo(null);
      if (setDistance) setDistance('');
      if (setDuration) setDuration('');
    }
  }, [pickupCoord, dropoffCoord, fetchRoute]);

  // SAFETY TIMER: If we have coords but no tripInfo for 2 seconds, fire Haversine
  useEffect(() => {
    if (pickupCoord && dropoffCoord && !tripInfo) {
      console.log("Starting safety timer (2s)...");
      const timer = setTimeout(() => {
        if (!tripInfo) {
          console.warn("Safety timer triggered, forcing Haversine...");
          const estDistance = calculateHaversine(pickupCoord.lat, pickupCoord.lng, dropoffCoord.lat, dropoffCoord.lng);
          const estDuration = Math.round(estDistance * 2);
          setRoutePath([pickupCoord, dropoffCoord]);
          setTripInfo({ distance: estDistance, duration: estDuration });
          if (setDistance) setDistance(estDistance);
          if (setDuration) setDuration(estDuration);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pickupCoord, dropoffCoord, tripInfo, setDistance, setDuration]);

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
