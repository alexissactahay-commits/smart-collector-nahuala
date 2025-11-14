// ForgotPassword.js
import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL; // 👈 Render URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/forgot-password/`, {
        email: email,
      });

      setMessage(
        res.data.message ||
          "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
      );
    } catch (err) {
      console.error("Error recuperando contraseña:", err);

      setError(
        "Error al enviar el correo. Por favor, inténtelo nuevamente."
      );
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>¿Olvidó su Contraseña?</h2>
      <p>Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>

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
