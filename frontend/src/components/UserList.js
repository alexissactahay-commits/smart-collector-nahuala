import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL; // 👈 URL dinámica (Render o local)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('No autorizado. Inicia sesión de nuevo.');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/admin/users/`,  // 👈 CORRECTO, ya no localhost
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUsers(response.data);
      } catch (err) {
        console.error('Error cargando usuarios:', err);

        if (err.response?.status === 401) {
          setError('Tu sesión expiró. Vuelve a iniciar sesión.');
        } else {
          setError('Error al cargar la lista de usuarios.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL]);

  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="error-text">{error}</div>;
  }

  return (
    <div className="user-list-container">
      <h1>Lista de Usuarios - Smart Collector</h1>

      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre de Usuario</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
