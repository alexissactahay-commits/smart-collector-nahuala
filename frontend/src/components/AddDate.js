// AddDate.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AddDate.css";

const AddDate = () => {
  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) API_URL = `${API_URL}/api`;

  // ================================
  // AUTH HELPERS
  // ================================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      token,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const handle401 = () => {
    alert("Tu sesión expiró. Inicia sesión nuevamente.");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const showBackendError = (err, title = "Error") => {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error(`❌ ${title}`, { status, data, err });

    alert(
      `${title}\n` +
        `Status: ${status}\n\n` +
        `Respuesta del backend:\n${JSON.stringify(data || {}, null, 2)}`
    );
  };

  // ================================
  // STATE
  // ================================
  const [routes, setRoutes] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState("");
  const [dateInput, setDateInput] = useState("");      // calendario (1 fecha)
  const [pendingDates, setPendingDates] = useState([]); // lista de fechas por guardar

  const ENDPOINT_DATES = `${API_URL}/admin/route-dates/`;

  // ================================
  // HELPERS
  // ================================
  const DAY_NAMES = useMemo(
    () => ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    []
  );

  // Convierte "2026-02-03" -> "Martes" (según tu zona local)
  const getDayNameFromISODate = (isoDate) => {
    try {
      // isoDate viene como YYYY-MM-DD
      // Forzamos hora local para evitar desfase por UTC:
      const d = new Date(`${isoDate}T12:00:00`);
      return DAY_NAMES[d.getDay()];
    } catch {
      return "—";
    }
  };

  const normalizeISO = (v) => String(v || "").trim();

  const addPendingDate = () => {
    if (!dateInput) {
      alert("Selecciona una fecha en el calendario.");
      return;
    }

    const iso = normalizeISO(dateInput);
    setPendingDates((prev) => {
      if (prev.includes(iso)) return prev; // evita duplicados
      return [...prev, iso].sort();
    });

    setDateInput("");
  };

  const removePendingDate = (iso) => {
    setPendingDates((prev) => prev.filter((d) => d !== iso));
  };

  const clearPending = () => setPendingDates([]);

  // ================================
  // FETCH ROUTES
  // ================================
  const fetchRoutes = async () => {
    try {
      const { token, headers } = getAuthHeaders();
      if (!token) return handle401();

      const res = await axios.get(`${API_URL}/admin/routes/`, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRoutes(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else showBackendError(err, "Error al cargar rutas");
    }
  };

  // ================================
  // FETCH DATES
  // ================================
  const fetchDates = async () => {
    try {
      const { token, headers } = getAuthHeaders();
      if (!token) return handle401();

      const res = await axios.get(ENDPOINT_DATES, { headers });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setDates(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else showBackendError(err, "Error al cargar fechas");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchRoutes();
      await fetchDates();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================================
  // SAVE (POST) MULTI FECHAS
  // ================================
  const savePendingDates = async () => {
    if (!selectedRoute) {
      alert("Debe seleccionar una ruta.");
      return;
    }
    if (pendingDates.length === 0) {
      alert("Agrega al menos 1 fecha a la lista.");
      return;
    }

    const { token, headers } = getAuthHeaders();
    if (!token) return handle401();

    try {
      // Guardamos 1 por 1 (más compatible)
      for (const d of pendingDates) {
        await axios.post(
          ENDPOINT_DATES,
          { route_id: selectedRoute, date: d },
          { headers }
        );
      }

      alert("Fechas guardadas ✅");
      setPendingDates([]);
      await fetchDates();
    } catch (err) {
      if (err.response?.status === 401) return handle401();
      showBackendError(err, "No se pudieron guardar las fechas");
    }
  };

  // ================================
  // DELETE DATE
  // ================================
  const deleteDate = async (id) => {
    const ok = window.confirm("¿Eliminar esta fecha programada?");
    if (!ok) return;

    const { token, headers } = getAuthHeaders();
    if (!token) return handle401();

    const urlWithSlash = `${ENDPOINT_DATES}${id}/`;
    const urlNoSlash = `${ENDPOINT_DATES}${id}`;

    try {
      try {
        await axios.delete(urlWithSlash, { headers });
      } catch (e1) {
        if (e1.response?.status === 401) return handle401();
        await axios.delete(urlNoSlash, { headers });
      }

      alert("Fecha eliminada ✅");
      await fetchDates();
    } catch (err) {
      if (err.response?.status === 401) return handle401();
      showBackendError(err, "No se pudo eliminar la fecha");
    }
  };

  // ================================
  // AGRUPAR PARA MOSTRAR BONITO
  // ================================
  const grouped = useMemo(() => {
    const map = new Map(); // routeId -> { routeName, items[] }

    for (const item of dates) {
      const routeId = item.route?.id || item.route_id || item.route;
      if (!routeId) continue;

      const routeName = item.route?.name || `Ruta ${routeId}`;

      if (!map.has(routeId)) {
        map.set(routeId, { routeId, routeName, items: [] });
      }
      map.get(routeId).items.push(item);
    }

    const result = Array.from(map.values());
    result.sort((a, b) => String(a.routeName).localeCompare(String(b.routeName)));

    // ordenar fechas dentro de cada ruta
    for (const r of result) {
      r.items.sort((x, y) => String(x.date).localeCompare(String(y.date)));
    }

    return result;
  }, [dates]);

  // ================================
  // UI
  // ================================
  if (loading) return <div className="add-date-container">Cargando...</div>;

  return (
    <div className="add-date-container">
      <h1>📅 Programar Fechas para una Ruta</h1>

      <p style={{ marginTop: -8, color: "#555" }}>
        Aquí asignas <strong>fechas</strong> a una ruta. El sistema mostrará el <strong>día</strong> automáticamente (Lunes, Martes, etc.).
      </p>

      <label>Ruta:</label>
      <select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
        <option value="">-- Seleccione una ruta --</option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <label>Calendario:</label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>

        <button type="button" onClick={addPendingDate} style={{ minWidth: 180 }}>
          + Agregar a lista
        </button>

        <button
          type="button"
          onClick={clearPending}
          style={{ minWidth: 180, background: "#6c757d" }}
        >
          Limpiar lista
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h2 style={{ marginBottom: 8 }}>🧾 Fechas por guardar</h2>

        {pendingDates.length === 0 ? (
          <p style={{ marginTop: 0 }}>No has agregado fechas todavía.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingDates.map((d) => (
              <div
                key={d}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  background: "#fff",
                }}
              >
                <div>
                  📅 <strong>{d}</strong> — 🗓️ <strong>{getDayNameFromISODate(d)}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => removePendingDate(d)}
                  style={{ background: "#dc3545", padding: "6px 10px" }}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={savePendingDates} style={{ minWidth: 240 }}>
          Guardar Fechas ✅
        </button>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2>✅ Fechas Programadas</h2>

      {grouped.length === 0 ? (
        <p>No hay fechas programadas.</p>
      ) : (
        grouped.map((g) => (
          <div
            key={g.routeId}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <strong style={{ fontSize: 16 }}>{g.routeName}</strong>
              <span style={{ color: "#666" }}>
                Total: <strong>{g.items.length}</strong>
              </span>
            </div>

            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((it) => (
                <div
                  key={it.id || `${g.routeId}-${it.date}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 10,
                    background: "#fafafa",
                  }}
                >
                  <div>
                    📅 <strong>{it.date}</strong> — 🗓️ <strong>{getDayNameFromISODate(it.date)}</strong>
                  </div>

                  {it.id ? (
                    <button
                      type="button"
                      onClick={() => deleteDate(it.id)}
                      style={{ background: "#dc3545", padding: "6px 10px" }}
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AddDate;