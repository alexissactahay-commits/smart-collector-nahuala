// CollectionPoints.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CollectionPoints.css';

const CollectionPoints = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState(null); // Estado para la ruta en edición
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    points: []
  });

  // Cargar rutas al montar
  useEffect(() => {
    fetchRoutes();
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
      setLoading(false);
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
      setLoading(false);
    }
  };

  // Eliminar ruta
  const deleteRoute = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta ruta?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      await axios.delete(`http://localhost:8000/api/admin/routes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoutes(); // Recargar lista
    } catch (err) {
      console.error('Error al eliminar ruta:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al eliminar la ruta. Por favor, inténtelo más tarde.');
      }
    }
  };

  // Marcar como completada
  const markAsCompleted = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      await axios.put(
        `http://localhost:8000/api/admin/routes/${id}/completed/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchRoutes(); // Recargar lista
    } catch (err) {
      console.error('Error al marcar ruta como completada:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al marcar la ruta como completada. Por favor, inténtelo más tarde.');
      }
    }
  };

  // Iniciar la edición de una ruta
  const startEditing = (route) => {
    setEditingRoute(route.id);
    setEditForm({
      name: route.name,
      description: route.description || '',
      start_time: route.start_time,
      end_time: route.end_time,
      points: route.points || []
    });
  };

  // Cancelar la edición
  const cancelEditing = () => {
    setEditingRoute(null);
    setEditForm({
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      points: []
    });
  };

  // Guardar los cambios
  const saveEdit = async () => {
    if (!editingRoute) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado');
      }
      await axios.put(
        `http://localhost:8000/api/admin/routes/${editingRoute}/`,
        {
          name: editForm.name,
          description: editForm.description,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          points: editForm.points
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditingRoute(null);
      fetchRoutes(); // Recargar lista
    } catch (err) {
      console.error('Error al guardar la ruta:', err);
      if (err.response?.status === 401) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      } else {
        alert('Error al guardar la ruta. Por favor, inténtelo más tarde.');
      }
    }
  };

  if (loading) {
    return <div>Cargando rutas...</div>;
  }

  return (
    <div className="collection-points-container">
      <h1>Puntos de Recolección - Smart Collector</h1>

      {/* Formulario para agregar nueva ruta */}
      <div className="add-route-form">
        <h2>Agregar Nueva Ruta</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>Día:</label>
            <select>
              <option>Lunes</option>
              <option>Martes</option>
              <option>Miércoles</option>
              <option>Jueves</option>
              <option>Viernes</option>
              <option>Sábado</option>
              <option>Domingo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nombre:</label>
            <input type="text" placeholder="Ej: Ruta Zona Norte" />
          </div>
          <div className="form-group">
            <label>Descripción (opcional):</label>
            <textarea></textarea>
          </div>
          <div className="form-group">
            <label>Hora de inicio:</label>
            <input type="time" defaultValue="08:00" />
          </div>
          <div className="form-group">
            <label>Hora de fin:</label>
            <input type="time" defaultValue="17:00" />
          </div>
          <button type="submit" className="btn-add-point">+ Agregar Punto</button>
          <button type="submit" className="btn-save-route">Guardar Ruta</button>
        </form>
      </div>

      {/* Lista de rutas existentes */}
      <div className="existing-routes">
        <h2>Rutas Existentes</h2>
        {routes.length === 0 ? (
          <p>No hay rutas creadas.</p>
        ) : (
          routes.map((route) => (
            <div key={route.id} className="route-card">
              {editingRoute === route.id ? (
                // Formulario de edición
                <div className="edit-form">
                  <h3>Editar Ruta: {route.name}</h3>
                  <div className="form-group">
                    <label>Nombre:</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nombre de la ruta"
                    />
                  </div>
                  <div className="form-group">
                    <label>Descripción:</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Descripción de la ruta"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora de inicio:</label>
                    <input
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora de fin:</label>
                    <input
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    />
                  </div>
                  <div className="form-actions">
                    <button onClick={saveEdit}>Guardar Cambios</button>
                    <button onClick={cancelEditing}>Cancelar</button>
                  </div>
                </div>
              ) : (
                // Vista normal de la ruta
                <>
                  <h3>{route.name} ({route.day_of_week})</h3>
                  <p><strong>Horario:</strong> {route.start_time} - {route.end_time}</p>
                  <p><strong>Estado:</strong> {route.completed ? 'Completada' : 'Pendiente'}</p>
                  {route.description && <p><strong>Descripción:</strong> {route.description}</p>}
                  <div className="route-actions">
                    <button
                      onClick={() => startEditing(route)}
                      className="btn-edit"
                    >
                      Editar Ruta
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="btn-delete"
                    >
                      Eliminar Ruta
                    </button>
                    {!route.completed && (
                      <button
                        onClick={() => markAsCompleted(route.id)}
                        className="btn-complete"
                      >
                        Marcar como Completada
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CollectionPoints;