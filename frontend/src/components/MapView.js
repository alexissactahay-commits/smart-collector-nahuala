import { toast } from 'react-toastify';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

// Hook personalizado para cargar Google Maps
const useGoogleMaps = (apiKey) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    let script = document.getElementById('google-maps-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setError('Error al cargar Google Maps API');
      document.head.appendChild(script);
    } else if (script.readyState === 'loaded' || script.readyState === 'complete') {
      setMapLoaded(true);
    } else {
      script.onload = () => setMapLoaded(true);
    }
  }, [apiKey]);

  return { mapLoaded, error };
};

const MapView = () => {
  const mapRef = useRef(null);
  const [vehicle, setVehicle] = useState({ latitude: 14.886351, longitude: -91.514472 });
  const [routes, setRoutes] = useState([]);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [alertShown, setAlertShown] = useState(false);

  const { mapLoaded, error } = useGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  // Inicializar el mapa
  useEffect(() => {
    if (!mapLoaded || error) return;
    if (!map && mapRef.current) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 14.886351, lng: -91.514472 },
        zoom: 15,
        mapTypeId: 'roadmap',
      });
      setMap(newMap);

      const truckIcon = {
        url: "/3d-illustration-of-recycling-garbage-truck-png.png",
        scaledSize: new window.google.maps.Size(40, 40),
      };

      const newMarker = new window.google.maps.Marker({
        position: { lat: vehicle.latitude, lng: vehicle.longitude },
        map: newMap,
        icon: truckIcon,
        title: 'Camión Recolector',
      });
      setMarker(newMarker);
    }
  }, [mapLoaded, error, map, vehicle.latitude, vehicle.longitude]);

  // Cargar las rutas del ciudadano
  useEffect(() => {
    if (!mapLoaded || !map) return;

    const loadRoutes = async () => {
      try {
        const token = localStorage.getItem('token');
        // ✅ Usamos REACT_APP_API_URL en lugar de localhost
        const res = await axios.get(`${process.env.REACT_APP_API_URL}my-routes/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutes(res.data); // eslint-disable-line no-unused-vars

        polylines.forEach(poly => poly.setMap(null));
        const newPolylines = [];

        res.data.forEach(route => {
          if (route.points && route.points.length > 0) {
            const path = route.points.map(point => ({
              lat: parseFloat(point.latitude),
              lng: parseFloat(point.longitude)
            }));
            const polyline = new window.google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: '#0000FF',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            });
            polyline.setMap(map);
            newPolylines.push(polyline);
          }
        });
        setPolylines(newPolylines);
      } catch (err) {
        console.error("Error al cargar las rutas:", err);
      }
    };

    loadRoutes();
    // ✅ CORRECCIÓN CLAVE: añadimos `polylines` al array de dependencias
  }, [mapLoaded, map, polylines]);

  // Actualizar ubicación del camión
  useEffect(() => {
    if (!mapLoaded || !marker) return;

    const interval = setInterval(async () => {
      try {
        // ✅ Usamos REACT_APP_API_URL
        const response = await axios.get(`${process.env.REACT_APP_API_URL}vehicles/1/`);
        const newVehicle = response.data;
        setVehicle(newVehicle);

        marker.setPosition({
          lat: newVehicle.latitude,
          lng: newVehicle.longitude,
        });

        const userLocation = { lat: 14.886351, lng: -91.514472 };
        const distance = Math.sqrt(
          Math.pow(newVehicle.latitude - userLocation.lat, 2) +
          Math.pow(newVehicle.longitude - userLocation.lng, 2)
        );
        if (distance < 0.1 && !alertShown) {
          toast.info('¡El camión recolector está a 5 minutos de tu ubicación!', {
            position: "top-right",
            autoClose: 5000,
          });
          setAlertShown(true);
        }
      } catch (err) {
        console.error("Error al actualizar la ubicación del camión:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mapLoaded, marker, alertShown]);

  if (error) return <div>Error: {error}</div>;
  if (!mapLoaded) return <div>Cargando Google Maps...</div>;

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={mapRef}></div>
  );
};

export default MapView;