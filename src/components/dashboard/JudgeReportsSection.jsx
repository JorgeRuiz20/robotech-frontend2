// src/components/dashboard/JudgeReportsSection.jsx
import { useState, useEffect } from 'react';
import { torneoService } from '../../services/authService';
import { reportService } from '../../services/reportService';
import ReportButton from '../common/ReportButton';
import './JudgeReportsSection.css';

function JudgeReportsSection() {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, activo, finalizado

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      const res = await torneoService.getAll();
      setTorneos(res.data);
    } catch (error) {
      console.error('Error cargando torneos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTorneos = torneos.filter(torneo => {
    if (filterStatus === 'all') return true;
    return torneo.estado.toLowerCase() === filterStatus;
  });

  if (loading) {
    return <div className="loading-state">Cargando reportes...</div>;
  }

  return (
    <div className="judge-reports-section">
      <div className="reports-header">
        <h2>📊 Reportes de Torneos</h2>
        <p>Descarga reportes y rankings de tus torneos asignados</p>
      </div>

      {/* Filtros */}
      <div className="filter-tabs">
        <button 
          className={filterStatus === 'all' ? 'active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          Todos ({torneos.length})
        </button>
        <button 
          className={filterStatus === 'activo' ? 'active' : ''}
          onClick={() => setFilterStatus('activo')}
        >
          Activos ({torneos.filter(t => t.estado === 'ACTIVO').length})
        </button>
        <button 
          className={filterStatus === 'finalizado' ? 'active' : ''}
          onClick={() => setFilterStatus('finalizado')}
        >
          Finalizados ({torneos.filter(t => t.estado === 'FINALIZADO').length})
        </button>
      </div>

      {/* Grid de Torneos */}
      {filteredTorneos.length === 0 ? (
        <p className="empty-state">
          {filterStatus === 'all' 
            ? 'No hay torneos disponibles' 
            : `No hay torneos ${filterStatus}s`}
        </p>
      ) : (
        <div className="torneos-grid">
          {filteredTorneos.map(torneo => (
            <div key={torneo.id} className="torneo-card">
              <div className="card-header">
                <h4>{torneo.nombre}</h4>
                <span className={`badge badge-${torneo.estado.toLowerCase()}`}>
                  {torneo.estado}
                </span>
              </div>

              <div className="card-info">
                <div className="info-row">
                  <span className="label">Categoría:</span>
                  <span className="value">{torneo.categoriaNombre}</span>
                </div>
                <div className="info-row">
                  <span className="label">Modalidad:</span>
                  <span className="value">{torneo.modalidad || 'Sin asignar'}</span>
                </div>
                {torneo.faseActual && (
                  <div className="info-row">
                    <span className="label">Fase:</span>
                    <span className="value">{torneo.faseActual}</span>
                  </div>
                )}
                {torneo.juezNombre && (
                  <div className="info-row">
                    <span className="label">Juez:</span>
                    <span className="value">{torneo.juezNombre}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <ReportButton 
                  label="Reporte Completo"
                  icon="📄"
                  variant="primary"
                  onDownload={() => reportService.descargarReporteTorneo(torneo.id)}
                />
                <ReportButton 
                  label="Ranking Final"
                  icon="🏅"
                  variant="secondary"
                  onDownload={() => reportService.descargarRankingTorneo(torneo.id)}
                />
              </div>

              {torneo.estado === 'FINALIZADO' && (
                <div className="finalized-badge">
                  ✅ Torneo completado
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JudgeReportsSection;