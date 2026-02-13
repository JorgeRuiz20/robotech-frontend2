// src/components/dashboard/ClubOwnerReportsSection.jsx
import { useState, useEffect } from 'react';
import { clubService, torneoService } from '../../services/authService';
import { reportService } from '../../services/reportService';
import ReportButton from '../common/ReportButton';
import './ClubOwnerReportsSection.css';

function ClubOwnerReportsSection() {
  const [miClub, setMiClub] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar info del club
      const clubRes = await clubService.getMyClub();
      setMiClub(clubRes.data);

      // Cargar todos los torneos (el backend filtrará cuáles puede ver)
      const torneosRes = await torneoService.getAll();
      setTorneos(torneosRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando reportes...</div>;
  }

  if (!miClub) {
    return (
      <div className="empty-state">
        <p>⚠️ No tienes un club asignado</p>
      </div>
    );
  }

  return (
    <div className="clubowner-reports-section">
      <div className="reports-header">
        <h2>📊 Mis Reportes</h2>
        <p>Descarga reportes de tu club y torneos donde participas</p>
      </div>

      {/* REPORTE DEL CLUB */}
      <div className="section-block">
        <h3>🏛️ Estadísticas de Mi Club</h3>
        <div className="club-report-card">
          <div className="club-info">
            <h4>{miClub.nombre}</h4>
            <div className="club-stats">
              <div className="stat">
                <span className="stat-label">Miembros:</span>
                <span className="stat-value">
                  {/* ✅ CORREGIDO: usar cantidadMiembros en lugar de totalMiembros/miembrosActuales */}
                  {miClub.cantidadMiembros || 0}/{miClub.maxParticipantes || 16}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Ciudad:</span>
                <span className="stat-value">{miClub.ciudad}</span>
              </div>
              <div className="stat">
                <span className="stat-label">País:</span>
                <span className="stat-value">{miClub.pais}</span>
              </div>
            </div>
          </div>
          
          <div className="club-actions">
            <ReportButton 
              label="Descargar Estadísticas del Club"
              icon="📊"
              variant="primary"
              onDownload={() => reportService.descargarReporteClub(miClub.id)}
            />
            <p className="help-text">
              Incluye: miembros, robots, victorias, y efectividad de cada participante
            </p>
          </div>
        </div>
      </div>

      {/* REPORTES DE TORNEOS */}
      <div className="section-block">
        <h3>🏆 Reportes de Torneos</h3>
        <p className="subtitle">
          Descarga reportes de torneos donde tu club tiene participantes
        </p>

        {torneos.length === 0 ? (
          <p className="empty-state">No hay torneos disponibles</p>
        ) : (
          <div className="torneos-grid">
            {torneos.map(torneo => (
              <div key={torneo.id} className="torneo-card">
                <div className="card-header">
                  <h4>{torneo.nombre}</h4>
                  <span className={`badge badge-${torneo.estado.toLowerCase()}`}>
                    {torneo.estado}
                  </span>
                </div>

                <div className="card-info">
                  <p><strong>Categoría:</strong> {torneo.categoriaNombre}</p>
                  <p><strong>Modalidad:</strong> {torneo.modalidad || 'Sin asignar'}</p>
                </div>

                <div className="card-actions">
                  <ReportButton 
                    label="Ver Ranking"
                    icon="🏅"
                    variant="primary"
                    onDownload={() => reportService.descargarRankingTorneo(torneo.id)}
                  />
                  <p className="help-text">
                    ⚠️ Solo podrás descargar si tu club participa en este torneo
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubOwnerReportsSection;