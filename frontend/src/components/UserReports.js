// UserReports.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserReports.css';

const UserReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Función para cargar reportes
  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // Validar autenticación
    if (!token || userRole !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}admin/reports/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login', { replace: true });
      }
      setLoading(false);
    }
  }, [navigate]);

  // ✅ NUEVA FUNCIÓN: Actualizar el estado de un reporte
  const handleUpdateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}admin/reports/${id}/`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Actualizar el estado localmente
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === id ? { ...report, status: newStatus } : report
        )
      );

      setMessage(`✅ Estado del reporte ${id} actualizado a "${newStatus}".`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setMessage('❌ Error al actualizar el estado del reporte.');
      setTimeout(() => setMessage(''), 3000);
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
      <h1>Reportes de Usuarios - Smart Collector</h1>
      {message && <div className="alert-message">{message}</div>}
      <table className="reports-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Detalle</th>
            <th>Fecha y Hora</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map(report => (
              <tr key={report.id}>
                <td>{report.user?.username || 'Desconocido'}</td>
                <td>{report.detalle}</td>
                <td>
                  {report.fecha
                    ? new Date(report.fecha).toLocaleString()
                    : 'Fecha no disponible'}
                </td>
                <td>
                  <select
                    value={report.status}
                    onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="resolved">Resuelto</option>
                    <option value="unresolved">No resuelto</option>
                  </select>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>
                No hay reportes disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserReports;