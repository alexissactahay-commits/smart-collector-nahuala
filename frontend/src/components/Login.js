// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

// URL BASE DEL BACKEND
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Función para construir URLs correctamente
const buildURL = (endpoint) => {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

  if (endpoint.startsWith('/')) {
    return `${base}${endpoint}`;
  }
  return `${base}/${endpoint}`;
};

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const apiPost = async (endpoint, data) => {
    try {
      const url = buildURL(endpoint);

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { access, role, username } = response.data;

      const normalizedRole = role.toLowerCase();
      localStorage.setItem('token', access);
      localStorage.setItem('userRole', normalizedRole);
      localStorage.setItem('username', username);

      if (normalizedRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error de API:', error.response?.data || error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      alert('Por favor llene todos los campos.');
      return;
    }

    try {
      await apiPost('api/login/', {
        identifier: identifier.trim(),
        password,
      });
    } catch (error) {
      alert('Credenciales inválidas.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <img src="/Log_smar_collector.png" alt="Logo Smart Collector" className="logo" />

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico o Usuario</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ej: ciudadano"
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

          <button type="submit" className="btn-login">Iniciar Sesión</button>

          <div className="links">
            <a onClick={() => navigate('/forgot-password')}>Olvidó su contraseña</a>
          </div>

          <hr />

          {/* 🔕 GOOGLE LOGIN DESACTIVADO */}
          {/* <GoogleLogin ... /> */} 
        </form>
      </div>
    </div>
  );
};

export default Login;



