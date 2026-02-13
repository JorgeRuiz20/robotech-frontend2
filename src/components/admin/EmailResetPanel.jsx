import { useState } from 'react';
import api from '../../services/api';

/**
 * ✅ COMPONENTE: Restablecimiento de Email por Admin
 * 
 * UBICACIÓN: 
 * - Crear archivo: src/components/admin/EmailResetPanel.jsx
 * - Importar en: src/components/dashboard/AdminPanel.jsx
 * - Agregar como nueva pestaña en el tab menu
 */

function EmailResetPanel() {
  const [searchDNI, setSearchDNI] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSearchUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFoundUser(null);
    setLoading(true);

    try {
      const response = await api.get(`/admin/email-reset/buscar/${searchDNI}`);
      
      if (response.data.success) {
        setFoundUser(response.data.usuario);
        setNewEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Usuario no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/admin/email-reset/restablecer', {
        dni: foundUser.dni,
        nuevoEmail: newEmail
      });

      if (response.data.success) {
        setMessage(
          `✅ Email restablecido exitosamente!\n\n` +
          `📧 Nuevo email: ${response.data.nuevoEmail}\n` +
          `🔑 Contraseña temporal: ${response.data.temporalPassword}\n\n` +
          `Se ha enviado un email con las nuevas credenciales.`
        );
        
        setTimeout(() => {
          setFoundUser(null);
          setSearchDNI('');
          setNewEmail('');
          setMessage('');
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h2>📧 Restablecimiento de Email</h2>
          <p style={{color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Busca un usuario por DNI y cambia su email con contraseña temporal
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{marginBottom: '1.5rem'}}>
          {error}
        </div>
      )}
      
      {message && (
        <div className="alert alert-success" style={{marginBottom: '1.5rem', whiteSpace: 'pre-line'}}>
          {message}
        </div>
      )}

      <div className="form-card" style={{marginBottom: '2rem'}}>
        <h3>🔍 Buscar Usuario</h3>
        <div className="form-group">
          <label>DNI *</label>
          <input
            type="text"
            value={searchDNI}
            onChange={(e) => setSearchDNI(e.target.value)}
            placeholder="12345678"
            maxLength="8"
            required
          />
          <small>Ingresa exactamente 8 dígitos</small>
        </div>

        <button 
          onClick={handleSearchUser}
          className="btn-primary"
          disabled={loading || searchDNI.length !== 8}
        >
          {loading ? 'Buscando...' : '🔍 Buscar Usuario'}
        </button>
      </div>

      {foundUser && (
        <div className="form-card">
          <h3>👤 Usuario Encontrado</h3>
          
          <div style={{
            background: 'rgba(0,200,255,0.05)',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(0,200,255,0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div>
                <strong style={{color: 'var(--neon)'}}>Nombre:</strong>
                <p style={{marginTop: '0.3rem'}}>{foundUser.nombre} {foundUser.apellido}</p>
              </div>
              <div>
                <strong style={{color: 'var(--neon)'}}>DNI:</strong>
                <p style={{marginTop: '0.3rem'}}>{foundUser.dni}</p>
              </div>
              <div>
                <strong style={{color: 'var(--neon)'}}>Email Actual:</strong>
                <p style={{marginTop: '0.3rem', color: '#ff9800'}}>{foundUser.email}</p>
              </div>
              <div>
                <strong style={{color: 'var(--neon)'}}>Estado:</strong>
                <p style={{marginTop: '0.3rem'}}>
                  <span className={`badge badge-${foundUser.estado.toLowerCase()}`}>
                    {foundUser.estado}
                  </span>
                </p>
              </div>
              <div>
                <strong style={{color: 'var(--neon)'}}>Club:</strong>
                <p style={{marginTop: '0.3rem'}}>{foundUser.clubNombre || 'Sin club'}</p>
              </div>
              <div>
                <strong style={{color: 'var(--neon)'}}>Roles:</strong>
                <p style={{marginTop: '0.3rem'}}>{foundUser.roles.join(', ')}</p>
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{marginBottom: '1.5rem'}}>
            <strong>⚠️ Importante:</strong> Al restablecer el email, se generará una nueva contraseña temporal 
            que será enviada al nuevo correo. El usuario deberá cambiarla al iniciar sesión.
          </div>

          <div className="form-group">
            <label>Nuevo Email *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevoemail@ejemplo.com"
              required
            />
          </div>

          <button 
            onClick={handleResetEmail}
            className="btn-primary"
            disabled={loading || !newEmail}
          >
            {loading ? 'Procesando...' : '🔄 Restablecer Email'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EmailResetPanel;