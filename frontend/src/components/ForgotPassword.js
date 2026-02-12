// ForgotPassword.js
import React, { useMemo, useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  base = String(base).replace(/\/+$/, "");
  if (!base.endsWith("/api")) base = `${base}/api`;
  return base;
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const API_URL = useMemo(() => normalizeApiBase(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSending(true);

    try {
      const res = await axios.post(
        `${API_URL}/forgot-password/`,
        { email: String(email || "").trim() },
        { timeout: 20000 }
      );

      setMessage(
        res.data?.message ||
          "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
      );
    } catch (err) {
      console.error("Error recuperando contraseña:", err);

      const status = err?.response?.status;
      const data = err?.response?.data;

      // ✅ Mostrar algo útil
      if (status) {
        setError(
          `No se pudo enviar el correo. Status: ${status}\n` +
            `Respuesta: ${typeof data === "string" ? data : JSON.stringify(data || {}, null, 2)}`
        );
      } else {
        setError("Error al enviar el correo. Por favor, inténtelo nuevamente.");
      }
    } finally {
      setSending(false);
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
            disabled={sending}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "Enviando..." : "Enviar Correo"}
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
    </div>
  );
};

export default ForgotPassword;