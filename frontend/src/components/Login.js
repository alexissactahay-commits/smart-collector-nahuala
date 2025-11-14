// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

// 🚨 IMPORTANTE:
// En Vercel tu variable DEBE ser así:
// REACT_APP_API_URL = https://smart-collector.onrender.com
// (SIN /api al final)

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Construye bien la URL sin duplicar /api
const buildURL = (endpoint) => {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  if (endpoint.startsWith("/")) {
    return `${base}${endpoint}`; 
  }
  return `${base}/${endpoint}`;
};

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const url = buildURL("/api/login/"); // 👈 AQUÍ SE ARREGLA TODO

    const response = await axios.post(
      url,
      {
        identifier: identifier.trim(),
        password: password.trim(),
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access, role, username } = response.data;

    const normalizedRole = role.toLowerCase();

    // Guardar sesión
    localStorage.setItem("token", access);
    localStorage.setItem("userRole", normalizedRole);
    localStorage.setItem("username", username);

    // Redirect por rol
    if (normalizedRole === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (normalizedRole === "recolector") {
      navigate("/recolector-dashboard", { replace: true });
    } else {
      navigate("/user-dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      alert("Complete todos los campos.");
      return;
    }

    try {
      await handleLogin();
    } catch (error) {
      console.error("Error en login:", error.response?.data || error.message);
      alert("Credenciales inválidas.");
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
              placeholder="Ej: admin, ciudadano, recolector"
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
            <a onClick={() => navigate('/forgot-password')}>Olvidó su contraseña</a>
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






