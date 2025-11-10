// src/components/AddDate.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddDate.css'; // Puedes crear este archivo después si quieres estilos

const AddDate = () => {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [date, setDate] = useState('');
  const [routeDates, setRouteDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar rutas al montar
  useEffect(() => {
    fetchRoutes();
    fetchRouteDates();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        window.location.href = '/login';
        return;
      }
      const res = await axios.get('http://localhost:8000/api/admin/routes/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoutes(res.data);
    } catch (err) {
      console.error('Error al cargar rutas:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al cargar las rutas. Por favor, inténtelo más tarde.');
      }
    }
  };

  const fetchRouteDates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        window.location.href = '/login';
        return;
      }
      const res = await axios.get('http://localhost:8000/api/admin/route-dates/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRouteDates(res.data);
    } catch (err) {
      console.error('Error al cargar fechas:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al cargar las fechas. Por favor, inténtelo más tarde.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeId || !date) {
      alert('Seleccione una ruta y una fecha.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      await axios.post(
        'http://localhost:8000/api/admin/route-dates/',
        { route: routeId, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('✅ Fecha agregada correctamente.');
      setRouteId('');
      setDate('');
      fetchRouteDates(); // Recargar lista
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error al agregar fecha:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al agregar la fecha. Verifique su conexión o inténtelo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta fecha?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      await axios.delete(`http://localhost:8000/api/admin/route-dates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRouteDates();
    } catch (err) {
      console.error('Error al eliminar fecha:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al eliminar la fecha. Por favor, inténtelo más tarde.');
      }
    }
  };

  return (
    <div className="add-date-container">
      <h2>📅 Agregar Fecha de Ruta</h2>

      {message && <div className="alert success">{message}</div>}

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