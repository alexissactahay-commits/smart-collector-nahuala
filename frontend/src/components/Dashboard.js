import React, { useState, useEffect } from 'react';
import PowerBIEmbed from './PowerBIEmbed';
import axios from 'axios';

const Dashboard = () => {
  const [powerBiData, setPowerBiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPowerBIToken = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/powerbi-token/', {
          withCredentials: true, // Para enviar cookies de sesión si es necesario
        });
        setPowerBiData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el dashboard de Power BI.');
        setLoading(false);
        console.error('Error:', err);
      }
    };

    fetchPowerBIToken();
  }, []);

  if (loading) {
    return <div>Cargando dashboard de Power BI...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!powerBiData) {
    return <div>No se pudo cargar la configuración de Power BI.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard de Inteligencia de Negocios - Smart Collector</h2>
      <PowerBIEmbed
        reportId={powerBiData.reportId}
        embedUrl={powerBiData.embedUrl}
        accessToken={powerBiData.embedToken}
      />
    </div>
  );
};

export default Dashboard;