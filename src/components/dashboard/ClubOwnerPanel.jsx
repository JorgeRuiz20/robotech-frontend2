// src/components/dashboard/ClubOwnerPanel.jsx
import { useState, useEffect } from 'react';
import {
  robotService,
  clubService,
  transferenciaService
} from '../../services/authService';
import api from '../../services/api';
import ClubOwnerReportsSection from './ClubOwnerReportsSection';

import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useGlobalLoading } from '../../context/GlobalLoadingContext';

function ClubOwnerPanel() {
  const [activeTab, setActiveTab] = useState('club');
  const [miClub, setMiClub] = useState(null);
  const [miembrosClub, setMiembrosClub] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [robotsPendientes, setRobotsPendientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRobot, setSelectedRobot] = useState(null);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [robotToReject, setRobotToReject] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [transferenciasSalida, setTransferenciasSalida] = useState([]);
  const [transferenciasIngreso, setTransferenciasIngreso] = useState([]);
  const [showProcesarModal, setShowProcesarModal] = useState(false);
  const [transferenciaActual, setTransferenciaActual] = useState(null);
  const [procesarForm, setProcesarForm] = useState({ aprobar: true, motivo: '' });

  const [showEditClub, setShowEditClub] = useState(false);
  const [clubForm, setClubForm] = useState({ nombre: '', descripcion: '', ciudad: '', pais: '' });

  // ✅ Contexto global
  const { isAnyLoading } = useGlobalLoading();

  useEffect(() => { loadData(); }, [activeTab]);
  useEffect(() => { loadMiClub(); }, []);

  const loadMiClub = async () => {
    try {
      const res = await clubService.getMyClub();
      setMiClub(res.data);
      setClubForm({
        nombre: res.data.nombre || '',
        descripcion: res.data.descripcion || '',
        ciudad: res.data.ciudad || '',
        pais: res.data.pais || ''
      });
    } catch (err) {
      console.error('Error cargando club:', err);
    }
  };

  const loadMiembros = async () => {
    try {
      const res = await api.get('/clubs/my-club/miembros');
      setMiembrosClub(res.data);
    } catch (err) {
      console.error('Error cargando miembros:', err);
      setMiembrosClub([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'robots':
          const robotsRes = await robotService.getPendientes();
          setRobotsPendientes(robotsRes.data);
          break;
        case 'codigos':
          await loadCodigos();
          break;
        case 'miembros':
          await loadMiembros();
          break;
        case 'transf-salida':
          const salidaRes = await transferenciaService.getPendientesSalida();
          setTransferenciasSalida(salidaRes.data);
          break;
        case 'transf-ingreso':
          const ingresoRes = await transferenciaService.getPendientesIngreso();
          setTransferenciasIngreso(ingresoRes.data);
          break;
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCodigos = async () => {
    try {
      const res = await api.get('/codigos-registro/mis-codigos');
      setCodigos(res.data);
    } catch (err) {
      console.error('Error cargando códigos:', err);
    }
  };

  // ✅ Protegido: actualizar club
  const [handleUpdateClub, isUpdatingClub] = useAsyncAction(async () => {
    await clubService.updateMyClub(clubForm);
    alert('✅ Club actualizado exitosamente');
    setShowEditClub(false);
    loadMiClub();
  });

  const handleVerDetallesRobot = (robot) => setSelectedRobot(robot);

  // ✅ Protegido: aprobar robot
  const [handleAprobarRobot, isAprobandoRobot] = useAsyncAction(async (id) => {
    await robotService.aprobar(id);
    alert('✅ Robot aprobado');
    setSelectedRobot(null);
    loadData();
  });

  const handleAbrirModalRechazo = (robot) => {
    setRobotToReject(robot);
    setMotivoRechazo('');
    setShowRechazoModal(true);
  };

  // ✅ Protegido: confirmar rechazo robot
  const [handleConfirmarRechazo, isRechazandoRobot] = useAsyncAction(async () => {
    if (!motivoRechazo.trim()) {
      alert('⚠️ Debes especificar un motivo de rechazo');
      return;
    }
    await robotService.rechazar(robotToReject.id, motivoRechazo);
    alert('❌ Robot rechazado');
    setShowRechazoModal(false);
    setRobotToReject(null);
    setMotivoRechazo('');
    setSelectedRobot(null);
    loadData();
  });

  // ✅ Protegido: generar código de registro
  const [generarCodigoRegistro, isGenerandoCodigo] = useAsyncAction(async () => {
    if (!miClub) {
      alert('No se pudo obtener información del club');
      return;
    }
    if (miClub.cuposDisponibles <= 0) {
      alert('⚠️ El club ha alcanzado el máximo de participantes. No se pueden generar más códigos.');
      return;
    }
    const response = await api.post('/codigos-registro/generar');
    alert(
      `✅ Código generado exitosamente!\n\n` +
      `🔑 Código: ${response.data.codigo}\n\n` +
      `Comparte este código con los nuevos miembros.\n\n` +
      `📊 Cupos disponibles: ${miClub.cuposDisponibles - 1}/${miClub.maxParticipantes || 16}`
    );
    loadData();
    loadMiClub();
  });

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert('✅ Código copiado: ' + codigo);
  };

  // ✅ Protegido: eliminar código
  const [eliminarCodigo, isEliminandoCodigo] = useAsyncAction(async (codigoId) => {
    if (!confirm('¿Estás seguro de eliminar este código?')) return;
    await api.delete(`/codigos-registro/${codigoId}`);
    alert('✅ Código eliminado');
    loadData();
    loadMiClub();
  });

  const handleAbrirProcesar = (transferencia, tipo, aprobar) => {
    setTransferenciaActual({...transferencia, tipo});
    setProcesarForm({aprobar, motivo: ''});
    setShowProcesarModal(true);
  };

  // ✅ Protegido: confirmar procesamiento de transferencia
  const [handleConfirmarProcesar, isProcessingTransfer] = useAsyncAction(async () => {
    const { tipo } = transferenciaActual;
    if (tipo === 'salida') {
      await transferenciaService.procesarSalida(transferenciaActual.id, procesarForm.aprobar, procesarForm.motivo);
    } else {
      await transferenciaService.procesarIngreso(transferenciaActual.id, procesarForm.aprobar, procesarForm.motivo);
    }
    alert(`✅ ${procesarForm.aprobar ? 'Aprobado' : 'Rechazado'} exitosamente`);
    setShowProcesarModal(false);
    loadData();
    loadMiClub();
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👨‍💼 Panel de Dueño de Club</h1>
        {miClub && (
          <div style={{marginTop: '1rem'}}>
            <p style={{color: 'var(--neon)', fontSize: '1.1rem', fontWeight: '600'}}>🏢 {miClub.nombre}</p>
            <p style={{color: 'var(--muted)', fontSize: '0.9rem'}}>
              📊 Miembros: {miClub.cantidadMiembros}/{miClub.maxParticipantes || 16}
              {miClub.cuposDisponibles > 0 ? ` • ${miClub.cuposDisponibles} cupos disponibles` : ' • Club lleno'}
            </p>
          </div>
        )}
        {isAnyLoading && (
          <span style={{
            display: 'inline-block', padding: '0.3rem 0.8rem',
            background: 'rgba(0,200,255,0.15)', border: '1px solid rgba(0,200,255,0.4)',
            borderRadius: '20px', fontSize: '0.8rem', color: 'var(--neon)', marginTop: '0.5rem'
          }}>
            ⏳ Procesando...
          </span>
        )}
      </div>

      <div className="dashboard-tabs">
        {[
          ['club', '🏢 Mi Club'],
          ['miembros', '👥 Miembros'],
          ['codigos', '🔑 Códigos'],
          ['robots', '🤖 Robots Pendientes'],
          ['transf-salida', '📤 Salidas'],
          ['transf-ingreso', '📥 Ingresos'],
          ['reportes', '📊 Reportes']
        ].map(([tab, label]) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'reportes' && <ClubOwnerReportsSection />}

        {/* MI CLUB */}
        {activeTab === 'club' && miClub && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h2>Información del Club</h2>
              <button className="btn-primary" disabled={isAnyLoading}
                onClick={() => setShowEditClub(!showEditClub)}>
                {showEditClub ? 'Cancelar' : '✏️ Editar Club'}
              </button>
            </div>

            {showEditClub ? (
              <div className="form-card">
                <h3>Editar Información del Club</h3>
                <div className="form-group">
                  <label>Nombre del Club *</label>
                  <input type="text" value={clubForm.nombre}
                    onChange={(e) => setClubForm({...clubForm, nombre: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea value={clubForm.descripcion}
                    onChange={(e) => setClubForm({...clubForm, descripcion: e.target.value})}
                    rows="4" placeholder="Describe tu club de robótica..." />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>Ciudad *</label>
                    <input type="text" value={clubForm.ciudad}
                      onChange={(e) => setClubForm({...clubForm, ciudad: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>País *</label>
                    <input type="text" value={clubForm.pais}
                      onChange={(e) => setClubForm({...clubForm, pais: e.target.value})} required />
                  </div>
                </div>
                <button onClick={handleUpdateClub} className="btn-primary" disabled={isAnyLoading}>
                  {isUpdatingClub ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            ) : (
              <div className="card">
                <h3>{miClub.nombre}</h3>
                <p style={{marginTop: '1rem', color: 'var(--muted)'}}>{miClub.descripcion || 'Sin descripción'}</p>
                <div style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div><p><strong>📍 Ciudad:</strong></p><p style={{color: 'var(--muted)'}}>{miClub.ciudad}</p></div>
                  <div><p><strong>🌎 País:</strong></p><p style={{color: 'var(--muted)'}}>{miClub.pais}</p></div>
                  <div><p><strong>👥 Miembros:</strong></p><p style={{color: 'var(--neon)'}}>{miClub.cantidadMiembros}/{miClub.maxParticipantes || 16}</p></div>
                  <div><p><strong>✨ Cupos:</strong></p><p style={{color: miClub.cuposDisponibles > 0 ? 'var(--success)' : 'var(--error)'}}>{miClub.cuposDisponibles} disponibles</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MIEMBROS */}
        {activeTab === 'miembros' && (
          <div>
            <h2>👥 Miembros del Club ({miembrosClub.length})</h2>
            {loading ? <div className="loading">Cargando...</div> : miembrosClub.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No hay miembros registrados</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Nombre</th><th>Email</th><th>DNI</th><th>Teléfono</th><th>Estado</th><th>Roles</th></tr>
                  </thead>
                  <tbody>
                    {miembrosClub.map(miembro => (
                      <tr key={miembro.id}>
                        <td>{miembro.nombre} {miembro.apellido}</td>
                        <td>{miembro.email}</td>
                        <td>{miembro.dni}</td>
                        <td>{miembro.telefono}</td>
                        <td><span className={`badge badge-${miembro.estado.toLowerCase()}`}>{miembro.estado}</span></td>
                        <td><small>{miembro.roles?.join(', ')}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CÓDIGOS */}
        {activeTab === 'codigos' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h2>🔑 Códigos de Registro</h2>
              <button className="btn-primary" onClick={generarCodigoRegistro}
                disabled={isAnyLoading || miClub?.cuposDisponibles <= 0}>
                {isGenerandoCodigo ? '⏳ Generando...' : '🎲 Generar Nuevo Código'}
              </button>
            </div>

            {miClub?.cuposDisponibles <= 0 && (
              <div className="alert alert-error" style={{marginBottom: '1.5rem'}}>
                ⚠️ <strong>Club lleno</strong> - Has alcanzado el máximo de participantes.
              </div>
            )}

            <div className="alert alert-info" style={{marginBottom: '2rem'}}>
              <strong>ℹ️ Información:</strong> Genera códigos para que nuevos miembros se unan a tu club.
            </div>

            {loading ? <div className="loading">Cargando...</div> : codigos.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No has generado códigos aún.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Código</th><th>Estado</th><th>Fecha Generación</th><th>Usado Por</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {codigos.map(codigo => (
                      <tr key={codigo.id}>
                        <td>
                          <code style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--neon)', padding: '0.3rem 0.6rem', background: 'rgba(0,200,255,0.1)', borderRadius: '4px'}}>
                            {codigo.codigo}
                          </code>
                        </td>
                        <td>
                          <span className={`badge ${codigo.usado ? 'badge-rechazado' : 'badge-aprobado'}`}>
                            {codigo.usado ? 'USADO' : 'DISPONIBLE'}
                          </span>
                        </td>
                        <td>
                          {new Date(codigo.fechaGeneracion).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td>
                          {codigo.usado ? (
                            <>{codigo.usadoPorNombre}<br /><small style={{color: 'var(--muted)'}}>{codigo.usadoPorEmail}</small></>
                          ) : (
                            <span style={{color: 'var(--muted)'}}>-</span>
                          )}
                        </td>
                        <td>
                          <button className="btn-secondary" disabled={isAnyLoading}
                            onClick={() => copiarCodigo(codigo.codigo)}
                            style={{padding: '0.5rem 1rem', marginRight: '0.5rem'}}>
                            📋 Copiar
                          </button>
                          {!codigo.usado && (
                            <button className="btn-secondary" disabled={isAnyLoading}
                              onClick={() => eliminarCodigo(codigo.id)}
                              style={{padding: '0.5rem 1rem', background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}>
                              {isEliminandoCodigo ? '⏳...' : '🗑️ Eliminar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ROBOTS PENDIENTES */}
        {activeTab === 'robots' && (
          <div>
            <h2>🤖 Robots Pendientes de Aprobación</h2>
            {loading ? <div className="loading">Cargando...</div> : robotsPendientes.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No hay robots pendientes</p>
            ) : (
              <div className="data-grid">
                {robotsPendientes.map(robot => (
                  <div key={robot.id} className="card">
                    <h3>{robot.nombre}</h3>
                    <p><strong>Usuario:</strong> {robot.usuarioNombre}</p>
                    <p><strong>Peso:</strong> {robot.peso}g</p>
                    <p><strong>Categoría:</strong> {robot.categoriaNombre}</p>
                    <p style={{fontSize: '0.9rem', color: 'var(--muted)'}}>{robot.descripcion}</p>
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                      <button className="btn-secondary" style={{flex: 1}} disabled={isAnyLoading}
                        onClick={() => handleVerDetallesRobot(robot)}>
                        👁️ Ver Detalles
                      </button>
                      <button className="btn-primary" style={{flex: 1}} disabled={isAnyLoading}
                        onClick={() => handleAprobarRobot(robot.id)}>
                        {isAprobandoRobot ? '⏳...' : '✓ Aprobar'}
                      </button>
                      <button className="btn-secondary" style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        disabled={isAnyLoading} onClick={() => handleAbrirModalRechazo(robot)}>
                        ✗ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSFERENCIAS SALIDA */}
        {activeTab === 'transf-salida' && (
          <div>
            <h2>📤 Solicitudes de Salida ({transferenciasSalida.length})</h2>
            <div className="alert alert-info" style={{marginBottom: '2rem'}}>
              ℹ️ Miembros de tu club solicitando transferirse a otros clubs
            </div>
            {transferenciasSalida.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No hay solicitudes pendientes</p>
            ) : (
              <div className="data-grid">
                {transferenciasSalida.map(sol => (
                  <div key={sol.id} className="card">
                    <h3>{sol.usuarioNombre}</h3>
                    <p style={{color: 'var(--muted)', fontSize: '0.9rem'}}>📧 {sol.usuarioEmail} • 📱 DNI: {sol.usuarioDni}</p>
                    <p style={{marginTop: '1rem'}}><strong>Destino:</strong> {sol.clubDestinoNombre}{sol.clubDestinoCiudad && ` (${sol.clubDestinoCiudad})`}</p>
                    {sol.mensajeUsuario && (
                      <div style={{marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,200,255,0.05)', borderRadius: '8px'}}>
                        <em>"{sol.mensajeUsuario}"</em>
                      </div>
                    )}
                    <p style={{marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)'}}>
                      🤖 {sol.robotsDelUsuario} robot(s) • ⏰ {new Date(sol.fechaSolicitud).toLocaleDateString('es-ES')}
                    </p>
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem'}}>
                      <button className="btn-primary" style={{flex: 1}} disabled={isAnyLoading}
                        onClick={() => handleAbrirProcesar(sol, 'salida', true)}>
                        ✅ Aprobar Salida
                      </button>
                      <button className="btn-secondary" style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        disabled={isAnyLoading} onClick={() => handleAbrirProcesar(sol, 'salida', false)}>
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSFERENCIAS INGRESO */}
        {activeTab === 'transf-ingreso' && (
          <div>
            <h2>📥 Solicitudes de Ingreso ({transferenciasIngreso.length})</h2>
            <div className="alert alert-success" style={{marginBottom: '2rem'}}>
              ✅ Competidores aprobados por sus clubs actuales queriendo unirse al tuyo
            </div>
            {transferenciasIngreso.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>No hay solicitudes pendientes</p>
            ) : (
              <div className="data-grid">
                {transferenciasIngreso.map(sol => (
                  <div key={sol.id} className="card">
                    <h3>{sol.usuarioNombre}</h3>
                    <p style={{color: 'var(--muted)', fontSize: '0.9rem'}}>📧 {sol.usuarioEmail} • 📱 DNI: {sol.usuarioDni}</p>
                    <p style={{marginTop: '1rem'}}><strong>Club Actual:</strong> {sol.clubOrigenNombre}{sol.clubOrigenCiudad && ` (${sol.clubOrigenCiudad})`}</p>
                    {sol.mensajeUsuario && (
                      <div style={{marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,200,255,0.05)', borderRadius: '8px'}}>
                        <em>"{sol.mensajeUsuario}"</em>
                      </div>
                    )}
                    <p style={{marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)'}}>
                      🤖 {sol.robotsDelUsuario} robot(s) • ⏰ {new Date(sol.fechaSolicitud).toLocaleDateString('es-ES')}
                    </p>
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem'}}>
                      <button className="btn-primary" style={{flex: 1}} disabled={isAnyLoading}
                        onClick={() => handleAbrirProcesar(sol, 'ingreso', true)}>
                        ✅ Aprobar Ingreso
                      </button>
                      <button className="btn-secondary" style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        disabled={isAnyLoading} onClick={() => handleAbrirProcesar(sol, 'ingreso', false)}>
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Detalles del Robot */}
      {selectedRobot && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem'}}>
          <div className="form-card" style={{maxWidth: '700px', width: '100%', maxHeight: '80vh', overflow: 'auto'}}>
            <h3>🤖 Detalles del Robot</h3>
            {selectedRobot.fotoRobot && (
              <img src={selectedRobot.fotoRobot} alt={selectedRobot.nombre}
                style={{width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem'}}
                onError={(e) => e.target.style.display = 'none'} />
            )}
            <div style={{marginBottom: '1rem'}}><strong style={{color: 'var(--neon)'}}>Nombre:</strong><p style={{marginTop: '0.5rem'}}>{selectedRobot.nombre}</p></div>
            <div style={{marginBottom: '1rem'}}><strong style={{color: 'var(--neon)'}}>Propietario:</strong><p style={{marginTop: '0.5rem'}}>{selectedRobot.usuarioNombre}</p></div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
              <div><strong style={{color: 'var(--neon)'}}>Peso:</strong><p style={{marginTop: '0.5rem'}}>{selectedRobot.peso}g</p></div>
              <div><strong style={{color: 'var(--neon)'}}>Categoría:</strong><p style={{marginTop: '0.5rem'}}>{selectedRobot.categoriaNombre}</p></div>
            </div>
            <div style={{marginBottom: '1rem'}}><strong style={{color: 'var(--neon)'}}>Descripción:</strong><p style={{marginTop: '0.5rem', color: 'var(--muted)'}}>{selectedRobot.descripcion}</p></div>
            <div style={{marginBottom: '1.5rem'}}>
              <strong style={{color: 'var(--neon)'}}>Especificaciones Técnicas:</strong>
              <div style={{marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,200,255,0.05)', borderRadius: '8px', border: '1px solid rgba(0,200,255,0.2)'}}>
                <p style={{whiteSpace: 'pre-wrap', color: 'var(--muted)'}}>{selectedRobot.especificacionesTecnicas || 'No especificado'}</p>
              </div>
            </div>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn-primary" style={{flex: 1}} disabled={isAnyLoading}
                onClick={() => handleAprobarRobot(selectedRobot.id)}>
                {isAprobandoRobot ? '⏳ Aprobando...' : '✓ Aprobar Robot'}
              </button>
              <button className="btn-secondary" style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                disabled={isAnyLoading}
                onClick={() => { setSelectedRobot(null); handleAbrirModalRechazo(selectedRobot); }}>
                ✗ Rechazar
              </button>
            </div>
            <button className="btn-secondary" style={{width: '100%', marginTop: '1rem'}} disabled={isAnyLoading}
              onClick={() => setSelectedRobot(null)}>
              ← Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Rechazo con motivo */}
      {showRechazoModal && robotToReject && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '2rem'}}>
          <div className="form-card" style={{maxWidth: '600px', width: '100%'}}>
            <h3 style={{color: '#ff3b3b'}}>❌ Rechazar Robot</h3>
            <div className="alert alert-error" style={{marginBottom: '1.5rem'}}>
              <strong>⚠️ Advertencia:</strong> Estás a punto de rechazar el robot "{robotToReject.nombre}" de {robotToReject.usuarioNombre}
            </div>
            <div className="form-group">
              <label>Motivo del Rechazo *</label>
              <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)}
                rows="5" placeholder="Explica por qué se rechaza el robot (ej: peso excedido, no cumple especificaciones, etc.)"
                required disabled={isAnyLoading}
                style={{width: '100%', padding: '0.75rem', border: '1px solid rgba(255,59,59,0.3)', borderRadius: '8px', background: 'rgba(255,59,59,0.05)', color: 'var(--text)', fontSize: '0.95rem'}} />
              <small style={{color: 'var(--muted)'}}>Este mensaje será visible para el competidor</small>
            </div>
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem'}}>
              <button className="btn-secondary" style={{flex: 1}} disabled={isAnyLoading}
                onClick={() => { setShowRechazoModal(false); setRobotToReject(null); setMotivoRechazo(''); }}>
                Cancelar
              </button>
              <button className="btn-primary" style={{flex: 1, background: 'linear-gradient(135deg, #ff3b3b, #d32f2f)', borderColor: '#ff3b3b'}}
                disabled={isAnyLoading || !motivoRechazo.trim()} onClick={handleConfirmarRechazo}>
                {isRechazandoRobot ? '⏳ Rechazando...' : '✓ Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Procesar Transferencia */}
      {showProcesarModal && transferenciaActual && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}>
          <div className="form-card" style={{maxWidth: '600px', width: '100%'}}>
            <h3>{procesarForm.aprobar ? '✅ Aprobar' : '❌ Rechazar'} Transferencia</h3>
            <div className="alert alert-info">
              <strong>{transferenciaActual.usuarioNombre}</strong>
              {transferenciaActual.tipo === 'salida'
                ? ` quiere transferirse a ${transferenciaActual.clubDestinoNombre}`
                : ` viene desde ${transferenciaActual.clubOrigenNombre}`}
            </div>
            {!procesarForm.aprobar && (
              <div className="form-group">
                <label>Motivo del Rechazo *</label>
                <textarea value={procesarForm.motivo} rows="4"
                  onChange={(e) => setProcesarForm({...procesarForm, motivo: e.target.value})}
                  placeholder="¿Por qué rechazas esta transferencia?" disabled={isAnyLoading} required />
              </div>
            )}
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn-secondary" disabled={isAnyLoading}
                onClick={() => setShowProcesarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" disabled={isAnyLoading || (!procesarForm.aprobar && !procesarForm.motivo.trim())}
                onClick={handleConfirmarProcesar}>
                {isProcessingTransfer ? '⏳ Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubOwnerPanel;