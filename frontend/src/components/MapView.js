// MapsView.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
  base = String(base).replace(/\/+$/, "");
  if (!base.endsWith("/api")) base = `${base}/api`;
  return base;
};

const API = normalizeApiBase();

const buildURL = (endpoint) => {
  let ep = String(endpoint || "");
  if (!ep.startsWith("/")) ep = "/" + ep;
  return API + ep;
};

// ✅ token robusto (por si guardas token o access)
const getToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("access") || "";
};

const handleAuthFail = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("userRole");
  window.location.replace("/login");
};

const useGoogleMaps = (apiKey) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setError("No hay API KEY de Google Maps (REACT_APP_GOOGLE_MAPS_API_KEY).");
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId);

    const onLoad = () => setMapLoaded(true);
    const onError = () => setError("Error al cargar Google Maps API");

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);
    }

    return () => {
      try {
        script?.removeEventListener("load", onLoad);
        script?.removeEventListener("error", onError);
      } catch (_) {}
    };
  }, [apiKey]);

  return { mapLoaded, error };
};

const MapView = () => {
  const mapRef = useRef(null);

  // ✅ CAMBIO 1: Centro por defecto en NAHUALÁ (ajusta si quieres)
  const DEFAULT_CENTER = useMemo(() => ({ lat: 14.845, lng: -91.318 }), []);

  const [calendarDates, setCalendarDates] = useState([]); // RouteDate
  const [routesWithPoints, setRoutesWithPoints] = useState([]); // routes con points
  const [routeSchedules, setRouteSchedules] = useState([]); // horarios

  const [map, setMap] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]);

  const { mapLoaded, error } = useGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  const token = getToken();
  const userRole = localStorage.getItem("userRole");

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ✅ CAMBIO 2: Mostrar día en el selector
  const dayNameFromISO = (iso) => {
    try {
      if (!iso) return "";
      const [y, m, d] = iso.split("-").map(Number);
      const dt = new Date(y, (m - 1), d);
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      return days[dt.getDay()] || "";
    } catch {
      return "";
    }
  };

  // ====== Opciones de fechas disponibles ======
  const availableDates = useMemo(() => {
    const arr = Array.isArray(calendarDates) ? calendarDates : [];
    const only = arr.map((x) => x?.date).filter(Boolean);
    const unique = Array.from(new Set(only));
    unique.sort((a, b) => new Date(a) - new Date(b));
    return unique;
  }, [calendarDates]);

  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!availableDates.length) {
      setSelectedDate("");
      return;
    }
    const today = todayISO();
    if (availableDates.includes(today)) {
      setSelectedDate(today);
    } else {
      const upcoming = availableDates.find((d) => new Date(d) >= new Date(today));
      setSelectedDate(upcoming || availableDates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates.length]);

  // ====== IDs de rutas programadas para la fecha seleccionada ======
  const scheduledRouteIds = useMemo(() => {
    if (!selectedDate) return [];
    return (Array.isArray(calendarDates) ? calendarDates : [])
      .filter((x) => x?.date === selectedDate)
      .map((x) => x?.route?.id)
      .filter(Boolean);
  }, [calendarDates, selectedDate]);

  // ====== Horarios disponibles para esa fecha ======
  const availableSchedulesForSelectedDate = useMemo(() => {
    if (!selectedDate || !scheduledRouteIds.length) return [];

    const schedules = (Array.isArray(routeSchedules) ? routeSchedules : [])
      .filter((s) => s?.route?.id && scheduledRouteIds.includes(s.route.id))
      .map((s) => ({
        id: s.id,
        route_id: s.route.id,
        route_name: s.route.name,
        start_time: s.start_time,
        end_time: s.end_time,
        label: `${s.route.name || "Ruta"} — ${s.start_time || "--:--"} a ${s.end_time || "--:--"}`,
      }));

    schedules.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    return schedules;
  }, [selectedDate, scheduledRouteIds, routeSchedules]);

  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  useEffect(() => {
    if (!availableSchedulesForSelectedDate.length) {
      setSelectedScheduleId("");
      return;
    }
    setSelectedScheduleId(String(availableSchedulesForSelectedDate[0].id));
  }, [availableSchedulesForSelectedDate]);

  const selectedSchedule = useMemo(() => {
    if (!selectedScheduleId) return null;
    return (
      availableSchedulesForSelectedDate.find(
        (s) => String(s.id) === String(selectedScheduleId)
      ) || null
    );
  }, [availableSchedulesForSelectedDate, selectedScheduleId]);

  const selectedRoute = useMemo(() => {
    if (!selectedSchedule?.route_id) return null;
    return routesWithPoints.find((r) => r.id === selectedSchedule.route_id) || null;
  }, [routesWithPoints, selectedSchedule]);

  // ----------------------------
  // Init map
  // ----------------------------
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 14,
      mapTypeId: "roadmap",
    });

    setMap(newMap);
  }, [mapLoaded, DEFAULT_CENTER]);

  // ----------------------------
  // Load data
  // ----------------------------
  useEffect(() => {
    if (!mapLoaded) return;

    const loadData = async () => {
      try {
        if (!token) {
          handleAuthFail();
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const calRes = await axios.get(buildURL("/my-routes/"), { headers });
        setCalendarDates(Array.isArray(calRes.data) ? calRes.data : []);

        const routesRes = await axios.get(buildURL("/routes/"), { headers });
        setRoutesWithPoints(Array.isArray(routesRes.data) ? routesRes.data : []);

        const schRes = await axios.get(buildURL("/citizen/route-schedules/"), { headers });
        setRouteSchedules(Array.isArray(schRes.data) ? schRes.data : []);
      } catch (err) {
        const status = err?.response?.status;
        console.error("Error cargando datos de mapa:", err?.response?.data || err.message);

        if (status === 401 || status === 403) {
          handleAuthFail();
        }
      }
    };

    loadData();
  }, [mapLoaded, token]);

  // ----------------------------
  // Draw route
  // ----------------------------
  useEffect(() => {
    if (!map || !mapLoaded) return;

    polylines.forEach((p) => p.setMap(null));
    routeMarkers.forEach((m) => m.setMap(null));

    // ✅ CAMBIO 1 (parte 2): si NO hay ruta seleccionada -> centrar en NAHUALÁ
    if (!selectedRoute) {
      try {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(14);
      } catch (_) {}
      setPolylines([]);
      setRouteMarkers([]);
      return;
    }

    const pts = Array.isArray(selectedRoute.points) ? [...selectedRoute.points] : [];
    if (pts.length < 2) {
      try {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(14);
      } catch (_) {}
      setPolylines([]);
      setRouteMarkers([]);
      return;
    }

    pts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const path = pts
      .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))
      .filter((p) => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

    if (path.length < 2) {
      try {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(14);
      } catch (_) {}
      setPolylines([]);
      setRouteMarkers([]);
      return;
    }

    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#1E88E5",
      strokeOpacity: 1,
      strokeWeight: 5,
    });

    polyline.setMap(map);

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds);

    const startMarker = new window.google.maps.Marker({
      position: path[0],
      map,
      label: "I",
      title: `Inicio - ${selectedRoute.name || "Ruta"}`,
    });

    const endMarker = new window.google.maps.Marker({
      position: path[path.length - 1],
      map,
      label: "F",
      title: `Fin - ${selectedRoute.name || "Ruta"}`,
    });

    setPolylines([polyline]);
    setRouteMarkers([startMarker, endMarker]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapLoaded, selectedRoute, DEFAULT_CENTER]);

  const showNoRouteToday = useMemo(() => {
    const today = todayISO();
    if (selectedDate !== today) return false;
    return !scheduledRouteIds.length;
  }, [scheduledRouteIds, selectedDate]);

  if (error) return <div style={{ padding: 20 }}>Error cargando mapas: {error}</div>;
  if (!mapLoaded) return <div style={{ padding: 20 }}>Cargando Google Maps...</div>;

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div style={{ padding: "10px 15px", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Mapa de rutas</strong>

        {userRole && (
          <span style={{ marginLeft: 10, color: "#666" }}>
            — Rol: {userRole}
          </span>
        )}

        {showNoRouteToday && (
          <div style={{ marginTop: 6, color: "#b00020", fontWeight: 600 }}>
            No hay ruta definida para hoy.
          </div>
        )}

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, color: "#444" }}>Día:</label>
            <br />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "6px 8px", minWidth: 260 }}
            >
              <option value="">-- Seleccione un día --</option>

              {/* ✅ CAMBIO 2: fecha + (día) */}
              {availableDates.map((d) => {
                const dayName = dayNameFromISO(d);
                const label = dayName ? `${d} (${dayName})` : d;
                return (
                  <option key={d} value={d}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#444" }}>Horario:</label>
            <br />
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              style={{ padding: "6px 8px", minWidth: 320 }}
              disabled={!availableSchedulesForSelectedDate.length}
            >
              {!availableSchedulesForSelectedDate.length ? (
                <option value="">-- No hay horarios para este día --</option>
              ) : (
                availableSchedulesForSelectedDate.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "calc(100vh - 120px)" }} />
    </div>
  );
};

export default MapView;