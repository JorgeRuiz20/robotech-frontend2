// src/components/torneos/RankingTorneo.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { torneoService } from '../../services/authService';
import './RankingTorneo.css';

function RankingTorneo({ torneoId, torneoNombre, onClose }) {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  const lastDataRef = useRef(null); // Referencia para comparar cambios

  // Función para serializar datos y compararlos (evita renders si los datos no cambian)
  const serializeData = useCallback((data) => {
    return JSON.stringify(data);
  }, []);

  // ✅ FUNCIÓN PARA CARGAR EL RANKING (optimizada)
  const cargarRanking = useCallback(async () => {
    // Solo mostrar loading en la carga inicial
    if (!rankingData) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await torneoService.getRanking(torneoId);
      const newData = response.data;
      const newDataSerialized = serializeData(newData);
      
      // Solo actualizar si realmente hay cambios
      if (lastDataRef.current !== newDataSerialized) {
        lastDataRef.current = newDataSerialized;
        setRankingData(newData);
      }
    } catch (err) {
      console.error('Error cargando ranking:', err);
      setError(err.response?.data?.mensaje || 'Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  }, [torneoId, rankingData, serializeData]);

  // ✅ EFECTO PARA CARGAR INICIAL Y CONFIGURAR POLLING
  useEffect(() => {
    // Cargar inmediatamente
    cargarRanking();

    // ✅ CONFIGURAR POLLING AUTOMÁTICO (cada 5 segundos)
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        cargarRanking();
      }, 5000); // 5 segundos
    }

    // ✅ CLEANUP: Limpiar intervalo cuando el componente se desmonte o cambie torneoId
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [torneoId, autoRefresh, cargarRanking]);

  // ✅ FUNCIÓN PARA TOGGLE DEL AUTO-REFRESH
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const descargarPDF = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://jorgeruiz20.onrender.com/api/reportes/torneos/${torneoId}/ranking/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al descargar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking_${torneoNombre?.replace(/\s+/g, '_') || 'torneo'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF del ranking');
    }
  }, [torneoId, torneoNombre]);

  const getMedalIcon = (posicion) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    return posicion;
  };

  // Componente memorizado para fila de ranking (evita re-renders innecesarios)
  const ParticipanteRow = useMemo(() => 
    ({ participante, posicion }) => (
      <tr className={posicion < 2 ? 'top-three' : ''}>
        <td className="posicion">
          <span className="medal">{getMedalIcon(posicion + 1)}</span>
        </td>
        <td className="robot-name">{participante.nombreRobot}</td>
        <td>{participante.usuarioNombre}</td>
        <td>{participante.clubNombre || 'Sin club'}</td>
        <td className="puntos">{participante.puntuacionTotal || 0}</td>
        <td className="victorias">{participante.partidosGanados || 0}</td>
        <td className="derrotas">{participante.partidosPerdidos || 0}</td>
        <td className="empates">{participante.partidosEmpatados || 0}</td>
        <td className="efectividad">
          {participante.efectividad ? participante.efectividad.toFixed(1) : '0.0'}%
        </td>
      </tr>
    )
  , []);

  if (loading) {
    return (
      <div className="ranking-modal-overlay">
        <div className="ranking-modal">
          <div className="ranking-header">
            <h2>Ranking - {torneoNombre}</h2>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>
          <div className="loading">Cargando ranking...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-modal-overlay">
        <div className="ranking-modal">
          <div className="ranking-header">
            <h2>Ranking - {torneoNombre}</h2>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>
          <div className="error-message">
            <p>{error}</p>
            {rankingData?.estadoTorneo === 'FINALIZADO' && rankingData?.urlPDF && (
              <button className="btn btn-primary" onClick={descargarPDF}>
                📥 Descargar Ranking PDF
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si el torneo está finalizado, mostrar mensaje y botón de PDF
  if (rankingData?.estadoTorneo === 'FINALIZADO') {
    return (
      <div className="ranking-modal-overlay">
        <div className="ranking-modal">
          <div className="ranking-header">
            <h2>Ranking - {torneoNombre}</h2>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>
          <div className="finalizado-message">
            <div className="trophy-icon">🏆</div>
            <h3>Torneo Finalizado</h3>
            <p>{rankingData.mensaje}</p>
            <button className="btn btn-primary" onClick={descargarPDF}>
              📥 Descargar Ranking PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si el torneo está pendiente
  if (rankingData?.estadoTorneo === 'PENDIENTE') {
    return (
      <div className="ranking-modal-overlay">
        <div className="ranking-modal">
          <div className="ranking-header">
            <h2>Ranking - {torneoNombre}</h2>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>
          <div className="pendiente-message">
            <div className="clock-icon">⏳</div>
            <h3>Torneo Pendiente</h3>
            <p>{rankingData.mensaje}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si el torneo está activo, mostrar ranking en tiempo real
  const ranking = rankingData?.ranking || [];

  return (
    <div className="ranking-modal-overlay">
      <div className="ranking-modal">
        <div className="ranking-header">
          <div>
            <h2>📊 Ranking en Tiempo Real</h2>
            <p className="torneo-nombre">{torneoNombre}</p>
          </div>
          <div className="ranking-actions">
            {/* ✅ BOTÓN PARA TOGGLE AUTO-REFRESH */}
            <button 
              className={`btn ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
              onClick={toggleAutoRefresh}
              title={autoRefresh ? 'Desactivar actualización automática' : 'Activar actualización automática'}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </button>
            
            <button className="btn btn-secondary" onClick={cargarRanking}>
              🔄 Actualizar Ahora
            </button>
            {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="no-data">
            No hay participantes en el ranking aún
          </div>
        ) : (
          <div className="ranking-table-container">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Robot</th>
                  <th>Competidor</th>
                  <th>Club</th>
                  <th>Puntos</th>
                  <th>V</th>
                  <th>D</th>
                  <th>E</th>
                  <th>Efectividad</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((participante, index) => (
                  <ParticipanteRow 
                    key={participante.id} 
                    participante={participante} 
                    posicion={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="ranking-footer">
          <p className="info-text">
            ℹ️ {autoRefresh 
              ? 'Actualización automática cada 5 segundos' 
              : 'Actualización manual - Presiona "Actualizar Ahora"'
            }. Total de participantes: {ranking.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RankingTorneo;