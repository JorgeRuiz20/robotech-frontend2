// src/components/dashboard/CompetitorReportsSection.jsx
import { useState, useEffect } from 'react';
import { torneoService } from '../../services/authService';
import { reportService } from '../../services/reportService';
import ReportButton from '../common/ReportButton';
import './CompetitorReportsSection.css';

function CompetitorReportsSection() {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      // Los competidores pueden ver todos los torneos públicos
      const res = await torneoService.getAll();
      setTorneos(res.data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando rankings...</div>;
  }

  return (
    <div className="competitor-reports-section">
      <div className="reports-header">
        <h2>🏅 Rankings de Torneos</h2>
        <p>Consulta las clasificaciones de los torneos disponibles</p>
      </div>

      {torneos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <p>No hay torneos disponibles en este momento</p>
        </div>
      ) : (
        <div className="torneos-grid">
          {torneos.map(torneo => (
            <div key={torneo.id} className="torneo-card">
              <div className="card-header">
                <div className="header-content">
                  <h4>{torneo.nombre}</h4>
                  <p className="categoria">{torneo.categoriaNombre}</p>
                </div>
                <span className={`badge badge-${torneo.estado.toLowerCase()}`}>
                  {torneo.estado}
                </span>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  {torneo.modalidad && (
                    <div className="info-item">
                      <span className="icon">🎯</span>
                      <div>
                        <span className="label">Modalidad</span>
                        <span className="value">{torneo.modalidad}</span>
                      </div>
                    </div>
                  )}
                  
                  {torneo.faseActual && (
                    <div className="info-item">
                      <span className="icon">📊</span>
                      <div>
                        <span className="label">Fase Actual</span>
                        <span className="value">{torneo.faseActual}</span>
                      </div>
                    </div>
                  )}

                  {torneo.sede && (
                    <div className="info-item">
                      <span className="icon">📍</span>
                      <div>
                        <span className="label">Sede</span>
                        <span className="value">{torneo.sede}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <ReportButton 
                    label="Ver Ranking"
                    icon="🏅"
                    variant="primary"
                    onDownload={() => reportService.descargarRankingTorneo(torneo.id)}
                  />
                </div>

                {torneo.estado === 'FINALIZADO' && (
                  <div className="status-note completed">
                    ✅ Torneo finalizado - Resultados oficiales
                  </div>
                )}

                {torneo.estado === 'ACTIVO' && (
                  <div className="status-note active">
                    🔴 En vivo - Resultados actualizados
                  </div>
                )}

                {torneo.estado === 'PENDIENTE' && (
                  <div className="status-note pending">
                    ⏳ Próximamente - Aún no iniciado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>Acerca de los Rankings</h4>
          <p>
            Los rankings muestran la clasificación actualizada de todos los participantes 
            en cada torneo, incluyendo puntos, victorias, derrotas y efectividad.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompetitorReportsSection;