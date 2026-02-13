import { useState, useEffect } from 'react';
import { robotService, torneoService, categoriaService, clubService, transferenciaService } from '../../services/authService';

function CompetitorPanel() {
  const [activeTab, setActiveTab] = useState('robots');
  const [torneos, setTorneos] = useState([]);
  const [misRobots, setMisRobots] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showRobotForm, setShowRobotForm] = useState(false);
  const [editingRobot, setEditingRobot] = useState(null);
  const [robotForm, setRobotForm] = useState({
    nombre: '',
    descripcion: '',
    peso: '',
    especificacionesTecnicas: '',
    categoriaId: '',
    fotoRobot: ''
  });

  const [selectedTorneo, setSelectedTorneo] = useState(null);
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);

  // ✅ NUEVO: Estado para ver motivo de rechazo
  const [showMotivoRechazo, setShowMotivoRechazo] = useState(null);

  // ✅ NUEVO: Estados para transferencias
  const [solicitudesTransferencia, setSolicitudesTransferencia] = useState([]);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [clubsDisponibles, setClubsDisponibles] = useState([]);
  const [miClubActual, setMiClubActual] = useState(null);
  const [transferenciaForm, setTransferenciaForm] = useState({
    clubDestinoId: '',
    mensaje: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const res = await categoriaService.getAll();
      setCategorias(res.data.filter(c => c.activa));
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'torneos':
          const torneosRes = await torneoService.getActivos();
          setTorneos(torneosRes.data);
          break;
        case 'robots':
          const robotsRes = await robotService.getMisRobots();
          setMisRobots(robotsRes.data);
          break;
        case 'transferencias':
          const solicitudesRes = await transferenciaService.getMisSolicitudes();
          setSolicitudesTransferencia(solicitudesRes.data);
          
          const clubsRes = await clubService.getAll();
          setClubsDisponibles(clubsRes.data);

          const miClubRes = await clubService.getMyClub();
          setMiClubActual(miClubRes.data);
          break;
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRobot = async (e) => {
    e.preventDefault();
    
    if (!robotForm.categoriaId) {
      alert('Debes seleccionar una categoría');
      return;
    }

    const categoriaSeleccionada = categorias.find(c => c.id === parseInt(robotForm.categoriaId));
    
    if (parseInt(robotForm.peso) > categoriaSeleccionada.pesoMaximo) {
      alert(`El peso excede el máximo de ${categoriaSeleccionada.pesoMaximo}g para esta categoría`);
      return;
    }

    try {
      const robotData = {
        nombreRobot: robotForm.nombre,
        descripcionRobot: robotForm.descripcion,
        peso: parseInt(robotForm.peso),
        especificacionesTecnicas: robotForm.especificacionesTecnicas,
        categoriaId: parseInt(robotForm.categoriaId),
        fotoRobot: robotForm.fotoRobot
      };

      if (editingRobot) {
        await robotService.update(editingRobot, robotData);
        alert('✅ Robot actualizado. Estado cambiado a PENDIENTE para revisión del club owner.');
      } else {
        await robotService.create(robotData);
        alert('✅ Robot registrado. Pendiente de aprobación del club owner.');
      }
      
      resetRobotForm();
      loadData();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditRobot = (robot) => {
    setEditingRobot(robot.id);
    setRobotForm({
      nombre: robot.nombre,
      descripcion: robot.descripcion,
      peso: robot.peso,
      especificacionesTecnicas: robot.especificacionesTecnicas,
      categoriaId: robot.categoriaId,
      fotoRobot: robot.fotoRobot || ''
    });
    setShowRobotForm(true);
  };

  const handleDeleteRobot = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este robot?')) return;
    
    try {
      await robotService.delete(id);
      alert('✅ Robot eliminado');
      loadData();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetRobotForm = () => {
    setShowRobotForm(false);
    setEditingRobot(null);
    setRobotForm({ 
      nombre: '', 
      descripcion: '', 
      peso: '', 
      especificacionesTecnicas: '', 
      categoriaId: '',
      fotoRobot: ''
    });
  };

  const handleAbrirInscripcion = (torneo) => {
    const robotsAprobados = misRobots.filter(r => 
      r.estado === 'APROBADO' && 
      r.categoriaId === torneo.categoriaId
    );
    
    if (robotsAprobados.length === 0) {
      alert(`❌ No tienes robots aprobados en la categoría "${torneo.categoriaNombre}"`);
      return;
    }

    setSelectedTorneo(torneo);
    setShowInscripcionModal(true);
  };

  const handleInscribirse = async (robotId) => {
    try {
      await torneoService.unirse(selectedTorneo.id, robotId);
      alert('✅ Te has inscrito exitosamente en el torneo');
      setShowInscripcionModal(false);
      setSelectedTorneo(null);
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // ✅ NUEVO: Funciones para transferencias
  const getBadgeClass = (estado) => {
    if (estado === 'APROBADA') return 'aprobado';
    if (estado.includes('RECHAZADA')) return 'rechazado';
    return 'pendiente';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'PENDIENTE_SALIDA': 'Pendiente Salida',
      'PENDIENTE_INGRESO': 'Pendiente Ingreso',
      'APROBADA': 'Aprobada',
      'RECHAZADA_SALIDA': 'Rechazada (Salida)',
      'RECHAZADA_INGRESO': 'Rechazada (Ingreso)',
      'CANCELADA': 'Cancelada'
    };
    return labels[estado] || estado;
  };

  const handleCancelarTransferencia = async (solicitudId) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    
    try {
      await transferenciaService.cancelar(solicitudId);
      alert('✅ Solicitud cancelada');
      loadData();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🏆 Panel de Competidor</h1>
        <p>Gestiona tus robots y participa en torneos</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'robots' ? 'active' : ''}
          onClick={() => setActiveTab('robots')}
        >
          🤖 Mis Robots
        </button>
        <button 
          className={activeTab === 'torneos' ? 'active' : ''}
          onClick={() => setActiveTab('torneos')}
        >
          🏆 Torneos Disponibles
        </button>
        <button 
          className={activeTab === 'transferencias' ? 'active' : ''}
          onClick={() => setActiveTab('transferencias')}
        >
          🔄 Transferencias
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'robots' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
              <h2>Mis Robots ({misRobots.length}/5)</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  resetRobotForm();
                  setShowRobotForm(!showRobotForm);
                }}
                disabled={misRobots.length >= 5}
              >
                {showRobotForm ? 'Cancelar' : '+ Registrar Robot'}
              </button>
            </div>

            {misRobots.length >= 5 && !showRobotForm && (
              <div className="alert alert-error" style={{marginBottom: '1.5rem'}}>
                ⚠️ Has alcanzado el límite de 5 robots por competidor
              </div>
            )}

            {showRobotForm && (
              <div className="form-card" style={{marginBottom: '2rem'}}>
                <h3>{editingRobot ? 'Editar Robot' : 'Nuevo Robot'}</h3>
                {editingRobot && (
                  <div className="alert alert-info" style={{marginBottom: '1rem'}}>
                    ℹ️ Al actualizar, el robot volverá a estado PENDIENTE para revisión
                  </div>
                )}
                
                <div className="form-group">
                  <label>Nombre del Robot *</label>
                  <input
                    type="text"
                    value={robotForm.nombre}
                    onChange={(e) => setRobotForm({...robotForm, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    value={robotForm.descripcion}
                    onChange={(e) => setRobotForm({...robotForm, descripcion: e.target.value})}
                    rows="3"
                    required
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      value={robotForm.categoriaId}
                      onChange={(e) => setRobotForm({...robotForm, categoriaId: e.target.value})}
                      required
                    >
                      <option value="">Selecciona categoría</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre} (máx: {cat.pesoMaximo}g)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Peso (gramos) *</label>
                    <input
                      type="number"
                      value={robotForm.peso}
                      onChange={(e) => setRobotForm({...robotForm, peso: e.target.value})}
                      required
                      min="1"
                    />
                    {robotForm.categoriaId && (
                      <small style={{color: 'var(--muted)'}}>
                        Máximo: {categorias.find(c => c.id === parseInt(robotForm.categoriaId))?.pesoMaximo}g
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Especificaciones Técnicas *</label>
                  <textarea
                    value={robotForm.especificacionesTecnicas}
                    onChange={(e) => setRobotForm({...robotForm, especificacionesTecnicas: e.target.value})}
                    rows="4"
                    required
                    placeholder="Describe los componentes, sensores, motores, etc."
                  />
                </div>

                <div className="form-group">
                  <label>URL Foto del Robot (opcional)</label>
                  <input
                    type="text"
                    value={robotForm.fotoRobot}
                    onChange={(e) => setRobotForm({...robotForm, fotoRobot: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <button 
                  onClick={handleSubmitRobot}
                  className="btn-primary"
                >
                  {editingRobot ? '💾 Actualizar' : '✅ Registrar'} Robot
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : misRobots.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>
                No tienes robots registrados. ¡Crea tu primer robot!
              </p>
            ) : (
              <div className="data-grid">
                {misRobots.map(robot => (
                  <div key={robot.id} className="card">
                    {robot.fotoRobot && (
                      <img 
                        src={robot.fotoRobot} 
                        alt={robot.nombre}
                        style={{width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <h3>{robot.nombre}</h3>
                    <p>{robot.descripcion}</p>
                    <p><strong>Peso:</strong> {robot.peso}g</p>
                    <p><strong>Categoría:</strong> {robot.categoriaNombre}</p>
                    <p>
                      <strong>Estado:</strong> 
                      <span className={`badge badge-${robot.estado.toLowerCase()}`}>
                        {robot.estado}
                      </span>
                    </p>
                    
                    {/* ✅ NUEVO: Mostrar alerta de rechazo */}
                    {robot.estado === 'RECHAZADO' && robot.motivoRechazo && (
                      <div className="alert alert-error" style={{marginTop: '1rem'}}>
                        <strong>❌ Motivo de rechazo:</strong>
                        <p style={{marginTop: '0.5rem', fontSize: '0.9rem'}}>
                          {robot.motivoRechazo}
                        </p>
                      </div>
                    )}
                    
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleEditRobot(robot)}
                        style={{flex: 1}}
                      >
                        ✏️ Editar
                      </button>
                      {robot.estado === 'PENDIENTE' && (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleDeleteRobot(robot.id)}
                          style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'torneos' && (
          <div>
            <h2>Torneos Activos</h2>
            {loading ? (
              <div className="loading">Cargando...</div>
            ) : torneos.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No hay torneos disponibles</p>
            ) : (
              <div className="data-grid">
                {torneos.map(torneo => (
                  <div key={torneo.id} className="card">
                    <h3>{torneo.nombre}</h3>
                    <p>{torneo.descripcion}</p>
                    {torneo.sedeNombre && <p><strong>📍 Sede:</strong> {torneo.sedeNombre}</p>}
                    <p><strong>📂 Categoría:</strong> {torneo.categoriaNombre}</p>
                    <p><strong>🏅 Estado:</strong> <span className={`badge badge-${torneo.estado.toLowerCase()}`}>{torneo.estado}</span></p>
                    <button 
                      className="btn-primary" 
                      style={{width: '100%', marginTop: '1rem'}}
                      onClick={() => handleAbrirInscripcion(torneo)}
                    >
                      📝 Inscribirse
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transferencias' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
              <h2>📋 Mis Solicitudes de Transferencia</h2>
              <button 
                className="btn-primary"
                onClick={() => setShowSolicitudModal(true)}
              >
                ➕ Solicitar Transferencia
              </button>
            </div>

            <div className="alert alert-info" style={{marginBottom: '2rem'}}>
              <strong>ℹ️ Proceso de transferencia:</strong>
              <ol style={{marginTop: '0.5rem', marginLeft: '1.5rem'}}>
                <li>Solicitas transferencia a otro club</li>
                <li>Tu club actual debe aprobar tu salida</li>
                <li>El club destino debe aprobar tu ingreso</li>
                <li>✅ ¡Transferencia completada!</li>
              </ol>
            </div>

            {solicitudesTransferencia.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>
                No tienes solicitudes de transferencia
              </p>
            ) : (
              <div className="data-grid">
                {solicitudesTransferencia.map(sol => (
                  <div key={sol.id} className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <div>
                        <h3 style={{color: 'var(--neon)', marginBottom: '0.5rem'}}>
                          {sol.clubOrigenNombre} → {sol.clubDestinoNombre}
                        </h3>
                        <p style={{fontSize: '0.85rem', color: 'var(--muted)'}}>
                          {new Date(sol.fechaSolicitud).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`badge badge-${getBadgeClass(sol.estado)}`}>
                        {getEstadoLabel(sol.estado)}
                      </span>
                    </div>

                    {sol.mensajeUsuario && (
                      <p style={{marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--muted)'}}>
                        "{sol.mensajeUsuario}"
                      </p>
                    )}

                    <div style={{marginTop: '1rem', fontSize: '0.85rem'}}>
                      {sol.estado === 'PENDIENTE_SALIDA' && (
                        <p style={{color: '#ffa500'}}>⏳ Esperando aprobación de {sol.clubOrigenNombre}</p>
                      )}
                      {sol.estado === 'PENDIENTE_INGRESO' && (
                        <p style={{color: '#4CAF50'}}>✅ Salida aprobada. Esperando a {sol.clubDestinoNombre}</p>
                      )}
                      {sol.estado === 'APROBADA' && (
                        <p style={{color: '#00ff00'}}>🎉 ¡Transferencia completada!</p>
                      )}
                      {sol.estado.startsWith('RECHAZADA') && sol.motivoRechazo && (
                        <div className="alert alert-error" style={{marginTop: '0.5rem'}}>
                          <strong>❌ Rechazada:</strong> {sol.motivoRechazo}
                        </div>
                      )}
                    </div>

                    {(sol.estado === 'PENDIENTE_SALIDA' || sol.estado === 'PENDIENTE_INGRESO') && (
                      <button 
                        className="btn-secondary"
                        style={{width: '100%', marginTop: '1rem', background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        onClick={() => handleCancelarTransferencia(sol.id)}
                      >
                        ❌ Cancelar Solicitud
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE INSCRIPCIÓN */}
      {showInscripcionModal && selectedTorneo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div className="form-card" style={{maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto'}}>
            <h3>Inscripción al Torneo</h3>
            <p style={{color: 'var(--muted)', marginBottom: '1.5rem'}}>
              <strong>{selectedTorneo.nombre}</strong> - {selectedTorneo.categoriaNombre}
            </p>

            <div className="alert alert-info" style={{marginBottom: '1.5rem'}}>
              ℹ️ Selecciona el robot con el que deseas participar
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {misRobots
                .filter(r => r.estado === 'APROBADO' && r.categoriaId === selectedTorneo.categoriaId)
                .map(robot => (
                  <div 
                    key={robot.id} 
                    className="card"
                    style={{cursor: 'pointer', border: '2px solid rgba(0,200,255,0.3)'}}
                    onClick={() => handleInscribirse(robot.id)}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h4 style={{margin: 0, color: 'var(--neon)'}}>{robot.nombre}</h4>
                        <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--muted)'}}>
                          {robot.peso}g • {robot.categoriaNombre}
                        </p>
                      </div>
                      <button className="btn-primary" style={{pointerEvents: 'none'}}>
                        Seleccionar →
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <button 
              className="btn-secondary"
              style={{width: '100%', marginTop: '1.5rem'}}
              onClick={() => {
                setShowInscripcionModal(false);
                setSelectedTorneo(null);
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVA SOLICITUD DE TRANSFERENCIA */}
      {showSolicitudModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="form-card" style={{maxWidth: '600px', width: '100%'}}>
            <h3>🔄 Solicitar Transferencia</h3>
            
            <div className="form-group">
              <label>Club Destino *</label>
              <select
                value={transferenciaForm.clubDestinoId}
                onChange={(e) => setTransferenciaForm({...transferenciaForm, clubDestinoId: e.target.value})}
                required
              >
                <option value="">Selecciona un club</option>
                {clubsDisponibles
                  .filter(c => c.id !== miClubActual?.id)
                  .map(club => (
                    <option key={club.id} value={club.id}>
                      {club.nombre} - {club.ciudad} ({club.cantidadMiembros}/{club.maxParticipantes || 16})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mensaje (opcional)</label>
              <textarea
                value={transferenciaForm.mensaje}
                onChange={(e) => setTransferenciaForm({...transferenciaForm, mensaje: e.target.value})}
                rows="4"
                placeholder="¿Por qué quieres unirte a este club?"
              />
            </div>

            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn-secondary" onClick={() => setShowSolicitudModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={async () => {
                  try {
                    await transferenciaService.solicitar(
                      transferenciaForm.clubDestinoId, 
                      transferenciaForm.mensaje
                    );
                    alert('✅ Solicitud enviada');
                    setShowSolicitudModal(false);
                    setTransferenciaForm({clubDestinoId: '', mensaje: ''});
                    loadData();
                  } catch (err) {
                    alert('❌ ' + (err.response?.data?.message || err.message));
                  }
                }}
                disabled={!transferenciaForm.clubDestinoId}
              >
                📨 Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitorPanel;
