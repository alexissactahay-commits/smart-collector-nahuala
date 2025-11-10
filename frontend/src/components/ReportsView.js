// ReportsView.js
import React, { useState, useEffect } from 'react';
import './ReportsView.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportsView = () => {
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState([]); // 👈 Nuevo: para mostrar reportes enviados
  const [loadingReports, setLoadingReports] = useState(true); // 👈 Nuevo: estado de carga

  // Validar autenticación al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'ciudadano') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Cargar reportes enviados al montar
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token no encontrado');
        }
        const res = await axios.get('http://localhost:8000/api/my-reports/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (error) {
        console.error('Error al cargar reportes:', error);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!detalle.trim()) {
      alert('Por favor, ingresa una descripción.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }

      await axios.post(
        'http://localhost:8000/api/my-reports/',
        {
          detalle: detalle.trim(),
          tipo: 'incidencias'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSubmitSuccess(true);
      setDetalle('');
      // Recargar la lista de reportes después de enviar
      const res = await axios.get('http://localhost:8000/api/my-reports/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (error) {
      console.error('Error al enviar el reporte:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        // Token inválido o expirado → limpiar y redirigir
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        alert('Tu sesión expiró. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        alert('Error al enviar el reporte. Por favor, inténtalo de nuevo.');
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
              placeholder="Ej: Basura acumulada en la esquina de 5a calle y 3a avenida"
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
          <p>Gracias por tu informe. Un administrador revisará tu incidencia y te responderá lo antes posible.</p>
          <p><strong>Tiempo estimado de respuesta:</strong> 24-48 horas.</p>
        </div>
      )}

      {/* Sección de reportes enviados */}
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
                <p><strong>Descripción:</strong> {report.detalle}</p>
                <p><strong>Fecha:</strong> {new Date(report.fecha).toLocaleString()}</p>
                <p><strong>Estado:</strong> 
                  <span className={`status-label status-${report.status}`}>
                    {report.status === 'pending' ? 'Pendiente' :
                     report.status === 'resolved' ? 'Resuelto' : 'No resuelto'}
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