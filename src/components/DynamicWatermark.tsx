import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

function getDeviceInfo() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desktop';
}

export function DynamicWatermark() {
  const { user } = useAuth();
  const [ip, setIp] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setIp(d.ip))
      .catch(() => setIp('N/A'));

    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const username = user.email?.split('@')[0] || 'user';
  const device = getDeviceInfo();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const text = `${username} · ${ip} · ${device} · ${dateStr} ${timeStr}`;

  // Create a diagonal repeating pattern
  const tiles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-[9999] overflow-hidden" style={{ userSelect: 'none' }}>
      <div
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '0',
          transform: 'rotate(-20deg) scale(1.5)',
          transformOrigin: 'center center',
        }}
      >
        {tiles.map(i => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              opacity: 0.04,
              fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              color: 'currentColor',
              letterSpacing: '0.5px',
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
