// src/components/dashboard/AdminReportsSection.jsx
import { useState, useEffect } from 'react';
import { torneoService, clubService } from '../../services/authService';
import { reportService } from '../../services/reportService';
import ReportButton from '../common/ReportButton';
import './AdminReportsSection.css';

function AdminReportsSection() {
  const [torneos, setTorneos] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('torneos'); // torneos, clubs, general

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'torneos') {
        const res = await torneoService.getAll();
        setTorneos(res.data);
      } else if (activeSubTab === 'clubs') {
        const res = await clubService.getAll();
        setClubs(res.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reports-section">
      <div className="reports-header">
        <h2>📊 Reportes del Sistema</h2>
        <p>Genera reportes detallados en PDF de torneos y clubs</p>
      </div>

      <div className="reports-tabs">
        <button 
          className={activeSubTab === 'torneos' ? 'active' : ''}
          onClick={() => setActiveSubTab('torneos')}
        >
          🏆 Torneos
        </button>
        <button 
          className={activeSubTab === 'clubs' ? 'active' : ''}
          onClick={() => setActiveSubTab('clubs')}
        >
          🏛️ Clubs
        </button>
        <button 
          className={activeSubTab === 'general' ? 'active' : ''}
          onClick={() => setActiveSubTab('general')}
        >
          📋 Generales
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Cargando...</div>
      ) : (
        <>
          {/* REPORTES DE TORNEOS */}
          {activeSubTab === 'torneos' && (
            <div className="reports-content">
              <h3>Reportes de Torneos Individuales</h3>
              <p className="subtitle">Descarga reportes detallados de cada torneo</p>
              
              {torneos.length === 0 ? (
                <p className="empty-state">No hay torneos disponibles</p>
              ) : (
                <div className="reports-grid">
                  {torneos.map(torneo => (
                    <div key={torneo.id} className="report-card">
                      <div className="card-header">
                        <h4>{torneo.nombre}</h4>
                        <span className={`badge badge-${torneo.estado.toLowerCase()}`}>
                          {torneo.estado}
                        </span>
                      </div>
                      
                      <div className="card-info">
                        <p><strong>Categoría:</strong> {torneo.categoriaNombre}</p>
                        <p><strong>Modalidad:</strong> {torneo.modalidad || 'Sin asignar'}</p>
                        {torneo.juezNombre && (
                          <p><strong>Juez:</strong> {torneo.juezNombre}</p>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTES DE CLUBS */}
          {activeSubTab === 'clubs' && (
            <div className="reports-content">
              <h3>Reportes de Clubs Individuales</h3>
              <p className="subtitle">Descarga estadísticas completas de cada club</p>
              
              {clubs.length === 0 ? (
                <p className="empty-state">No hay clubs disponibles</p>
              ) : (
                <div className="reports-grid">
                  {clubs.map(club => (
                    <div key={club.id} className="report-card">
                      <div className="card-header">
                        <h4>{club.nombre}</h4>
                        <span className="badge badge-info">
                          {club.ciudad}
                        </span>
                      </div>
                      
                      <div className="card-info">
                        <p><strong>Owner:</strong> {club.ownerNombre || 'Sin asignar'}</p>
                        <p><strong>Miembros:</strong> {club.cantidadMiembros || 0}/{club.maxParticipantes || 16}</p>
                      </div>

                      <div className="card-actions">
                        <ReportButton 
                          label="Estadísticas del Club"
                          icon="📊"
                          variant="primary"
                          onDownload={() => reportService.descargarReporteClub(club.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTES GENERALES */}
          {activeSubTab === 'general' && (
            <div className="reports-content">
              <h3>Reportes Generales del Sistema</h3>
              <p className="subtitle">Reportes consolidados de todos los torneos y clubs</p>
              
              <div className="general-reports">
                <div className="general-report-card">
                  <div className="icon-large">🏆</div>
                  <h4>Todos los Torneos</h4>
                  <p>Lista completa con estadísticas de todos los torneos del sistema</p>
                  <ReportButton 
                    label="Descargar Reporte General"
                    icon="📥"
                    variant="success"
                    onDownload={() => reportService.descargarTodosLosTorneos()}
                  />
                </div>

                <div className="general-report-card">
                  <div className="icon-large">🏛️</div>
                  <h4>Todos los Clubs</h4>
                  <p>Ranking completo de clubs con sus estadísticas acumuladas</p>
                  <ReportButton 
                    label="Descargar Reporte General"
                    icon="📥"
                    variant="success"
                    onDownload={() => reportService.descargarTodosLosClubs()}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminReportsSection;