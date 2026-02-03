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

const dayLabelFromKey = (key) => {
  // Acepta números o strings (según como esté guardado day_of_week en tu modelo)
  const s = String(key ?? "").toLowerCase();

  // si viene número 0-6 (lunes=0)
  const asNum = Number(s);
  if (!Number.isNaN(asNum)) {
    const mapNum = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return mapNum[asNum] || "Día";
  }

  // si viene texto
  const mapText = {
    lunes: "Lunes",
    monday: "Lunes",
    martes: "Martes",
    tuesday: "Martes",
    miercoles: "Miércoles",
    miércoles: "Miércoles",
    wednesday: "Miércoles",
    jueves: "Jueves",
    thursday: "Jueves",
    viernes: "Viernes",
    friday: "Viernes",
    sabado: "Sábado",
    sábado: "Sábado",
    saturday: "Sábado",
    domingo: "Domingo",
    sunday: "Domingo",
  };

  return mapText[s] || "Día";
};

const sortDayKey = (key) => {
  const s = String(key ?? "").toLowerCase();
  const asNum = Number(s);
  if (!Number.isNaN(asNum)) return asNum;

  const order = {
    lunes: 0,
    monday: 0,
    martes: 1,
    tuesday: 1,
    miercoles: 2,
    miércoles: 2,
    wednesday: 2,
    jueves: 3,
    thursday: 3,
    viernes: 4,
    friday: 4,
    sabado: 5,
    sábado: 5,
    saturday: 5,
    domingo: 6,
    sunday: 6,
  };

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

        // ✅ endpoint ciudadano
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

  // Agrupar horarios por día de semana
  const groupedByDay = useMemo(() => {
    const map = new Map();

    (Array.isArray(schedules) ? schedules : []).forEach((s) => {
      const dayKey = s?.day_of_week;
      if (dayKey === undefined || dayKey === null) return;

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
    const out = Array.from(map.entries())
      .map(([dayKey, items]) => ({
        dayKey,
        dayName: dayLabelFromKey(dayKey),
        items,
      }))
      .sort((a, b) => sortDayKey(a.dayKey) - sortDayKey(b.dayKey));

    return out;
  }, [schedules]);

  // Mostrar al menos Lunes-Viernes aunque no haya data
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
    // si el backend devuelve day_of_week como números, igual lo mostramos tal cual venga
    // pero también queremos garantizar L-V visibles
    const hasTextKeys = groupedByDay.some((d) => typeof d.dayKey === "string");
    if (!hasTextKeys) {
      // backend numérico: no forzamos L-V con texto, solo mostramos lo que venga
      return groupedByDay;
    }

    // backend texto: aseguramos L-V
    const map = new Map(groupedByDay.map((d) => [String(d.dayKey).toLowerCase(), d]));
    const result = baseDays.map((d) => map.get(d.dayKey) || { ...d, items: [] });
    return result;
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
