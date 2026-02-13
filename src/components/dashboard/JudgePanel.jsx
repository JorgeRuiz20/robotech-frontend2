import { useState, useEffect } from 'react';
import { torneoService } from "../../services/authService";
import './JudgePanel.css';
import JudgeReportsSection from './JudgeReportsSection';

function JudgePanel() {
  const [activeTab, setActiveTab] = useState('torneos');
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEnf, setSelectedEnf] = useState(null);
  const [puntos1, setPuntos1] = useState('');
  const [puntos2, setPuntos2] = useState('');
  const [error, setError] = useState('');

  // ✅ NUEVO: Recuperar estado del localStorage al cargar
  useEffect(() => {
    const savedState = localStorage.getItem('judgePanel_state');
    if (savedState) {
      try {
        const { torneoId, tab } = JSON.parse(savedState);
        if (torneoId && tab === 'bracket') {
          // Cargar torneo guardado
          loadTorneoFromStorage(torneoId);
        }
      } catch (err) {
        console.error('Error recuperando estado:', err);
      }
    }
    loadTorneos();
  }, []);

  // ✅ NUEVO: Guardar estado cuando cambia el torneo seleccionado
  useEffect(() => {
    if (torneoSeleccionado && activeTab === 'bracket') {
      localStorage.setItem('judgePanel_state', JSON.stringify({
        torneoId: torneoSeleccionado.id,
        tab: activeTab
      }));
    } else if (activeTab === 'torneos') {
      localStorage.removeItem('judgePanel_state');
    }
  }, [torneoSeleccionado, activeTab]);

  const loadTorneoFromStorage = async (torneoId) => {
    try {
      const response = await torneoService.getActivos();
      const torneo = response.data.find(t => t.id === torneoId);
      if (torneo) {
        setTorneoSeleccionado(torneo);
        setActiveTab('bracket');
        await loadBracket(torneoId);
      }
    } catch (err) {
      console.error('Error cargando torneo guardado:', err);
      localStorage.removeItem('judgePanel_state');
    }
  };

  const loadTorneos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await torneoService.getActivos();
      setTorneos(response.data);
    } catch (err) {
      console.error('Error cargando torneos:', err);
      setError('Error al cargar torneos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarModalidad = async (torneoId, modalidad) => {
    try {
      await torneoService.asignarModalidad(torneoId, modalidad);
      alert('✅ Modalidad asignada exitosamente');
      await loadTorneos();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('No eres el juez asignado')) {
        alert('⛔ ' + errorMsg);
      } else {
        alert('Error: ' + errorMsg);
      }
    }
  };

  const handleGenerarEnfrentamientos = async (torneo) => {
    if (!confirm(`¿Generar enfrentamientos para "${torneo.nombre}"?`)) return;

    try {
      const res = await torneoService.generarEnfrentamientos(torneo.id);
      alert(`✅ ${res.data.mensaje}\n\nModalidad: ${res.data.modalidad}\nEnfrentamientos: ${res.data.enfrentamientos}\nFase: ${res.data.faseActual}`);
      
      setTorneoSeleccionado(torneo);
      setActiveTab('bracket');
      await loadBracket(torneo.id);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('No eres el juez asignado')) {
        alert('⛔ ' + errorMsg);
      } else {
        alert('Error: ' + errorMsg);
      }
    }
  };

  const loadBracket = async (torneoId) => {
    setLoading(true);
    setError('');
    try {
      const res = await torneoService.getBracket(torneoId);
      setBracket(res.data);
    } catch (err) {
      console.error('Error cargando bracket:', err);
      setError('Error al cargar bracket: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarResultado = async () => {
    if (!puntos1 || !puntos2) {
      alert('⚠️ Debes ingresar ambos puntajes');
      return;
    }

    if (!confirm(`¿Confirmar resultado?\n\n${selectedEnf.participante1Robot}: ${puntos1}\n${selectedEnf.participante2Robot}: ${puntos2}`)) {
      return;
    }

    try {
      await torneoService.registrarResultado(
        torneoSeleccionado.id,
        selectedEnf.id,
        parseInt(puntos1),
        parseInt(puntos2)
      );
      
      alert('✅ Resultado registrado');
      setSelectedEnf(null);
      setPuntos1('');
      setPuntos2('');
      await loadBracket(torneoSeleccionado.id);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAvanzarGanadores = async () => {
    if (!bracket) return;

    const pendientes = Object.values(bracket.bracket).flat()
      .filter(e => e.resultado === 'PENDIENTE').length;

    if (pendientes > 0) {
      alert(`⚠️ Aún hay ${pendientes} enfrentamiento(s) pendiente(s) en la fase actual`);
      return;
    }

    if (!confirm('¿Avanzar ganadores a la siguiente fase?')) return;

    try {
      const res = await torneoService.avanzarGanadores(torneoSeleccionado.id);
      
      if (res.data.finalizado) {
        alert(`🏆 ¡TORNEO FINALIZADO!\n\n${res.data.mensaje}`);
        setActiveTab('torneos');
        setTorneoSeleccionado(null);
        setBracket(null);
        localStorage.removeItem('judgePanel_state');
        loadTorneos();
      } else {
        alert(`✅ ${res.data.mensaje}\n\nNueva fase: ${res.data.nuevaFase}\nGanadores avanzados: ${res.data.ganadoresAvanzados}`);
        await loadBracket(torneoSeleccionado.id);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const getEstadoTorneo = (torneo) => {
    if (!torneo.modalidad) {
      return {
        estado: 'SIN_MODALIDAD',
        mensaje: '⚠️ Sin modalidad asignada',
        accion: 'ASIGNAR_MODALIDAD'
      };
    }
    
    if (torneo.modalidad && (!bracket || bracket.totalEnfrentamientos === 0)) {
      return {
        estado: 'MODALIDAD_ASIGNADA',
        mensaje: `✅ Modalidad: ${torneo.modalidad}`,
        accion: 'GENERAR_ENFRENTAMIENTOS'
      };
    }
    
    return {
      estado: 'ENFRENTAMIENTOS_ACTIVOS',
      mensaje: `🎯 ${torneo.modalidad} - Fase: ${torneo.faseActual || 'N/A'}`,
      accion: 'VER_BRACKET'
    };
  };

  // ✅ CORREGIDO: Función para determinar ganador basado en resultado del backend
  const getGanador = (enf) => {
    // El backend retorna resultado: 'GANA_1' o 'GANA_2' o 'PENDIENTE'
    if (enf.resultado === 'GANA_1') return 1;
    if (enf.resultado === 'GANA_2') return 2;
    return null;
  };

  const EnfrentamientoCard = ({ enf }) => {
    const ganador = getGanador(enf);
    const isPendiente = enf.resultado === 'PENDIENTE';
    
    return (
      <div 
        className={`enfrentamiento-card ${isPendiente ? 'pendiente' : 'completado'}`}
        onClick={() => isPendiente && setSelectedEnf(enf)}
      >
        {/* Participante 1 */}
        <div className={`participante ${ganador === 1 ? 'ganador' : ''}`}>
          <div className="info">
            <span className="nombre">{enf.participante1Nombre}</span>
            <span className="robot">🤖 {enf.participante1Robot}</span>
          </div>
          <div className="puntos">
            {!isPendiente ? enf.puntosParticipante1 : '-'}
          </div>
          {/* ✅ BADGE COMPLETADO junto al ganador */}
          {!isPendiente && ganador === 1 && (
            <div className="badge-ganador">✓ GANADOR</div>
          )}
        </div>

        {/* VS Separator */}
        <div className="vs-separator">VS</div>

        {/* Participante 2 */}
        <div className={`participante ${ganador === 2 ? 'ganador' : ''}`}>
          <div className="info">
            <span className="nombre">{enf.participante2Nombre}</span>
            <span className="robot">🤖 {enf.participante2Robot}</span>
          </div>
          <div className="puntos">
            {!isPendiente ? enf.puntosParticipante2 : '-'}
          </div>
          {/* ✅ BADGE COMPLETADO junto al ganador */}
          {!isPendiente && ganador === 2 && (
            <div className="badge-ganador">✓ GANADOR</div>
          )}
        </div>

        {/* Hint para click si está pendiente */}
        {isPendiente && (
          <div className="click-hint">👆 Click para registrar</div>
        )}
      </div>
    );
  };

  const BracketView = () => {
    if (!bracket || !bracket.bracket) return null;

    const fases = ['OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'FINAL'];
    const fasesPresentes = fases.filter(f => bracket.bracket[f]?.length > 0);

    return (
      <div className="bracket-container">
        {fasesPresentes.map(fase => (
          <div key={fase} className="fase-column">
            <div className="fase-header">{fase}</div>
            <div className="enfrentamientos-list">
              {bracket.bracket[fase].map(enf => (
                <EnfrentamientoCard key={enf.id} enf={enf} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>⚖️ Panel del Juez</h1>
        <p>Gestiona torneos activos y registra resultados en tiempo real</p>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'torneos' ? 'active' : ''}
          onClick={() => {
            setActiveTab('torneos');
            setTorneoSeleccionado(null);
            setBracket(null);
          }}
        >
          🏆 Torneos Activos
        </button>
        {torneoSeleccionado && (
          <button 
            className={activeTab === 'bracket' ? 'active' : ''}
            onClick={() => setActiveTab('bracket')}
          >
            🎯 Bracket: {torneoSeleccionado.nombre}
          </button>
        )}
        <button 
          className={activeTab === 'reportes' ? 'active' : ''}
          onClick={() => setActiveTab('reportes')}
        >
          📊 Reportes
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {error && <div className="error-banner">❌ {error}</div>}

        {loading && <div className="loading">⏳ Cargando...</div>}

        {/* TAB: TORNEOS */}
        {activeTab === 'torneos' && !loading && (
          <>
            <h2>Torneos Activos</h2>
            {torneos.length === 0 ? (
              <div className="empty-state">
                📭 No hay torneos activos en este momento
              </div>
            ) : (
              <div className="data-grid">
                {torneos.map(torneo => {
                  const estado = getEstadoTorneo(torneo);
                  return (
                    <div key={torneo.id} className="card">
                      <h3>{torneo.nombre}</h3>
                      <p><strong>Categoría:</strong> {torneo.categoriaNombre}</p>
                      <p><strong>Participantes:</strong> {torneo.cantidadParticipantes || 0}</p>
                      <p>{estado.mensaje}</p>

                      <div className="button-group">
                        {estado.accion === 'ASIGNAR_MODALIDAD' && (
                          <>
                            <button 
                              className="btn-primary"
                              onClick={() => handleAsignarModalidad(torneo.id, 'ELIMINATORIA')}
                            >
                              ⚔️ Eliminatoria
                            </button>
                            <button 
                              className="btn-primary"
                              onClick={() => handleAsignarModalidad(torneo.id, 'TODOS_CONTRA_TODOS')}
                            >
                              🔄 Todos vs Todos
                            </button>
                          </>
                        )}

                        {estado.accion === 'GENERAR_ENFRENTAMIENTOS' && (
                          <button 
                            className="btn-primary"
                            onClick={() => handleGenerarEnfrentamientos(torneo)}
                          >
                            🎲 Generar Enfrentamientos
                          </button>
                        )}

                        {estado.accion === 'VER_BRACKET' && (
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              setTorneoSeleccionado(torneo);
                              setActiveTab('bracket');
                              loadBracket(torneo.id);
                            }}
                          >
                            👁️ Ver Bracket
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB: BRACKET */}
        {activeTab === 'bracket' && !loading && bracket && (
          <>
            <div className="bracket-header">
              <div>
                <h2>{torneoSeleccionado.nombre}</h2>
                <p className="progress-text">
                  {bracket.enfrentamientosCompletados}/{bracket.totalEnfrentamientos} completados
                </p>
              </div>
              <button 
                className="btn-primary"
                onClick={handleAvanzarGanadores}
                disabled={bracket.enfrentamientosPendientes > 0}
              >
                ⏭️ Avanzar Ganadores
              </button>
            </div>

            <BracketView />
          </>
        )}

        {/* TAB: REPORTES */}
        {activeTab === 'reportes' && (
          <JudgeReportsSection />
        )}
      </div>

      {/* Modal Registrar Resultado */}
      {selectedEnf && (
        <div className="modal-overlay" onClick={() => setSelectedEnf(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="form-card">
              <h3>⚖️ Registrar Resultado</h3>
              
              <div className="resultado-form">
                <div className="resultado-input">
                  <label>{selectedEnf.participante1Nombre}</label>
                  <span className="robot-name">🤖 {selectedEnf.participante1Robot}</span>
                  <input
                    type="number"
                    value={puntos1}
                    onChange={(e) => setPuntos1(e.target.value)}
                    placeholder="Puntos"
                    min="0"
                  />
                </div>

                <div className="vs-modal">VS</div>

                <div className="resultado-input">
                  <label>{selectedEnf.participante2Nombre}</label>
                  <span className="robot-name">🤖 {selectedEnf.participante2Robot}</span>
                  <input
                    type="number"
                    value={puntos2}
                    onChange={(e) => setPuntos2(e.target.value)}
                    placeholder="Puntos"
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedEnf(null)}>
                  ❌ Cancelar
                </button>
                <button className="btn-primary" onClick={handleRegistrarResultado}>
                  ✅ Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JudgePanel;