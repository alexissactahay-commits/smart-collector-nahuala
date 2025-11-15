import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SendMessage.css';

const SendMessage = () => {
  const [users, setUsers] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const token = localStorage.getItem('token');

  // 🔥 Construcción segura del endpoint
  const BASE_URL = process.env.REACT_APP_API_URL.endsWith('/')
    ? process.env.REACT_APP_API_URL + 'api/'
    : process.env.REACT_APP_API_URL + '/api/';

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}admin/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setAlert({ message: 'Error al cargar la lista de usuarios.', type: 'error' });
    }
  }, [BASE_URL, token]);

  const fetchSentMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}admin/messages/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentMessages(res.data);
    } catch (err) {
      console.error('Error al cargar mensajes enviados:', err);
      setAlert({ message: 'Error al cargar el historial de mensajes.', type: 'error' });
    }
  }, [BASE_URL, token]);

  useEffect(() => {
    fetchUsers();
    fetchSentMessages();
  }, [fetchUsers, fetchSentMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setAlert({ message: 'El mensaje no puede estar vacío.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}admin/messages/`,
        {
          message: message.trim(),
          user_id: selectedRecipientId || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAlert({ message: 'Mensaje enviado correctamente.', type: 'success' });
      setMessage('');
      setSelectedRecipientId('');
      fetchSentMessages();
      setTimeout(() => setAlert({ message: '', type: '' }), 3000);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setAlert({ message: 'Error al enviar el mensaje. Por favor, inténtelo de nuevo.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-message-container">
      <h1>Enviar Mensajes - Smart Collector</h1>

      {alert.message && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-form">
        <div className="form-group">
          <label>Destinatario:</label>
          <select
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
          >
            <option value="">-- Enviar a todos los usuarios --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Mensaje:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows="5"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
      </form>

      <h2>Historial de Mensajes Enviados</h2>
      {sentMessages.length === 0 ? (
        <p>No hay mensajes enviados.</p>
      ) : (
        <div className="messages-list">
          {sentMessages.map((msg) => (
            <div key={msg.id} className="message-card">
              <p><strong>Para:</strong> {msg.usuario?.username || 'Todos los usuarios'}</p>
              <p><strong>Mensaje:</strong> {msg.message}</p>
              <p><strong>Estado:</strong> {msg.estado}</p>
              <p><strong>Fecha:</strong> {new Date(msg.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SendMessage;
