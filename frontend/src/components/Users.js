// Users.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Users.css';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Verificar autenticación al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }

    fetchUsers();
  }, [navigate, fetchUsers]);

  // Cambiar rol de usuario
  const updateRole = async (userId, newRole) => {
    try {
      await api.put('/api/admin/users/', {
        id: userId,
        role: newRole,
      });

      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      setMessage(`Rol actualizado a ${newRole}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      alert('Error al actualizar el rol.');
    }
  };

  // Activar / desactivar usuario
  const toggleActive = async (userId, isActive) => {
    try {
      await api.put('/api/admin/users/', {
        id: userId,
        is_active: !isActive,
      });

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, is_active: !isActive }
            : user
        )
      );

      setMessage(isActive ? 'Usuario desactivado' : 'Usuario activado');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado del usuario.');
    }
  };

  if (loading) {
    return <div className="users-container">Cargando usuarios...</div>;
  }

  return (
    <div className="users-container">
      <h1>Lista de Usuarios - Smart Collector</h1>

      {message && <div className="alert-message">{message}</div>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No hay usuarios registrados
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? 'Activo' : 'Inactivo'}</td>
                <td>
                  {user.role === 'ciudadano' ? (
                    <button onClick={() => updateRole(user.id, 'admin')}>
                      Hacer Admin
                    </button>
                  ) : (
                    <button onClick={() => updateRole(user.id, 'ciudadano')}>
                      Quitar Admin
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(user.id, user.is_active)}
                    className={user.is_active ? 'btn-deactivate' : 'btn-activate'}
                  >
                    {user.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
