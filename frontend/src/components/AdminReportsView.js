import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminReportsView.css";

const AdminReportsView = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===========================
  // Cargar reportes de ciudadanos
  // ===========================
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión.");
        window.location.href = "/login";
        return;
      }

      const res = await axios.get(`${API_URL}/admin/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReports(res.data);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      alert("Error al cargar reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ===========================
  // Actualizar estado del reporte
  // ===========================
  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/admin/reports/${id}/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Estado actualizado a: ${newStatus}`);
      fetchReports();
    } catch (error) {
      console.error("Error al actualizar reporte:", error);
      alert("No se pudo actualizar el estado.");
    }
  };

  if (loading) return <div className="loading">Cargando reportes...</div>;

  return (
    <div className="reports-admin-container">
      <h2>Reportes de Ciudadanos - Smart Collector</h2>

      <div className="reports-list">
        {reports.length === 0 ? (
          <p className="no-reports">No hay reportes enviados.</p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`report-card status-${report.status}`}
            >
              <div className="report-header">
                <h3>Reporte #{report.id}</h3>
                <span className="report-date">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>

              <p>
                <strong>Descripción:</strong> {report.description}
              </p>

              <p>
                <strong>Usuario:</strong>{" "}
                {report.user?.username || "Desconocido"}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                <span className={`status-label status-${report.status}`}>
                  {report.status === "pending"
                    ? "Pendiente"
                    : report.status === "resolved"
                    ? "Resuelto"
                    : "No Resuelto"}
                </span>
              </p>

              {/* Botones para cambiar estado */}
              <div className="actions-row">
                <button
                  onClick={() => updateStatus(report.id, "resolved")}
                  className="btn-success"
                >
                  Marcar como Resuelto
                </button>

                <button
                  onClick={() => updateStatus(report.id, "unresolved")}
                  className="btn-danger"
                >
                  Marcar como No Resuelto
                </button>

                <button
                  onClick={() => updateStatus(report.id, "pending")}
                  className="btn-warning"
                >
                  Marcar como Pendiente
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReportsView;
