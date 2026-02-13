import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🤖 RoboTech
        </Link>

        <ul className="navbar-menu">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/torneos">Torneos</Link></li>
          <li><Link to="/brackets"> Brackets</Link></li>
          <li><Link to="/historial">Historial</Link></li>

          {isAuthenticated ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li className="user-info">
                <span>👤 {user?.nombre}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-logout">
                  Cerrar Sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn-login">Iniciar Sesión</Link></li>
              <li><Link to="/register" className="btn-register">Registrarse</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;