import React, { useState } from 'react';
import './ChangePhotoModal.css';

const ChangePhotoModal = ({ onClose }) => {
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
    if (!file) return;
    setUploading(true);

    // Aquí iría la llamada real a tu backend:
    // const formData = new FormData();
    // formData.append('profile_picture', file);
    // await axios.post('http://localhost:8000/api/upload-profile-picture/', formData, {
    //   headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
    // });

    // Simulamos subida exitosa
    setTimeout(() => {
      setSuccess(true);
      setUploading(false);
      setTimeout(() => {
        onClose();
        // Opcional: actualizar foto en UI
      }, 1500);
    }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Cambiar Foto de Perfil</h3>
        {success ? (
          <p style={{ color: 'green' }}>✅ Foto actualizada correctamente.</p>
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
              <button type="button" onClick={onClose}>Cancelar</button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Subiendo...' : 'Guardar Foto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePhotoModal;