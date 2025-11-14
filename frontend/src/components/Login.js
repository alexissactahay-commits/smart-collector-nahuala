// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

// ===============================================
// 🔥 URL BASE DEL BACKEND (Render + Local)
// ===============================================
const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8000';

// Fuerza siempre el prefijo /api
const api = (endpoint) => {
  endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!endpoint.startsWith('/api/')) {
    endpoint = '/api' + endpoint;
  }
  return `${API_URL}${endpoint}`;
};

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // ===============================================
  // 🔥 PETICIÓN LOGIN
  // ===============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      alert('Por favor llene todos los campos.');
      return;
    }

    try {
      const response = await axios.post(
        api('/login/'),
        {
          identifier: identifier.trim(),
          password: password.trim(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { access, role, username } = response.data;

      // Normalizar rol
      const userRole = role.toLowerCase();

      // Guardar credenciales
      localStorage.setItem('token', access);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('username', username);

      // ===============================================
      // 🔥 REDIRECCIÓN SEGÚN ROL
      // ===============================================
      if (userRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userRole === 'recolector') {
        navigate('/recolector-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('LOGIN ERROR:', error.response?.data || error);

      if (error.response?.status === 401) {
        alert('Credenciales inválidas.');
      } else if (error.response?.status === 500) {
        alert('Error interno del servidor. Inténtalo nuevamente.');
      } else {
        alert('No se pudo conectar al servidor.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="/Log_smar_collector.png"
          alt="Logo Smart Collector"
          className="logo"
        />

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico o Usuario</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ej: admin"
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>

          <div className="links">
            <a onClick={() => navigate('/forgot-password')}>
              Olvidó su contraseña
            </a>
          </div>

          <div className="links" style={{ marginTop: '10px' }}>
            <a
              onClick={() => navigate('/register')}
              style={{ fontWeight: 'bold', cursor: 'pointer' }}
            >
              ¿No tiene cuenta? Regístrese aquí
            </a>
          </div>

          <hr />
        </form>
      </div>
    </div>
  );
};

export default Login;





