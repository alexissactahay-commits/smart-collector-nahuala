import React, { useState } from "react";
import axios from "axios";
import "./ChangePhotoModal.css";

const ChangePhotoModal = ({ onClose }) => {
  // Debe ser algo como: https://smartcollectorolintepeque.com/api
  const API_URL = process.env.REACT_APP_API_URL;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Por favor selecciona una imagen.");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        return;
      }

      const formData = new FormData();
      formData.append("profile_picture", file);

      await axios.post(
        `${API_URL}/upload-profile-picture/`,   // ← corregido
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,  // ← correcto con JWT
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);

      setTimeout(() => {
        onClose();
        window.location.reload(); // refrescar perfil
      }, 1500);

    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert("Error al subir la imagen. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Cambiar Foto de Perfil</h3>

        {success ? (
          <p style={{ color: "green" }}>✅ Foto actualizada correctamente.</p>
        ) : (
          <>
            <div className="photo-preview">
              {preview ? (
                <img src={preview} alt="Vista previa" />
              ) : (
                <div className="placeholder">Sin foto</div>
              )}
            </div>

            <input type="file" accept="image/*" onChange={handleFileChange} />

            <div className="modal-actions">
              <button onClick={onClose} className="btn-cancel">
                Cancelar
              </button>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-save"
              >
                {uploading ? "Subiendo..." : "Guardar Foto"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePhotoModal;

