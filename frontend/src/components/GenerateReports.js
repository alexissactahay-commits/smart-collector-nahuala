// GenerateReports.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./GenerateReports.css";

const GenerateReports = () => {
  const navigate = useNavigate();

  const [allReports, setAllReports] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
    base = base.replace(/\/+$/, "");
    if (!base.endsWith("/api")) base = `${base}/api`;
    return base;
  }, []);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const authHeaders = useMemo(() => {
    return token
      ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
      : { Accept: "application/json" };
  }, [token]);

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

  const parseDateOnly = (dateStr) => {
    if (!dateStr) return null;

    const s = String(dateStr).slice(0, 10);
    const parts = s.split("-");

    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);

    if (!y || !m || !d) return null;

    return new Date(y, m - 1, d);
  };

  const isInRange = (report) => {
    const reportDateRaw = pickDate(report);
    const reportDate = parseDateOnly(reportDateRaw);

    if (!reportDate) return false;

    const from = startDate ? parseDateOnly(startDate) : null;
    const to = endDate ? parseDateOnly(endDate) : null;

    if (from && reportDate < from) return false;
    if (to && reportDate > to) return false;

    return true;
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

  const buildSummary = (reports) => {
    const total_reports = reports.length;

    const resolved_reports = reports.filter(
      (r) => r?.status === "resolved"
    ).length;

    const pending_reports = reports.filter(
      (r) => r?.status === "pending"
    ).length;

    const unresolved_reports = reports.filter(
      (r) => r?.status === "unresolved"
    ).length;

    const not_solved_reports = pending_reports + unresolved_reports;

    const days_since_first_report = computeDaysSinceFirst(reports);

    setReportData({
      total_reports,
      resolved_reports,
      pending_reports,
      unresolved_reports,
      not_solved_reports,
      days_since_first_report,
    });
  };

  const fetchReportData = async () => {
    try {
      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      setLoading(true);

      const listRes = await axios.get(`${API_URL}/admin/reports/`, {
        headers: authHeaders,
      });

      const reports = normalizeList(listRes.data);

      setAllReports(reports);
      buildSummary(reports);
    } catch (err) {
      console.error("Error al cargar informe:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      alert("Error al cargar los datos del informe.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (startDate && endDate) {
      const from = parseDateOnly(startDate);
      const to = parseDateOnly(endDate);

      if (from > to) {
        alert("La fecha inicial no puede ser mayor que la fecha final.");
        return;
      }
    }

    const filtered = allReports.filter(isInRange);
    buildSummary(filtered);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    buildSummary(allReports);
  };

  const generatePDF = async () => {
    try {
      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      const params = {};

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(
        `${API_URL}/admin/reports/generate-pdf/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          params,
          responseType: "blob",
        }
      );

      const fileName =
        startDate || endDate
          ? `informe_smart_collector_${startDate || "inicio"}_${endDate || "final"}.pdf`
          : "informe_smart_collector.pdf";

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);

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

  if (loading) {
    return (
      <div className="generate-reports-container">
        Cargando informe...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="generate-reports-container">
        No se pudieron cargar los datos del informe.
      </div>
    );
  }

  return (
    <div className="generate-reports-container">

      {/* Botón regresar */}
      <button
        id="generate-reports-small-back-button"
        type="button"
        onClick={() => navigate("/admin-dashboard")}
      >
        ← Regresar
      </button>

      <h1>Generar Informes - Smart Collector</h1>

      <div className="filter-section">
        <h2>Filtrar reportes por rango de fechas</h2>

        <div className="filter-row">
          <div className="filter-group">
            <label>Fecha inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Fecha final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="button" onClick={applyDateFilter}>
            Aplicar filtro
          </button>

          <button type="button" onClick={clearDateFilter}>
            Limpiar filtro
          </button>
        </div>
      </div>

      <div className="summary-cards">
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
          <p>{safeNum(reportData.not_solved_reports)}</p>
        </div>

        <div className="card">
          <h3>Días desde el primer reporte</h3>
          <p>{safeNum(reportData.days_since_first_report)} días</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={generatePDF}>
          Descargar informe en PDF
        </button>
      </div>
    </div>
  );
};

export default GenerateReports;