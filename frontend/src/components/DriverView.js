// DriverView.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const DriverView = () => {
  const [routePoints, setRoutePoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  // ===============================
  //   CARGAR RUTAS ASIGNADAS
  // ===============================
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Tu sesión expiró. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        // Llamada real al backend 🚛🔥
        const res = await axios.get(`${API_URL}/my-routes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Extraer puntos de todas las rutas
        const points = res.data.flatMap((route) =>
          route.points.map((p) => ({
            id: p.id,
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude),
            completed: p.completed || false,
          }))
        );

        setRoutePoints(points);
      } catch (error) {
        console.error("Error obteniendo rutas:", error);
        alert("Error al cargar los puntos de ruta.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [API_URL]);

  // =====================================
  //   MARCAR UN PUNTO COMO COMPLETADO
  // =====================================
  const handleComplete = async (pointId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      await axios.post(
        `${API_URL}/complete-point/${pointId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar visualmente
      setRoutePoints((prev) =>
        prev.map((p) =>
          p.id === pointId ? { ...p, completed: true } : p
        )
      );

      alert("Punto marcado como completado 👍");
    } catch (err) {
      console.error("Error completando punto:", err);
      alert("Error al marcar el punto como completado.");
    }
  };

  if (loading) return <h3 style={{ padding: "20px" }}>Cargando puntos...</h3>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Vista del Recolector - Smart Collector 🚛</h2>

      {routePoints.length === 0 ? (
        <p>No tienes puntos asignados.</p>
      ) : (
        routePoints.map((point) => (
          <div key={point.id} style={{ margin: "12px 0" }}>
            <span
              style={{
                color: point.completed ? "green" : "black",
                textDecoration: point.completed ? "line-through" : "none",
              }}
            >
              Punto {point.id}: ({point.lat}, {point.lng})
            </span>

            {!point.completed && (
              <button
                onClick={() => handleComplete(point.id)}
                style={{
                  marginLeft: "10px",
                  padding: "6px 14px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Completar
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DriverView;
