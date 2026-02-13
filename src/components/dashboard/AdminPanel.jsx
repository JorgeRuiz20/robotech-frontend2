import { useState, useEffect } from 'react';
import { 
  userService, 
  torneoService, 
  categoriaService,
  clubService
} from '../../services/authService';
import api from '../../services/api';

// ✅ NUEVOS IMPORTS
import EmailResetPanel from '../admin/EmailResetPanel';
import SedePanel from '../admin/SedePanel';
import CountdownTimer from '../admin/CountdownTimer';
import ClubDeshabilitacionPanel from '../admin/ClubDeshabilitacionPanel'; 
import AdminReportsSection from './AdminReportsSection';

function AdminPanel() {
  // ✅ CAMBIO: Agregar 'sedes' como tab inicial o mantener 'torneos'
  const [activeTab, setActiveTab] = useState('torneos');
  const [users, setUsers] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showTorneoForm, setShowTorneoForm] = useState(false);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingTorneo, setEditingTorneo] = useState(null);
  const [editingCategoria, setEditingCategoria] = useState(null);

  // ✅ MODIFICAR: torneoForm para incluir juezResponsableId
  const [torneoForm, setTorneoForm] = useState({
    nombre: '',
    descripcion: '',
    sedeId: '',
    categoriaId: '',
    juezResponsableId: '', // ✅ NUEVO
    activacionAutomatica: false,
    fechaActivacionProgramada: ''
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nombre: '',
    descripcion: '',
    pesoMaximo: '',
    reglasEspecificas: ''
  });

  const [userForm, setUserForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    roles: []
  });

  // ✅ NUEVO: Estado para sedes
  const [sedes, setSedes] = useState([]);
  // ✅ AGREGAR: Estado para jueces
  const [jueces, setJueces] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    // ✅ CAMBIO: Cargar sedes y jueces al montar componente
    loadSedes();
    loadJueces(); // ✅ NUEVO
  }, []);

  // ✅ NUEVA FUNCIÓN: Cargar sedes
  const loadSedes = async () => {
    try {
      const res = await api.get('/sedes');
      setSedes(res.data.filter(s => s.activa));
    } catch (err) {
      console.error('Error cargando sedes:', err);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar lista de jueces
  const loadJueces = async () => {
    try {
      const res = await api.get('/admin/roles/jueces');
      setJueces(res.data);
    } catch (err) {
      console.error('Error cargando jueces:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'usuarios':
          const usersRes = await userService.getAll();
          setUsers(usersRes.data);
          break;
        case 'torneos':
          const torneosRes = await torneoService.getAll();
          setTorneos(torneosRes.data);
          const categoriasForTorneos = await categoriaService.getAll();
          setCategorias(categoriasForTorneos.data);
          await loadSedes(); // ✅ CAMBIO: Cargar sedes también
          break;
        case 'categorias':
          const categoriasRes = await categoriaService.getAll();
          setCategorias(categoriasRes.data);
          break;
        case 'codigos':
          await loadCodigosAndClubs();
          break;
        // ✅ Los nuevos tabs se manejan dentro de sus propios componentes
        case 'emailReset':
        case 'sedes':
          // No necesitan cargar datos aquí
          break;
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCodigosAndClubs = async () => {
    try {
      const [codigosRes, clubsRes] = await Promise.all([
        api.get('/codigos-registro'),
        clubService.getAll()
      ]);
      setCodigos(codigosRes.data);
      setClubs(clubsRes.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // ✅ MODIFICAR: handleCreateTorneo para incluir juez
  const handleCreateTorneo = async (e) => {
    e.preventDefault();
    
    try {
      const requestData = {
        nombre: torneoForm.nombre,
        descripcion: torneoForm.descripcion,
        sedeId: parseInt(torneoForm.sedeId),
        categoriaId: parseInt(torneoForm.categoriaId),
        juezResponsableId: parseInt(torneoForm.juezResponsableId) // ✅ NUEVO
      };

      if (torneoForm.activacionAutomatica && torneoForm.fechaActivacionProgramada) {
        // ✅ CORRECCIÓN: Mantener la hora local de Perú
        // El datetime-local ya da la hora en timezone local del navegador
        // Solo agregamos segundos y milisegundos
        const fechaLocal = torneoForm.fechaActivacionProgramada + ':00.000';
        requestData.fechaActivacionProgramada = fechaLocal;
        requestData.activacionAutomatica = true;
      }

      if (editingTorneo) {
        await torneoService.update(editingTorneo, requestData);
        alert('✅ Torneo actualizado exitosamente');
      } else {
        await torneoService.create(requestData);
        alert('✅ Torneo creado exitosamente');
      }
      
      resetTorneoForm();
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
  };

  // ✅ MODIFICAR: handleEditTorneo para incluir juez
  const handleEditTorneo = (torneo) => {
    setEditingTorneo(torneo.id);
    
    // ✅ CORRECCIÓN: Convertir de UTC del backend a hora local de Perú
    let fechaLocal = '';
    if (torneo.fechaActivacionProgramada) {
      // El backend envía en formato ISO: "2025-01-15T15:00:00"
      // Tomamos solo los primeros 16 caracteres (sin segundos)
      fechaLocal = torneo.fechaActivacionProgramada.slice(0, 16);
    }
    
    setTorneoForm({
      nombre: torneo.nombre,
      descripcion: torneo.descripcion || '',
      sedeId: torneo.sedeId || '',
      categoriaId: torneo.categoriaId,
      juezResponsableId: torneo.juezResponsableId || '', // ✅ NUEVO
      activacionAutomatica: torneo.activacionAutomatica || false,
      fechaActivacionProgramada: fechaLocal
    });
    setShowTorneoForm(true);
  };

  const handleDeleteTorneo = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este torneo?')) return;
    
    try {
      await torneoService.delete(id);
      alert('Torneo eliminado exitosamente');
      loadData();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCambiarEstadoTorneo = async (id, nuevoEstado) => {
    try {
      await torneoService.cambiarEstado(id, nuevoEstado);
      alert('Estado actualizado exitosamente');
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // ✅ MODIFICAR: resetTorneoForm para incluir juez
  const resetTorneoForm = () => {
    setShowTorneoForm(false);
    setEditingTorneo(null);
    setTorneoForm({ 
      nombre: '', 
      descripcion: '', 
      sedeId: '',
      categoriaId: '',
      juezResponsableId: '', // ✅ NUEVO
      activacionAutomatica: false,
      fechaActivacionProgramada: ''
    });
  };

  const handleCreateCategoria = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoria) {
        await categoriaService.update(editingCategoria, categoriaForm);
        alert('Categoría actualizada exitosamente');
      } else {
        await categoriaService.create(categoriaForm);
        alert('Categoría creada exitosamente');
      }
      resetCategoriaForm();
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditCategoria = (cat) => {
    setEditingCategoria(cat.id);
    setCategoriaForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion || '',
      pesoMaximo: cat.pesoMaximo || '',
      reglasEspecificas: cat.reglasEspecificas || ''
    });
    setShowCategoriaForm(true);
  };

  const handleDesactivarCategoria = async (id) => {
    if (!confirm('¿Desactivar esta categoría?')) return;
    
    try {
      await categoriaService.desactivar(id);
      alert('Categoría desactivada');
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetCategoriaForm = () => {
    setShowCategoriaForm(false);
    setEditingCategoria(null);
    setCategoriaForm({ 
      nombre: '', 
      descripcion: '', 
      pesoMaximo: '', 
      reglasEspecificas: '' 
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (userForm.roles.length === 0) {
      alert('Debes seleccionar al menos un rol');
      return;
    }

    try {
      const response = await api.post('/admin/users/create', userForm);
      
      if (response.data.success) {
        const { temporalPassword, email } = response.data;
        
        alert(
          `✅ Usuario creado exitosamente!\n\n` +
          `📧 Email: ${email}\n` +
          `🔑 Contraseña temporal: ${temporalPassword}\n\n` +
          `Se ha enviado un email con las credenciales.`
        );
        
        setShowUserForm(false);
        setUserForm({
          nombre: '',
          apellido: '',
          dni: '',
          email: '',
          telefono: '',
          fechaNacimiento: '',
          roles: []
        });
        loadData();
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRoleChange = (role) => {
    const newRoles = userForm.roles.includes(role)
      ? userForm.roles.filter(r => r !== role)
      : [...userForm.roles, role];
    
    setUserForm({ ...userForm, roles: newRoles });
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert('✅ Código copiado: ' + codigo);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👨‍💼 Panel de Administrador</h1>
        <p>Gestiona todos los aspectos del sistema RoboTech</p>
      </div>

      {/* ✅ CAMBIO: Agregar nuevas pestañas */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'torneos' ? 'active' : ''}
          onClick={() => setActiveTab('torneos')}
        >
          🏆 Torneos
        </button>
        <button 
          className={activeTab === 'sedes' ? 'active' : ''}
          onClick={() => setActiveTab('sedes')}
        >
          🏟️ Sedes
        </button>
        <button 
          className={activeTab === 'categorias' ? 'active' : ''}
          onClick={() => setActiveTab('categorias')}
        >
          📋 Categorías
        </button>
        <button 
          className={activeTab === 'usuarios' ? 'active' : ''}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Usuarios
        </button>
        <button 
          className={activeTab === 'emailReset' ? 'active' : ''}
          onClick={() => setActiveTab('emailReset')}
        >
          📧 Reset Email
        </button>
  <button 
    className={activeTab === 'deshabilitacion' ? 'active' : ''}
    onClick={() => setActiveTab('deshabilitacion')}
  >
    🚫 Deshabilitar Clubs
  </button>
  
  <button 
    className={activeTab === 'codigos' ? 'active' : ''}
    onClick={() => setActiveTab('codigos')}
  >
    🔑 Códigos
  </button>
  <button 
    className={activeTab === 'reportes' ? 'active' : ''}
    onClick={() => setActiveTab('reportes')}
  >
    📊 Reportes
  </button>
</div>

      <div className="dashboard-content">
        {/* ✅ NUEVO: Renderizar EmailResetPanel */}
        {activeTab === 'emailReset' && <EmailResetPanel />}

        {/* ✅ NUEVO: Renderizar SedePanel */}
        {activeTab === 'sedes' && <SedePanel />}

        {activeTab === 'deshabilitacion' && <ClubDeshabilitacionPanel />}

        {/* ✅ NUEVO: Renderizar AdminReportsSection */}
        {activeTab === 'reportes' && <AdminReportsSection />}

        {/* TORNEOS - ✅ ACTUALIZADO con selector de sede y juez */}
        {activeTab === 'torneos' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
              <h2>Gestión de Torneos</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  resetTorneoForm();
                  setShowTorneoForm(!showTorneoForm);
                }}
              >
                {showTorneoForm ? 'Cancelar' : '+ Crear Torneo'}
              </button>
            </div>

            {showTorneoForm && (
              <div className="form-card" style={{marginBottom: '2rem'}}>
                <h3>{editingTorneo ? 'Editar Torneo' : 'Nuevo Torneo'}</h3>
                
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={torneoForm.nombre}
                    onChange={(e) => setTorneoForm({...torneoForm, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={torneoForm.descripcion}
                    onChange={(e) => setTorneoForm({...torneoForm, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Sede *</label>
                  <select
                    value={torneoForm.sedeId}
                    onChange={(e) => setTorneoForm({...torneoForm, sedeId: e.target.value})}
                    required
                  >
                    <option value="">Selecciona una sede</option>
                    {sedes.map(sede => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nombre} - {sede.distrito}
                      </option>
                    ))}
                  </select>
                  {sedes.length === 0 && <small>⚠️ No hay sedes disponibles</small>}
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={torneoForm.categoriaId}
                    onChange={(e) => setTorneoForm({...torneoForm, categoriaId: e.target.value})}
                    required
                  >
                    <option value="">Selecciona categoría</option>
                    {categorias.filter(c => c.activa).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* ✅ NUEVO: Selector de Juez */}
                <div className="form-group">
                  <label>Juez Responsable *</label>
                  <select
                    value={torneoForm.juezResponsableId}
                    onChange={(e) => setTorneoForm({...torneoForm, juezResponsableId: e.target.value})}
                    required
                  >
                    <option value="">Selecciona un juez</option>
                    {jueces.map(juez => (
                      <option key={juez.id} value={juez.id}>
                        {juez.nombre} {juez.apellido} - {juez.email}
                      </option>
                    ))}
                  </select>
                  {jueces.length === 0 && (
                    <small style={{color: 'var(--warning)'}}>
                      ⚠️ No hay jueces disponibles. Crea usuarios con rol JUDGE primero.
                    </small>
                  )}
                </div>

                {/* ✅ NUEVA SECCIÓN: Programación Automática */}
                <div style={{
                  background: 'rgba(0,200,255,0.05)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,200,255,0.2)',
                  marginTop: '1.5rem'
                }}>
                  <div className="form-group">
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                      <input
                        type="checkbox"
                        checked={torneoForm.activacionAutomatica || false}
                        onChange={(e) => setTorneoForm({
                          ...torneoForm, 
                          activacionAutomatica: e.target.checked,
                          fechaActivacionProgramada: e.target.checked ? torneoForm.fechaActivacionProgramada : ''
                        })}
                      />
                      <strong style={{color: 'var(--neon)'}}>⏰ Programar activación automática</strong>
                    </label>
                    <small style={{color: 'var(--muted)', display: 'block', marginTop: '0.5rem'}}>
                      El torneo se activará automáticamente en la fecha programada
                    </small>
                  </div>

                  {torneoForm.activacionAutomatica && (
                    <div className="form-group" style={{marginTop: '1rem'}}>
                      <label>Fecha y Hora de Activación *</label>
                      <input
                        type="datetime-local"
                        value={torneoForm.fechaActivacionProgramada}
                        onChange={(e) => setTorneoForm({...torneoForm, fechaActivacionProgramada: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                      <small style={{color: 'var(--muted)', display: 'block', marginTop: '0.5rem'}}>
                        ℹ️ La fecha debe ser futura. El torneo cambiará a ACTIVO automáticamente
                      </small>
                    </div>
                  )}
                </div>

                <button onClick={handleCreateTorneo} className="btn-primary" style={{marginTop: '1.5rem'}}>
                  {editingTorneo ? '💾 Actualizar' : '✅ Crear'} Torneo
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : (
              <div className="data-grid">
                {torneos.map(torneo => (
                  <div key={torneo.id} className="card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
                      <h3>{torneo.nombre}</h3>
                      <span className={`badge badge-${torneo.estado.toLowerCase()}`}>{torneo.estado}</span>
                    </div>
                    
                    <p style={{color: 'var(--muted)', marginBottom: '0.5rem'}}>{torneo.descripcion}</p>
                    
                    {torneo.sedeNombre && (
                      <p style={{marginBottom: '0.5rem'}}>
                        <strong>🏟️ Sede:</strong> {torneo.sedeNombre}
                      </p>
                    )}
                    
                    <p style={{marginBottom: '0.5rem'}}>
                      <strong>📂 Categoría:</strong> {torneo.categoriaNombre}
                    </p>

                    {/* ✅ NUEVO: Mostrar juez asignado */}
                    {torneo.juezResponsableNombre && (
                      <p style={{marginBottom: '0.5rem'}}>
                        <strong>⚖️ Juez:</strong> {torneo.juezResponsableNombre}
                      </p>
                    )}

                    {/* ✅ NUEVO: Mostrar información de programación */}
                    {torneo.activacionAutomatica && torneo.fechaActivacionProgramada && torneo.estado === 'PENDIENTE' && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(0,200,255,0.05)',
                        border: '1px solid rgba(0,200,255,0.2)',
                        borderRadius: '8px'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                          <span style={{fontSize: '1.2rem'}}>⏰</span>
                          <strong style={{color: 'var(--neon)', fontSize: '0.9rem'}}>Activación Programada</strong>
                        </div>
                        
                        <p style={{fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.8rem'}}>
                          📅 {new Date(torneo.fechaActivacionProgramada).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        <div style={{display: 'flex', justifyContent: 'center'}}>
                          <CountdownTimer targetDate={torneo.fechaActivacionProgramada} />
                        </div>
                      </div>
                    )}
                    
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleEditTorneo(torneo)}
                        style={{flex: 1}}
                      >
                        ✏️ Editar
                      </button>
                      
                      {torneo.estado === 'PENDIENTE' && (
                        <>
                          {!torneo.activacionAutomatica && (
                            <button 
                              className="btn-primary"
                              onClick={() => handleCambiarEstadoTorneo(torneo.id, 'ACTIVO')}
                              style={{flex: 1}}
                            >
                              ▶️ Activar
                            </button>
                          )}
                          <button 
                            className="btn-secondary"
                            onClick={() => handleDeleteTorneo(torneo.id)}
                            style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}
                      
                      {torneo.estado === 'ACTIVO' && (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleCambiarEstadoTorneo(torneo.id, 'FINALIZADO')}
                          style={{flex: 1}}
                        >
                          🏁 Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CATEGORÍAS - SIN EDAD */}
        {activeTab === 'categorias' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
              <h2>Gestión de Categorías</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  resetCategoriaForm();
                  setShowCategoriaForm(!showCategoriaForm);
                }}
              >
                {showCategoriaForm ? 'Cancelar' : '+ Crear Categoría'}
              </button>
            </div>

            {showCategoriaForm && (
              <div className="form-card" style={{marginBottom: '2rem'}}>
                <h3>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={categoriaForm.nombre}
                    onChange={(e) => setCategoriaForm({...categoriaForm, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={categoriaForm.descripcion}
                    onChange={(e) => setCategoriaForm({...categoriaForm, descripcion: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Peso Máximo (g) *</label>
                  <input
                    type="number"
                    value={categoriaForm.pesoMaximo}
                    onChange={(e) => setCategoriaForm({...categoriaForm, pesoMaximo: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reglas Específicas</label>
                  <textarea
                    value={categoriaForm.reglasEspecificas}
                    onChange={(e) => setCategoriaForm({...categoriaForm, reglasEspecificas: e.target.value})}
                    rows="4"
                  />
                </div>

                <button onClick={handleCreateCategoria} className="btn-primary">
                  {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : (
              <div className="data-grid">
                {categorias.map(cat => (
                  <div key={cat.id} className="card">
                    <h3>{cat.nombre}</h3>
                    <p>{cat.descripcion}</p>
                    <p><strong>Peso máx:</strong> {cat.pesoMaximo}g</p>
                    <p><strong>Estado:</strong> <span className={`badge ${cat.activa ? 'badge-aprobado' : 'badge-rechazado'}`}>
                      {cat.activa ? 'ACTIVA' : 'INACTIVA'}
                    </span></p>
                    
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleEditCategoria(cat)}
                        style={{flex: 1}}
                      >
                        ✏️ Editar
                      </button>
                      
                      {cat.activa && (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleDesactivarCategoria(cat.id)}
                          style={{flex: 1, background: 'rgba(255,59,59,0.1)', borderColor: '#ff3b3b'}}
                        >
                          🚫 Desactivar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USUARIOS */}
        {activeTab === 'usuarios' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
              <h2>Gestión de Usuarios</h2>
              <button 
                className="btn-primary"
                onClick={() => setShowUserForm(!showUserForm)}
              >
                {showUserForm ? 'Cancelar' : '+ Crear Usuario'}
              </button>
            </div>

            {showUserForm && (
              <div className="form-card" style={{marginBottom: '2rem'}}>
                <h3>Crear Nuevo Usuario</h3>
                <p style={{color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem'}}>
                  📧 Se generará una contraseña temporal y se enviará por email
                </p>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={userForm.nombre}
                      onChange={(e) => setUserForm({...userForm, nombre: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Apellido *</label>
                    <input
                      type="text"
                      value={userForm.apellido}
                      onChange={(e) => setUserForm({...userForm, apellido: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>DNI *</label>
                    <input
                      type="text"
                      value={userForm.dni}
                      onChange={(e) => setUserForm({...userForm, dni: e.target.value})}
                      required
                      maxLength="8"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      value={userForm.telefono}
                      onChange={(e) => setUserForm({...userForm, telefono: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      value={userForm.fechaNacimiento}
                      onChange={(e) => setUserForm({...userForm, fechaNacimiento: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Roles *</label>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem'}}>
                    {['ROLE_ADMIN', 'ROLE_CLUB_OWNER', 'ROLE_JUDGE', 'ROLE_COMPETITOR', 'ROLE_USER'].map(role => (
                      <label key={role} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <input
                          type="checkbox"
                          checked={userForm.roles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                        />
                        {role.replace('ROLE_', '')}
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={handleCreateUser} className="btn-primary">Crear Usuario</button>
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>DNI</th>
                      <th>Estado</th>
                      <th>Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.nombre} {user.apellido}</td>
                        <td>{user.email}</td>
                        <td>{user.dni}</td>
                        <td>
                          <span className={`badge badge-${user.estado.toLowerCase()}`}>
                            {user.estado}
                          </span>
                        </td>
                        <td>{user.roles?.join(', ')}</td>
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
            <h2>🔑 Códigos de Registro</h2>
            
            <div className="alert alert-info" style={{marginBottom: '2rem'}}>
              <strong>ℹ️ Información:</strong> Los códigos son generados por los Club Owners.
            </div>

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Club</th>
                      <th>Estado</th>
                      <th>Generado Por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codigos.map(codigo => (
                      <tr key={codigo.id}>
                        <td><code>{codigo.codigo}</code></td>
                        <td>{codigo.clubNombre}</td>
                        <td>
                          <span className={`badge ${codigo.usado ? 'badge-rechazado' : 'badge-aprobado'}`}>
                            {codigo.usado ? 'USADO' : 'DISPONIBLE'}
                          </span>
                        </td>
                        <td>{codigo.generadoPorNombre}</td>
                        <td>
                          <button 
                            className="btn-secondary"
                            onClick={() => copiarCodigo(codigo.codigo)}
                          >
                            📋 Copiar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;