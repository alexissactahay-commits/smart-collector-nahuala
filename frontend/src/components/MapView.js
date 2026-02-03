import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
  base = base.replace(/\/+$/, "");
  if (!base.endsWith("/api")) base = `${base}/api`;
  return base;
};

const API = normalizeApiBase();

const buildURL = (endpoint) => {
  if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
  return API + endpoint;
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
    } else {
      script.addEventListener("load", () => setMapLoaded(true));
      script.addEventListener("error", () => setError("Error al cargar Google Maps API"));
    }
  }, [apiKey]);

  return { mapLoaded, error };
};

const MapView = () => {
  const mapRef = useRef(null);

  const DEFAULT_CENTER = useMemo(
    () => ({ lat: 14.886351, lng: -91.514472 }),
    []
  );

  const [calendarDates, setCalendarDates] = useState([]); // my-routes (RouteDate)
  const [routesWithPoints, setRoutesWithPoints] = useState([]); // routes with points
  const [routeSchedules, setRouteSchedules] = useState([]); // citizen route schedules

  const [map, setMap] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]);

  const { mapLoaded, error } = useGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ====== Opciones de fechas disponibles (programadas por admin) ======
  const availableDates = useMemo(() => {
    const arr = Array.isArray(calendarDates) ? calendarDates : [];
    const only = arr.map((x) => x?.date).filter(Boolean);
    const unique = Array.from(new Set(only));
    unique.sort((a, b) => new Date(a) - new Date(b));
    return unique;
  }, [calendarDates]);

  // ====== Fecha seleccionada por el usuario ======
  const [selectedDate, setSelectedDate] = useState("");

  // setear por defecto: hoy si existe, si no la próxima, si no vacío
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
    return calendarDates
      .filter((x) => x?.date === selectedDate)
      .map((x) => x?.route?.id)
      .filter(Boolean);
  }, [calendarDates, selectedDate]);

  // ====== Horarios disponibles para esa fecha (según day_of_week de la ruta) ======
  const availableSchedulesForSelectedDate = useMemo(() => {
    if (!selectedDate || !scheduledRouteIds.length) return [];

    // rutas del día seleccionado (por fecha)
    const routesOfDate = routesWithPoints.filter((r) => scheduledRouteIds.includes(r.id));
    if (!routesOfDate.length) return [];

    // day_of_week permitido (pueden ser varias rutas en un día)
    const allowedDays = new Set(routesOfDate.map((r) => r.day_of_week).filter(Boolean));

    const schedules = (Array.isArray(routeSchedules) ? routeSchedules : [])
      .filter((s) => s?.route?.id && allowedDays.has(s.day_of_week))
      .filter((s) => scheduledRouteIds.includes(s.route.id))
      .map((s) => ({
        id: s.id,
        route_id: s.route.id,
        route_name: s.route.name,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        label: `${s.route.name || "Ruta"} — ${s.start_time || "--:--"} a ${s.end_time || "--:--"}`,
      }));

    // ordenar por hora inicio
    schedules.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    return schedules;
  }, [selectedDate, scheduledRouteIds, routesWithPoints, routeSchedules]);

  // ====== Horario seleccionado por el usuario ======
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  // si cambia fecha, escoger el primer horario disponible
  useEffect(() => {
    if (!availableSchedulesForSelectedDate.length) {
      setSelectedScheduleId("");
      return;
    }
    setSelectedScheduleId(String(availableSchedulesForSelectedDate[0].id));
  }, [availableSchedulesForSelectedDate]);

  const selectedSchedule = useMemo(() => {
    if (!selectedScheduleId) return null;
    return availableSchedulesForSelectedDate.find((s) => String(s.id) === String(selectedScheduleId)) || null;
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
  // Load calendar + routes + schedules
  // ----------------------------
  useEffect(() => {
    if (!mapLoaded) return;

    const loadData = async () => {
      try {
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // fechas asignadas
        const calRes = await axios.get(buildURL("/my-routes/"), { headers });
        setCalendarDates(Array.isArray(calRes.data) ? calRes.data : []);

        // rutas con puntos (tu endpoint actual)
        const routesRes = await axios.get(buildURL("/routes/"), { headers });
        setRoutesWithPoints(Array.isArray(routesRes.data) ? routesRes.data : []);

        // ✅ horarios (nuevo endpoint ciudadano)
        const schRes = await axios.get(buildURL("/citizen/route-schedules/"), { headers });
        setRouteSchedules(Array.isArray(schRes.data) ? schRes.data : []);
      } catch (err) {
        console.error("Error cargando datos de mapa:", err);
      }
    };

    loadData();
  }, [mapLoaded, token]);

  // ----------------------------
  // Draw polyline for selected route
  // ----------------------------
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // limpiar polylines anteriores
    polylines.forEach((p) => p.setMap(null));
    routeMarkers.forEach((m) => m.setMap(null));

    if (!selectedRoute) {
      setPolylines([]);
      setRouteMarkers([]);
      return;
    }

    const pts = Array.isArray(selectedRoute.points) ? [...selectedRoute.points] : [];
    if (pts.length < 2) {
      setPolylines([]);
      setRouteMarkers([]);
      return;
    }

    pts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const path = pts
      .map((p) => ({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
      }))
      .filter((p) => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

    if (path.length < 2) {
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
  }, [map, mapLoaded, selectedRoute]);

  const showNoRouteToday = useMemo(() => {
    const today = todayISO();
    // solo mostrar el mensaje “para hoy”
    if (selectedDate !== today) return false;

    // si hoy no hay rutas programadas
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

        {/* Mensaje si HOY no hay ruta */}
        {showNoRouteToday && (
          <div style={{ marginTop: 6, color: "#b00020", fontWeight: 600 }}>
            No hay ruta definida para hoy.
          </div>
        )}

        {/* Selectores */}
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, color: "#444" }}>Día:</label>
            <br />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "6px 8px", minWidth: 220 }}
            >
              <option value="">-- Seleccione un día --</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
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
                  <option key={s.id} value={s.id}>{s.label}</option>
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