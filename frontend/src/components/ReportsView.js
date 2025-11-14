// ReportsView.js
import React, { useState, useEffect } from 'react';
import './ReportsView.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL; // 👈 PRODUCCIÓN / LOCAL

const ReportsView = () => {
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Validar token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'ciudadano') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Axios config
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  // Cargar reportes enviados
  const fetchReports = async () => {
    try {
      const res = await api.get('/my-reports/');
      setReports(res.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Enviar reporte
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!detalle.trim()) {
      alert('Por favor, ingresa una descripción.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/my-reports/', {
        description: detalle.trim() // 👈 Nombre correcto según el backend
      });

      setSubmitSuccess(true);
      setDetalle('');
      fetchReports(); // Recargar lista
    } catch (error) {
      console.error('Error al enviar el reporte:', error);

      if (error.response?.status === 401) {
        localStorage.clear();
        alert('Tu sesión expiró. Por favor inicia sesión nuevamente.');
        navigate('/login');
      } else {
        alert('Error al enviar el reporte. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reports-container">
      <h2>Reportar Incidencia - Smart Collector</h2>

      {!submitSuccess ? (
        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descripción de la incidencia *</label>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Ej: Basura acumulada cerca de mi casa"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Informe'}
          </button>
        </form>
      ) : (
        <div className="success-message">
          <h3>¡Informe Enviado!</h3>
          <p>Gracias por tu informe. Un administrador lo revisará pronto.</p>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="reports-history">
        <h3>Mis Reportes Enviados</h3>

        {loadingReports ? (
          <p>Cargando reportes...</p>
        ) : reports.length === 0 ? (
          <p>Aún no has enviado ningún reporte.</p>
        ) : (
          <div className="reports-list">
            {reports.map(report => (
              <div key={report.id} className={`report-card status-${report.status}`}>
                <p><strong>Descripción:</strong> {report.description}</p>
                <p><strong>Fecha:</strong> {new Date(report.created_at).toLocaleString()}</p>
                <p><strong>Estado:</strong>
                  <span className={`status-label status-${report.status}`}>
                    {report.status === 'pending'
                      ? 'Pendiente'
                      : report.status === 'resolved'
                      ? 'Resuelto'
                      : 'No resuelto'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ReportsView;
