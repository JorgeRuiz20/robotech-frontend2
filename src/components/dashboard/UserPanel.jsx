import { useState, useEffect } from 'react';
import { clubService, transferenciaService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

function UserPanel() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal: solicitar ingreso
  const [showModal, setShowModal] = useState(false);
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Alerta de aprobación
  const [alertaAprobada, setAlertaAprobada] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Cada 10 segundos verifica si ya se aprobó la solicitud (para auto-redirigir)
  useEffect(() => {
    const interval = setInterval(() => {
      verificarAprobacion();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clubs') {
        const res = await clubService.getAll();
        // Solo mostrar clubs activos
        setClubs(res.data.filter(c => c.activa !== false));
      } else if (activeTab === 'solicitudes') {
        const res = await transferenciaService.getMisSolicitudes();
        setSolicitudes(res.data);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verifica si el backend ya asignó ROLE_COMPETITOR (solicitud aprobada)
  const verificarAprobacion = async () => {
    try {
      // Hacemos un GET al endpoint que devuelve las solicitudes del usuario
      // Si una ya está APROBADA, significa que el backend ya le dio ROLE_COMPETITOR
      const res = await transferenciaService.getMisSolicitudes();
      const aprobada = res.data.find(s => s.estado === 'APROBADA');
      if (aprobada) {
        setAlertaAprobada(true);
        setSolicitudes(res.data);
      }
    } catch (err) {
      // silencio — puede que no esté logueado o red floja
    }
  };

  // Cuando el usuario hace clic en "Ir al Panel de Competidor" después de ser aprobado,
  // reautenticamos para refrescar el token con los nuevos roles
  const handleRefrescarRoles = async () => {
    try {
      // El token actual ya tiene permisos actualizados en el backend,
      // pero el localStorage tiene los roles viejos.
      // Hacemos una llamada para obtener los datos actualizados del usuario.
      const res = await api.get('/auth/me');
      // Actualizar localStorage manualmente con los nuevos roles
      const usuarioActualizado = {
        ...user,
        roles: res.data.roles
      };
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));
      // Forzar recarga de la página para que AuthContext re-leva los nuevos roles
      window.location.reload();
    } catch (err) {
      // Si no existe /auth/me, el plan B es simplemente recargar
      // y pedir al usuario que haga re-login
      alert(
        '✅ ¡Tu solicitud fue aprobada!\n\n' +
        'Por favor, cierra sesión y vuelve a ingresar para ver tu nuevo panel de Competidor.'
      );
    }
  };

  // --- Modal: abrir solicitud ---
  const handleAbrirSolicitud = (club) => {
    // Verificar si el usuario ya tiene una solicitud pendiente para este club
    const pendiente = solicitudes.find(
      s => s.clubDestinoId === club.id && (s.estado === 'PENDIENTE_INGRESO' || s.estado === 'PENDIENTE_SALIDA')
    );
    if (pendiente) {
      alert('⚠️ Ya tienes una solicitud pendiente. Solo puedes tener una solicitud activa a la vez.');
      return;
    }
    setClubSeleccionado(club);
    setMensaje('');
    setShowModal(true);
  };

  // --- Modal: enviar solicitud ---
  const handleEnviarSolicitud = async () => {
    if (!clubSeleccionado) return;
    setEnviando(true);
    try {
      await transferenciaService.solicitarIngresoSinClub(clubSeleccionado.id, mensaje);
      alert('✅ ¡Solicitud enviada! El club owner la revisará pronto.');
      setShowModal(false);
      setClubSeleccionado(null);
      setMensaje('');
      // Refrescar solicitudes
      const res = await transferenciaService.getMisSolicitudes();
      setSolicitudes(res.data);
      // Si estamos en la pestaña de clubs, también recargar para que se oculte el botón
      if (activeTab === 'clubs') loadData();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setEnviando(false);
    }
  };

  // --- Helpers de UI ---
  const getEstadoLabel = (estado) => {
    const labels = {
      'PENDIENTE_SALIDA': 'Pendiente Salida',
      'PENDIENTE_INGRESO': 'Pendiente Ingreso',
      'APROBADA': 'Aprobada ✅',
      'RECHAZADA_SALIDA': 'Rechazada (Salida)',
      'RECHAZADA_INGRESO': 'Rechazada (Ingreso)',
      'CANCELADA': 'Cancelada'
    };
    return labels[estado] || estado;
  };

  const getBadgeClass = (estado) => {
    if (estado === 'APROBADA') return 'badge-aprobado';
    if (estado.includes('RECHAZADA')) return 'badge-rechazado';
    if (estado === 'CANCELADA') return 'badge-rechazado';
    return 'badge-pendiente';
  };

  // Verificar si el usuario tiene solicitud pendiente (cualquier club)
  const tienesSolicitudPendiente = solicitudes.some(
    s => s.estado === 'PENDIENTE_INGRESO' || s.estado === 'PENDIENTE_SALIDA'
  );

  // ======================== RENDER ========================
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👤 Panel de Usuario</h1>
        <p>Solicita ingreso a un club para competir en torneos de RoboTech</p>
      </div>

      {/* Alerta: solicitud aprobada → puede ir al panel de competidor */}
      {alertaAprobada && (
        <div style={{
          background: 'rgba(0,255,100,0.1)',
          border: '1px solid rgba(0,255,100,0.4)',
          borderRadius: '10px',
          padding: '1.2rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <p style={{ color: '#00ff64', fontWeight: '600', margin: 0 }}>
              🎉 ¡Tu solicitud fue aprobada! Ya eres competidor.
            </p>
            <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
              Recarga la página para acceder a tu nuevo panel de Competidor.
            </p>
          </div>
          <button className="btn-primary" onClick={handleRefrescarRoles} style={{ whiteSpace: 'nowrap' }}>
            🏆 Ir al Panel de Competidor
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'clubs' ? 'active' : ''}
          onClick={() => setActiveTab('clubs')}
        >
          🏛️ Clubs Disponibles
        </button>
        <button
          className={activeTab === 'solicitudes' ? 'active' : ''}
          onClick={() => setActiveTab('solicitudes')}
        >
          📋 Mis Solicitudes
          {solicitudes.filter(s => s.estado === 'PENDIENTE_INGRESO').length > 0 && (
            <span style={{
              background: '#ff9800',
              color: '#000',
              borderRadius: '10px',
              padding: '1px 7px',
              fontSize: '0.75rem',
              marginLeft: '6px',
              fontWeight: '700'
            }}>
              {solicitudes.filter(s => s.estado === 'PENDIENTE_INGRESO').length}
            </span>
          )}
        </button>
      </div>

      <div className="dashboard-content">

        {/* ============ TAB: CLUBS DISPONIBLES ============ */}
        {activeTab === 'clubs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Clubs disponibles</h2>
              {tienesSolicitudPendiente && (
                <span style={{
                  background: 'rgba(255,152,0,0.15)',
                  color: '#ff9800',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(255,152,0,0.3)'
                }}>
                  ⏳ Tienes una solicitud pendiente
                </span>
              )}
            </div>

            {loading ? (
              <div className="loading">Cargando clubs...</div>
            ) : clubs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                <p style={{ color: 'var(--muted)' }}>No hay clubs disponibles en el momento.</p>
              </div>
            ) : (
              <div className="data-grid">
                {clubs.map(club => {
                  // Verificar si ya tiene solicitud pendiente/aprobada para este club
                  const solicitudExistente = solicitudes.find(
                    s => s.clubDestinoId === club.id &&
                         (s.estado === 'PENDIENTE_INGRESO' || s.estado === 'APROBADA')
                  );

                  return (
                    <div key={club.id} className="card" style={{ position: 'relative' }}>
                      {/* Header del card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.8rem' }}>
                        <h3 style={{ margin: 0 }}>{club.nombre}</h3>
                        <span className={`badge ${club.cuposDisponibles > 0 ? 'badge-aprobado' : 'badge-rechazado'}`}>
                          {club.cuposDisponibles > 0 ? `${club.cuposDisponibles} cupos` : 'Lleno'}
                        </span>
                      </div>

                      {/* Info del club */}
                      {club.descripcion && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {club.descripcion}
                        </p>
                      )}
                      {club.ciudad && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          📍 {club.ciudad}{club.pais ? `, ${club.pais}` : ''}
                        </p>
                      )}
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        👥 {club.cantidadMiembros || 0} miembros
                        {club.maxParticipantes && ` / ${club.maxParticipantes} máximo`}
                      </p>

                      {/* Botón de acción */}
                      <div style={{ marginTop: '1rem' }}>
                        {solicitudExistente ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            background: solicitudExistente.estado === 'APROBADA'
                              ? 'rgba(0,255,100,0.1)'
                              : 'rgba(255,152,0,0.1)',
                            border: `1px solid ${solicitudExistente.estado === 'APROBADA' ? 'rgba(0,255,100,0.3)' : 'rgba(255,152,0,0.3)'}`,
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            color: solicitudExistente.estado === 'APROBADA' ? '#00ff64' : '#ff9800'
                          }}>
                            {solicitudExistente.estado === 'APROBADA' ? '✅ Aprobada' : '⏳ Solicitud pendiente'}
                          </span>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={() => handleAbrirSolicitud(club)}
                            disabled={tienesSolicitudPendiente || club.cuposDisponibles <= 0}
                            style={{ width: '100%' }}
                          >
                            {club.cuposDisponibles <= 0
                              ? '❌ Sin cupos'
                              : tienesSolicitudPendiente
                                ? '⏳ Ya tienes solicitud activa'
                                : '📤 Solicitar Ingreso'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ TAB: MIS SOLICITUDES ============ */}
        {activeTab === 'solicitudes' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Mis Solicitudes de Ingreso</h2>

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : solicitudes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                <h3>📋 No tienes solicitudes</h3>
                <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                  Ve a la pestaña de "Clubs Disponibles" y solicita ingreso a un club.
                </p>
                <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('clubs')}>
                  🏛️ Ver Clubs
                </button>
              </div>
            ) : (
              <div className="data-grid">
                {solicitudes.map(sol => (
                  <div key={sol.id} className="card">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}>
                        {sol.clubDestinoNombre || 'Club desconocido'}
                      </h3>
                      <span className={`badge ${getBadgeClass(sol.estado)}`}>
                        {getEstadoLabel(sol.estado)}
                      </span>
                    </div>

                    {/* Detalles */}
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      📅 Solicitado: {sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString() : '—'}
                    </p>

                    {sol.clubDestinoNombre && sol.clubDestinoCiudad && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        📍 {sol.clubDestinoCiudad}
                      </p>
                    )}

                    {sol.mensajeUsuario && (
                      <div style={{
                        background: 'rgba(0,200,255,0.05)',
                        border: '1px solid rgba(0,200,255,0.15)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.8rem',
                        marginTop: '0.8rem',
                        fontSize: '0.88rem'
                      }}>
                        <strong style={{ color: 'var(--neon)', fontSize: '0.8rem' }}>Tu mensaje:</strong>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text)' }}>{sol.mensajeUsuario}</p>
                      </div>
                    )}

                    {/* Motivo de rechazo si existe */}
                    {sol.motivoRechazo && (
                      <div style={{
                        background: 'rgba(255,59,59,0.08)',
                        border: '1px solid rgba(255,59,59,0.2)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.8rem',
                        marginTop: '0.8rem',
                        fontSize: '0.88rem'
                      }}>
                        <strong style={{ color: '#ff3b3b', fontSize: '0.8rem' }}>Motivo de rechazo:</strong>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text)' }}>{sol.motivoRechazo}</p>
                      </div>
                    )}

                    {/* Si fue aprobada: botón para ir al panel */}
                    {sol.estado === 'APROBADA' && (
                      <button
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        onClick={handleRefrescarRoles}
                      >
                        🏆 Ir al Panel de Competidor
                      </button>
                    )}

                    {/* Si está pendiente: puede cancelarla */}
                    {(sol.estado === 'PENDIENTE_INGRESO' || sol.estado === 'PENDIENTE_SALIDA') && (
                      <button
                        className="btn-secondary"
                        style={{
                          marginTop: '1rem',
                          width: '100%',
                          background: 'rgba(255,59,59,0.08)',
                          borderColor: 'rgba(255,59,59,0.3)',
                          color: '#ff3b3b'
                        }}
                        onClick={async () => {
                          if (!confirm('¿Cancelar esta solicitud?')) return;
                          try {
                            await transferenciaService.cancelar(sol.id);
                            alert('✅ Solicitud cancelada');
                            loadData();
                          } catch (err) {
                            alert('❌ Error: ' + (err.response?.data?.message || err.message));
                          }
                        }}
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

      {/* ============ MODAL: SOLICITAR INGRESO ============ */}
      {showModal && clubSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>📤 Solicitar Ingreso</h3>
              <button
                className="btn-secondary"
                style={{ padding: '0.3rem 0.7rem', fontSize: '1rem' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Info del club seleccionado */}
            <div style={{
              background: 'rgba(0,200,255,0.06)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontWeight: '600', margin: '0 0 0.3rem', color: 'var(--neon)' }}>
                🏛️ {clubSeleccionado.nombre}
              </p>
              {clubSeleccionado.ciudad && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.2rem 0' }}>
                  📍 {clubSeleccionado.ciudad}{clubSeleccionado.pais ? `, ${clubSeleccionado.pais}` : ''}
                </p>
              )}
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.2rem 0' }}>
                👥 {clubSeleccionado.cantidadMiembros || 0} miembros · {clubSeleccionado.cuposDisponibles || 0} cupos libres
              </p>
            </div>

            {/* Campo de mensaje */}
            <div className="form-group">
              <label>Mensaje (opcional)</label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows="3"
                placeholder="Ej: Me interesa unirme porque tengo experiencia en robótica competitiva..."
              />
              <small>El club owner verá este mensaje al revisar tu solicitud.</small>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleEnviarSolicitud}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : '✅ Enviar Solicitud'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPanel;