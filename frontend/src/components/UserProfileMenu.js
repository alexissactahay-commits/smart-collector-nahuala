import React, { useState } from 'react';
import './UserProfileMenu.css';

const UserProfileMenu = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="user-profile-menu">
      <div className="user-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        👤
      </div>
      {isMenuOpen && (
        <div className="dropdown-menu">
          <button onClick={() => alert('Funcionalidad de cambiar contraseña. En producción, aquí se abriría un formulario.')}>
            Cambiar Contraseña
          </button>
          <button onClick={() => alert('Funcionalidad de cambiar foto. En producción, aquí se abriría un selector de archivos.')}>
            Cambiar Foto de Perfil
          </button>
          <button onClick={onLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;