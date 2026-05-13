import React from 'react';
import './ContactView.css';

const ContactView = () => {
  return (
    <div className="contact-container">
      <h2>Contacto - Smart Collector</h2>
      <div className="contact-card">
        <p>¿Tienes alguna duda, sugerencia o necesitas reportar un problema urgente?</p>
        <p>¡No dudes en contactarnos! Estamos aquí para servirte y mejorar nuestro servicio- TU MUNI NAHUALA.</p>
        
        <div className="contact-info">
          <div className="contact-item">
            <span className="icon">📞</span>
            <div>
              <h3>ENCARGADO OFICINA DE MEDIO AMBIENTE Y RECURSOS NATURALES</h3>
              <a href="">FRANCISCO ISMAEL TZAJ TZOC</a>
              <h3>Teléfono</h3>
              <a href="tel:45086488">45086488</a>
            </div>
          </div>
          
          <div className="contact-item">
            <span className="icon">✉️</span>
            <div>
              <h3>Correo Electrónico</h3>
              <a href="mailto:jsactahay@gmail.com">jsactahay@gmail.com</a>
            </div>
          </div>
        </div>
        
        <p className="note">Horario de atención: Lunes a Viernes, 8:30 AM - 15:45 PM.</p>
      </div>
    </div>
  );
};

export default ContactView;