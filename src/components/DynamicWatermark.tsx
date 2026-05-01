import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

const SESSION_ENTRY_KEY = 'decode_session_entry_at';

function getSessionEntry(): Date {
  try {
    const raw = sessionStorage.getItem(SESSION_ENTRY_KEY);
    if (raw) return new Date(raw);
  } catch {}
  const now = new Date();
  try { sessionStorage.setItem(SESSION_ENTRY_KEY, now.toISOString()); } catch {}
  return now;
}

export function DynamicWatermark() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [entryAt] = useState<Date>(() => getSessionEntry());

  useEffect(() => {
    if (!user) { setFullName(''); return; }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('full_name, ra')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const name = (data?.full_name || '').trim();
        const ra = (data?.ra || '').trim();
        setFullName(name ? (ra ? `${name} (RA ${ra})` : name) : (user.email?.split('@')[0] || 'aluno'));
      });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const device = getDeviceInfo();
  const fmtDateTime = (d: Date) =>
    `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const displayName = fullName || (user.email?.split('@')[0] || 'aluno');
  // Removido: chamada à api.ipify.org (latência variável, falhas lentas) e timer de 60s.
  // O timestamp de entrada da sessão já identifica unicamente a sessão do aluno.
  const text = `${displayName} · ${device} · entrou ${fmtDateTime(entryAt)}`;

  // Tiles reduzidos de 12 → 6 (mantém cobertura visual, metade do trabalho de layout)
  const tiles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-[9999] overflow-hidden" style={{ userSelect: 'none' }}>
      <div
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '0',
          transform: 'rotate(-20deg) scale(1.6)',
          transformOrigin: 'center center',
        }}
      >
        {tiles.map(i => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              opacity: 0.05,
              fontSize: '10px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              color: 'currentColor',
              letterSpacing: '0.4px',
              padding: '0 8px',
              textAlign: 'center',
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
