// src/components/AddSchedule.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddSchedule.css';

const AddSchedule = () => {

  // ============================
  // NORMALIZACIÓN DE API_URL
  // ============================
  let API_URL = process.env.REACT_APP_API_URL || "";
  API_URL = API_URL.replace(/\/+$/, ""); // Quitamos "/" al final

  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  // ============================
  // STATES
  // ============================
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [start_time, setStart_time] = useState('');
  const [end_time, setEnd_time] = useState('');
  const [routeSchedules, setRouteSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const DAYS = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves',
    'Viernes', 'Sábado', 'Domingo'
  ];

  // ============================
  // Cargar rutas y horarios
  // ============================
  useEffect(() => {
    fetchRoutes();
    fetchRouteSchedules();
  }, []);

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

  const fetchRouteSchedules = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_URL}/admin/route-schedules/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRouteSchedules(res.data);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
      alert('Error al cargar los horarios.');
    }
  };

  // ============================
  // Guardar nuevo horario
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!routeId || !dayOfWeek || !start_time || !end_time) {
      alert('Complete todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_URL}/admin/route-schedules/`,
        {
          route: routeId,
          day_of_week: dayOfWeek,
          start_time,
          end_time
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('✅ Horario agregado correctamente.');
      setRouteId('');
      setDayOfWeek('');
      setStart_time('');
      setEnd_time('');

      fetchRouteSchedules();

      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error('Error al agregar horario:', err.response?.data || err.message);
      alert('Error al agregar el horario.');
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Eliminar horario
  // ============================
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este horario?')) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/admin/route-schedules/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchRouteSchedules();

    } catch (err) {
      console.error('Error al eliminar horario:', err);
      alert('No se pudo eliminar el horario.');
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <div className="add-schedule-container">
      <h2>⏰ Agregar Horario de Ruta</h2>

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
          <label>Día de la semana:</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            required
          >
            <option value="">-- Seleccione un día --</option>
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Hora de inicio:</label>
          <input
            type="time"
            value={start_time}
            onChange={(e) => setStart_time(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Hora de fin:</label>
          <input
            type="time"
            value={end_time}
            onChange={(e) => setEnd_time(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Agregar Horario'}
        </button>
      </form>

      {/* Tabla de horarios */}
      <h3>Horarios Programados</h3>

      {routeSchedules.length === 0 ? (
        <p>No hay horarios programados.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Día</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {routeSchedules.map((rs) => (
              <tr key={rs.id}>
                <td>{rs.route?.name || 'Ruta no disponible'}</td>
                <td>{rs.day_of_week}</td>
                <td>{rs.start_time}</td>
                <td>{rs.end_time}</td>
                <td>
                  <button
                    onClick={() => handleDelete(rs.id)}
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

export default AddSchedule;

