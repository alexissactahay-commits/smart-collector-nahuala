// MessagesView.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MessagesView.css";

const MessagesView = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [readingId, setReadingId] = useState(null);

  const API_URL = useMemo(() => {
    let base = process.env.REACT_APP_API_URL || "http://localhost:8000";
    base = String(base).replace(/\/+$/, "");
    if (!base.endsWith("/api")) base = `${base}/api`;
    return base;
  }, []);

  const isUnreadEstado = (estado) => {
    const e = String(estado || "").toLowerCase().trim();
    return (
      e === "pendiente" ||
      e === "enviada" ||
      e === "sin leer" ||
      e === "unread"
    );
  };

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

      const formattedMessages = (
        Array.isArray(response.data) ? response.data : []
      ).map((msg) => ({
        id: msg.id,
        title: "Mensaje del Administrador",
        body: msg.message || msg.detalle || "Mensaje sin contenido",
        date: msg.created_at
          ? new Date(msg.created_at).toLocaleString()
          : "Fecha no disponible",
        sender: msg.sender?.username || "Administración",
        estado: msg.estado || "pendiente",
        isUnread: isUnreadEstado(msg.estado),
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

  const handleMarkAsRead = async (message) => {
    if (!message?.id || !message.isUnread || readingId === message.id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setReadingId(message.id);

    try {
      await axios.patch(
        `${API_URL}/my-notifications/${message.id}/`,
        { estado: "leida" },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? { ...m, estado: "leida", isUnread: false }
            : m
        )
      );

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      console.error("Error al marcar mensaje como leído:", error);
      alert("No se pudo marcar el mensaje como leído.");
    } finally {
      setReadingId(null);
    }
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();

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

      setMessages((prev) => prev.filter((m) => m.id !== id));
      window.dispatchEvent(new Event("notifications-updated"));
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

      {/* Botón regresar */}
      <button
        id="messages-small-back-button"
        type="button"
        onClick={() => navigate("/user-dashboard")}
      >
        ← Regresar
      </button>

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
                onClick={() => handleMarkAsRead(message)}
                style={{
                  cursor: message.isUnread ? "pointer" : "default",
                  borderLeft: message.isUnread
                    ? "6px solid #d90429"
                    : "6px solid #1f4173",
                  background: message.isUnread ? "#fff7f7" : "#ffffff",
                }}
                title={
                  message.isUnread
                    ? "Clic para marcar como leído"
                    : "Mensaje leído"
                }
              >
                <div className="message-header">
                  <h3>
                    {message.title}

                    {message.isUnread && (
                      <span
                        style={{
                          marginLeft: "10px",
                          background: "#d90429",
                          color: "white",
                          fontSize: "12px",
                          padding: "3px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        Nuevo
                      </span>
                    )}
                  </h3>

                  <span className="message-date">
                    {message.date}
                  </span>
                </div>

                <p className="message-body">
                  {message.body}
                </p>

                <p className="message-sender">
                  — {message.sender}
                </p>

                <button
                  type="button"
                  onClick={(event) => handleDelete(message.id, event)}
                  disabled={deletingId === message.id}
                  style={{
                    marginTop: "10px",
                    background: "#d90429",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    cursor:
                      deletingId === message.id ? "not-allowed" : "pointer",
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