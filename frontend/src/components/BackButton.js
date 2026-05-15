import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

const BackButton = ({ to }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <div className="back-button-wrapper">
      <button type="button" className="back-button-small" onClick={handleBack}>
        ← Regresar
      </button>
    </div>
  );
};

export default BackButton;