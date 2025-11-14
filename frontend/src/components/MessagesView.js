// MessagesView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MessagesView.css';

const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL; // 👈 USAMOS LA URL DE PRODUCCIÓN

  // Cargar mensajes reales del backend
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('Token no encontrado');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/my-notifications/`, // 👈 AHORA YA NO ES LOCALHOST
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Adaptamos los datos al formato del frontend
        const formattedMessages = response.data.map((msg) => ({
          id: msg.id,
          title: 'Mensaje del Administrador',
          body: msg.message || msg.detalle || 'Mensaje sin contenido',
          date: msg.created_at
            ? new Date(msg.created_at).toLocaleDateString()
            : 'Fecha no disponible',
          sender: msg.sender?.username || 'Administración',
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [API_URL]);

  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
  };

  return (
    <div className="messages-container">
      <h2>Mensajes Oficiales - Smart Collector</h2>

      {loading ? (
        <p className="no-messages">Cargando mensajes...</p>
      ) : (
        <div className="messages-list">
          {messages.length === 0 ? (
            <p className="no-messages">No hay mensajes nuevos.</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="message-card"
                onClick={() => handleOpenMessage(message)}
              >
                <div className="message-header">
                  <h3>{message.title}</h3>
                  <span className="message-date">{message.date}</span>
                </div>

                <p className="message-body">{message.body}</p>
                <p className="message-sender">— {message.sender}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DEL MENSAJE */}
      {selectedMessage && (
        <div className="message-modal">
          <div className="message-modal-content">
            <button className="close-btn" onClick={handleCloseMessage}>
              ×
            </button>

            <h3>{selectedMessage.title}</h3>
            <p className="message-body-modal">{selectedMessage.body}</p>
            <p className="message-sender-modal">— {selectedMessage.sender}</p>
            <p className="message-date-modal">Fecha: {selectedMessage.date}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesView;
