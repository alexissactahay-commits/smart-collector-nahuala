// ForgotPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/forgot-password/', {
        email: email
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError('Error al enviar el correo. Por favor, inténtelo de nuevo.');
      setMessage('');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>¿Olvidó su Contraseña?</h2>
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@dominio.com"
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Enviar Correo
        </button>
      </form>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ForgotPassword;