// RecolectorTracker.js
import React, { useState } from "react";
import axios from "axios";
import "./RecolectorTracker.css"; // opcional si quieres estilos

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Construcción segura de URLs
const buildURL = (endpoint) => {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return endpoint.startsWith("/") ? `${base}${endpoint}` : `${base}/${endpoint}`;
};

const RecolectorTracker = () => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLocation = () => {
    if (!navigator.geolocation) {
      setStatus("❌ Tu dispositivo no soporta GPS.");
      return;
    }

    setLoading(true);
    setStatus("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const token = localStorage.getItem("token");
        if (!token) {
          setStatus("❌ No tienes una sesión activa.");
          return;
        }

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const url = buildURL("/vehicles/1/update-location/");
          await axios.put(
            url,
            { latitude, longitude },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setStatus(`✔ Ubicación enviada correctamente.`);
        } catch (error) {
          console.error(error);
          setStatus("❌ Error al enviar la ubicación.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setStatus("❌ No se pudo obtener tu ubicación. Activa el GPS.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="tracker-container">
      <h2>Enviar Ubicación del Camión</h2>

      <button 
        onClick={sendLocation} 
        disabled={loading}
        className="btn-send"
      >
        {loading ? "Enviando..." : "Enviar Ubicación"}
      </button>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
};

export default RecolectorTracker;

