// src/components/AddDate.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddDate.css';

const AddDate = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [date, setDate] = useState('');
  const [routeDates, setRouteDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ================================
  // Cargar rutas y fechas al montar
  // ================================
  useEffect(() => {
    fetchRoutes();
    fetchRouteDates();
  }, []);

  // Cargar rutas
  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_URL}/admin/routes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRoutes(res.data);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      alert('Error al cargar rutas. Inicie sesión nuevamente.');
    }
  };

  // Cargar fechas programadas
  const fetchRouteDates = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_URL}/admin/route-dates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRouteDates(res.data);
    } catch (err) {
      console.error('Error al cargar fechas:', err);
      alert('Error al cargar las fechas.');
    }
  };

  // ================================
  // Agregar fecha
  // ================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!routeId || !date) {
      alert('Seleccione una ruta y una fecha.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_URL}/admin/route-dates/`,
        {
          route: routeId,
          date
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('✅ Fecha agregada correctamente.');
      setRouteId('');
      setDate('');

      fetchRouteDates();

      setTimeout(() => setMessage(''), 2500);

    } catch (err) {
      console.error('Error al agregar fecha:', err.response?.data || err.message);
      alert('Error al agregar la fecha. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Eliminar fecha
  // ================================
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta fecha?')) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/admin/route-dates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchRouteDates();

    } catch (err) {
      console.error('Error al eliminar la fecha:', err);
      alert('No se pudo eliminar la fecha.');
    }
  };

  return (
    <div className="add-date-container">
      <h2>📅 Agregar Fecha de Ruta</h2>

      {message && <div className="alert success">{message}</div>}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="form">

        <div className="form-group">
          <label>Ruta:</label>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            required
          >
            <option value="">-- Seleccione una ruta --</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name} ({route.day_of_week})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Fecha:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Agregar Fecha'}
        </button>
      </form>

      {/* Tabla */}
      <h3>Fechas Programadas</h3>

      {routeDates.length === 0 ? (
        <p>No hay fechas programadas.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {routeDates.map((rd) => (
              <tr key={rd.id}>
                <td>{rd.route?.name || 'Ruta no disponible'}</td>
                <td>{rd.date}</td>
                <td>
                  <button
                    onClick={() => handleDelete(rd.id)}
                    className="btn-delete"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      )}
    </div>
  );
};

export default AddDate;
