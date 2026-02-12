// CollectionPoints.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./CollectionPoints.css";

// ================================
// Cargar Google Maps Script (sin librerías externas)
// ================================
const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (!apiKey) return reject(new Error("Falta REACT_APP_GOOGLE_MAPS_API_KEY"));

    if (window.google && window.google.maps) return resolve(true);

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () =>
        reject(new Error("Error cargando Google Maps"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Error cargando Google Maps"));
    document.head.appendChild(script);
  });
};

const CollectionPoints = () => {
  // ================================
  // NORMALIZAR API_URL
  // ================================
  let API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) API_URL = `${API_URL}/api`;

  const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // ✅ headers dinámicos (token siempre actualizado)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      token,
      authHeaders: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
  const [loading, setLoading] = useState(true);

  // 🔥 modo edición
  const [editingId, setEditingId] = useState(null);

  // Formulario
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  // Puntos dibujados en el mapa
  const [drawPoints, setDrawPoints] = useState([]); // [{lat, lng}]
  const [mapError, setMapError] = useState("");

  // ================================
  // GOOGLE MAPS refs
  // ================================
  const mapRef = useRef(null); // div container
  const gmapRef = useRef(null); // google map instance
  const polylineRef = useRef(null); // google polyline
  const markersRef = useRef([]); // markers for points
  const clickListenerRef = useRef(null);
  const initTimerRef = useRef(null);

  const defaultCenter = useMemo(() => {
    // Centro aproximado (ajusta si quieres)
    return { lat: 14.84, lng: -91.32 };
  }, []);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const clearMapDrawing = () => {
    if (markersRef.current?.length) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  const renderDrawingOnMap = (pts) => {
    if (!gmapRef.current || !(window.google && window.google.maps)) return;

    clearMapDrawing();
    if (!pts || pts.length === 0) return;

    markersRef.current = pts.map((p, idx) => {
      return new window.google.maps.Marker({
        position: p,
        map: gmapRef.current,
        label: idx === 0 ? "I" : idx === pts.length - 1 ? "F" : `${idx + 1}`,
      });
    });

    polylineRef.current = new window.google.maps.Polyline({
      path: pts,
      geodesic: true,
      strokeColor: "#1E88E5",
      strokeOpacity: 1,
      strokeWeight: 5,
    });
    polylineRef.current.setMap(gmapRef.current);

    const bounds = new window.google.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    gmapRef.current.fitBounds(bounds);
  };

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
    setDrawPoints([]);
    clearMapDrawing();
  };

  const undoLastPoint = () => {
    setDrawPoints((prev) => {
      const next = prev.slice(0, -1);
      renderDrawingOnMap(next);
      return next;
    });
  };

  const clearPoints = () => {
    setDrawPoints([]);
    clearMapDrawing();
  };

  // ================================
  // Init Google Map (FIX: asegura que el div exista)
  // ================================
  useEffect(() => {
    let mounted = true;

    const tryInitMap = () => {
      if (!mounted) return;

      // si el div aún no existe, reintenta
      if (!mapRef.current) {
        initTimerRef.current = setTimeout(tryInitMap, 200);
        return;
      }

      // si ya existe el mapa, no lo recrees
      if (gmapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        mapTypeId: "roadmap",
      });

      gmapRef.current = map;

      // Click to add point
      const listener = map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setDrawPoints((prev) => {
          const next = [...prev, { lat, lng }];
          renderDrawingOnMap(next);
          return next;
        });
      });

      clickListenerRef.current = listener;

      // si ya hay puntos en estado
      if (drawPoints.length > 0) renderDrawingOnMap(drawPoints);

      // por si el contenedor se dibujó después, forzamos resize
      setTimeout(() => {
        if (gmapRef.current) {
          window.google.maps.event.trigger(gmapRef.current, "resize");
          gmapRef.current.setCenter(defaultCenter);
        }
      }, 200);
    };

    const init = async () => {
      try {
        await loadGoogleMapsScript(GOOGLE_KEY);
        if (!mounted) return;

        // ya que el script cargó, intenta crear el mapa
        tryInitMap();
      } catch (e) {
        console.error(e);
        setMapError(
          "No se pudo cargar Google Maps. Verifica tu API KEY, referers y que Billing esté activo en Google Cloud."
        );
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        if (initTimerRef.current) clearTimeout(initTimerRef.current);
      } catch (_) {}
      try {
        if (clickListenerRef.current) clickListenerRef.current.remove();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_KEY, defaultCenter]);

  // ================================
  // GET ROUTES
  // ================================
  const fetchRoutes = async () => {
    try {
      const { token, authHeaders } = getAuthHeaders();
      if (!token) return handle401();

      const res = await axios.get(`${API_URL}/admin/routes/`, authHeaders);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRoutes(data);
    } catch (err) {
      if (err.response?.status === 401) handle401();
      else showBackendError(err, "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================================
  // BUILD PAYLOAD
  // ================================
  const buildPayload = () => {
    const points = drawPoints.map((p, idx) => ({
      latitude: Number(p.lat),
      longitude: Number(p.lng),
      order: idx,
    }));

    return {
      name: form.name.trim(),
      description: (form.description || "").trim(),

      // defaults para compatibilidad
      day_of_week: "Lunes",
      start_time: "08:00",
      end_time: "12:00",

      points,
    };
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Ingresa el nombre de la ruta.";
    if (drawPoints.length < 2)
      return "Dibuja la ruta: mínimo 2 puntos (inicio y fin).";
    return null;
  };

  // ================================
  // CREATE ROUTE
  // ================================
  const createRoute = async (e) => {
    e.preventDefault();

    const { token, authHeaders } = getAuthHeaders();
    if (!token) return handle401();

    const msg = validateForm();
    if (msg) return alert(msg);

    const payload = buildPayload();

    try {
      await axios.post(`${API_URL}/admin/routes/`, payload, authHeaders);
      alert("Ruta dibujada y registrada ✅");
      resetForm();
      setLoading(true);
      await fetchRoutes();
    } catch (err) {
      if (err.response?.status === 401) return handle401();
      showBackendError(err, "No se pudo registrar la ruta");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // UPDATE ROUTE
  // ================================
  const updateRoute = async (e) => {
    e.preventDefault();

    const { token, authHeaders } = getAuthHeaders();
    if (!token) return handle401();
    if (!editingId) return;

    const msg = validateForm();
    if (msg) return alert(msg);

    const payload = buildPayload();

    const urlWithSlash = `${API_URL}/admin/routes/${editingId}/`;
    const urlNoSlash = `${API_URL}/admin/routes/${editingId}`;

    const attempts = [
      { method: "patch", url: urlWithSlash },
      { method: "put", url: urlWithSlash },
      { method: "patch", url: urlNoSlash },
      { method: "put", url: urlNoSlash },
    ];

    try {
      for (const a of attempts) {
        try {
          if (a.method === "patch") await axios.patch(a.url, payload, authHeaders);
          else await axios.put(a.url, payload, authHeaders);

          alert("Ruta actualizada ✅");
          resetForm();
          setLoading(true);
          await fetchRoutes();
          return;
        } catch (errTry) {
          if (errTry.response?.status === 401) return handle401();
        }
      }

      alert("No se pudo actualizar la ruta. Revisa el endpoint de UPDATE en el backend.");
    } catch (err) {
      showBackendError(err, "No se pudo actualizar la ruta");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // EDIT / DELETE
  // ================================
  const startEdit = (route) => {
    setEditingId(route.id);
    setForm({
      name: route.name || "",
      description: route.description || "",
    });

    const pts = Array.isArray(route.points) ? [...route.points] : [];
    pts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const mapped = pts
      .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))
      .filter((p) => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

    setDrawPoints(mapped);
    renderDrawingOnMap(mapped);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRoute = async (routeId) => {
    const { token, authHeaders } = getAuthHeaders();
    if (!token) return handle401();

    const ok = window.confirm(
      "¿Seguro que deseas ELIMINAR esta ruta? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    const urlWithSlash = `${API_URL}/admin/routes/${routeId}/`;
    const urlNoSlash = `${API_URL}/admin/routes/${routeId}`;

    try {
      try {
        await axios.delete(urlWithSlash, authHeaders);
      } catch (err1) {
        if (err1.response?.status === 401) return handle401();
        await axios.delete(urlNoSlash, authHeaders);
      }

      alert("Ruta eliminada ✅");

      if (editingId === routeId) resetForm();

      setLoading(true);
      await fetchRoutes();
    } catch (err) {
      if (err.response?.status === 401) return handle401();
      showBackendError(err, "No se pudo eliminar la ruta");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // UI (FIX: NO retornar temprano, para que el mapa exista)
  // ================================
  return (
    <div className="collection-points-container">
      <h1>Puntos de Recolección - Smart Collector</h1>

      {loading && (
        <div style={{ marginBottom: 10, color: "#666" }}>
          Cargando rutas...
        </div>
      )}

      <div className="existing-routes">
        <h2>Registrar Ruta (Dibujada en Mapa)</h2>

        <form onSubmit={editingId ? updateRoute : createRoute} style={{ marginBottom: 20 }}>
          <input
            type="text"
            name="name"
            placeholder="Nombre de la ruta (Ej: RUTA 1)"
            value={form.name}
            onChange={onChange}
            style={{ width: 380, marginBottom: 10 }}
          />

          <textarea
            name="description"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={onChange}
            style={{ width: 720, maxWidth: "100%", height: 70, marginBottom: 12 }}
          />

          {/* MAPA DIBUJO */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong>Dibuja la ruta:</strong>
              <span style={{ color: "#666" }}>
                (clic en el mapa para agregar puntos — mínimo 2)
              </span>

              <button type="button" onClick={undoLastPoint} style={{ background: "#6c757d" }}>
                Deshacer último punto
              </button>

              <button type="button" onClick={clearPoints} style={{ background: "#dc3545" }}>
                Limpiar ruta
              </button>

              <span style={{ marginLeft: 8, color: "#0b5ed7" }}>
                Puntos: <strong>{drawPoints.length}</strong>
              </span>
            </div>

            {!GOOGLE_KEY && (
              <div
                style={{
                  padding: 10,
                  border: "1px solid #f5c2c7",
                  background: "#f8d7da",
                  color: "#842029",
                }}
              >
                Falta <strong>REACT_APP_GOOGLE_MAPS_API_KEY</strong> en tu .env.
                Sin eso no se puede dibujar en el mapa.
              </div>
            )}

            {mapError && (
              <div
                style={{
                  padding: 10,
                  border: "1px solid #ffeeba",
                  background: "#fff3cd",
                  color: "#856404",
                }}
              >
                {mapError}
              </div>
            )}

            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: 360,
                borderRadius: 10,
                border: "1px solid #ddd",
                overflow: "hidden",
                background: "#f3f3f3",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" style={{ width: 340 }}>
              {editingId ? "Actualizar Ruta" : "Guardar Ruta"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ width: 330, backgroundColor: "#6c757d" }}
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>

        <h2>Rutas Existentes</h2>

        {routes.length === 0 ? (
          <p>No hay rutas creadas.</p>
        ) : (
          routes.map((route) => {
            const pts = Array.isArray(route.points) ? route.points : [];
            return (
              <div key={route.id} className="route-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0 }}>{route.name}</h3>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => startEdit(route)}>
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRoute(route.id)}
                      style={{ backgroundColor: "#dc3545" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {route.description && (
                  <p style={{ marginTop: 10 }}>
                    <strong>Descripción:</strong> {route.description}
                  </p>
                )}

                <p style={{ marginTop: 8 }}>
                  <strong>Puntos guardados:</strong> {pts.length}
                </p>

                {pts.length > 0 && (
                  <div className="points-list">
                    <h4>Puntos:</h4>
                    {[...pts]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .slice(0, 10)
                      .map((p) => (
                        <div key={p.id || `${p.latitude}-${p.longitude}`} className="point-item">
                          📍 ({p.latitude}, {p.longitude}) {p.order != null ? `— orden: ${p.order}` : ""}
                        </div>
                      ))}

                    {pts.length > 10 && (
                      <div style={{ color: "#666", marginTop: 6 }}>
                        Mostrando 10 de {pts.length} puntos...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollectionPoints;