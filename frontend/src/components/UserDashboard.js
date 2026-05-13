// UserDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState('Ciudadano'); // Valor por defecto

    // Verifica si el usuario está autenticado y tiene rol válido
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');

        if (!token || !role || role === 'admin') {
            // Si no hay token, no hay rol, o es admin → redirigir al login
            navigate('/login', { replace: true });
            return;
        }

        // Establecer el rol mostrado
        setUserRole('Ciudadano');
    }, [navigate]);

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

                {/* Título centrado: Ciudadano */}
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
                            <button onClick={handleLogout} className="logout-button">
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido principal: tarjetas */}
            <main className="main-content">
                <div className="card-grid">
                    <div className="card" onClick={() => navigate('/map')}>
                        <div className="icon">📍</div>
                        <h3>Ver Mapa</h3>
                    </div>

                    <div className="card" onClick={() => navigate('/messages')}>
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