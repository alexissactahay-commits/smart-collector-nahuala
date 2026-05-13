import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CalendarView.css";

const CalendarView = () => {
  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "";
  API_URL = API_URL.replace(/\/+$/, "");

  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  // ================================

  const [routeDates, setRouteDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const token = localStorage.getItem("token");

  // ----------------------------
  // Parseo LOCAL de fecha
  // ----------------------------
  const parseLocalDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    const parts = dateStr.split("-");

    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);

    if (!y || !m || !d) return null;

    return new Date(y, m - 1, d);
  };

  // ----------------------------
  // Cargar calendario
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

        const res = await axios.get(`${API_URL}/calendar/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
            message: "Sesión expirada o sin permisos.",
            type: "error",
          });

          window.location.href = "/login";
          return;
        }

        setAlert({
          message: "No se pudo cargar el calendario.",
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

      if (!map[dateKey]) {
        map[dateKey] = [];
      }

      map[dateKey].push(item);
    });

    const sortedKeys = Object.keys(map).sort((a, b) => {
      const da = parseLocalDate(a);
      const db = parseLocalDate(b);

      if (!da || !db) {
        return String(a).localeCompare(String(b));
      }

      return da - db;
    });

    return { map, sortedKeys };
  }, [routeDates]);

  // ----------------------------
  // Formatear fecha
  // ----------------------------
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

  // ----------------------------
  // Formatear hora
  // ----------------------------
  const formatTime = (t) => {
    if (!t) return null;

    const s = String(t).trim();

    if (!s) return null;

    const parts = s.split(":");

    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }

    return s;
  };

  if (loading) {
    return (
      <div className="calendar-container">
        Cargando calendario...
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <h2>Calendario de Recolección - Smart Collector</h2>

      {alert.message && (
        <div
          className={`alert ${alert.type}`}
          style={{ marginBottom: "15px" }}
        >
          {alert.message}
        </div>
      )}

      {groupedByDate.sortedKeys.length === 0 ? (
        <p className="no-service-text">
          Aún no hay fechas asignadas a rutas.
        </p>
      ) : (
        <div className="calendar-grid">
          {groupedByDate.sortedKeys.map((dateKey) => (
            <div key={dateKey} className="day-card">
              <h3>{formatDate(dateKey)}</h3>

              <ul>
                {groupedByDate.map[dateKey].map((item) => {
                  const routeName =
                    item?.route?.name || "Ruta sin nombre";

                  // ✅ TOMAR HORARIOS DESDE schedules
                  const schedules = Array.isArray(
                    item?.route?.schedules
                  )
                    ? item.route.schedules
                    : [];

                  // ✅ comunidades
                  const communities = Array.isArray(
                    item?.route?.communities
                  )
                    ? item.route.communities
                    : [];

                  const communitiesText =
                    communities.length > 0
                      ? communities
                          .map((c) => c?.name)
                          .filter(Boolean)
                          .join(", ")
                      : null;

                  return (
                    <li key={item.id}>
                      <div style={{ fontWeight: 600 }}>
                        {routeName}
                      </div>

                      {/* ✅ MOSTRAR TODOS LOS HORARIOS */}
                      {schedules.length > 0 ? (
                        schedules.map((sch, idx) => {
                          const st = formatTime(sch?.start_time);
                          const et = formatTime(sch?.end_time);

                          return (
                            <div
                              key={idx}
                              style={{
                                color: "#666",
                                fontSize: "0.9rem",
                              }}
                            >
                              Horario: {st} - {et}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "#999",
                            fontSize: "0.9rem",
                          }}
                        >
                          Horario no asignado
                        </div>
                      )}

                      {communitiesText ? (
                        <div
                          style={{
                            color: "#666",
                            fontSize: "0.9rem",
                          }}
                        >
                          Comunidades: {communitiesText}
                        </div>
                      ) : (
                        <div
                          style={{
                            color: "#999",
                            fontSize: "0.9rem",
                          }}
                        >
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