// AdminDashboard.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [newReportsCount, setNewReportsCount] = useState(0);

  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    base = String(base).replace(/\/+$/, '');
    if (!base.endsWith('/api')) base = `${base}/api`;
    return base;
  }, []);

  const fetchNewReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setNewReportsCount(0);
        return;
      }

      const res = await axios.get(`${API_URL}/admin/reports/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      const data = Array.isArray(res.data) ? res.data : [];

      const pendingReports = data.filter((report) => {
        const status = String(report?.status || '').toLowerCase().trim();

        return (
          status === 'pending' ||
          status === 'pendiente' ||
          status === 'nuevo' ||
          status === 'sin leer'
        );
      }).length;

      setNewReportsCount(pendingReports);
    } catch (error) {
      console.error('Error al cargar reportes nuevos:', error);
      setNewReportsCount(0);
    }
  }, [API_URL]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }

    fetchNewReports();

    const interval = setInterval(() => {
      fetchNewReports();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate, fetchNewReports]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="logo-container">
          <img
            src="/Log_smar_collector.png"
            alt="Logo Smart Collector"
            className="logo"
          />
          <h1>Smart Collector "ADMINISTRADOR"</h1>
        </div>
      </header>

      <div className="card-grid">
        <div className="card" onClick={() => navigate('/users')}>
          <div className="icon">👥</div>
          <h3>USUARIOS</h3>
        </div>

        <div
          className="card"
          onClick={() => navigate('/user-reports')}
          style={{ position: 'relative' }}
        >
          {newReportsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '18px',
                right: '24px',
                minWidth: '24px',
                height: '24px',
                padding: '0 7px',
                borderRadius: '999px',
                background: '#dc3545',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                zIndex: 2,
              }}
            >
              {newReportsCount > 99 ? '99+' : newReportsCount}
            </span>
          )}

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

        <div className="card" onClick={() => navigate('/add-date')}>
          <div className="icon">📅</div>
          <h3>AGREGAR FECHA</h3>
        </div>

        <div className="card" onClick={() => navigate('/add-schedule')}>
          <div className="icon">⏰</div>
          <h3>AGREGAR HORARIO</h3>
        </div>

        <div className="card" onClick={() => navigate('/admin/route-communities')}>
          <div className="icon">🏘️</div>
          <h3>LISTA DE COMUNIDADES</h3>
        </div>

        <div className="card" onClick={handleLogout}>
          <div className="icon">🚪</div>
          <h3>SALIR</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;