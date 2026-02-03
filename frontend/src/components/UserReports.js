// UserReports.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./UserReports.css";

const UserReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ===========================
  // Helpers para soportar varios nombres de campos
  // ===========================
  const getDetail = (r) =>
    r?.detalle ??
    r?.detail ??
    r?.descripcion ??
    r?.description ??
    r?.message ??
    "";

  const getDate = (r) =>
    r?.fecha ?? r?.created_at ?? r?.date ?? r?.createdAt ?? null;

  const getUsername = (r) =>
    r?.user?.username ?? r?.username ?? r?.user_name ?? "Desconocido";

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    // Soportar distintas llaves comunes
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.reports)) return payload.reports;
    if (Array.isArray(payload.items)) return payload.items;

    return [];
  };

  // ===========================
  // Cargar reportes
  // ===========================
  const fetchReports = useCallback(async () => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();

    if (role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    try {
      // ✅ IMPORTANTE: tu API real está en /api/admin/reports/
      const res = await api.get("/api/admin/reports/");

      const data = normalizeList(res.data);
      setReports(data);

      if (data.length === 0) {
        setMessage("No hay reportes devueltos por el servidor.");
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (error) {
      console.error("Error al cargar reportes:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setMessage("Error al cargar reportes (revisa backend/endpoint).");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ===========================
  // Actualizar estado
  // ===========================
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      // ✅ IMPORTANTE: update también debe ir bajo /api
      await api.put(`/api/admin/reports/${id}/`, { status: newStatus });

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      setMessage("Estado actualizado correctamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      setMessage("Error al actualizar el estado");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return <div className="user-reports-container">Cargando reportes...</div>;
  }

  return (
    <div className="user-reports-container">
      <h1>Reportes de Usuarios</h1>

      {message && <div className="alert-message">{message}</div>}

      <table className="reports-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Detalle</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {reports.length > 0 ? (
            reports.map((report) => {
              const rawDate = getDate(report);
              const detail = getDetail(report);

              return (
                <tr key={report.id}>
                  <td>{getUsername(report)}</td>
                  <td>{detail || "Sin detalle"}</td>
                  <td>
                    {rawDate
                      ? new Date(rawDate).toLocaleString()
                      : "No disponible"}
                  </td>
                  <td>
                    <select
                      value={report.status || "pending"}
                      onChange={(e) =>
                        handleUpdateStatus(report.id, e.target.value)
                      }
                      className="status-select"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="resolved">Resuelto</option>
                      <option value="unresolved">No Resuelto</option>
                    </select>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay reportes disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserReports;