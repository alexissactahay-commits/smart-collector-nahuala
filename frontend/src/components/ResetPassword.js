import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Normalizar API_URL igual que ya usas
  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
    base = String(base).replace(/\/+$/, "");
    if (!base.endsWith("/api")) base = `${base}/api`;
    return base;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ Validar que venga uid/token en la URL
    if (!uid || !token) {
      setError("Enlace inválido. Solicita un nuevo enlace de restablecimiento.");
      return;
    }

    if (newPassword !== newPassword2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (String(newPassword).length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/reset-password/`,
        {
          uidb64: uid,
          token: token,
          new_password: newPassword,
          confirm_password: newPassword2, // ✅ opcional (backend lo acepta si lo mandas)
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      const okMsg =
        res?.data?.message ||
        res?.data?.detail ||
        "Contraseña actualizada correctamente.";
      setMessage(okMsg);

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error("Error reset:", err);

      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "No se pudo actualizar la contraseña. Solicita un nuevo enlace.";

      setError(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Restablecer contraseña</h2>
      <p>Ingresa tu nueva contraseña para tu cuenta de Smart Collector.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            placeholder="Confirmar contraseña"
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ResetPassword;