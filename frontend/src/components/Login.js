// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

// ================================
// NORMALIZAR API_URL
// ================================
const normalizeApiBase = () => {
  let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
  base = base.replace(/\/+$/, "");
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

  const postLogin = async () => {
    return axios.post(
      buildURL("/api/login/"),
      {
        identifier: identifier.trim(),
        password: password,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // ⬅️ aumentado a 30s
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // ✅ evita doble submit

    if (!identifier.trim() || !password.trim()) {
      alert("Por favor llene todos los campos.");
      return;
    }

    setLoading(true);

    try {
      let response;

      try {
        response = await postLogin();
      } catch (err) {
        // ✅ retry automático si fue problema de red / cold start
        const status = err?.response?.status;
        const isNetwork = !err?.response;
        const isGateway = status === 502 || status === 503 || status === 504;
        const isTimeout = err?.code === "ECONNABORTED";

        if (isNetwork || isGateway || isTimeout) {
          await new Promise((r) => setTimeout(r, 800));
          response = await postLogin();
        } else {
          throw err;
        }
      }

      const access =
        response?.data?.access ||
        response?.data?.token ||
        response?.data?.access_token;

      const roleRaw = response?.data?.role || "";
      const username = response?.data?.username || "";
      const userId = response?.data?.user_id || "";

      if (!access) {
        alert("Login correcto, pero no se recibió token.");
        setLoading(false);
        return;
      }

      // ✅ Guardar primero, luego redirigir
      localStorage.setItem("token", access);
      localStorage.setItem("userRole", String(roleRaw).toLowerCase());
      localStorage.setItem("username", username);
      if (userId) localStorage.setItem("userId", String(userId));

      // ✅ Redirección limpia (evita parpadeo)
      if (String(roleRaw).toLowerCase() === "admin") {
        window.location.replace("/admin-dashboard");
      } else {
        window.location.replace("/user-dashboard");
      }

    } catch (error) {
      console.error("Error de login:", error);

      if (error.response) {
        if (error.response.status === 401) {
          alert("Usuario o contraseña incorrectos.");
        } else if (error.response.status === 403) {
          alert("No tienes permisos para ingresar.");
        } else {
          alert("Error del servidor. Intente más tarde.");
        }
      } else if (error.code === "ECONNABORTED") {
        alert("Tiempo de espera agotado. Intente nuevamente.");
      } else {
        alert("No se pudo conectar con el servidor.");
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
        </form>
      </div>
    </div>
  );
};

export default Login;