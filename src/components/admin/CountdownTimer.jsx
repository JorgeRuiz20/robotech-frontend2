import { useState, useEffect } from 'react';

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0,255,0,0.1)',
        border: '1px solid rgba(0,255,0,0.3)',
        borderRadius: '8px'
      }}>
        <span style={{fontSize: '1.2rem'}}>✅</span>
        <span style={{color: '#00ff00', fontWeight: '600'}}>Listo para activar</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      gap: '0.5rem',
      padding: '0.5rem',
      background: 'rgba(0,200,255,0.1)',
      border: '1px solid rgba(0,200,255,0.3)',
      borderRadius: '8px'
    }}>
      {timeLeft.days > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0.3rem 0.6rem',
          background: 'rgba(0,200,255,0.2)',
          borderRadius: '4px',
          minWidth: '50px'
        }}>
          <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon)'}}>
            {timeLeft.days}
          </span>
          <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>días</span>
        </div>
      )}
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.3rem 0.6rem',
        background: 'rgba(0,200,255,0.2)',
        borderRadius: '4px',
        minWidth: '50px'
      }}>
        <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon)'}}>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>horas</span>
      </div>

      <span style={{fontSize: '1.5rem', color: 'var(--neon)', alignSelf: 'center'}}>:</span>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.3rem 0.6rem',
        background: 'rgba(0,200,255,0.2)',
        borderRadius: '4px',
        minWidth: '50px'
      }}>
        <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon)'}}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>min</span>
      </div>

      <span style={{fontSize: '1.5rem', color: 'var(--neon)', alignSelf: 'center'}}>:</span>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.3rem 0.6rem',
        background: 'rgba(0,200,255,0.2)',
        borderRadius: '4px',
        minWidth: '50px'
      }}>
        <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon)'}}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>seg</span>
      </div>
    </div>
  );
}

export default CountdownTimer;
