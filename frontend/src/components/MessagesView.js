import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MessagesView.css';

const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // NORMALIZAMOS LA URL PARA EVITAR /api/api Y ///
  let API_URL = process.env.REACT_APP_API_URL;
  API_URL = API_URL.replace(/\/+$/, "");
  if (!API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return setLoading(false);

        const response = await axios.get(
          `${API_URL}/my-notifications/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const formattedMessages = response.data.map((msg) => ({
          id: msg.id,
          title: 'Mensaje del Administrador',
          body: msg.message || msg.detalle || 'Mensaje sin contenido',
          date: msg.created_at
            ? new Date(msg.created_at).toLocaleString()
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
              <div key={message.id} className="message-card">
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
    </div>
  );
};

export default MessagesView;



