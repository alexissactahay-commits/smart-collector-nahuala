// RecolectorDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecolectorDashboard.css";

const RecolectorDashboard = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Recolector";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="recolector-dashboard">
      
      <div className="header">
        <img src="/Log_smar_collector.png" alt="Logo" className="logo" />
        <h2>Bienvenido, {username}</h2>
        <p style={{ marginTop: "-10px", fontSize: "14px", color: "#555" }}>
          Panel de Recolector
        </p>
      </div>

      <div className="options">
        <button 
          className="btn-option"
          onClick={() => navigate("/recolector-tracker")}
        >
          🚛 Enviar Ubicación del Camión
        </button>

        <button 
          className="btn-option-secondary"
          onClick={() => navigate("/user-dashboard")}
        >
          👁 Ver Rutas del Día
        </button>

        <button 
          className="btn-logout"
          onClick={handleLogout}
        >
          ❌ Cerrar Sesión
        </button>
      </div>

    </div>
  );
};

export default RecolectorDashboard;

