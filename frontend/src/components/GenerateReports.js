// GenerateReports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GenerateReports.css';

const GenerateReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL; // 👈 URL base: https://smart-collector.onrender.com/api

  // ============================
  // Cargar datos del informe
  // ============================
  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró, inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      // 👇 RUTA CORREGIDA (SIN /api extra)
      const res = await axios.get(`${API_URL}/admin/reports/generate/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportData(res.data);
    } catch (err) {
      console.error("Error al cargar informe:", err);

      if (err.response?.status === 401) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      } else {
        alert("Error al cargar los datos del informe.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Descargar PDF
  // ============================
  const generatePDF = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      // 👇 RUTA CORREGIDA
      const response = await axios.get(
        `${API_URL}/admin/reports/generate-pdf/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf"
          },
          responseType: "blob" // necesario para PDF
        }
      );

      // Crear enlace para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "informe_smart_collector.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error al generar PDF:", error);

      if (error.response?.status === 401) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      } else {
        alert("Error generando el PDF.");
      }
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

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

  return (
    <div className="generate-reports-container">
      <h1>Generar Informes - Smart Collector</h1>

      <div className="summary-cards">
        <div className="card">
          <h3>Rutas Completadas</h3>
          <p>{reportData.completed_routes}</p>
        </div>

        <div className="card">
          <h3>Rutas Pendientes</h3>
          <p>{reportData.pending_routes}</p>
        </div>

        <div className="card">
          <h3>Reportes Recibidos</h3>
          <p>{reportData.total_reports}</p>
        </div>

        <div className="card">
          <h3>Reportes Solucionados</h3>
          <p>{reportData.resolved_reports}</p>
        </div>

        <div className="card">
          <h3>Reportes No Solucionados</h3>
          <p>{reportData.unresolved_reports + reportData.pending_reports}</p>
        </div>

        <div className="card">
          <h3>Días desde el primer reporte</h3>
          <p>{reportData.days_since_first_report} días</p>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={() =>
            window.open(reportData.power_bi_link.trim(), "_blank")
          }
        >
          Ver en Power BI
        </button>

        <button onClick={generatePDF}>Descargar como PDF</button>
      </div>
    </div>
  );
};

export default GenerateReports;

