import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CalendarView.css";

const CalendarView = () => {
  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "";
  API_URL = API_URL.replace(/\/+$/, ""); // quitar slashes finales
  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }
  // ================================

  const [routeDates, setRouteDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const token = localStorage.getItem("token");

  // ----------------------------
  // ✅ Parseo correcto de YYYY-MM-DD en hora LOCAL (evita desfase -1 día)
  // ----------------------------
  const parseLocalDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d); // ✅ local
  };

  // ----------------------------
  // Cargar calendario (CIUDADANO)
  // ----------------------------
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        if (!token) {
          setAlert({
            message: "Tu sesión expiró. Inicia sesión nuevamente.",
            type: "error",
          });
          window.location.href = "/login";
          return;
        }

        // ✅ ENDPOINT PARA CIUDADANO
        const res = await axios.get(`${API_URL}/calendar/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = Array.isArray(res.data) ? res.data : [];
        setRouteDates(data);
      } catch (err) {
        console.error("Error al cargar calendario:", err);

        const status = err.response?.status;

        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("username");
          setAlert({
            message: "Sesión expirada o sin permisos. Inicia sesión de nuevo.",
            type: "error",
          });
          window.location.href = "/login";
          return;
        }

        setAlert({
          message: "No se pudo cargar el calendario. Verifica el servidor.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [API_URL, token]);

  // ----------------------------
  // Agrupar por fecha
  // ----------------------------
  const groupedByDate = useMemo(() => {
    const map = {};

    routeDates.forEach((item) => {
      const dateKey = item?.date || "Sin fecha";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });

    // ordenar por fecha ascendente (YYYY-MM-DD)
    const sortedKeys = Object.keys(map).sort((a, b) => {
      const da = parseLocalDate(a);
      const db = parseLocalDate(b);
      if (!da || !db) return String(a).localeCompare(String(b));
      return da - db;
    });

    return { map, sortedKeys };
  }, [routeDates]);

  // ✅ Formatear fecha sin desfase por UTC
  const formatDate = (dateStr) => {
    try {
      const d = parseLocalDate(dateStr);
      if (!d) return dateStr;
      return d.toLocaleDateString("es-GT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // ✅ formatear hora HH:MM desde "08:00:00" o "08:00"
  const formatTime = (t) => {
    if (!t) return null;
    const s = String(t).trim();
    if (!s) return null;
    // si viene HH:MM:SS -> cortar
    const parts = s.split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return s;
  };

  if (loading) {
    return <div className="calendar-container">Cargando calendario...</div>;
  }

  return (
    <div className="calendar-container">
      <h2>Calendario de Recolección - Smart Collector</h2>

      {alert.message && (
        <div className={`alert ${alert.type}`} style={{ marginBottom: "15px" }}>
          {alert.message}
        </div>
      )}

      {groupedByDate.sortedKeys.length === 0 ? (
        <p className="no-service-text">
          Aún no hay fechas asignadas a rutas. (Admin debe agregar fechas en "Agregar Fecha")
        </p>
      ) : (
        <div className="calendar-grid">
          {groupedByDate.sortedKeys.map((dateKey) => (
            <div key={dateKey} className="day-card">
              {/* ✅ Fecha EXACTA asignada por admin (sin desfase de -1 día) */}
              <h3>{formatDate(dateKey)}</h3>

              <ul>
                {groupedByDate.map[dateKey].map((item) => {
                  const routeName = item?.route?.name || "Ruta sin nombre";

                  // ✅ Hora asignada por admin (si existe en la ruta)
                  const st = formatTime(item?.route?.start_time);
                  const et = formatTime(item?.route?.end_time);
                  const horario = st && et ? `${st} - ${et}` : null;

                  // ✅ Comunidades (si el backend ya las manda)
                  const communities = Array.isArray(item?.route?.communities)
                    ? item.route.communities
                    : [];
                  const communitiesText =
                    communities.length > 0
                      ? communities.map((c) => c?.name).filter(Boolean).join(", ")
                      : null;

                  return (
                    <li key={item.id}>
                      <div style={{ fontWeight: 600 }}>{routeName}</div>

                      {/* ✅ Quitamos (Lunes) completamente */}
                      {horario ? (
                        <div style={{ color: "#666", fontSize: "0.9rem" }}>
                          Horario: {horario}
                        </div>
                      ) : (
                        <div style={{ color: "#999", fontSize: "0.9rem" }}>
                          Horario no asignado
                        </div>
                      )}

                      {communitiesText ? (
                        <div style={{ color: "#666", fontSize: "0.9rem" }}>
                          Comunidades: {communitiesText}
                        </div>
                      ) : (
                        <div style={{ color: "#999", fontSize: "0.9rem" }}>
                          Comunidades no asignadas
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarView;