import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DriverView = () => {
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    // Simular carga de puntos de ruta
    const mockPoints = [
      { id: 1, lat: 14.886351, lng: -91.514472, completed: false },
      { id: 2, lat: 14.887, lng: -91.515, completed: false },
      { id: 3, lat: 14.888, lng: -91.516, completed: false },
    ];
    setRoutePoints(mockPoints);
  }, []);

  const handleComplete = async (pointId) => {
    try {
      await axios.post(`http://localhost:8000/api/complete-point/${pointId}/`);
      setRoutePoints(prev => 
        prev.map(p => p.id === pointId ? { ...p, completed: true } : p)
      );
      alert('Punto marcado como completado');
    } catch (err) {
      alert('Error al marcar el punto');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Vista del Camión - Smart Collector</h2>
      <div>
        {routePoints.map(point => (
          <div key={point.id} style={{ margin: '10px 0' }}>
            <span style={{ 
              color: point.completed ? 'green' : 'black',
              textDecoration: point.completed ? 'line-through' : 'none'
            }}>
              Punto {point.id}: ({point.lat}, {point.lng})
            </span>
            {!point.completed && (
              <button 
                onClick={() => handleComplete(point.id)}
                style={{ marginLeft: '10px', padding: '5px 10px' }}
              >
                Completar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverView;