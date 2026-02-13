import { useState, useEffect } from 'react';
import { clubDeshabilitacionService, clubService } from '../../services/authService';
import './ClubDeshabilitacionPanel.css';

function ClubDeshabilitacionPanel() {
  const [activeStep, setActiveStep] = useState('listar');
  const [deshabilitaciones, setDeshabilitaciones] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [selectedDeshabilitacion, setSelectedDeshabilitacion] = useState(null);
  const [loading, setLoading] = useState(false);

  // Formulario para deshabilitar club
  const [formDeshabilitar, setFormDeshabilitar] = useState({
    clubId: '',
    motivo: '',
    diasLimite: 7
  });

  // Formulario para solicitudes masivas
  const [clubDestinoId, setClubDestinoId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deshabRes, clubsRes] = await Promise.all([
        clubDeshabilitacionService.listar(),
        clubService.getAll()
      ]);
      
      setDeshabilitaciones(deshabRes.data);
      setClubs(clubsRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // 🚫 PASO 1: Deshabilitar club
  const handleDeshabilitar = async (e) => {
    e.preventDefault();
    
    if (!confirm('⚠️ ¿Estás seguro de deshabilitar este club? Se notificará a todos los miembros.')) {
      return;
    }

    try {
      const response = await clubDeshabilitacionService.deshabilitar(
        formDeshabilitar.clubId,
        formDeshabilitar.motivo,
        formDeshabilitar.diasLimite
      );

      if (response.data.success) {
        alert('✅ Club marcado para deshabilitación. Notificaciones enviadas a los miembros.');
        setFormDeshabilitar({ clubId: '', motivo: '', diasLimite: 7 });
        loadData();
        setActiveStep('listar');
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // 📤 PASO 2: Enviar solicitudes masivas
  const handleEnviarSolicitudesMasivas = async () => {
    if (!selectedDeshabilitacion || !clubDestinoId) {
      alert('⚠️ Selecciona un club destino');
      return;
    }

    if (!confirm(`¿Enviar solicitudes de transferencia masivas al club seleccionado?`)) {
      return;
    }

    try {
      const response = await clubDeshabilitacionService.enviarSolicitudesMasivas(
        selectedDeshabilitacion.id,
        clubDestinoId
      );

      if (response.data.success) {
        const { solicitudesCreadas } = response.data.data;
        alert(`✅ ${solicitudesCreadas} solicitudes enviadas exitosamente`);
        setClubDestinoId('');
        loadDeshabilitacionDetalle(selectedDeshabilitacion.id);
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // ⬇️ PASO 3: Degradar miembros restantes
  const handleDegradadarRestantes = async () => {
    if (!selectedDeshabilitacion) return;

    if (!confirm('⚠️ ADVERTENCIA: Los miembros no reubicados perderán su rol de COMPETIDOR. ¿Continuar?')) {
      return;
    }

    try {
      const response = await clubDeshabilitacionService.degradarMiembrosRestantes(
        selectedDeshabilitacion.id
      );

      if (response.data.success) {
        const { degradados } = response.data.data;
        alert(`✅ ${degradados} miembros degradados. Club deshabilitado.`);
        loadData();
        setSelectedDeshabilitacion(null);
        setActiveStep('listar');
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // ❌ Cancelar deshabilitación
  const handleCancelar = async (deshabilitacionId) => {
    if (!confirm('¿Cancelar esta deshabilitación?')) return;

    try {
      await clubDeshabilitacionService.cancelar(deshabilitacionId);
      alert('✅ Deshabilitación cancelada');
      loadData();
      setSelectedDeshabilitacion(null);
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cargar detalle de deshabilitación
  const loadDeshabilitacionDetalle = async (id) => {
    try {
      const response = await clubDeshabilitacionService.getEstado(id);
      setSelectedDeshabilitacion(response.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Renderizar badge según estado
  const renderEstadoBadge = (estado) => {
    const colors = {
      'PENDIENTE': 'warning',
      'PROCESANDO': 'info',
      'COMPLETADA': 'success',
      'CANCELADA': 'danger'
    };
    return <span className={`badge badge-${colors[estado]}`}>{estado}</span>;
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="deshabilitacion-panel">
      <div className="panel-header">
        <h2>🚫 Deshabilitación de Clubs</h2>
        <p>Gestiona el proceso de deshabilitación de clubs y reubicación de miembros</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeStep === 'listar' ? 'active' : ''}
          onClick={() => setActiveStep('listar')}
        >
          📋 Deshabilitaciones
        </button>
        <button 
          className={activeStep === 'nueva' ? 'active' : ''}
          onClick={() => setActiveStep('nueva')}
        >
          🚫 Nueva Deshabilitación
        </button>
      </div>

      {/* PASO 1: Nueva Deshabilitación */}
      {activeStep === 'nueva' && (
        <div className="form-card">
          <h3>🚫 Deshabilitar Club</h3>
          <p className="text-muted">
            Esto iniciará el proceso de deshabilitación. Los miembros serán notificados por email.
          </p>

          <form onSubmit={handleDeshabilitar}>
            <div className="form-group">
              <label>Club a Deshabilitar *</label>
              <select
                value={formDeshabilitar.clubId}
                onChange={(e) => setFormDeshabilitar({...formDeshabilitar, clubId: e.target.value})}
                required
              >
                <option value="">Selecciona un club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.nombre} - {club.cantidadMiembros} miembros
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Motivo de Deshabilitación *</label>
              <textarea
                value={formDeshabilitar.motivo}
                onChange={(e) => setFormDeshabilitar({...formDeshabilitar, motivo: e.target.value})}
                rows="4"
                placeholder="Explica por qué se deshabilita el club..."
                required
              />
            </div>

            <div className="form-group">
              <label>Días Límite para Acción</label>
              <input
                type="number"
                value={formDeshabilitar.diasLimite}
                onChange={(e) => setFormDeshabilitar({...formDeshabilitar, diasLimite: e.target.value})}
                min="1"
                max="30"
              />
              <small>Días que los miembros tienen para solicitar transferencia</small>
            </div>

            <button type="submit" className="btn-primary">
              🚫 Iniciar Deshabilitación
            </button>
          </form>
        </div>
      )}

      {/* Lista de Deshabilitaciones */}
      {activeStep === 'listar' && (
        <div>
          {deshabilitaciones.length === 0 ? (
            <div className="empty-state">
              <p>No hay deshabilitaciones registradas</p>
            </div>
          ) : (
            <div className="data-grid">
              {deshabilitaciones.map(desh => (
                <div key={desh.id} className="card deshabilitacion-card">
                  <div className="card-header">
                    <h3>{desh.clubNombre}</h3>
                    {renderEstadoBadge(desh.estado)}
                  </div>

                  <div className="card-body">
                    <p><strong>📅 Fecha:</strong> {new Date(desh.fechaDeshabilitacion).toLocaleDateString()}</p>
                    <p><strong>⏰ Límite:</strong> {new Date(desh.fechaLimiteAccion).toLocaleDateString()}</p>
                    <p><strong>👥 Total Miembros:</strong> {desh.totalMiembros}</p>
                    
                    <div className="progress-section">
                      <p><strong>📊 Progreso:</strong></p>
                      <ul>
                        <li>✅ Reubicados: {desh.miembrosReubicados || 0}</li>
                        <li>⬇️ Degradados: {desh.miembrosDegradados || 0}</li>
                        <li>⏳ Pendientes: {desh.miembrosPendientes || 0}</li>
                      </ul>
                    </div>

                    <p><strong>📝 Motivo:</strong></p>
                    <p className="text-muted">{desh.motivo}</p>

                    {desh.diasRestantes !== undefined && (
                      <div className={`countdown ${desh.limiteExpirado ? 'expired' : ''}`}>
                        {desh.limiteExpirado ? (
                          <span>⏰ Límite expirado</span>
                        ) : (
                          <span>⏱️ {desh.diasRestantes} días restantes</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    {desh.estado === 'PENDIENTE' && (
                      <>
                        <button 
                          className="btn-primary"
                          onClick={() => {
                            setSelectedDeshabilitacion(desh);
                            setActiveStep('gestionar');
                          }}
                        >
                          ⚙️ Gestionar
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleCancelar(desh.id)}
                        >
                          ❌ Cancelar
                        </button>
                      </>
                    )}
                    
                    {desh.estado === 'PROCESANDO' && (
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          setSelectedDeshabilitacion(desh);
                          setActiveStep('gestionar');
                        }}
                      >
                        ⚙️ Continuar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gestión Detallada */}
      {activeStep === 'gestionar' && selectedDeshabilitacion && (
        <div>
          <button 
            className="btn-secondary"
            onClick={() => setActiveStep('listar')}
            style={{marginBottom: '1rem'}}
          >
            ← Volver a la lista
          </button>

          <div className="form-card">
            <h3>⚙️ Gestión de {selectedDeshabilitacion.clubNombre}</h3>
            {renderEstadoBadge(selectedDeshabilitacion.estado)}

            <div className="info-section">
              <h4>📊 Estado Actual</h4>
              <ul>
                <li>Total miembros: {selectedDeshabilitacion.totalMiembros}</li>
                <li>Reubicados: {selectedDeshabilitacion.miembrosReubicados || 0}</li>
                <li>Degradados: {selectedDeshabilitacion.miembrosDegradados || 0}</li>
                <li>Pendientes: {selectedDeshabilitacion.miembrosPendientes || 0}</li>
              </ul>
            </div>

            {/* PASO 2: Solicitudes Masivas */}
            {(selectedDeshabilitacion.estado === 'PENDIENTE' || 
              selectedDeshabilitacion.estado === 'PROCESANDO') && (
              <div className="action-section">
                <h4>📤 PASO 2: Enviar Solicitudes Masivas</h4>
                <p className="text-muted">
                  Crea solicitudes de transferencia para todos los miembros sin transferencia
                </p>

                <div className="form-group">
                  <label>Club Destino *</label>
                  <select
                    value={clubDestinoId}
                    onChange={(e) => setClubDestinoId(e.target.value)}
                  >
                    <option value="">Selecciona un club</option>
                    {clubs
                      .filter(c => c.id !== selectedDeshabilitacion.clubId)
                      .map(club => (
                        <option key={club.id} value={club.id}>
                          {club.nombre} - {club.cuposDisponibles || 0} cupos disponibles
                        </option>
                      ))}
                  </select>
                </div>

                <button 
                  className="btn-primary"
                  onClick={handleEnviarSolicitudesMasivas}
                  disabled={!clubDestinoId}
                >
                  📤 Enviar Solicitudes Masivas
                </button>
              </div>
            )}

            {/* PASO 3: Degradar Restantes */}
            {selectedDeshabilitacion.miembrosPendientes > 0 && (
              <div className="action-section warning">
                <h4>⬇️ PASO 3: Degradar Miembros Restantes</h4>
                <p className="text-muted">
                  Los miembros no reubicados perderán el rol COMPETITOR
                </p>
                <p><strong>Miembros a degradar:</strong> {selectedDeshabilitacion.miembrosPendientes}</p>

                <button 
                  className="btn-danger"
                  onClick={handleDegradadarRestantes}
                >
                  ⬇️ Degradar y Deshabilitar Club
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDeshabilitacionPanel;