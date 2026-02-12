// ReportsView.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ReportsView.css";

const ReportsView = () => {
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState("");
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // API URL NORMALIZADA (evita /api/api y ///)
  // ===============================
  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
    base = base.replace(/\/+$/, ""); // quitar slash final
    if (!base.endsWith("/api")) base = `${base}/api`; // solo agregar si no existe
    return base;
  }, []);

  const getToken = () => localStorage.getItem("token");

  // ===============================
  // VERIFICAR SESIÓN
  // ===============================
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // ===============================
  // CARGAR MIS REPORTES
  // ===============================
  const fetchReports = useCallback(async () => {
    const token = getToken();
    if (!token) return; // ✅ evita llamar sin token (causa 401)

    try {
      const res = await axios.get(`${API_URL}/my-reports/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      setReportes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err?.response?.status;

      console.error("Error al cargar reportes:", err?.response?.data || err?.message);

      // ✅ Si token inválido/expirado
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
        return;
      }
    }
  }, [API_URL, navigate]);

  useEffect(() => {
    // ✅ solo cargar si hay token
    if (getToken()) fetchReports();
  }, [fetchReports]);

  // ===============================
  // ENVIAR REPORTE
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!detalle.trim()) {
      alert("Debes escribir una descripción.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/my-reports/`,
        {
          detalle: detalle.trim(),
          tipo: "incidencias", // ✅ coincide con tu modelo
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      );

      setDetalle("");
      await fetchReports();
      alert("✅ Reporte enviado correctamente.");
    } catch (err) {
      const status = err?.response?.status;

      console.error("Error al enviar el reporte:", err?.response?.data || err?.message);

      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
        return;
      }

      alert("❌ Error al enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ELIMINAR REPORTE (OJO: tu backend NO tiene este endpoint)
  // ===============================
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este reporte?")) return;

    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      // ⚠️ Tu urls.py NO tiene /api/my-reports/<id>/
      // Lo intento por si luego lo agregamos; si falla, aviso bonito.
      await axios.delete(`${API_URL}/my-reports/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      setReportes((prev) => prev.filter((rep) => rep.id !== id));
    } catch (err) {
      const status = err?.response?.status;

      console.error("Error al eliminar reporte:", err?.response?.data || err?.message);

      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
        return;
      }

      if (status === 404 || status === 405) {
        alert("⚠️ El servidor aún no tiene habilitado eliminar reportes.");
        return;
      }

      alert("❌ Error al eliminar el reporte.");
    }
  };

  // ===============================
  // TRADUCIR ESTADO
  // ===============================
  const renderStatus = (status) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "resolved":
        return "Resuelto";
      case "unresolved":
        return "No resuelto";
      default:
        return status || "Pendiente";
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
        />

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
              <p>
                <strong>Detalle:</strong> {rep.detalle}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {rep.fecha ? new Date(rep.fecha).toLocaleString() : "No disponible"}
              </p>
              <p>
                <strong>Estado:</strong> {renderStatus(rep.status)}
              </p>

              <button className="btn-delete" onClick={() => handleDelete(rep.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportsView;