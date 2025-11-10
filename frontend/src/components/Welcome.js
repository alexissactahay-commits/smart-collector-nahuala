import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css'; // Crearemos este archivo después

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <img src="/Log_smar_collector.png" alt="Logo Smart Collector" className="logo" />
        <h1>¡Bienvenido a Smart Collector!</h1>
        <p>La plataforma inteligente diseñada para revolucionar la gestión de residuos en Olintepeque. Aquí, la tecnología se une al compromiso ambiental para optimizar cada ruta de recolección, asegurar un servicio eficiente y mantener nuestras calles más limpias.</p>
        <p>Con Smart Collector, la Municipalidad de Olintepeque transforma la recolección de basura, haciéndola más transparente, ágil y sostenible. Juntos, construimos un futuro más limpio para nuestra comunidad.</p>
        <p><strong>Inicia sesión o regístrate</strong> para ser parte de esta solución.</p>
        <div className="buttons">
          <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
          <Link to="/register" className="btn btn-secondary">Regístrate</Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;