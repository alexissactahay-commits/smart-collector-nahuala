// GenerateReports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GenerateReports.css';
const GenerateReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // Cargar datos del informe
  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        window.location.href = '/login';
        return;
      }
      const res = await axios.get('http://localhost:8000/api/admin/reports/generate/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar informe:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al cargar los datos del informe. Por favor, inténtelo más tarde.');
      }
      setLoading(false);
    }
  };
  // Generar PDF (descarga desde backend)
  const generatePDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      const response = await axios.get('http://localhost:8000/api/admin/reports/generate-pdf/', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf'
        },
        responseType: 'blob' // Importante para archivos binarios
      });
      // Crear enlace y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'informe_smart_collector.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      if (error.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al generar el PDF. Por favor, inténtelo más tarde.');
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
    return <div className="generate-reports-container">No se pudieron cargar los datos del informe.</div>;
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
          <h3>Días desde primer reporte</h3>
          <p>{reportData.days_since_first_report} días</p>
        </div>
      </div>
      <div className="actions">
        <button onClick={() => window.open(reportData.power_bi_link.trim(), '_blank')}>
          Ver en Power BI
        </button>
        <button onClick={generatePDF}>
          Descargar como PDF
        </button>
      </div>
    </div>
  );
};
export default GenerateReports;