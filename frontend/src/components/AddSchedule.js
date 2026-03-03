// src/components/AddSchedule.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AddSchedule.css";

const AddSchedule = () => {
  // ============================
  // NORMALIZACIÓN DE API_URL
  // ============================
  let API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) API_URL = `${API_URL}/api`;

  // ============================
  // AUTH HELPERS
  // ============================
  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  const handle401 = () => {
    alert("Tu sesión expiró. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const prettyBackendError = (err, title = "Error") => {
    const status = err.response?.status;
    const data = err.response?.data;

    const asText =
      typeof data === "string"
        ? data.slice(0, 1200)
        : JSON.stringify(data || {}, null, 2);

    console.error(`❌ ${title}`, { status, data, err });

    alert(
      `${title}\n` +
        `Status: ${status}\n\n` +
        `Respuesta del backend:\n${asText}`
    );
  };

  // ============================
  // STATES
  // ============================
  const [routes, setRoutes] = useState([]);
  const [routeDates, setRouteDates] = useState([]); // viene de AddDate (route-dates)
  const [routeSchedules, setRouteSchedules] = useState([]);

  const [routeId, setRouteId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [start_time, setStart_time] = useState("");
  const [end_time, setEnd_time] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ============================
  // UTIL: obtener día en español desde YYYY-MM-DD (sin error por zona horaria)
  // ============================
  const DAY_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const dateToDayEs = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return "";
    const [y, m, d] = yyyy_mm_dd.split("-").map((n) => parseInt(n, 10));
    if (!y || !m || !d) return "";
    const utc = new Date(Date.UTC(y, m - 1, d));
    return DAY_ES[utc.getUTCDay()];
  };

  // Formato seguro para TimeField en DRF: HH:MM:SS
  const normalizeTime = (t) => {
    if (!t) return "";
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    return t;
  };

  // ✅ helper: sacar el "día" del horario SIN confundir con el día de la ruta
  // - primero intenta campos propios del schedule (day / weekday / day_of_week)
  // - si no existen, entonces usa route.day_of_week como respaldo
  const getScheduleDayLabel = (rs) => {
    // Intentar día del horario
    const scheduleDay =
      rs?.day ||
      rs?.weekday ||
      rs?.day_of_week || // si tu backend sí lo devuelve como texto
      rs?.day_name;

    if (scheduleDay) return scheduleDay;

    // Respaldo: día de la ruta (NO es lo ideal, pero evita mostrar vacío)
    return rs?.route?.day_of_week || "—";
  };

  // ============================
  // FETCH
  // ============================
  const fetchRoutes = async () => {
    try {
      const token = getToken();
      if (!token) return handle401();

      const res = await axios.get(`${API_URL}/admin/routes/`, authHeaders());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRoutes(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else prettyBackendError(err, "Error al cargar rutas");
    }
  };

  const fetchRouteDates = async () => {
    try {
      const token = getToken();
      if (!token) return handle401();

      const res = await axios.get(`${API_URL}/admin/route-dates/`, authHeaders());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRouteDates(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else prettyBackendError(err, "Error al cargar fechas (route-dates)");
    }
  };

  const fetchRouteSchedules = async () => {
    try {
      const token = getToken();
      if (!token) return handle401();

      const res = await axios.get(`${API_URL}/admin/route-schedules/`, authHeaders());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRouteSchedules(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else prettyBackendError(err, "Error al cargar horarios");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRoutes();
      await fetchRouteDates();
      await fetchRouteSchedules();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // DÍAS DISPONIBLES: salen SOLO de route-dates (AddDate)
  // ============================
  const availableDaysForSelectedRoute = useMemo(() => {
    if (!routeId) return [];

    const filtered = routeDates.filter((rd) => {
      const rid = rd.route?.id ?? rd.route_id ?? rd.route;
      return String(rid) === String(routeId);
    });

    const days = filtered.map((rd) => dateToDayEs(rd.date)).filter(Boolean);

    const unique = Array.from(new Set(days));
    unique.sort((a, b) => DAY_ES.indexOf(a) - DAY_ES.indexOf(b));
    return unique;
  }, [routeId, routeDates]);

  // Si cambio de ruta, auto-selecciona el primer día disponible
  useEffect(() => {
    if (!routeId) {
      setDayOfWeek("");
      return;
    }
    if (availableDaysForSelectedRoute.length === 0) {
      setDayOfWeek("");
      return;
    }
    if (!availableDaysForSelectedRoute.includes(dayOfWeek)) {
      setDayOfWeek(availableDaysForSelectedRoute[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, availableDaysForSelectedRoute]);

  // ============================
  // Guardar nuevo horario
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!routeId) {
      alert("Seleccione una ruta.");
      return;
    }

    if (availableDaysForSelectedRoute.length === 0) {
      alert("Esta ruta no tiene fechas asignadas en AddDate. Primero asigna fechas.");
      return;
    }

    if (!dayOfWeek || !start_time || !end_time) {
      alert("Complete todos los campos.");
      return;
    }

    if (!availableDaysForSelectedRoute.includes(dayOfWeek)) {
      alert("Ese día no está asignado a la ruta según las fechas de AddDate.");
      return;
    }

    // ✅ FIX: mandamos el día con 3 llaves diferentes por compatibilidad
    // (porque tu backend/serializer puede esperar "day" o "weekday" y no "day_of_week")
    const payload = {
      route_id: routeId,

      // Día del horario (compatibilidad máxima)
      day: dayOfWeek,
      weekday: dayOfWeek,
      day_of_week: dayOfWeek,

      start_time: normalizeTime(start_time),
      end_time: normalizeTime(end_time),
    };

    setSaving(true);

    try {
      await axios.post(`${API_URL}/admin/route-schedules/`, payload, authHeaders());

      setMessage("✅ Horario agregado correctamente.");
      setStart_time("");
      setEnd_time("");

      await fetchRouteSchedules();
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else prettyBackendError(err, "Error al agregar el horario");
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // Eliminar horario
  // ============================
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este horario?")) return;
    try {
      await axios.delete(`${API_URL}/admin/route-schedules/${id}/`, authHeaders());
      await fetchRouteSchedules();
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else prettyBackendError(err, "No se pudo eliminar el horario");
    }
  };

  // ============================
  // UI
  // ============================
  if (loading) return <div className="add-schedule-container">Cargando...</div>;

  const selectedRouteObj = routes.find((r) => String(r.id) === String(routeId));

  const schedulesToShow = routeId
    ? routeSchedules.filter(
        (rs) => String(rs.route?.id ?? rs.route_id ?? rs.route) === String(routeId)
      )
    : routeSchedules;

  return (
    <div className="add-schedule-container">
      <h2>⏰ Agregar Horario de Ruta</h2>
      <p style={{ marginTop: -6, color: "#555" }}>
        📌 En este módulo solo defines el <b>horario</b>. Los <b>días disponibles</b> salen de las fechas asignadas en <b>AddDate</b>.
      </p>

      {message && <div className="alert success">{message}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Ruta:</label>
          <select value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
            <option value="">-- Seleccione una ruta --</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>

          {routeId && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#2e7d32" }}>
              ✅ Días disponibles por fechas:{" "}
              <b>{availableDaysForSelectedRoute.length ? availableDaysForSelectedRoute.join(", ") : "Ninguno"}</b>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Día de la semana:</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            required
            disabled={!routeId || availableDaysForSelectedRoute.length === 0}
          >
            <option value="">
              {routeId
                ? availableDaysForSelectedRoute.length
                  ? "-- Seleccione un día --"
                  : "Primero asigna fechas en AddDate"
                : "Seleccione una ruta primero"}
            </option>

            {availableDaysForSelectedRoute.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Hora de inicio:</label>
          <input
            type="time"
            value={start_time}
            onChange={(e) => setStart_time(e.target.value)}
            required
            disabled={!routeId || !dayOfWeek}
          />
        </div>

        <div className="form-group">
          <label>Hora de fin:</label>
          <input
            type="time"
            value={end_time}
            onChange={(e) => setEnd_time(e.target.value)}
            required
            disabled={!routeId || !dayOfWeek}
          />
        </div>

        <button type="submit" disabled={saving || !routeId || !dayOfWeek}>
          {saving ? "Guardando..." : "Agregar Horario"}
        </button>
      </form>

      <h3>Horarios Programados</h3>
      {selectedRouteObj ? (
        <p style={{ marginTop: -8, color: "#666" }}>
          Mostrando horarios de: <b>{selectedRouteObj.name}</b>
        </p>
      ) : null}

      {schedulesToShow.length === 0 ? (
        <p>No hay horarios programados.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Día</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {schedulesToShow.map((rs) => (
              <tr key={rs.id}>
                <td>{rs.route?.name || "—"}</td>

                {/* ✅ FIX: mostrar el día REAL del horario, no el de la ruta */}
                <td>{getScheduleDayLabel(rs)}</td>

                <td>{String(rs.start_time || "").slice(0, 5)}</td>
                <td>{String(rs.end_time || "").slice(0, 5)}</td>
                <td>
                  <button onClick={() => handleDelete(rs.id)} className="btn-delete">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AddSchedule;
