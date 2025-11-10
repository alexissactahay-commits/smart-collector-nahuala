import React from 'react';
import './HoursView.css';

const HoursView = () => {
  // Horario base para todos los días
  const schedule = {
    lunes: "8:30 AM - 4:00 PM",
    martes: "No hay recoleccion este dia",
    miercoles: "8:30 AM - 4:00 PM",
    jueves: "8:30 AM - 4:00 PM",
    viernes: "8:30 AM - 4:00 PM"
  };

  const days = [
    { name: 'Lunes', key: 'lunes' },
    { name: 'Martes', key: 'martes' },
    { name: 'Miércoles', key: 'miercoles' },
    { name: 'Jueves', key: 'jueves' },
    { name: 'Viernes', key: 'viernes' }
  ];

  return (
    <div className="hours-container">
      <h2>Horarios de Recolección - Olintepeque</h2>
      <div className="hours-grid">
        {days.map(day => (
          <div key={day.key} className="hour-card">
            <h3>{day.name}</h3>
            <p className="hour-time">{schedule[day.key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoursView;