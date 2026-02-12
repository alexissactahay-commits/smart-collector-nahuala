// Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

// ================================
// NORMALIZAR API_URL (igual que Login.js)
// ================================
const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
  base = base.replace(/\/+$/, ""); // quitar slash final
  return base;
};

const API_BASE = normalizeApiBase();

const buildURL = (endpoint) => {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${path}`;
};

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        buildURL("/api/register/"), // ✅ endpoint correcto
        {
          username: username.trim(),
          email: email.trim(),
          password: password,
          role: "citizen", // ✅ rol por defecto recomendado (consistente)
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      alert("Usuario registrado correctamente. Ahora puedes iniciar sesión.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error register:", error);

      const status = error?.response?.status;

      if (status === 400) {
        // Puede venir por email repetido, username repetido, password inválida, etc.
        const data = error?.response?.data;
        const msg =
          (typeof data === "string" && data) ||
          data?.detail ||
          data?.email?.[0] ||
          data?.username?.[0] ||
          data?.password?.[0] ||
          "Datos inválidos. Revisa usuario/correo/contraseña.";
        alert(msg);
      } else if (status === 409) {
        alert("El usuario o correo ya existe.");
      } else {
        alert("Error al registrar el usuario. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <img
          src="/Log_smar_collector.png"
          alt="Logo Smart Collector"
          className="logo"
        />
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

          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Registrando..." : "Registrar"}
          </button>
        </form>

        <div className="login-link">
          ¿Ya tienes cuenta?{" "}
          <span
            style={{ cursor: "pointer", color: "#0078d4", fontWeight: "bold" }}
            onClick={() => navigate("/login")}
          >
            Inicia Sesión
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;