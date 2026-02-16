// src/components/torneos/HistorialTorneos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { torneoService } from '../../services/authService';
import RankingTorneo from './RankingTorneo';
import './HistorialTorneos.css';

function HistorialTorneos() {
  const [torneos, setTorneos] = useState([]);
  const [torneosFiltrados, setTorneosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rankingModal, setRankingModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarTorneos();
  }, [filtroEstado]);

  useEffect(() => {
    aplicarFiltros();
  }, [torneos, fechaInicio, fechaFin, busqueda]);

  const cargarTorneos = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (filtroEstado) {
        case 'FINALIZADOS':
          response = await torneoService.getFinalizados();
          break;
        case 'ACTIVOS':
          response = await torneoService.getActivos();
          break;
        case 'PENDIENTES':
          response = await torneoService.getPendientes();
          break;
        default:
          response = await torneoService.getAll();
      }
      
      // Asegurar que los datos tengan valores por defecto si no vienen del backend
      const torneosConDatos = response.data.map(torneo => ({
        ...torneo,
        cantidadParticipantes: torneo.cantidadParticipantes ?? 0,
        cantidadCompetencias: torneo.cantidadCompetencias ?? 0
      }));
      
      setTorneos(torneosConDatos);
    } catch (err) {
      console.error('Error cargando torneos:', err);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...torneos];

    // Filtro por búsqueda (nombre o categoría)
    if (busqueda.trim()) {
      resultado = resultado.filter(t => 
        t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.categoriaNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.sedeNombre?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      resultado = resultado.filter(t => {
        const fechaTorneo = new Date(t.fechaInicio || t.fechaCreacion);
        const fechaFiltroInicio = new Date(fechaInicio);
        return fechaTorneo >= fechaFiltroInicio;
      });
    }

    if (fechaFin) {
      resultado = resultado.filter(t => {
        const fechaTorneo = new Date(t.fechaFin || t.fechaInicio || t.fechaCreacion);
        const fechaFiltroFin = new Date(fechaFin);
        fechaFiltroFin.setHours(23, 59, 59, 999); // Incluir todo el día
        return fechaTorneo <= fechaFiltroFin;
      });
    }

    setTorneosFiltrados(resultado);
  };

  const descargarPDFRanking = async (torneoId, nombreTorneo) => {
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
      a.download = `ranking_${nombreTorneo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF del ranking');
    }
  };

  const descargarPDFCompleto = (torneoId) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:8080/api/reportes/torneos/${torneoId}/pdf`;
    
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  };

  const verRanking = (torneo) => {
    setRankingModal(torneo);
  };

  const irABrackets = (torneoId) => {
    navigate(`/brackets/${torneoId}`);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setBusqueda('');
    setFiltroEstado('TODOS');
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      'FINALIZADO': 'badge-finalizado',
      'ACTIVO': 'badge-activo',
      'PENDIENTE': 'badge-pendiente'
    };
    
    return <span className={`badge ${clases[estado]}`}>{estado}</span>;
  };

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h1 className="neon-title">🏆 Historial de Torneos</h1>
        <p>Explora todos los torneos realizados y descarga sus reportes</p>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-row">
          {/* Búsqueda */}
          <div className="filtro-item">
            <label>🔍 Buscar</label>
            <input
              type="text"
              placeholder="Nombre, categoría o sede..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-search"
            />
          </div>

          {/* Filtro por estado */}
          <div className="filtro-item">
            <label>Estado</label>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select-filter"
            >
              <option value="TODOS">Todos</option>
              <option value="FINALIZADOS">Finalizados</option>
              <option value="ACTIVOS">En Curso</option>
              <option value="PENDIENTES">Pendientes</option>
            </select>
          </div>

          {/* Fecha inicio */}
          <div className="filtro-item">
            <label>📅 Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-date"
            />
          </div>

          {/* Fecha fin */}
          <div className="filtro-item">
            <label>📅 Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-date"
            />
          </div>

          {/* Botón limpiar */}
          <div className="filtro-item">
            <label>&nbsp;</label>
            <button onClick={limpiarFiltros} className="btn-limpiar">
              🗑️ Limpiar
            </button>
          </div>
        </div>

        <div className="filtros-info">
          Mostrando {torneosFiltrados.length} de {torneos.length} torneos
        </div>
      </div>

      {/* Contenido */}
      <div className="torneos-content">
        {loading ? (
          <div className="loading">Cargando torneos...</div>
        ) : torneosFiltrados.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>No se encontraron torneos con los filtros aplicados</p>
            <button onClick={limpiarFiltros} className="btn-secondary">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="torneos-grid">
            {torneosFiltrados.map((torneo) => (
              <div key={torneo.id} className="torneo-card">
                {/* Header */}
                <div className="card-header">
                  <h3>{torneo.nombre}</h3>
                  {getEstadoBadge(torneo.estado)}
                </div>

                {/* Info */}
                <div className="card-body">
                  <div className="info-row">
                    <span className="icon">🏆</span>
                    <span>{torneo.categoriaNombre}</span>
                  </div>

                  {torneo.sedeNombre && (
                    <div className="info-row">
                      <span className="icon">📍</span>
                      <span>{torneo.sedeNombre} - {torneo.sedeDistrito}</span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="icon">📅</span>
                    <span>
                      {torneo.estado === 'FINALIZADO' && torneo.fechaFin
                        ? `Finalizado: ${formatearFecha(torneo.fechaFin)}`
                        : torneo.fechaInicio
                        ? `Inicio: ${formatearFecha(torneo.fechaInicio)}`
                        : `Creado: ${formatearFecha(torneo.fechaCreacion)}`}
                    </span>
                  </div>

                  {torneo.modalidad && (
                    <div className="info-row">
                      <span className="icon">⚔️</span>
                      <span>{torneo.modalidad.replace('_', ' ')}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="stats-row">
                    <div className="stat">
                      <div className="stat-value">
                        {torneo.cantidadParticipantes || 0}
                      </div>
                      <div className="stat-label">Participantes</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">
                        {torneo.cantidadCompetencias || 0}
                      </div>
                      <div className="stat-label">Enfrentamientos</div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="card-actions">
                  {torneo.estado === 'FINALIZADO' && (
                    <>
                      <button
                        onClick={() => descargarPDFRanking(torneo.id, torneo.nombre)}
                        className="btn-action btn-pdf"
                      >
                        📥 Ranking PDF
                      </button>
                      <button
                        onClick={() => descargarPDFCompleto(torneo.id)}
                        className="btn-action btn-secondary-action"
                      >
                        📄 Reporte Completo
                      </button>
                    </>
                  )}

                  {torneo.estado === 'ACTIVO' && (
                    <>
                      <button
                        onClick={() => verRanking(torneo)}
                        className="btn-action btn-ranking"
                      >
                        📊 Ver Ranking en Vivo
                      </button>
                      <button
                        onClick={() => irABrackets(torneo.id)}
                        className="btn-action btn-secondary-action"
                      >
                        🏆 Ver Brackets
                      </button>
                    </>
                  )}

                  {torneo.estado === 'PENDIENTE' && (
                    <div className="pendiente-info">
                      ⏳ Próximamente
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Ranking */}
      {rankingModal && (
        <RankingTorneo
          torneoId={rankingModal.id}
          torneoNombre={rankingModal.nombre}
          onClose={() => setRankingModal(null)}
        />
      )}
    </div>
  );
}

export default HistorialTorneos;