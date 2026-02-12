import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./MessagesView.css";

const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Normalizar API_URL: evita /api/api y también evita crash si no existe env
  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
    base = String(base).replace(/\/+$/, "");
    if (!base.endsWith("/api")) base = `${base}/api`;
    return base;
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessages([]);
        return;
      }

      const response = await axios.get(`${API_URL}/my-notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      const formattedMessages = (Array.isArray(response.data) ? response.data : []).map((msg) => ({
        id: msg.id,
        title: "Mensaje del Administrador",
        body: msg.message || msg.detalle || "Mensaje sin contenido",
        date: msg.created_at ? new Date(msg.created_at).toLocaleString() : "Fecha no disponible",
        sender: msg.sender?.username || "Administración",
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await fetchMessages();
      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  // ✅ NUEVO: borrar mensaje (solo para el ciudadano)
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ok = window.confirm("¿Deseas eliminar este mensaje?");
    if (!ok) return;

    setDeletingId(id);

    try {
      await axios.delete(`${API_URL}/my-notifications/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      // ✅ reflejar inmediato sin esperar recarga
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);

      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.replace("/login");
        return;
      }

      alert("No se pudo eliminar el mensaje. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
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
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <h3>{message.title}</h3>
                  <span className="message-date">{message.date}</span>
                </div>

                <p className="message-body">{message.body}</p>
                <p className="message-sender">— {message.sender}</p>

                {/* ✅ BOTÓN ELIMINAR */}
                <button
                  type="button"
                  onClick={() => handleDelete(message.id)}
                  disabled={deletingId === message.id}
                  style={{
                    marginTop: "10px",
                    background: "#d90429",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    cursor: deletingId === message.id ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {deletingId === message.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesView;