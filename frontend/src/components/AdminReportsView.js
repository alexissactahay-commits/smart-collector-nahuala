// AdminReportsView.js
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminReportsView.css";

const AdminReportsView = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===========================
  // Cargar reportes (solo admin)
  // ===========================
  const fetchReports = useCallback(async () => {
    const role = localStorage.getItem("userRole");

    if (role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await api.get("/admin/reports/");
      setReports(res.data);
    } catch (error) {
      console.error("Error al cargar reportes:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ===========================
  // Actualizar estado del reporte
  // ===========================
  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/reports/${id}/`, {
        status: newStatus,
      });

      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("No se pudo actualizar el estado del reporte.");
    }
  };

  if (loading) {
    return <div className="loading">Cargando reportes...</div>;
  }

  return (
    <div className="reports-admin-container">
      <h2>Reportes de Ciudadanos</h2>

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
                  {report.fecha
                    ? new Date(report.fecha).toLocaleString()
                    : "Fecha no disponible"}
                </span>
              </div>

              <p>
                <strong>Descripción:</strong> {report.detalle}
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

              {/* Acciones */}
              <div className="actions-row">
                <button
                  onClick={() => updateStatus(report.id, "resolved")}
                  className="btn-success"
                >
                  Resuelto
                </button>

                <button
                  onClick={() => updateStatus(report.id, "unresolved")}
                  className="btn-danger"
                >
                  No Resuelto
                </button>

                <button
                  onClick={() => updateStatus(report.id, "pending")}
                  className="btn-warning"
                >
                  Pendiente
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
