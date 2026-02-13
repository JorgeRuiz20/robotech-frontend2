// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HistorialTorneos from './components/torneos/HistorialTorneos';
import BracketPublico from './components/torneos/BracketPublico';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TorneosPublicos from './pages/TorneosPublicos';
import RecuperarPassword from './pages/RecuperarPassword';

// Components
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';

// CSS - ¡IMPORTANTE! Importa el archivo CSS
import './App.css';

function AppRoutes() {
  const { isAuthenticated, hasRole } = useAuth();

  const getDashboard = () => {
    if (hasRole('ROLE_ADMIN')) return <Dashboard type="admin" />;
    if (hasRole('ROLE_CLUB_OWNER')) return <Dashboard type="clubowner" />;
    if (hasRole('ROLE_COMPETITOR')) return <Dashboard type="competitor" />;
    if (hasRole('ROLE_JUDGE')) return <Dashboard type="judge" />;
    return <Dashboard type="user" />;
  };

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
        } />
        <Route path="/reset-password" element={<RecuperarPassword />} />
        <Route path="/torneos" element={<TorneosPublicos />} />
        <Route path="/brackets" element={<BracketPublico />} />
        <Route path="/historial" element={<HistorialTorneos />} />
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={
          <PrivateRoute>{getDashboard()}</PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;