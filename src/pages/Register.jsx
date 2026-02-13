// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

function Register() {
  const [formData, setFormData] = useState({
    codigoRegistro: '',
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fechaNacimiento: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, minúscula, número y carácter especial');
      setLoading(false);
      return;
    }

    try {
      // Preparar FormData para enviar
      const data = new FormData();
      
      // Crear objeto con los datos del usuario (sin confirmPassword)
      const userData = {
        codigoRegistro: formData.codigoRegistro.trim().toUpperCase(),
        dni: formData.dni,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono,
        fechaNacimiento: formData.fechaNacimiento
      };

      // Enviar como JSON string en el campo userData
      data.append('userData', JSON.stringify(userData));

      await authService.register(data);
      
      setSuccess('✅ ¡Registro exitoso! Has sido aprobado automáticamente. Redirigiendo al login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || 'Error al registrarse';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2>🤖 Registro RoboTech</h2>
        <p style={{color: 'var(--muted)', marginBottom: '1.5rem', textAlign: 'center'}}>
          Necesitas un código proporcionado por un Club Owner
        </p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label>Código de Registro *</label>
          <input
            type="text"
            name="codigoRegistro"
            value={formData.codigoRegistro}
            onChange={handleChange}
            placeholder="REG-XXXXXXXX"
            maxLength="20"
            required
            style={{textTransform: 'uppercase'}}
          />
          <small>Ejemplo: REG-ABC12345</small>
        </div>

        <hr style={{margin: '1.5rem 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)'}} />

        <h3 style={{color: 'var(--neon)', marginBottom: '1rem', fontSize: '1.1rem'}}>Datos Personales</h3>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div className="form-group">
            <label>DNI *</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              required
              placeholder="12345678"
              maxLength="8"
            />
          </div>

          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div className="form-group">
            <label>Apellido *</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
            />
            <small>Min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial</small>
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              placeholder="+51987654321"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento *</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="alert alert-info">
          <strong>ℹ️ Nota:</strong> Al registrarte con un código válido, serás aprobado automáticamente en el club y podrás registrar tus robots.
        </div>

        <button 
          onClick={handleSubmit}
          className="btn-primary full-width"
          disabled={loading}
        >
          {loading ? 'Registrando...' : '✓ Completar Registro'}
        </button>

        <div className="form-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;