import { useState, useEffect } from 'react';
import { competenciaService } from '../services/authService';
import '../pages/Dashboard.css';

function JudgeDashboard() {
  const [competencias, setCompetencias] = useState([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState(null);
  const [enfrentamientos, setEnfrentamientos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar competencias activas (necesitarías un endpoint para esto)
    // Por ahora, dejaremos esto como placeholder
  }, []);

  const loadEnfrentamientos = async (competenciaId) => {
    setLoading(true);
    try {
      const res = await competenciaService.getEnfrentamientos(competenciaId);
      setEnfrentamientos(res.data);
    } catch (err) {
      console.error('Error cargando enfrentamientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const registrarResultado = async (enfrentamientoId) => {
    const puntos1 = prompt('Puntos Participante 1:');
    const puntos2 = prompt('Puntos Participante 2:');
    
    if (!puntos1 || !puntos2) return;

    try {
      await competenciaService.registrarResultado(
        enfrentamientoId, 
        parseInt(puntos1), 
        parseInt(puntos2)
      );
      alert('Resultado registrado');
      loadEnfrentamientos(selectedCompetencia);
    } catch (err) {
      alert('Error al registrar resultado');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>⚖️ Panel de Juez</h1>
      </div>

      <div className="dashboard-content">
        <h2>Enfrentamientos Pendientes</h2>
        
        {selectedCompetencia ? (
          <div>
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedCompetencia(null)}
            >
              ← Volver
            </button>
            
            <div className="table-container" style={{marginTop: '2rem'}}>
              <table>
                <thead>
                  <tr>
                    <th>Participante 1</th>
                    <th>Participante 2</th>
                    <th>Ronda</th>
                    <th>Resultado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enfrentamientos.map(enf => (
                    <tr key={enf.id}>
                      <td>{enf.participante1Nombre} ({enf.participante1Robot})</td>
                      <td>{enf.participante2Nombre} ({enf.participante2Robot})</td>
                      <td>{enf.ronda}</td>
                      <td>
                        {enf.resultado === 'PENDIENTE' ? (
                          <span className="badge badge-pendiente">Pendiente</span>
                        ) : (
                          <span>{enf.puntosParticipante1} - {enf.puntosParticipante2}</span>
                        )}
                      </td>
                      <td>
                        {enf.resultado === 'PENDIENTE' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => registrarResultado(enf.id)}
                          >
                            Registrar Resultado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p>Selecciona una competencia para ver los enfrentamientos</p>
        )}
      </div>
    </div>
  );
}

export default JudgeDashboard;