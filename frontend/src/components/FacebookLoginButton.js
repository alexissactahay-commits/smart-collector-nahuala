import React from 'react';

const FacebookLoginButton = ({ onSuccess, onError }) => {
  const handleClick = () => {
    if (window.FB) {
      window.FB.login((response) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'id,name,email' }, (user) => {
            onSuccess({
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
              name: user.name,
              email: user.email
            });
          });
        } else {
          onError?.();
        }
      }, { scope: 'public_profile,email' });
    } else {
      alert('Facebook SDK no está cargado. Recarga la página.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: '#3b5998',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      <span>🔵</span> Iniciar con Facebook
    </button>
  );
};

export default FacebookLoginButton;