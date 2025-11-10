// Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}register/`, {
        username,
        email,
        password,
        role: 'ciudadano' // Rol por defecto
      });
      alert('Usuario registrado correctamente. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 400) {
        alert('El correo electrónico ya está registrado.');
      } else {
        alert('Error al registrar el usuario. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <img src="/Log_smar_collector.png" alt="Logo Smart Collector" className="logo" />
        <h2>Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: juan_perez"
              required
            />
          </div>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ejemplo@ejemplo.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="************"
              required
            />
          </div>
          <button type="submit" className="btn-register">Registrar</button>
        </form>
        <div className="login-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a>
        </div>
      </div>
    </div>
  );
};

export default Register;