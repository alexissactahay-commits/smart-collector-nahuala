// AddDate.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddDate.css";

const AddDate = () => {

  // 🔥 NORMALIZAMOS LA URL COMO EN LOS OTROS COMPONENTES
  let API_URL = process.env.REACT_APP_API_URL || "";
  API_URL = API_URL.replace(/\/+$/, ""); // quitar / sobrantes al final

  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  const [routes, setRoutes] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  // ===========================
  // Cargar rutas al iniciar
  // ===========================
  useEffect(() => {
    fetchRoutes();
    fetchDates();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/admin/routes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRoutes(res.data);
    } catch (err) {
      console.error("❌ Error al cargar rutas:", err);
      alert("Error al cargar rutas.");
    }
  };

  const fetchDates = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/admin/route-dates/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDates(res.data);
    } catch (err) {
      console.error("❌ Error al cargar fechas:", err);
      alert("Error al cargar fechas.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Guardar fecha nueva
  // ===========================
  const addDate = async () => {
    if (!selectedRoute || !selectedDate) {
      alert("Debe seleccionar ruta y fecha.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/admin/route-dates/`,
        {
          route_id: selectedRoute,
          date: selectedDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Fecha agregada correctamente.");
      fetchDates();
    } catch (err) {
      console.error("❌ Error al agregar fecha:", err);
      alert("Error al agregar la fecha.");
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="add-date-container">
      <h1>📅 Agregar Fecha de Ruta</h1>

      <label>Ruta:</label>
      <select
        value={selectedRoute}
        onChange={(e) => setSelectedRoute(e.target.value)}
      >
        <option value="">-- Seleccione una ruta --</option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.day_of_week})
          </option>
        ))}
      </select>

      <label>Fecha:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <button onClick={addDate}>Agregar Fecha</button>

      <h2>Fechas Programadas</h2>
      {dates.length === 0 ? (
        <p>No hay fechas programadas.</p>
      ) : (
        dates.map((d) => (
          <div key={d.id}>
            📅 {d.date} — Ruta {d.route?.name}
          </div>
        ))
      )}
    </div>
  );
};

export default AddDate;

