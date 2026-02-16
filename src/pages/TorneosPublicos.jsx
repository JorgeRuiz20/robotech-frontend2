import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { torneoService } from '../services/authService';
import RankingTorneo from '../components/torneos/RankingTorneo';

function TorneosPublicos() {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rankingModal, setRankingModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTorneos();
  }, []);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      const res = await torneoService.getActivos();
      setTorneos(res.data);
    } catch (err) {
      console.error('Error cargando torneos:', err);
    } finally {
      setLoading(false);
    }
  };

  const irABrackets = (torneoId) => {
    navigate(`/brackets/${torneoId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="neon-title">🏆 Torneos Activos</h1>
        <p>Explora los torneos disponibles y únete a la competencia</p>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Cargando torneos...</div>
        ) : torneos.length === 0 ? (
          <p style={{textAlign: 'center', padding: '2rem', color: 'var(--muted)'}}>
            No hay torneos activos en este momento
          </p>
        ) : (
          <div className="data-grid">
            {torneos.map(torneo => (
              <div key={torneo.id} className="card">
                <h3>{torneo.nombre}</h3>
                <p>{torneo.descripcion}</p>
                <p><strong>📅 Categoría:</strong> {torneo.categoriaNombre}</p>
                <p><strong>🏅 Estado:</strong> <span className="badge badge-aprobado">{torneo.estado}</span></p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: 'column' }}>
                  <button
                    onClick={() => setRankingModal(torneo)}
                    className="btn btn-primary"
                  >
                    📊 Ver Ranking
                  </button>
                  
                  <button
                    onClick={() => irABrackets(torneo.id)}
                    className="btn btn-secondary"
                  >
                    🏆 Ver Brackets
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {rankingModal && (
        <RankingTorneo
          torneoId={rankingModal.id}
          torneoNombre={rankingModal.nombre}
          onClose={() => setRankingModal(null)}
        />
      )}
    </div>
  );
}

export default TorneosPublicos;