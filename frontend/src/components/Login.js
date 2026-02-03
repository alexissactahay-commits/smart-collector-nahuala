// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

// ================================
// NORMALIZAR API_URL (como en el resto del proyecto)
// ================================
const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
  base = base.replace(/\/+$/, ""); // quitar slash final
  // OJO: aquí NO agregamos /api, porque buildURL ya recibe /api/login/
  return base;
};

const API_BASE = normalizeApiBase();

const buildURL = (endpoint) => {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${path}`;
};

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      alert("Por favor llene todos los campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        buildURL("/api/login/"), // ✅ tu endpoint correcto
        {
          identifier: identifier.trim(),
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      // Tu backend devuelve: access, refresh, role, username, user_id
      // Dejamos fallback por si en algún momento cambia.
      const access =
        response?.data?.access ||
        response?.data?.token ||
        response?.data?.access_token;

      const roleRaw = response?.data?.role || "";
      const username = response?.data?.username || "";
      const userId = response?.data?.user_id || "";

      if (!access) {
        alert("Login correcto, pero no se recibió token. Revisa el backend.");
        return;
      }

      // Limpiar sesión anterior (importante)
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");

      // Guardar datos en localStorage
      localStorage.setItem("token", access);
      localStorage.setItem("userRole", String(roleRaw).toLowerCase());
      localStorage.setItem("username", username);
      if (userId) localStorage.setItem("userId", String(userId));

      // Redirección por rol
      if (String(roleRaw).toLowerCase() === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/user-dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error de login:", error);

      if (error.response) {
        if (error.response.status === 401) {
          alert("Usuario o contraseña incorrectos.");
          return;
        }
        if (error.response.status === 403) {
          alert("No tienes permisos para ingresar.");
          return;
        }
        alert("Error del servidor. Intente más tarde.");
      } else if (error.code === "ECONNABORTED") {
        alert("Tiempo de espera agotado. Verifica que Django esté corriendo.");
      } else {
        alert("No se pudo conectar con el servidor. Verifique que Django esté corriendo.");
      }
    } finally {
      setLoading(false);
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
              placeholder="Ej: admin o ciudadano"
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

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="links">
            <span
              onClick={() => navigate("/forgot-password")}
              style={{ cursor: "pointer" }}
            >
              Olvidó su contraseña
            </span>
          </div>

          <div className="links" style={{ marginTop: "10px" }}>
            <span
              onClick={() => navigate("/register")}
              style={{ fontWeight: "bold", cursor: "pointer" }}
            >
              ¿No tiene cuenta? Regístrese aquí
            </span>
          </div>

          <hr />
          {/* 🔕 LOGIN CON GOOGLE DESACTIVADO */}
        </form>
      </div>
    </div>
  );
};

export default Login;
