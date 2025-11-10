// AdminDashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-dashboard">
      {/* Encabezado con logo y nombre */}
      <header className="dashboard-header">
        <div className="logo-container">
          <img src="/Log_smar_collector.png" alt="Logo Smart Collector" className="logo" />
          <h1>Smart Collector "ADMINISTRADOR"</h1>
        </div>
      </header>

      {/* Contenedor de tarjetas */}
      <div className="card-grid">
        <div className="card" onClick={() => navigate('/users')}>
          <div className="icon">👥</div>
          <h3>USUARIOS</h3>
        </div>
        <div className="card" onClick={() => navigate('/user-reports')}>
          <div className="icon">📊</div>
          <h3>REPORTES USUARIOS</h3>
        </div>
        <div className="card" onClick={() => navigate('/generate-reports')}>
          <div className="icon">📄</div>
          <h3>GENERAR INFORMES</h3>
        </div>
        <div className="card" onClick={() => navigate('/collection-points')}>
          <div className="icon">📍</div>
          <h3>PUNTOS DE RECOLECCIÓN</h3>
        </div>
        <div className="card" onClick={() => navigate('/send-message')}>
          <div className="icon">✉️</div>
          <h3>ENVIAR MENSAJES</h3>
        </div>
        {/* 👇 Reemplazado: INCENTIVOS → AGREGAR FECHA */}
        <div className="card" onClick={() => navigate('/add-date')}>
          <div className="icon">📅</div>
          <h3>AGREGAR FECHA</h3>
        </div>
        {/* 👇 Reemplazado: PUBLICACIONES → AGREGAR HORARIO */}
        <div className="card" onClick={() => navigate('/add-schedule')}>
          <div className="icon">⏰</div>
          <h3>AGREGAR HORARIO</h3>
        </div>
        <div className="card" onClick={() => handleCardClick('/logout')}>
          <div className="icon">🚪</div>
          <h3>SALIR</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;