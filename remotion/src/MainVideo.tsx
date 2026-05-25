import React from 'react';
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont } from '@remotion/google-fonts/SpaceGrotesk';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });

const CYAN = '#00f0ff';
const PURPLE = '#a855f7';
const DARK = '#050508';
const PANEL = '#0d0d18';
const PANEL2 = '#12121f';

// ───────── Browser-style chrome ─────────
const Chrome: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label = 'academy.decode' }) => (
  <div
    style={{
      width: '92%',
      height: '86%',
      borderRadius: 18,
      overflow: 'hidden',
      background: PANEL,
      border: `1px solid rgba(0,240,255,0.25)`,
      boxShadow: `0 30px 90px rgba(0,240,255,0.18), 0 10px 40px rgba(168,85,247,0.18)`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ height: 38, background: '#08080f', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: 11, height: 11, borderRadius: 11, background: '#ff5f57' }} />
      <div style={{ width: 11, height: 11, borderRadius: 11, background: '#febc2e' }} />
      <div style={{ width: 11, height: 11, borderRadius: 11, background: '#28c840' }} />
      <div style={{ marginLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily }}>{label}</div>
    </div>
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: DARK }}>{children}</div>
  </div>
);

// ───────── BG ─────────
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 30;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 20%, rgba(0,240,255,0.10), transparent 60%), radial-gradient(circle at 70% 80%, rgba(168,85,247,0.12), transparent 60%), ${DARK}` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      <div style={{ position: 'absolute', top: -200 + drift, left: -200, width: 600, height: 600, borderRadius: '50%', filter: 'blur(140px)', background: CYAN, opacity: 0.18 }} />
      <div style={{ position: 'absolute', bottom: -200 - drift, right: -200, width: 600, height: 600, borderRadius: '50%', filter: 'blur(140px)', background: PURPLE, opacity: 0.22 }} />
    </AbsoluteFill>
  );
};

const useFade = (dur: number, fadeIn = 12, fadeOut = 12) => {
  const f = useCurrentFrame();
  const o = Math.min(
    interpolate(f, [0, fadeIn], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(f, [dur - fadeOut, dur], [1, 0], { extrapolateLeft: 'clamp' })
  );
  const y = interpolate(f, [0, fadeIn], [20, 0], { extrapolateRight: 'clamp' });
  return { opacity: o, transform: `translateY(${y}px)` };
};

const SceneWrap: React.FC<{ children: React.ReactNode; dur: number; label?: string }> = ({ children, dur, label }) => {
  const style = useFade(dur);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily }}>
      <Background />
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <Chrome label={label}>{children}</Chrome>
      </div>
    </AbsoluteFill>
  );
};

// ───────── Scene 1: Login / Portal ─────────
const SceneLogin: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 18 } });
  return (
    <SceneWrap dur={72} label="academy.decode/login">
      <div style={{ display: 'flex', height: '100%' }}>
        {/* left brand */}
        <div style={{ flex: 1.1, background: `linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.18)), ${PANEL2}`, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🦉</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>DECODE ACADEMY</div>
          </div>
          <div style={{ transform: `translateY(${(1 - s) * 40}px)`, opacity: s }}>
            <div style={{ color: '#fff', fontSize: 44, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>Sua jornada<br />em tecnologia.</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', marginTop: 16, fontSize: 16 }}>Apostilas · Exercícios · Gamificação</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Desenvolvido por Kaique Aurelio &amp; Decode Analytics</div>
        </div>
        {/* right form */}
        <div style={{ flex: 1, background: PANEL, padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>Entrar</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 8 }}>Use seu RA ou e-mail institucional</div>
          {['RA / E-mail', 'Senha'].map((p, i) => (
            <div key={p} style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 14, opacity: interpolate(f, [10 + i * 6, 20 + i * 6], [0, 1], { extrapolateRight: 'clamp' }) }}>{p}</div>
          ))}
          <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 10, background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`, color: '#050508', fontWeight: 700, textAlign: 'center', boxShadow: `0 10px 30px rgba(0,240,255,0.3)`, transform: `scale(${0.95 + s * 0.05})` }}>Acessar</div>
        </div>
      </div>
    </SceneWrap>
  );
};

// ───────── Scene 2: Dashboard ─────────
const SceneDashboard: React.FC = () => {
  const f = useCurrentFrame();
  const stagger = (i: number) => interpolate(f, [i * 4, i * 4 + 16], [0, 1], { extrapolateRight: 'clamp' });
  const slide = (i: number) => interpolate(f, [40, 90], [0, -i * 60], { extrapolateRight: 'clamp' });
  return (
    <SceneWrap dur={96} label="academy.decode/dashboard">
      <div style={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>Olá, Ana 👋</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Pronta para continuar de onde parou?</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>🔥 30 dias</div>
            <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(0,240,255,0.15)', color: CYAN, fontSize: 12, fontWeight: 600 }}>Nível 8 · 2480 XP</div>
          </div>
        </div>
        {/* widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: 'Apostilas concluídas', v: '18', c: CYAN },
            { l: 'Exercícios resolvidos', v: '342', c: PURPLE },
            { l: 'Flashcards revisados', v: '1.2k', c: '#22c55e' },
            { l: 'Badges conquistadas', v: '12', c: '#f59e0b' },
          ].map((w, i) => (
            <div key={w.l} style={{ background: PANEL2, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, opacity: stagger(i), transform: `translateY(${(1 - stagger(i)) * 16}px)` }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{w.l}</div>
              <div style={{ color: w.c, fontSize: 26, fontWeight: 700, marginTop: 6 }}>{w.v}</div>
            </div>
          ))}
        </div>
        {/* carousel */}
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>Continuar lendo</div>
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {[
            ['Algoritmos e Estruturas', '#00f0ff'],
            ['Banco de Dados', '#a855f7'],
            ['Redes de Computadores', '#22c55e'],
            ['Engenharia de Software', '#f59e0b'],
            ['Cálculo II', '#ec4899'],
            ['Sistemas Operacionais', '#3b82f6'],
          ].map(([t, c], i) => (
            <div key={t} style={{ flex: '0 0 200px', height: 140, borderRadius: 14, background: `linear-gradient(135deg, ${c}30, ${PANEL2})`, border: `1px solid ${c}40`, padding: 14, transform: `translateX(${slide(i)}px)`, opacity: stagger(i + 2) }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c, opacity: 0.8 }} />
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginTop: 14 }}>{t}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>Continuar →</div>
              <div style={{ marginTop: 14, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${40 + i * 8}%`, height: '100%', background: c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SceneWrap>
  );
};

// ───────── Scene 3: Apostila 3 colunas ─────────
const SceneApostila: React.FC = () => {
  const f = useCurrentFrame();
  const typed = Math.floor(interpolate(f, [10, 80], [0, 280], { extrapolateRight: 'clamp' }));
  const body = `A complexidade de um algoritmo é frequentemente expressa usando notação Big O, que descreve o comportamento assintótico no pior caso. Estruturas de dados como árvores balanceadas garantem operações em O(log n), enquanto tabelas hash oferecem acesso médio em O(1). A escolha correta impacta diretamente a performance de aplicações em larga escala...`.slice(0, typed);
  return (
    <SceneWrap dur={96} label="academy.decode/apostila/algoritmos">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 200px', height: '100%' }}>
        {/* TOC */}
        <div style={{ background: PANEL2, borderRight: '1px solid rgba(255,255,255,0.05)', padding: 20, fontSize: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5, marginBottom: 12 }}>SUMÁRIO</div>
          {[
            ['1', 'Introdução', false],
            ['1.1', 'Conceitos básicos', false],
            ['2', 'Complexidade', true],
            ['2.1', 'Notação Big O', false],
            ['2.1.1', 'Pior caso', false],
            ['2.2', 'Estruturas de dados', false],
            ['3', 'Algoritmos de busca', false],
          ].map(([n, t, active]) => (
            <div key={String(n)} style={{ display: 'flex', gap: 8, padding: '6px 8px', borderRadius: 6, background: active ? 'rgba(0,240,255,0.1)' : 'transparent', marginBottom: 2 }}>
              <div style={{ color: active ? CYAN : 'rgba(255,255,255,0.35)', fontWeight: 600, minWidth: 32 }}>{n as string}</div>
              <div style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>{t as string}</div>
            </div>
          ))}
        </div>
        {/* content */}
        <div style={{ padding: '28px 32px', overflow: 'hidden' }}>
          <div style={{ color: CYAN, fontSize: 11, letterSpacing: 2 }}>CAPÍTULO 2 · COMPLEXIDADE</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginTop: 6, lineHeight: 1.15 }}>Notação Big O e desempenho de algoritmos</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.65, marginTop: 16 }}>{body}<span style={{ opacity: (f % 12) < 6 ? 1 : 0, color: CYAN }}>▍</span></div>
          <div style={{ marginTop: 18, padding: 14, borderLeft: `3px solid ${PURPLE}`, background: 'rgba(168,85,247,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            💡 <b style={{ color: '#fff' }}>Dica:</b> O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²)
          </div>
        </div>
        {/* notes */}
        <div style={{ background: PANEL2, borderLeft: '1px solid rgba(255,255,255,0.05)', padding: 18, fontSize: 11 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }}>SUAS ANOTAÇÕES</div>
          {['Revisar Big O', 'Lista 3 — exercício 4', 'Comparar BST x AVL'].map((n, i) => (
            <div key={n} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 8, color: 'rgba(255,255,255,0.7)', opacity: interpolate(f, [30 + i * 8, 50 + i * 8], [0, 1], { extrapolateRight: 'clamp' }) }}>{n}</div>
          ))}
        </div>
      </div>
    </SceneWrap>
  );
};

// ───────── Scene 4: Exercícios + XP ─────────
const SceneExercicios: React.FC = () => {
  const f = useCurrentFrame();
  const selected = f > 32 ? 1 : -1;
  const correct = f > 48;
  const xpStart = 2480;
  const xpFinal = 2530;
  const xp = Math.floor(interpolate(f, [50, 78], [xpStart, xpFinal], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const badge = spring({ frame: f - 64, fps: 24, config: { damping: 8 } });
  const opts = ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'];
  return (
    <SceneWrap dur={96} label="academy.decode/exercicios">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '100%' }}>
        <div style={{ padding: 32 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2 }}>QUESTÃO 04 / 10 · ALGORITMOS</div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginTop: 10, lineHeight: 1.35 }}>
            Qual a complexidade da busca binária em um array ordenado de tamanho n?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            {opts.map((o, i) => {
              const isSel = selected === i;
              const isRight = correct && i === 1;
              const isWrong = correct && isSel && i !== 1;
              const bg = isRight ? 'rgba(34,197,94,0.15)' : isWrong ? 'rgba(239,68,68,0.15)' : isSel ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)';
              const bd = isRight ? '#22c55e' : isWrong ? '#ef4444' : isSel ? CYAN : 'rgba(255,255,255,0.08)';
              return (
                <div key={o} style={{ padding: '14px 18px', background: bg, border: `1px solid ${bd}`, borderRadius: 10, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid ${bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: bd }}>{String.fromCharCode(65 + i)}</div>
                  {o}
                  {isRight && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓ correto</span>}
                </div>
              );
            })}
          </div>
          {correct && (
            <div style={{ marginTop: 18, padding: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              💡 Busca binária divide o espaço pela metade a cada iteração → <b style={{ color: '#22c55e' }}>O(log n)</b>
            </div>
          )}
        </div>
        {/* gamification panel */}
        <div style={{ background: PANEL2, padding: 22, borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5 }}>SEU PROGRESSO</div>
          <div>
            <div style={{ color: '#fff', fontSize: 12 }}>Nível 8</div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${interpolate(xp, [2400, 2600], [40, 80])}%`, height: '100%', background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
              <span>{xp} XP</span><span>2600 XP</span>
            </div>
          </div>
          {correct && (
            <div style={{ padding: 14, borderRadius: 12, background: `linear-gradient(135deg, rgba(0,240,255,0.2), rgba(168,85,247,0.2))`, border: `1px solid ${CYAN}55`, transform: `scale(${0.7 + badge * 0.3})`, opacity: badge }}>
              <div style={{ color: CYAN, fontSize: 11, fontWeight: 700 }}>+50 XP</div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginTop: 4 }}>Resposta correta!</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['🏆', '⚡', '🔥', '🎯', '📚', '🧠'].map((b, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: i === 0 && correct ? `1px solid ${CYAN}` : '1px solid transparent' }}>{b}</div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🔥 Streak de 30 dias</div>
        </div>
      </div>
    </SceneWrap>
  );
};

// ───────── Scene 5: Flashcards + Pomodoro ─────────
const SceneStudy: React.FC = () => {
  const f = useCurrentFrame();
  const flip = interpolate(f, [24, 44], [0, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const showBack = flip > 90;
  const pomo = Math.max(0, 25 - Math.floor(f / 4));
  const sec = String(Math.floor((f * 2.5) % 60)).padStart(2, '0');
  const min = String(pomo).padStart(2, '0');
  return (
    <SceneWrap dur={96} label="academy.decode/estudar">
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', height: '100%' }}>
        {/* Flashcard */}
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2 }}>FLASHCARDS · DECK ALGORITMOS</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1000 }}>
            <div style={{ width: 360, height: 220, position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${flip}deg)`, transition: 'none' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: `linear-gradient(135deg, ${PANEL2}, #1a1a2e)`, border: `1px solid ${CYAN}50`, padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'center', backfaceVisibility: 'hidden', boxShadow: `0 20px 60px rgba(0,240,255,0.15)` }}>
                <div style={{ color: CYAN, fontSize: 11, letterSpacing: 2 }}>PERGUNTA</div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginTop: 12, lineHeight: 1.3 }}>O que é notação Big O?</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: `linear-gradient(135deg, #1a1a2e, ${PANEL2})`, border: `1px solid ${PURPLE}50`, padding: 26, display: 'flex', flexDirection: 'column', justifyContent: 'center', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: `0 20px 60px rgba(168,85,247,0.15)` }}>
                <div style={{ color: PURPLE, fontSize: 11, letterSpacing: 2 }}>RESPOSTA</div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 500, marginTop: 12, lineHeight: 1.4 }}>Descreve o comportamento assintótico de um algoritmo no pior caso, em função do tamanho da entrada.</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', opacity: showBack ? interpolate(f, [46, 60], [0, 1], { extrapolateRight: 'clamp' }) : 0 }}>
            {[['Difícil', '#ef4444'], ['Médio', '#f59e0b'], ['Fácil', '#22c55e']].map(([l, c]) => (
              <div key={l} style={{ padding: '10px 18px', borderRadius: 999, border: `1px solid ${c}55`, color: c, fontSize: 12, fontWeight: 600 }}>{l}</div>
            ))}
          </div>
        </div>
        {/* Pomodoro */}
        <div style={{ background: PANEL2, padding: 28, borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2, marginBottom: 18 }}>🍅 POMODORO · FOCO</div>
          <div style={{ width: 200, height: 200, borderRadius: '50%', background: `conic-gradient(${CYAN} ${(f / 96) * 360}deg, rgba(255,255,255,0.08) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: 170, height: 170, borderRadius: '50%', background: PANEL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontSize: 38, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{min}:{sec}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>tempo de foco</div>
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= 2 ? CYAN : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Sessão 2 de 4</div>
        </div>
      </div>
    </SceneWrap>
  );
};

// ───────── Scene 6: Biblioteca + Leaderboard ─────────
const SceneLibrary: React.FC = () => {
  const f = useCurrentFrame();
  const stagger = (i: number) => interpolate(f, [i * 5, i * 5 + 18], [0, 1], { extrapolateRight: 'clamp' });
  const books = [
    ['Clean Code', '#00f0ff'],
    ['Pragmatic Programmer', '#a855f7'],
    ['Algoritmos', '#22c55e'],
    ['Design Patterns', '#f59e0b'],
    ['Cracking Coding', '#ec4899'],
    ['SICP', '#3b82f6'],
    ['Refactoring', '#06b6d4'],
    ['Code Complete', '#8b5cf6'],
  ];
  return (
    <SceneWrap dur={144} label="academy.decode/biblioteca">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '100%' }}>
        <div style={{ padding: 28, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Biblioteca Digital</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>PDFs e e-books para download e leitura offline</div>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: 999, background: 'rgba(0,240,255,0.1)', color: CYAN, fontSize: 12 }}>📚 84 livros</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {books.map(([t, c], i) => (
              <div key={t} style={{ opacity: stagger(i), transform: `translateY(${(1 - stagger(i)) * 20}px)` }}>
                <div style={{ aspectRatio: '3/4', borderRadius: 8, background: `linear-gradient(135deg, ${c}, ${c}80)`, position: 'relative', overflow: 'hidden', boxShadow: `0 10px 30px ${c}30` }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12, color: '#fff', fontSize: 11, fontWeight: 700 }}>{t}</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'rgba(0,0,0,0.3)' }} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 6 }}>PDF · {120 + i * 20}p</div>
              </div>
            ))}
          </div>
        </div>
        {/* Leaderboard */}
        <div style={{ background: PANEL2, padding: 22, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5, marginBottom: 12 }}>🏆 RANKING SEMANAL</div>
          {[
            ['🥇', 'Carlos S.', '4820 XP', '#f59e0b'],
            ['🥈', 'Juliana C.', '4560 XP', 'rgba(255,255,255,0.6)'],
            ['🥉', 'Pedro M.', '4310 XP', '#cd7f32'],
            ['4', 'Ana Silva', '2530 XP', CYAN],
            ['5', 'Lucas T.', '2480 XP', 'rgba(255,255,255,0.5)'],
            ['6', 'Maria F.', '2210 XP', 'rgba(255,255,255,0.5)'],
          ].map(([p, n, x, c], i) => (
            <div key={String(n)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: n === 'Ana Silva' ? 'rgba(0,240,255,0.08)' : 'transparent', marginBottom: 4, opacity: stagger(i), border: n === 'Ana Silva' ? `1px solid ${CYAN}40` : '1px solid transparent' }}>
              <div style={{ width: 24, color: c as string, fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{p as string}</div>
              <div style={{ flex: 1, color: '#fff', fontSize: 13 }}>{n as string}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{x as string}</div>
            </div>
          ))}
          <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: `linear-gradient(135deg, rgba(0,240,255,0.15), rgba(168,85,247,0.15))`, border: `1px solid ${CYAN}40`, textAlign: 'center', opacity: interpolate(f, [70, 100], [0, 1], { extrapolateRight: 'clamp' }) }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Decode Analytics Academy</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4 }}>Sua jornada em tecnologia.</div>
          </div>
        </div>
      </div>
    </SceneWrap>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: DARK, fontFamily }}>
      <Series>
        <Series.Sequence durationInFrames={72}><SceneLogin /></Series.Sequence>
        <Series.Sequence durationInFrames={96}><SceneDashboard /></Series.Sequence>
        <Series.Sequence durationInFrames={96}><SceneApostila /></Series.Sequence>
        <Series.Sequence durationInFrames={96}><SceneExercicios /></Series.Sequence>
        <Series.Sequence durationInFrames={96}><SceneStudy /></Series.Sequence>
        <Series.Sequence durationInFrames={144}><SceneLibrary /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
