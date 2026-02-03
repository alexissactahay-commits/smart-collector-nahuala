// GenerateReports.js
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./GenerateReports.css";

const GenerateReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Construir API_URL robusto (evita que quede solo "/api")
  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
    base = base.replace(/\/+$/, ""); // quitar / finales
    if (!base.endsWith("/api")) base = `${base}/api`;
    return base;
  }, []);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const authHeaders = useMemo(() => {
    return token
      ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
      : { Accept: "application/json" };
  }, [token]);

  // --------------------------
  // Helpers
  // --------------------------
  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.reports)) return payload.reports;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  };

  const pickDate = (r) =>
    r?.fecha ?? r?.created_at ?? r?.date ?? r?.createdAt ?? null;

  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const computeDaysSinceFirst = (reports) => {
    if (!reports?.length) return 0;

    const dates = reports
      .map((r) => pickDate(r))
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()));

    if (!dates.length) return 0;

    const first = new Date(Math.min(...dates.map((d) => d.getTime())));
    const now = new Date();
    const diffMs = now.getTime() - first.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  // --------------------------
  // FETCH REPORT SUMMARY + LISTA REAL
  // --------------------------
  const fetchReportData = async () => {
    try {
      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      setLoading(true);

      // 1) Traer lista real de reportes (esto es lo que sí refleja la verdad)
      const listRes = await axios.get(`${API_URL}/admin/reports/`, {
        headers: authHeaders,
      });

      const reports = normalizeList(listRes.data);

      const total_reports = reports.length;
      const resolved_reports = reports.filter((r) => r?.status === "resolved").length;
      const pending_reports = reports.filter((r) => r?.status === "pending").length;
      const unresolved_reports = reports.filter((r) => r?.status === "unresolved").length;

      const days_since_first_report = computeDaysSinceFirst(reports);

      // 2) Intentar traer el summary del backend (si viene bien lo mezclamos)
      let summary = {};
      try {
        const sumRes = await axios.get(`${API_URL}/admin/reports/generate/`, {
          headers: authHeaders,
        });
        summary = sumRes.data || {};
      } catch (e) {
        // Si falla, no pasa nada: nos quedamos con lo calculado
        summary = {};
      }

      // 3) Mezclar: prioridad a lo calculado desde /reports/ para los conteos
      setReportData({
        // rutas (si backend las manda bien, ok; si no, 0)
        completed_routes: safeNum(summary.completed_routes),
        pending_routes: safeNum(summary.pending_routes),

        // reportes (SIEMPRE desde lista real)
        total_reports,
        resolved_reports,
        pending_reports,
        unresolved_reports,

        // días (calculado real)
        days_since_first_report,

        // Power BI link (si viene del backend)
        power_bi_link: (summary.power_bi_link || "").trim(),
      });
    } catch (err) {
      console.error("Error al cargar informe:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      alert("Error al cargar los datos del informe. Revisa el backend/endpoint.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // GENERAR PDF
  // --------------------------
  const generatePDF = async () => {
    try {
      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const response = await axios.get(`${API_URL}/admin/reports/generate-pdf/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "informe_smart_collector.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error generando el PDF.");
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------
  // UI
  // --------------------------
  if (loading) {
    return <div className="generate-reports-container">Cargando informe...</div>;
  }

  if (!reportData) {
    return (
      <div className="generate-reports-container">
        No se pudieron cargar los datos del informe.
      </div>
    );
  }

  const notSolved = safeNum(reportData.unresolved_reports) + safeNum(reportData.pending_reports);

  return (
    <div className="generate-reports-container">
      <h1>Generar Informes - Smart Collector</h1>

      <div className="summary-cards">
        <div className="card">
          <h3>Rutas Completadas</h3>
          <p>{safeNum(reportData.completed_routes)}</p>
        </div>

        <div className="card">
          <h3>Rutas Pendientes</h3>
          <p>{safeNum(reportData.pending_routes)}</p>
        </div>

        <div className="card">
          <h3>Reportes Recibidos</h3>
          <p>{safeNum(reportData.total_reports)}</p>
        </div>

        <div className="card">
          <h3>Reportes Solucionados</h3>
          <p>{safeNum(reportData.resolved_reports)}</p>
        </div>

        <div className="card">
          <h3>Reportes No Solucionados</h3>
          <p>{safeNum(notSolved)}</p>
        </div>

        <div className="card">
          <h3>Días desde el primer reporte</h3>
          <p>{safeNum(reportData.days_since_first_report)} días</p>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={() => {
            const link = (reportData.power_bi_link || "").trim();
            if (!link) {
              alert("No hay link de Power BI configurado todavía.");
              return;
            }
            window.open(link, "_blank");
          }}
        >
          Ver en Power BI
        </button>

        <button onClick={generatePDF}>Descargar como PDF</button>
      </div>
    </div>
  );
};

export default GenerateReports;