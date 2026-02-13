// src/components/torneos/BracketPublico.jsx
import { useState, useEffect } from 'react';
import { torneoService } from '../../services/authService';
import { toast } from 'react-toastify';
import './BracketPublico.css';

function BracketPublico() {
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTorneos();
    
    const interval = setInterval(() => {
      if (torneoSeleccionado) {
        seleccionarTorneo(torneoSeleccionado, true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [torneoSeleccionado]);

  const loadTorneos = async () => {
    setLoading(true);
    try {
      const res = await torneoService.getAll();
      const torneosActivos = res.data.filter(t => 
        t.estado === 'ACTIVO' || t.estado === 'FINALIZADO'
      );
      setTorneos(torneosActivos);
      
      if (torneosActivos.length > 0 && !torneoSeleccionado) {
        seleccionarTorneo(torneosActivos[0]);
      }
    } catch (err) {
      console.error('Error cargando torneos:', err);
      toast.error('Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarTorneo = async (torneo, silent = false) => {
    setTorneoSeleccionado(torneo);
    if (!silent) setLoading(true);
    
    try {
      const res = await torneoService.getBracket(torneo.id);
      setBracket(res.data);
    } catch (err) {
      console.error('Error cargando bracket:', err);
      if (!silent) toast.error('Error al cargar el bracket');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generarAvatar = (nombre) => {
    if (!nombre) return { iniciales: '?', color: 'rgba(255,255,255,0.1)' };
    
    const iniciales = nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#52B788', '#E76F51', '#264653', '#2A9D8F'
    ];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colores[Math.abs(hash) % colores.length];
    
    return { iniciales, color };
  };

  const getGanador = (enf) => {
    if (!enf || !enf.resultado) return null;
    if (enf.resultado === 'GANA_1') return 1;
    if (enf.resultado === 'GANA_2') return 2;
    return null;
  };

  // Estructura completa - FINAL dividida en dos columnas
  const generarEstructuraCompleta = () => {
    if (!bracket || !bracket.bracket) return null;

    const estructura = {
      octavosIzq: [],
      cuartosIzq: [],
      semiIzq: [],
      finalIzq: [],
      finalDer: [],
      semiDer: [],
      cuartosDer: [],
      octavosDer: []
    };

    const octavos = bracket.bracket.OCTAVOS || [];
    const cuartos = bracket.bracket.CUARTOS || [];
    const semis = bracket.bracket.SEMIFINAL || [];
    const final = bracket.bracket.FINAL || [];

    // OCTAVOS: 4 izquierda, 4 derecha
    estructura.octavosIzq = Array(4).fill(null).map((_, i) => octavos[i] || null);
    estructura.octavosDer = Array(4).fill(null).map((_, i) => octavos[i + 4] || null);

    // CUARTOS: 2 izquierda, 2 derecha
    estructura.cuartosIzq = Array(2).fill(null).map((_, i) => cuartos[i] || null);
    estructura.cuartosDer = Array(2).fill(null).map((_, i) => cuartos[i + 2] || null);

    // SEMIFINALES: 1 izquierda, 1 derecha
    estructura.semiIzq = [semis[0] || null];
    estructura.semiDer = [semis[1] || null];

    // FINAL: Dividida en 2 columnas (participante 1 a la izq, participante 2 a la der)
    if (final[0]) {
      estructura.finalIzq = [{
        ...final[0],
        soloParticipante: 1
      }];
      estructura.finalDer = [{
        ...final[0],
        soloParticipante: 2
      }];
    } else {
      estructura.finalIzq = [null];
      estructura.finalDer = [null];
    }

    return estructura;
  };

  // Componente de Equipo
  const Team = ({ nombre, robot, esGanador, esPendiente, clubNombre }) => {
    const avatar = generarAvatar(nombre);
    
    return (
      <div className={`bracket-pub-team ${esGanador ? 'ganador' : ''} ${esPendiente ? 'pendiente' : ''}`}>
        <div 
          className="bracket-pub-avatar" 
          style={{ backgroundColor: avatar.color }}
        >
          {avatar.iniciales}
        </div>
        <div className="bracket-pub-team-robot">
          {robot ? `🤖 ${robot}` : 'Por definir'}
        </div>
        
        {/* Tooltip con info completa */}
        {!esPendiente && nombre && (
          <div className="bracket-pub-team-tooltip">
            <div className="bracket-pub-tooltip-header">
              <div 
                className="bracket-pub-tooltip-avatar" 
                style={{ backgroundColor: avatar.color }}
              >
                {avatar.iniciales}
              </div>
              <div className="bracket-pub-tooltip-info">
                <div className="bracket-pub-tooltip-nombre">{nombre}</div>
                <div className="bracket-pub-tooltip-robot">
                  <span>🤖</span>
                  <span>{robot}</span>
                </div>
              </div>
            </div>
            {clubNombre && (
              <div className="bracket-pub-tooltip-details">
                <div className="bracket-pub-tooltip-detail-row">
                  <span className="bracket-pub-tooltip-label">Club:</span>
                  <span className="bracket-pub-tooltip-value">{clubNombre}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Componente de Match
  const Match = ({ enfrentamiento }) => {
    if (!enfrentamiento) {
      return (
        <div className="bracket-pub-match vacio">
          <Team esPendiente={true} />
          <div className="bracket-pub-vs"></div>
          <Team esPendiente={true} />
        </div>
      );
    }

    const ganador = getGanador(enfrentamiento);

    return (
      <div className="bracket-pub-match">
        <Team
          nombre={enfrentamiento.participante1Nombre}
          robot={enfrentamiento.participante1Robot}
          clubNombre={enfrentamiento.participante1Club}
          esGanador={ganador === 1}
          esPendiente={!enfrentamiento.participante1Nombre}
        />
        <div className="bracket-pub-vs"></div>
        <Team
          nombre={enfrentamiento.participante2Nombre}
          robot={enfrentamiento.participante2Robot}
          clubNombre={enfrentamiento.participante2Club}
          esGanador={ganador === 2}
          esPendiente={!enfrentamiento.participante2Nombre}
        />
      </div>
    );
  };

  // Match de Final (un solo participante)
  const MatchFinal = ({ enfrentamiento, participanteNumero }) => {
    if (!enfrentamiento) {
      return (
        <div className="bracket-pub-match vacio">
          <Team esPendiente={true} />
        </div>
      );
    }

    const ganador = getGanador(enfrentamiento);
    const esEsteElGanador = ganador === participanteNumero;
    
    const nombre = participanteNumero === 1 
      ? enfrentamiento.participante1Nombre 
      : enfrentamiento.participante2Nombre;
    const robot = participanteNumero === 1 
      ? enfrentamiento.participante1Robot 
      : enfrentamiento.participante2Robot;
    const clubNombre = participanteNumero === 1
      ? enfrentamiento.participante1Club
      : enfrentamiento.participante2Club;

    return (
      <div className="bracket-pub-match">
        <Team
          nombre={nombre}
          robot={robot}
          clubNombre={clubNombre}
          esGanador={esEsteElGanador}
          esPendiente={!nombre}
        />
      </div>
    );
  };

  // Columna
  const Columna = ({ titulo, matches, className }) => (
    <div className={`bracket-pub-col ${className}`}>
      <div className="bracket-pub-col-title">{titulo}</div>
      <div className="bracket-pub-matches">
        {matches.map((enf, idx) => (
          <Match key={enf?.id || `${className}-${idx}`} enfrentamiento={enf} />
        ))}
      </div>
    </div>
  );

  // Columna Final (solo muestra un participante)
  const ColumnaFinal = ({ titulo, matches, className, participanteNumero }) => (
    <div className={`bracket-pub-col ${className}`}>
      <div className="bracket-pub-col-title">{titulo}</div>
      <div className="bracket-pub-matches">
        {matches.map((enf, idx) => (
          <MatchFinal 
            key={enf?.id || `${className}-${idx}`} 
            enfrentamiento={enf} 
            participanteNumero={participanteNumero}
          />
        ))}
      </div>
    </div>
  );

  const renderBracket = () => {
    if (!bracket || !bracket.bracket) {
      return (
        <div className="bracket-pub-empty">
          <div className="bracket-pub-empty-icon">🏆</div>
          <h3>No hay bracket disponible</h3>
          <p>Este torneo aún no tiene enfrentamientos</p>
        </div>
      );
    }

    const estructura = generarEstructuraCompleta();
    if (!estructura) return null;

    // Obtener ganador del match final para el podio
    const matchFinal = estructura.finalIzq[0];
    const ganadorFinal = matchFinal ? getGanador(matchFinal) : null;

    return (
      <>
        {/* Header */}
        <div className="bracket-pub-header">
          <h1 className="bracket-pub-titulo">{torneoSeleccionado.nombre}</h1>
          <div className="bracket-pub-info-badges">
            <span className="bracket-pub-badge categoria">
              {torneoSeleccionado.categoriaNombre}
            </span>
            <span className="bracket-pub-badge modalidad">
              {torneoSeleccionado.modalidad?.replace('_', ' ')}
            </span>
            <span className="bracket-pub-badge progreso">
              {bracket.completados}/{bracket.totalEnfrentamientos}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="bracket-pub-container">
          <div className="bracket-pub-grid">
            {/* IZQUIERDA */}
            <Columna 
              titulo="OCTAVOS" 
              matches={estructura.octavosIzq} 
              className="octavos-izq" 
            />
            <Columna 
              titulo="CUARTOS" 
              matches={estructura.cuartosIzq} 
              className="cuartos-izq" 
            />
            <Columna 
              titulo="SEMI" 
              matches={estructura.semiIzq} 
              className="semi-izq" 
            />

            {/* FINAL IZQUIERDA (Participante 1) */}
            <ColumnaFinal 
              titulo="FINAL" 
              matches={estructura.finalIzq} 
              className="final-izq"
              participanteNumero={1}
            />

            {/* PODIO CENTRAL */}
            <div className="bracket-pub-podio">
              {/* CAMPEÓN */}
              <div className="bracket-pub-campeon">
                <div className="bracket-pub-trophy">🏆</div>
                <div className="bracket-pub-campeon-title">CAMPEÓN</div>
                {ganadorFinal && matchFinal ? (
                  (() => {
                    const ganadorData = ganadorFinal === 1 
                      ? {
                          nombre: matchFinal.participante1Nombre,
                          robot: matchFinal.participante1Robot
                        }
                      : {
                          nombre: matchFinal.participante2Nombre,
                          robot: matchFinal.participante2Robot
                        };
                    const avatar = generarAvatar(ganadorData.nombre);
                    
                    return (
                      <>
                        <div 
                          className="bracket-pub-campeon-avatar" 
                          style={{ backgroundColor: avatar.color }}
                        >
                          {avatar.iniciales}
                        </div>
                        <div className="bracket-pub-campeon-nombre">
                          {ganadorData.nombre}
                        </div>
                        <div className="bracket-pub-campeon-robot">
                          🤖 {ganadorData.robot}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="bracket-pub-pendiente">Por definir</div>
                )}
              </div>

              {/* SEGUNDO LUGAR */}
              <div className="bracket-pub-subcampeon">
                <div className="bracket-pub-podio-title">🥈 2° LUGAR</div>
                {ganadorFinal && matchFinal ? (
                  (() => {
                    const subcampeonData = ganadorFinal === 1 
                      ? {
                          nombre: matchFinal.participante2Nombre,
                          robot: matchFinal.participante2Robot
                        }
                      : {
                          nombre: matchFinal.participante1Nombre,
                          robot: matchFinal.participante1Robot
                        };
                    const avatar = generarAvatar(subcampeonData.nombre);
                    
                    return (
                      <>
                        <div 
                          className="bracket-pub-podio-avatar" 
                          style={{ backgroundColor: avatar.color }}
                        >
                          {avatar.iniciales}
                        </div>
                        <div className="bracket-pub-podio-nombre">
                          {subcampeonData.nombre}
                        </div>
                        <div className="bracket-pub-podio-robot">
                          🤖 {subcampeonData.robot}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="bracket-pub-pendiente">TBD</div>
                )}
              </div>
            </div>

            {/* FINAL DERECHA (Participante 2) */}
            <ColumnaFinal 
              titulo="FINAL" 
              matches={estructura.finalDer} 
              className="final-der"
              participanteNumero={2}
            />

            {/* DERECHA */}
            <Columna 
              titulo="SEMI" 
              matches={estructura.semiDer} 
              className="semi-der" 
            />
            <Columna 
              titulo="CUARTOS" 
              matches={estructura.cuartosDer} 
              className="cuartos-der" 
            />
            <Columna 
              titulo="OCTAVOS" 
              matches={estructura.octavosDer} 
              className="octavos-der" 
            />
          </div>
        </div>
      </>
    );
  };

  if (loading && !bracket) {
    return (
      <div className="bracket-pub-wrapper">
        <div className="bracket-pub-loading">
          <div className="bracket-pub-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bracket-pub-wrapper">
      {/* Selector de torneos */}
      {torneos.length > 1 && (
        <div className="bracket-pub-selector">
          {torneos.map(torneo => (
            <button
              key={torneo.id}
              className={`bracket-pub-torneo-btn ${torneoSeleccionado?.id === torneo.id ? 'activo' : ''}`}
              onClick={() => seleccionarTorneo(torneo)}
            >
              {torneo.nombre}
            </button>
          ))}
        </div>
      )}

      {renderBracket()}
    </div>
  );
}

export default BracketPublico;