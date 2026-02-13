function Home() {
  return (
    <div className="hero">
      <div className="hero-content">
        <h1 className="neon-title">🤖 Bienvenido a RoboTech</h1>
        <p>Plataforma líder en torneos de robótica competitiva</p>
        <div className="hero-buttons">
          <a href="/torneos" className="btn-primary">Ver Torneos</a>
          <a href="/register" className="btn-secondary">Registrarse</a>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '4rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(0,200,255,0.1) 0%, rgba(123,44,191,0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(0,200,255,0.2)',
          maxWidth: '700px',
          margin: '4rem auto 0'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: 'var(--neon)'
          }}>
            ¿Listo para competir?
          </h3>
          <p style={{
            color: 'var(--muted)',
            marginBottom: '1.5rem'
          }}>
            Regístrate ahora, construye tu robot y participa en emocionantes torneos de robótica. 
            Revisa las categorías, torneos y clubs disponibles en el menú superior.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;