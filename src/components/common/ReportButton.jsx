// src/components/common/ReportButton.jsx
import { useState } from 'react';
import './ReportButton.css';

function ReportButton({ 
  onDownload, 
  label = 'Descargar PDF', 
  icon = '📄',
  variant = 'primary' // primary, secondary, success
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onDownload();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message;
      
      if (errorMsg.includes('No tienes permiso')) {
        alert('⛔ ' + errorMsg);
      } else if (errorMsg.includes('no participa')) {
        alert('⚠️ ' + errorMsg);
      } else {
        alert('Error al descargar reporte: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`report-btn report-btn-${variant}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          Descargando...
        </>
      ) : (
        <>
          <span className="icon">{icon}</span>
          {label}
        </>
      )}
    </button>
  );
}

export default ReportButton;