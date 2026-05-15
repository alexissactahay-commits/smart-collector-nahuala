// CalendarView.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CalendarView.css";

const CalendarView = () => {
  const navigate = useNavigate();

  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "";

  API_URL = API_URL.replace(/\/+$/, "");

  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  const [routeDates, setRouteDates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState({
    message: "",
    type: "",
  });

  const token = localStorage.getItem("token");

  // ----------------------------
  // Parseo local de fecha
  // ----------------------------
  const parseLocalDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    const parts = dateStr.split("-");

    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);

    return new Date(y, m - 1, d);
  };

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

    const parts = s.split(":");

    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }

    return s;
  };

  // ----------------------------
  // Cargar datos
  // ----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const [calendarRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/calendar/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          axios.get(`${API_URL}/citizen/route-schedules/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setRouteDates(Array.isArray(calendarRes.data) ? calendarRes.data : []);
        setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      } catch (err) {
        console.error("Error cargando calendario:", err);

        setAlert({
          message: "No se pudo cargar el calendario.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

      return da - db;
    });

    return {
      map,
      sortedKeys,
    };
  }, [routeDates]);

  // ----------------------------
  // Obtener horarios reales de una ruta
  // ----------------------------
  const getSchedulesForRoute = (routeId) => {
    return schedules.filter((s) => s?.route?.id === routeId);
  };

  // ----------------------------
  // Loading
  // ----------------------------
  if (loading) {
    return <div className="calendar-container">Cargando calendario...</div>;
  }

  return (
    <div className="calendar-container">
      {/* Botón regresar */}
      <button
        id="calendar-small-back-button"
        type="button"
        onClick={() => navigate("/user-dashboard")}
      >
        ← Regresar
      </button>

      <h2>Calendario de Recolección - Smart Collector</h2>

      {alert.message && (
        <div className={`alert ${alert.type}`} style={{ marginBottom: "15px" }}>
          {alert.message}
        </div>
      )}

      {groupedByDate.sortedKeys.length === 0 ? (
        <p className="no-service-text">Aún no hay fechas asignadas.</p>
      ) : (
        <div className="calendar-grid">
          {groupedByDate.sortedKeys.map((dateKey) => (
            <div key={dateKey} className="day-card">
              <h3>{formatDate(dateKey)}</h3>

              <ul>
                {groupedByDate.map[dateKey].map((item) => {
                  const route = item?.route;

                  const routeName = route?.name || "Ruta";
                  const routeId = route?.id;

                  const realSchedules = getSchedulesForRoute(routeId);

                  const communities = Array.isArray(route?.communities)
                    ? route.communities
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
                      <div style={{ fontWeight: 600 }}>{routeName}</div>

                      {realSchedules.length > 0 ? (
                        realSchedules.map((sch) => (
                          <div
                            key={sch.id}
                            style={{
                              color: "#666",
                              fontSize: "0.9rem",
                            }}
                          >
                            Horario: {formatTime(sch.start_time)} -{" "}
                            {formatTime(sch.end_time)}
                          </div>
                        ))
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

                      {communitiesText && (
                        <div
                          style={{
                            color: "#444",
                            fontSize: "0.9rem",
                            marginTop: "4px",
                          }}
                        >
                          Comunidades: {communitiesText}
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