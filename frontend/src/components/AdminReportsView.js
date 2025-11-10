import React, { useState, useEffect } from 'react';
import './AdminReportsView.css';
import axios from 'axios';

const AdminReportsView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          alert('No estás autenticado. Por favor, inicia sesión.');
          return;
        }

        // Llamar a la API real de Django
        const response = await axios.get('http://localhost:8000/api/incidents/', {
          headers: {
            Authorization: `Token ${token}` // Si usas TokenAuthentication
            // Si usas JWT, cambia a: `Authorization: 'Bearer ${token}'`
          }
        });

        // Formatear los datos para que coincidan con tu estructura
        const formattedReports = response.data.map(report => ({
          id: report.id,
          description: report.descripcion,
          location: report.ubicacion || 'No especificada',
          user: report.usuario?.username || 'Desconocido',
          date: new Date(report.fecha).toISOString().split('T')[0], // Formato YYYY-MM-DD
          status: 'Pendiente' // Tu modelo Incident no tiene estado, así que lo dejamos fijo por ahora
        }));

        setReports(formattedReports);
      } catch (error) {
        console.error('Error al cargar los reportes:', error);
        alert('Error al cargar los reportes. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleRespond = (id) => {
    alert(`Funcionalidad de respuesta al reporte #${id} en desarrollo.`);
    // Aquí irá la lógica para responder al ciudadano
  };

  if (loading) {
    return <div className="loading">Cargando reportes...</div>;
  }

  return (
    <div className="reports-admin-container">
      <h2>Informes de Ciudadanos - Smart Collector</h2>
      <div className="reports-list">
        {reports.length === 0 ? (
          <p className="no-reports">No hay informes nuevos.</p>
        ) : (
          reports.map(report => (
            <div key={report.id} className="report-card pendiente">
              <div className="report-header">
                <h3>Reporte #{report.id}</h3>
                <span className="report-date">{report.date}</span>
              </div>
              <p><strong>Descripción:</strong> {report.description}</p>
              <p><strong>Ubicación:</strong> {report.location}</p>
              <p><strong>Usuario:</strong> {report.user}</p>
              <p><strong>Estado:</strong> {report.status}</p>
              <button className="action-button" onClick={() => handleRespond(report.id)}>
                Responder
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReportsView;