import { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * ✅ COMPONENTE: Gestión de Sedes
 * 
 * UBICACIÓN:
 * - Crear archivo: src/components/admin/SedePanel.jsx
 * - Importar en: src/components/dashboard/AdminPanel.jsx
 * - Agregar como nueva pestaña "🏟️ Sedes"
 */

function SedePanel() {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSede, setEditingSede] = useState(null);
  const [sedeForm, setSedeForm] = useState({
    nombre: '',
    direccion: '',
    distrito: '',
    referencia: '',
    capacidadMaxima: '',
    tieneEstacionamiento: false
  });

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sedes');
      setSedes(response.data);
    } catch (err) {
      console.error('Error cargando sedes:', err);
      alert('Error al cargar sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const sedeData = {
        ...sedeForm,
        capacidadMaxima: parseInt(sedeForm.capacidadMaxima)
      };

      if (editingSede) {
        await api.put(`/sedes/${editingSede}`, sedeData);
        alert('✅ Sede actualizada exitosamente');
      } else {
        await api.post('/sedes', sedeData);
        alert('✅ Sede creada exitosamente');
      }
      
      resetForm();
      loadSedes();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (sede) => {
    setEditingSede(sede.id);
    setSedeForm({
      nombre: sede.nombre,
      direccion: sede.direccion || '',
      distrito: sede.distrito || '',
      referencia: sede.referencia || '',
      capacidadMaxima: sede.capacidadMaxima || '',
      tieneEstacionamiento: sede.tieneEstacionamiento || false
    });
    setShowForm(true);
  };

  const handleDesactivar = async (id) => {
    if (!confirm('¿Desactivar esta sede?')) return;
    
    try {
      await api.put(`/sedes/${id}/desactivar`);
      alert('✅ Sede desactivada');
      loadSedes();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar permanentemente esta sede? Esta acción no se puede deshacer.')) return;
    
    try {
      await api.delete(`/sedes/${id}`);
      alert('✅ Sede eliminada');
      loadSedes();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSede(null);
    setSedeForm({
      nombre: '',
      direccion: '',
      distrito: '',
      referencia: '',
      capacidadMaxima: '',
      tieneEstacionamiento: false
    });
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
        <div>
          <h2>🏟️ Gestión de Sedes</h2>
          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Administra las ubicaciones donde se realizarán los torneos
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva Sede'}
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{marginBottom: '2rem'}}>
          <h3>{editingSede ? 'Editar Sede' : 'Nueva Sede'}</h3>
          
          <div className="form-group">
            <label>Nombre de la Sede *</label>
            <input
              type="text"
              value={sedeForm.nombre}
              onChange={(e) => setSedeForm({...sedeForm, nombre: e.target.value})}
              placeholder="Ej: Estadio Nacional"
              required
            />
          </div>

          <div className="form-group">
            <label>Dirección *</label>
            <input
              type="text"
              value={sedeForm.direccion}
              onChange={(e) => setSedeForm({...sedeForm, direccion: e.target.value})}
              placeholder="Ej: Av. José Díaz 1350"
              required
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <div className="form-group">
              <label>Distrito *</label>
              <input
                type="text"
                value={sedeForm.distrito}
                onChange={(e) => setSedeForm({...sedeForm, distrito: e.target.value})}
                placeholder="Ej: Miraflores"
                required
              />
            </div>

            <div className="form-group">
              <label>Capacidad Máxima *</label>
              <input
                type="number"
                value={sedeForm.capacidadMaxima}
                onChange={(e) => setSedeForm({...sedeForm, capacidadMaxima: e.target.value})}
                placeholder="Ej: 200"
                required
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Punto de Referencia</label>
            <input
              type="text"
              value={sedeForm.referencia}
              onChange={(e) => setSedeForm({...sedeForm, referencia: e.target.value})}
              placeholder="Ej: Frente al Parque Kennedy"
            />
          </div>

          <div className="form-group">
            <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={sedeForm.tieneEstacionamiento}
                onChange={(e) => setSedeForm({...sedeForm, tieneEstacionamiento: e.target.checked})}
              />
              ¿Tiene estacionamiento?
            </label>
          </div>

          <button onClick={handleSubmit} className="btn-primary">
            {editingSede ? '💾 Actualizar Sede' : '✅ Crear Sede'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="data-grid">
          {sedes.map(sede => (
            <div key={sede.id} className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem'}}>
                <h3 style={{margin: 0}}>{sede.nombre}</h3>
                <span className={`badge ${sede.activa ? 'badge-aprobado' : 'badge-rechazado'}`}>
                  {sede.activa ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>
              
              <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                📍 {sede.direccion}
              </p>
              <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                🏙️ {sede.distrito}
              </p>
              {sede.referencia && (
                <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                  ℹ️ {sede.referencia}
                </p>
              )}
              <p style={{color: 'var(--neon)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                👥 Capacidad: {sede.capacidadMaxima} personas
              </p>
              <p style={{color: 'var(--muted)', fontSize: '0.9rem'}}>
                {sede.tieneEstacionamiento ? '🅿️ Con estacionamiento' : '❌ Sin estacionamiento'}
              </p>
              
              <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                <button 
                  className="btn-secondary"
                  onClick={() => handleEdit(sede)}
                  style={{flex: 1}}
                >
                  ✏️ Editar
                </button>
                
                {sede.activa && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleDesactivar(sede.id)}
                    style={{flex: 1, background: 'rgba(255,152,0,0.1)', borderColor: '#ff9800'}}
                  >
                    🚫 Desactivar
                  </button>
                )}
                
                {!sede.activa && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleEliminar(sede.id)}
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
  );
}

export default SedePanel;