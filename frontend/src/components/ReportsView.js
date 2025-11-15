// ReportsView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsView.css';

const ReportsView = () => {
  const [detalle, setDetalle] = useState("");
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Normalizar API URL
  let API_URL = process.env.REACT_APP_API_URL;
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  const token = localStorage.getItem("token");

  // Obtener mis reportes
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${API_URL}/my-reports/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReportes(res.data);
      } catch (err) {
        console.error("Error al cargar reportes:", err);
      }
    };
    fetchReports();
  }, [API_URL, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!detalle.trim()) {
      alert("Debes escribir una descripción.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/my-reports/`,
        {
          detalle: detalle,      // 👈 CAMPO QUE ESPERA EL BACKEND
          tipo: "incidencias"    // 👈 se envía automáticamente
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Reporte enviado correctamente.");
      setDetalle("");

      // recargar lista
      const res = await axios.get(`${API_URL}/my-reports/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(res.data);

    } catch (err) {
      console.error("Error al enviar el reporte:", err);
      alert("Error al enviar el reporte. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container">
      <h2>Reportar Incidencia</h2>

      <form onSubmit={handleSubmit} className="report-form">
        <label>Descripción de la incidencia *</label>
        <textarea
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Describe la incidencia..."
          required
        ></textarea>

        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar Reporte"}
        </button>
      </form>

      <h2>Mis Reportes Enviados</h2>
      {reportes.length === 0 ? (
        <p>Aún no has enviado ningún reporte.</p>
      ) : (
        <ul className="reports-list">
          {reportes.map((rep) => (
            <li key={rep.id} className="report-item">
              <p><strong>Detalle:</strong> {rep.detalle}</p>
              <p><strong>Fecha:</strong> {rep.fecha}</p>
              <p><strong>Estado:</strong> {rep.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsView;
