// UserDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState('Ciudadano');
    const [unreadMessages, setUnreadMessages] = useState(0);

    // ============================
    // NORMALIZAR API_URL
    // ============================
    const API_URL = useMemo(() => {
        let base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        base = String(base).replace(/\/+$/, '');
        if (!base.endsWith('/api')) base = `${base}/api`;
        return base;
    }, []);

    // ============================
    // CARGAR MENSAJES NO LEÍDOS
    // ============================
    const fetchUnreadMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setUnreadMessages(0);
                return;
            }

            const response = await axios.get(`${API_URL}/my-notifications/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                timeout: 15000,
            });

            const data = Array.isArray(response.data) ? response.data : [];

            // ✅ Cuenta mensajes no leídos
            // En tu backend normalmente vienen como "pendiente" o "enviada"
            const unread = data.filter((msg) => {
                const estado = String(msg?.estado || '').toLowerCase().trim();

                return (
                    estado === 'pendiente' ||
                    estado === 'enviada' ||
                    estado === 'sin leer' ||
                    estado === 'unread'
                );
            }).length;

            setUnreadMessages(unread);
        } catch (error) {
            console.error('Error al cargar mensajes no leídos:', error);
            setUnreadMessages(0);
        }
    }, [API_URL]);

    // ============================
    // VALIDAR LOGIN
    // ============================
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || !role || role === 'admin') {
            navigate('/login', { replace: true });
            return;
        }

        setUserRole('Ciudadano');
        fetchUnreadMessages();

        // ✅ Actualiza cada 30 segundos por si el admin manda mensajes nuevos
        const interval = setInterval(() => {
            fetchUnreadMessages();
        }, 30000);

        return () => clearInterval(interval);
    }, [navigate, fetchUnreadMessages]);

    // ============================
    // CERRAR SESIÓN
    // ============================
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login', { replace: true });
    };

    return (
        <div className="user-dashboard">
            {/* Encabezado */}
            <header className="user-header">
                {/* Logo */}
                <div className="logo-placeholder">
                    <img
                        src="/Log_smar_collector.png"
                        alt="Logo Smart Collector"
                        className="logo"
                    />
                </div>

                {/* Título centrado */}
                <h1 className="header-title">{userRole}</h1>

                {/* Menú de usuario */}
                <div className="user-icon-container">
                    <div
                        className="user-icon"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        title="Menú de usuario"
                    >
                        👤
                    </div>

                    {isMenuOpen && (
                        <div className="dropdown-menu">
                            <button
                                onClick={handleLogout}
                                className="logout-button"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido principal */}
            <main className="main-content">
                <div className="card-grid">
                    <div className="card" onClick={() => navigate('/map')}>
                        <div className="icon">📍</div>
                        <h3>Ver Mapa</h3>
                    </div>

                    {/* ✅ TARJETA MENSAJES CON CONTADOR */}
                    <div
                        className="card messages-card"
                        onClick={() => navigate('/messages')}
                        style={{ position: 'relative' }}
                    >
                        {unreadMessages > 0 && (
                            <span
                                className="message-badge"
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
                                {unreadMessages > 99 ? '99+' : unreadMessages}
                            </span>
                        )}

                        <div className="icon">✉️</div>
                        <h3>Mensajes</h3>
                    </div>

                    <div className="card" onClick={() => navigate('/reports')}>
                        <div className="icon">❗</div>
                        <h3>Reportes</h3>
                    </div>

                    <div className="card" onClick={() => navigate('/calendar')}>
                        <div className="icon">📅</div>
                        <h3>Calendario</h3>
                    </div>

                    <div className="card" onClick={() => navigate('/hours')}>
                        <div className="icon">⏰</div>
                        <h3>Horarios</h3>
                    </div>

                    <div className="card" onClick={() => navigate('/contact')}>
                        <div className="icon">📞</div>
                        <h3>Contacto</h3>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;