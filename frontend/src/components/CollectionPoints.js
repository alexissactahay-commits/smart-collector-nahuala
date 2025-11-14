// CollectionPoints.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CollectionPoints.css";

const CollectionPoints = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar rutas al montar
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const res = await axios.get(`${API_URL}/admin/routes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRoutes(res.data);
    } catch (err) {
      console.error("Error al cargar rutas:", err);

      if (err.response?.status === 401) {
        alert("Tu sesión expiró.");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      } else {
        alert("Error al cargar rutas.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando rutas...</div>;

  return (
    <div className="collection-points-container">
      <h1>Puntos de Recolección - Smart Collector</h1>

      <div className="info-box">
        <p>
          <strong>Nota:</strong> Actualmente solo está habilitada la vista de
          rutas. Si necesitas crear, editar o eliminar rutas, puedo crear los
          endpoints reales en Django.
        </p>
      </div>

      {/* Lista de rutas existentes */}
      <div className="existing-routes">
        <h2>Rutas Existentes</h2>
        {routes.length === 0 ? (
          <p>No hay rutas creadas.</p>
        ) : (
          routes.map((route) => (
            <div key={route.id} className="route-card">
              <h3>
                {route.name} ({route.day_of_week})
              </h3>

              <p>
                <strong>Horario:</strong> {route.start_time} -{" "}
                {route.end_time}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {route.completed ? "Completada" : "Pendiente"}
              </p>

              {route.description && (
                <p>
                  <strong>Descripción:</strong> {route.description}
                </p>
              )}

              {/* Lista de puntos */}
              {route.points?.length > 0 && (
                <div className="points-list">
                  <h4>Puntos de recolección:</h4>
                  {route.points.map((p) => (
                    <div key={p.id} className="point-item">
                      📍 ({p.latitude}, {p.longitude})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CollectionPoints;
