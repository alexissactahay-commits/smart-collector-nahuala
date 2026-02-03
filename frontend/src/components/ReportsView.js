// ReportsView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ReportsView.css';

const ReportsView = () => {
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState('');
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // API URL NORMALIZADA
  // ===============================
  let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  API_URL = API_URL.replace(/\/+$/, '');
  API_URL = `${API_URL}/api`;

  const token = localStorage.getItem('token');

  // ===============================
  // VERIFICAR SESIÓN
  // ===============================
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // ===============================
  // CARGAR MIS REPORTES
  // ===============================
  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/my-reports/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(res.data);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, []);

  // ===============================
  // ENVIAR REPORTE
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!detalle.trim()) {
      alert('Debes escribir una descripción.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/my-reports/`,
        {
          detalle: detalle,
          tipo: 'incidencia'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDetalle('');
      fetchReports();
      alert('✅ Reporte enviado correctamente.');

    } catch (err) {
      console.error('Error al enviar el reporte:', err);
      alert('❌ Error al enviar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ELIMINAR REPORTE
  // ===============================
  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este reporte?')) return;

    try {
      await axios.delete(`${API_URL}/my-reports/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportes(reportes.filter(rep => rep.id !== id));
    } catch (err) {
      console.error('Error al eliminar reporte:', err);
      alert('❌ Error al eliminar el reporte.');
    }
  };

  // ===============================
  // TRADUCIR ESTADO
  // ===============================
  const renderStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'resolved':
        return 'Resuelto';
      case 'unresolved':
        return 'No resuelto';
      default:
        return status;
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
          {loading ? 'Enviando...' : 'Enviar Reporte'}
        </button>
      </form>

      <h2>Mis Reportes Enviados</h2>

      {reportes.length === 0 ? (
        <p>Aún no has enviado ningún reporte.</p>
      ) : (
        <ul className="reports-list">
          {reportes.map((rep) => (
            <li key={rep.id} className="report-item">
              <p><strong>Detalle:</strong> {rep.detalle}</p>
              <p><strong>Fecha:</strong> {new Date(rep.fecha).toLocaleString()}</p>
              <p><strong>Estado:</strong> {renderStatus(rep.status)}</p>

              <button
                className="btn-delete"
                onClick={() => handleDelete(rep.id)}
              >
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
