// Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

// 🔥 API BASE URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 🔥 Función auxiliar para POST a la API
  const apiPost = async (endpoint, data) => {

    // 🔥 Asegurar endpoint final correcto:
    // TODAS las rutas deben iniciar con /api/
    const cleanBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    const url = `${cleanBase}/api/${endpoint}`;

    try {
      const response = await axios.post(url, data);

      const { access, role, username } = response.data;

      localStorage.setItem('token', access);
      localStorage.setItem('userRole', role.toLowerCase());
      localStorage.setItem('username', username);

      if (role.toLowerCase() === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (error) {
      console.error("🔥 Error API:", error.response?.data || error.message);
      throw error;
    }
  };

  // Facebook
  useEffect(() => {
    if (window.FB) return;
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.FB.init({
        appId: "1930193997909434",
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      alert("Complete todos los campos");
      return;
    }

    try {
      await apiPost("login/", {
        identifier: identifier.trim(),
        password: password.trim(),
      });
    } catch {
      alert("Credenciales inválidas");
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK no está listo.");
      return;
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        apiPost("facebook-login/", {
          access_token: response.authResponse.accessToken,
        });
      } else {
        alert("Login con Facebook falló.");
      }
    });
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
              placeholder="Ej: ciudadano@olintepeque.gt"
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
            <a href="/forgot-password">Olvidó su Contraseña</a>
          </div>

          <hr />

          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await apiPost("google-login/", {
                  token: credentialResponse.credential,
                });
              } catch {
                alert("Error con Google");
              }
            }}
            onError={() => alert("Error con Google")}
          />

          <button
            type="button"
            className="btn-social facebook"
            onClick={handleFacebookLogin}
          >
            Iniciar con Facebook
          </button>

          <div className="register-link">
            ¿No posee una cuenta? <a href="/register">Crea una aquí</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
