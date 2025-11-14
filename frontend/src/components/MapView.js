import { toast } from "react-toastify";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

// ========= UTILIDAD PARA EVITAR RUTAS DOBLES =========
const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const buildURL = (endpoint) => {
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
  return API.replace(/\/+$/, "") + endpoint;
};

// ========= HOOK GOOGLE MAPS =========
const useGoogleMaps = (apiKey) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    let script = document.getElementById("google-maps-script");
    if (!script) {
      script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => setMapLoaded(true);
      script.onerror = () => setError("Error al cargar Google Maps API");

      document.head.appendChild(script);
    }
  }, [apiKey]);

  return { mapLoaded, error };
};

const MapView = () => {
  const mapRef = useRef(null);

  const [vehicle, setVehicle] = useState({
    latitude: 14.886351,
    longitude: -91.514472,
  });

  const [routes, setRoutes] = useState([]);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [polylines, setPolylines] = useState([]);

  const { mapLoaded, error } = useGoogleMaps(
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  );

  // Inicializar el mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: vehicle.latitude, lng: vehicle.longitude },
      zoom: 15,
      mapTypeId: "roadmap",
    });

    setMap(newMap);

    const truckIcon = {
      url: "/3d-illustration-of-recycling-garbage-truck-png.png",
      scaledSize: new window.google.maps.Size(45, 45),
    };

    const newMarker = new window.google.maps.Marker({
      position: {
        lat: vehicle.latitude,
        lng: vehicle.longitude,
      },
      map: newMap,
      icon: truckIcon,
      title: "Camión Recolector",
    });

    setMarker(newMarker);
  }, [mapLoaded]);

  // Cargar puntos de ruta
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const loadRoutes = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(buildURL("/my-routes/"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRoutes(res.data);

        // limpiar polylines
        polylines.forEach((p) => p.setMap(null));

        let newPolys = [];

        res.data.forEach((route) => {
          if (route.points && route.points.length > 0) {
            const path = route.points.map((point) => ({
              lat: parseFloat(point.latitude),
              lng: parseFloat(point.longitude),
            }));

            const polyline = new window.google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: "#0000FF",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            });

            polyline.setMap(map);
            newPolys.push(polyline);
          }
        });

        setPolylines(newPolys);
      } catch (err) {
        console.error("Error cargando rutas:", err);
      }
    };

    loadRoutes();
  }, [map, mapLoaded]);

  // Obtener ubicación REAL del camión
  useEffect(() => {
    if (!map || !marker) return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(buildURL("/vehicles/1/"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        const newVehicle = res.data;
        setVehicle(newVehicle);

        marker.setPosition({
          lat: parseFloat(newVehicle.latitude),
          lng: parseFloat(newVehicle.longitude),
        });
      } catch (err) {
        console.error("Error obteniendo ubicación del camión:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [map, marker]);

  if (error) return <div>Error cargando mapas.</div>;
  if (!mapLoaded) return <div>Cargando Google Maps...</div>;

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100vh", borderRadius: "10px" }}
    ></div>
  );
};

export default MapView;
