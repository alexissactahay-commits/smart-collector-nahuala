// SendMessage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SendMessage.css';

const SendMessage = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const token = localStorage.getItem('token');
  const role = (localStorage.getItem('userRole') || '').toLowerCase();

  // ✅ Normaliza API_URL: quita "/" final y asegura que termine con "/api"
  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    base = base.replace(/\/+$/, '');
    if (!base.endsWith('/api')) base = `${base}/api`;
    return base;
  }, []);

  // ✅ Guard: solo admin
  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [token, role, navigate]);

  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = normalizeArray(res.data);
      const onlyActive = list.filter(u => u?.is_active !== false);
      setUsers(onlyActive);
    } catch (err) {
      console.error('Error al cargar usuarios:', err.response?.data || err.message);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login', { replace: true });
        return;
      }

      setAlert({ message: 'Error al cargar la lista de usuarios.', type: 'error' });
    }
  }, [API_URL, token, navigate]);

  // ✅ Historial: solo si el backend lo permite.
  // Si responde 405, NO mostramos error (solo informamos).
  const fetchSentMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/messages/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = normalizeArray(res.data);
      setSentMessages(list);
    } catch (err) {
      const status = err.response?.status;

      // 🔥 Tu caso: GET no permitido -> 405
      if (status === 405) {
        setSentMessages([]);
        setAlert({
          message: 'Historial no disponible (el servidor no permite GET en /admin/messages/).',
          type: 'warning'
        });
        return;
      }

      console.error('Error al cargar mensajes enviados:', err.response?.data || err.message);

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login', { replace: true });
        return;
      }

      setAlert({ message: 'Error al cargar el historial de mensajes.', type: 'error' });
    }
  }, [API_URL, token, navigate]);

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchSentMessages();
  }, [token, fetchUsers, fetchSentMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setAlert({ message: 'El mensaje no puede estar vacío.', type: 'warning' });
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/admin/messages/`,
        {
          message: message.trim(),
          user_id: selectedRecipientId ? Number(selectedRecipientId) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlert({ message: 'Mensaje enviado correctamente.', type: 'success' });
      setMessage('');
      setSelectedRecipientId('');

      // ✅ Intentamos recargar historial (si el backend ya lo permite)
      await fetchSentMessages();

      setTimeout(() => setAlert({ message: '', type: '' }), 2500);
    } catch (err) {
      console.error('Error al enviar mensaje:', err.response?.data || err.message);
      setAlert({ message: 'Error al enviar el mensaje. Inténtalo de nuevo.', type: 'error' });
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
                {user.username} {user.email ? `(${user.email})` : ''}
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
        <p>No hay mensajes enviados (o el servidor no habilitó historial).</p>
      ) : (
        <div className="messages-list">
          {sentMessages.map((msg) => (
            <div key={msg.id} className="message-card">
              <p><strong>Para:</strong> {msg.usuario?.username || 'Todos los usuarios'}</p>
              <p><strong>Mensaje:</strong> {msg.message}</p>
              <p><strong>Estado:</strong> {msg.estado || 'N/A'}</p>
              <p><strong>Fecha:</strong> {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SendMessage;