const secureRandom = () => { const values = new Uint32Array(1); crypto.getRandomValues(values); return values[0] / 0x100000000; };

import { useMemo } from 'react';

export function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: secureRandom() * 4 + 2,
      x: secureRandom() * 100,
      y: secureRandom() * 100,
      duration: secureRandom() * 15 + 10,
      delay: secureRandom() * 5,
      opacity: secureRandom() * 0.15 + 0.03,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary animate-float-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
