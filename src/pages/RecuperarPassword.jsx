// src/pages/RecuperarPassword.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function RecuperarPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // Si hay token, mostrar formulario de reseteo
  const [showResetForm, setShowResetForm] = useState(!!token);

  // Estado para solicitar email
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para resetear contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ Solicitar recuperación de contraseña
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password/forgot', { email });
      setMessage(response.data.message || '✅ Se ha enviado un email con las instrucciones');
      setEmail('');
    } catch (err) {
      setMessage('Si el email está registrado, recibirás las instrucciones');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resetear contraseña con token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/password/reset', {
        token: token,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });

      setMessage(response.data.message || '✅ Contraseña restablecida exitosamente');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        {!showResetForm ? (
          <>
            <h2>🔐 Recuperar Contraseña</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleForgotPassword}>
              <p style={{color: 'var(--muted)', marginBottom: '1.5rem'}}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Enviando...' : '📧 Enviar Email'}
              </button>
            </form>

            <div className="form-links">
              <Link to="/login">← Volver al login</Link>
            </div>
          </>
        ) : (
          <>
            <h2>🔑 Restablecer Contraseña</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleResetPassword}>
              <p style={{color: 'var(--muted)', marginBottom: '1.5rem'}}>
                Ingresa tu nueva contraseña
              </p>
              
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="8"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="form-group">
                <label>Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="8"
                  placeholder="Repite tu contraseña"
                />
              </div>

              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Restableciendo...' : '✓ Restablecer Contraseña'}
              </button>
            </form>

            <div className="form-links">
              <Link to="/login">← Volver al login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RecuperarPassword;