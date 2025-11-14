// Dashboard.js
import React, { useState, useEffect } from "react";
import PowerBIEmbed from "./PowerBIEmbed";
import axios from "axios";

const Dashboard = () => {
  const [powerBiData, setPowerBiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchPowerBIToken = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Tu sesión expiró. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        const response = await axios.get(`${API_URL}/powerbi-token/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPowerBiData(response.data);
      } catch (err) {
        console.error("Error cargando Power BI:", err);
        setError("No se pudo cargar el dashboard de Power BI.");
      } finally {
        setLoading(false);
      }
    };

    fetchPowerBIToken();
  }, [API_URL]);

  if (loading) return <div>Cargando dashboard de Power BI...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!powerBiData) return <div>No hay datos para mostrar el dashboard.</div>;

  return (
    <div style={{ padding: "20px" }}>
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
