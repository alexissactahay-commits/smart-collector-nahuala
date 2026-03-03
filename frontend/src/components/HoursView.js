import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./HoursView.css";

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

// ✅ NUEVO: normaliza claves de día (quita tildes, espacios, etc.)
const normalizeDayKey = (key) => {
  if (key === undefined || key === null) return null;

  // Si viene number (0-6)
  if (typeof key === "number" && Number.isFinite(key)) return key;

  const s0 = String(key).trim();
  if (!s0) return null;

  // Si viene string numérica "0-6"
  if (/^\d+$/.test(s0)) {
    const n = Number(s0);
    if (Number.isFinite(n)) return n;
  }

  // Quitar tildes y normalizar
  const s = s0
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\./g, "")
    .trim();

  const alias = {
    monday: "lunes",
    lunes: "lunes",
    tuesday: "martes",
    martes: "martes",
    wednesday: "miercoles",
    miercoles: "miercoles",
    jueves: "jueves",
    thursday: "jueves",
    friday: "viernes",
    viernes: "viernes",
    saturday: "sabado",
    sabado: "sabado",
    sunday: "domingo",
    domingo: "domingo",
  };

  return alias[s] || s; // si viene raro, al menos lo dejamos consistente
};

const dayLabelFromKey = (key) => {
  // Acepta números o strings ya normalizados
  if (typeof key === "number") {
    const mapNum = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return mapNum[key] || "Día";
  }

  const s = String(key ?? "").toLowerCase();

  const mapText = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  return mapText[s] || "Día";
};

const sortDayKey = (key) => {
  if (typeof key === "number") return key;

  const order = {
    lunes: 0,
    martes: 1,
    miercoles: 2,
    jueves: 3,
    viernes: 4,
    sabado: 5,
    domingo: 6,
  };

  const s = String(key ?? "").toLowerCase();
  return order[s] ?? 99;
};

const HoursView = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await axios.get(buildURL("/citizen/route-schedules/"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error cargando horarios:", e);
        setError("No se pudieron cargar los horarios. Intenta nuevamente.");
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [token]);

  // ✅ Agrupar horarios por día (normalizado)
  const groupedByDay = useMemo(() => {
    const map = new Map();

    (Array.isArray(schedules) ? schedules : []).forEach((s) => {
      const rawDayKey = s?.day_of_week;
      const dayKey = normalizeDayKey(rawDayKey);
      if (dayKey === null) return;

      const start = s?.start_time || "--:--";
      const end = s?.end_time || "--:--";
      const routeName = s?.route?.name || "Ruta";

      const item = {
        id: s?.id,
        start_time: start,
        end_time: end,
        routeName,
      };

      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(item);
    });

    // ordenar dentro de cada día por start_time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
      map.set(k, arr);
    }

    // devolver como array ordenado por día
    return Array.from(map.entries())
      .map(([dayKey, items]) => ({
        dayKey,
        dayName: dayLabelFromKey(dayKey),
        items,
      }))
      .sort((a, b) => sortDayKey(a.dayKey) - sortDayKey(b.dayKey));
  }, [schedules]);

  // Mostrar al menos Lunes-Viernes aunque no haya data (cuando backend devuelve texto)
  const baseDays = useMemo(
    () => [
      { dayKey: "lunes", dayName: "Lunes" },
      { dayKey: "martes", dayName: "Martes" },
      { dayKey: "miercoles", dayName: "Miércoles" },
      { dayKey: "jueves", dayName: "Jueves" },
      { dayKey: "viernes", dayName: "Viernes" },
    ],
    []
  );

  const viewDays = useMemo(() => {
    const anyNumeric = groupedByDay.some((d) => typeof d.dayKey === "number");
    if (anyNumeric) {
      // Si el backend devuelve números 0-6, mostramos lo que venga
      return groupedByDay;
    }

    // Backend texto: aseguramos L-V
    const map = new Map(groupedByDay.map((d) => [String(d.dayKey).toLowerCase(), d]));
    return baseDays.map((d) => map.get(d.dayKey) || { ...d, items: [] });
  }, [groupedByDay, baseDays]);

  return (
    <div className="hours-container">
      <h2>Horarios de Recolección - Nahualá</h2>

      {loading && <p style={{ textAlign: "center" }}>Cargando horarios...</p>}

      {!loading && error && (
        <p style={{ textAlign: "center", color: "#b00020", fontWeight: 600 }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="hours-grid">
          {viewDays.map((day) => (
            <div key={String(day.dayKey)} className="hour-card">
              <h3>{day.dayName}</h3>

              {Array.isArray(day.items) && day.items.length > 0 ? (
                <div className="hour-time">
                  {day.items.map((it) => (
                    <div key={it.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>
                        {it.start_time} - {it.end_time}
                      </div>
                      <div style={{ fontSize: 13, color: "#2e7d32" }}>
                        {it.routeName}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="hour-time">No hay recolección este día</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HoursView;