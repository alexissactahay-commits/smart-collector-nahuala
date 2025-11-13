// Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

// ✅ Usa la variable de entorno (sin la barra final)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Función auxiliar para construir la URL de manera segura y manejar la respuesta
  // Elimina la necesidad de repetir ${API_URL}/api/ en cada llamada
  const apiPost = async (endpoint, data) => {
    // 1. Elimina cualquier barra final de API_URL.
    // 2. Agrega '/api/'.
    // 3. Agrega el endpoint (ej: 'login/' o 'google-login/').
    const baseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseURL}/api/${endpoint}`;

    try {
      const response = await axios.post(url, data);

      const { access, role, username } = response.data;

      if (!access || !role) {
        throw new Error('Respuesta inválida del servidor');
      }

      const normalizedRole = role.toLowerCase();
      localStorage.setItem('token', access);
      localStorage.setItem('userRole', normalizedRole);
      localStorage.setItem('username', username);

      if (normalizedRole === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error de API:', error.response?.data || error.message);
      throw error;
    }
  };

  // Inicializa el SDK de Facebook
  useEffect(() => {
    if (window.FB) return;

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.FB.init({
        appId: '1930193997909434',
        cookie: true,
        xfbml: true,
        version: 'v20.0'
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password.trim()) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    try {
      // ✅ Usa la función corregida, solo pasando el endpoint final
      await apiPost('login/', {
        identifier: cleanIdentifier,
        password: password
      });
    } catch (error) {
      alert('Credenciales inválidas. Por favor, intente de nuevo.');
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert('Facebook SDK no está listo. Por favor, recargue la página.');
      return;
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        // ✅ Usa la función corregida
        apiPost('facebook-login/', {
          access_token: response.authResponse.accessToken
        })
          .catch(err => {
            console.error('Error en login con Facebook:', err);
            alert('Error al iniciar sesión con Facebook. Por favor, inténtelo de nuevo.');
          });
      } else {
        alert('Login con Facebook cancelado o fallido.');
      }
    }, { scope: 'public_profile,email' });
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
              placeholder="Ej: ciudadano@olintepeque.gt o ciudadano"
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
          <button type="submit" className="btn-login">Iniciar Sesión</button>
          <div className="links">
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
            >
              Olvidó su Contraseña
            </a>
          </div>
          <hr />
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                // ✅ Usa la función corregida
                await apiPost('google-login/', {
                  token: credentialResponse.credential
                });
              } catch (err) {
                console.error('Error en login con Google:', err);
                alert('Error al iniciar sesión con Google');
              }
            }}
            onError={() => {
              alert('Error en el login con Google');
            }}

            render={({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                className="btn-social google"
              >
                <span style={{ marginRight: '10px' }}>🟢</span> Iniciar con Google
              </button>
            )}
          />
          <button
            type="button"
            className="btn-social facebook"
            onClick={handleFacebookLogin}
          >
            <span style={{ marginRight: '10px' }}>🔵</span> Iniciar con Facebook
          </button>
          <div className="register-link">
            Si no posee una cuenta. <a href="/register">Crea una aquí</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;