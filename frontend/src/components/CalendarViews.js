import React from 'react';
import './CalendarViews.css'; // Crearemos este archivo después

const CalendarViews = () => {
  // Datos reales de Olintepeque
  const schedule = {
    lunes: [
      "Casco Urbano",
      "Cantón San Isidro",
      "Carretera principal hacia Quetzaltenango",
      "El Trigal",
      "Condominio Claris",
      "Cantón la Libertad"
    ],
    martes: [], // No hay recolección
    miercoles: [
      "Mercado y Plaza de Animales",
      "Sector Fidel Esteban Rodas",
      "Condominio Shalom",
      "Calle los Oxlaj",
      "Hotel Ana Inn",
      "Colonia Santa Ana",
      "San Sebastián",
      "Valle Alto",
      "Escuela Pajoc",
      "Escuela Chuisuc",
      "Escuela San Isidro",
      "Pinar del Río"
    ],
    jueves: [
      "Municipalidad",
      "Instituto de Olintepeque",
      "Escuela El Centro"
    ],
    viernes: [
      "Casco Urbano",
      "Aldea Barrios",
      "Condominio Don Víctor",
      "Condominio San Miguel del Llano",
      "Condominio Nueva Esperanza",
      "Condominio Santa Teresita",
      "Condominio Difiory",
      "Condominio San Javier",
      "Condominio Jardines del Valle",
      "Barrio la Paz"
    ]
  };

  const days = [
    { name: 'Lunes', key: 'lunes' },
    { name: 'Martes', key: 'martes' },
    { name: 'Miércoles', key: 'miercoles' },
    { name: 'Jueves', key: 'jueves' },
    { name: 'Viernes', key: 'viernes' }
  ];

  return (
    <div className="calendar-container">
      <h2>Calendario de Recolección - Olintepeque</h2>
      <div className="calendar-grid">
        {days.map(day => (
          <div key={day.key} className={`day-card ${schedule[day.key].length === 0 ? 'no-service' : ''}`}>
            <h3>{day.name}</h3>
            {schedule[day.key].length === 0 ? (
              <p className="no-service-text">No hay recolección</p>
            ) : (
              <ul>
                {schedule[day.key].map((location, index) => (
                  <li key={index}>{location}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarViews;