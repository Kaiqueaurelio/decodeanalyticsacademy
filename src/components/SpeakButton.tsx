import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Pause, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  getText: () => string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const cleanText = (raw: string) =>
  raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>~]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Google Translate TTS aceita até ~200 chars por chamada. Dividimos respeitando frases. */
const chunkText = (text: string, maxLen = 190): string[] => {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    let sentence = s.trim();
    if (!sentence) continue;
    // Frase muito longa: quebra por vírgula/espaço
    while (sentence.length > maxLen) {
      let cut = sentence.lastIndexOf(',', maxLen);
      if (cut < 50) cut = sentence.lastIndexOf(' ', maxLen);
      if (cut < 50) cut = maxLen;
      chunks.push(sentence.slice(0, cut).trim());
      sentence = sentence.slice(cut).trim();
    }
    if ((current + ' ' + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

const googleTtsUrl = (text: string) =>
  `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=pt-BR&client=tw-ob`;

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;
type Speed = typeof SPEED_OPTIONS[number];

export function SpeakButton({ getText, label = 'Ouvir em voz', className = '', size = 'md' }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'speaking' | 'paused'>('idle');
  const [speed, setSpeed] = useState<Speed>(() => {
    const saved = parseFloat(localStorage.getItem('speak_speed') || '1');
    return (SPEED_OPTIONS as readonly number[]).includes(saved) ? (saved as Speed) : 1;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const cancelledRef = useRef(false);

  const applySpeed = (s: Speed) => {
    setSpeed(s);
    localStorage.setItem('speak_speed', String(s));
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  useEffect(() => () => {
    cancelledRef.current = true;
    try { audioRef.current?.pause(); audioRef.current = null; } catch {}
  }, []);

  const playNext = () => {
    if (cancelledRef.current) return;
    if (indexRef.current >= queueRef.current.length) {
      setState('idle');
      return;
    }
    const chunk = queueRef.current[indexRef.current];
    const audio = new Audio(googleTtsUrl(chunk));
    audio.preload = 'auto';
    audio.playbackRate = speed;
    audioRef.current = audio;

    audio.onplaying = () => setState('speaking');
    audio.onended = () => { indexRef.current += 1; playNext(); };
    audio.onerror = () => {
      console.warn('[SpeakButton] erro no chunk', indexRef.current);
      indexRef.current += 1;
      playNext();
    };

    audio.play().catch((err) => {
      console.warn('[SpeakButton] play() falhou:', err);
      indexRef.current += 1;
      playNext();
    });
  };

  const start = () => {
    const text = cleanText(getText() || '');
    if (!text) { toast.message('Nada para ler'); return; }

    // Destrava áudio no iOS com play silencioso síncrono no gesto
    try {
      const silent = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//FJAhN89UrU7T1pTPNVT3X8JP/9vpfwj/r/0/9/3P//');
      silent.volume = 0;
      silent.play().catch(() => {});
    } catch {}

    queueRef.current = chunkText(text, 190);
    indexRef.current = 0;
    cancelledRef.current = false;
    setState('loading');
    playNext();
  };

  const togglePause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'speaking') { a.pause(); setState('paused'); }
    else if (state === 'paused') { a.play().catch(() => {}); setState('speaking'); }
  };

  const stop = () => {
    cancelledRef.current = true;
    queueRef.current = [];
    indexRef.current = 0;
    try { audioRef.current?.pause(); audioRef.current = null; } catch {}
    setState('idle');
  };

  const sizeCls =
    size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' :
    size === 'lg' ? 'h-11 px-5 text-sm gap-2' :
    'h-9 px-4 text-xs gap-1.5';
  const iconCls = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const SpeedSelector = (
    <div className="inline-flex items-center rounded-full bg-muted/60 backdrop-blur p-0.5 gap-0.5 border border-border/50">
      {SPEED_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => applySpeed(s)}
          className={`px-2 h-7 rounded-full text-[10px] font-bold transition-all ${
            speed === s
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={`Velocidade ${s}x`}
        >
          {s}x
        </button>
      ))}
    </div>
  );

  if (state === 'idle') {
    return (
      <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
        <button
          onClick={start}
          className={`inline-flex items-center font-bold rounded-full bg-primary text-primary-foreground shadow-md hover:brightness-110 hover:-translate-y-px transition-all ${sizeCls}`}
        >
          <Volume2 className={iconCls} />
          {label}
        </button>
        {SpeedSelector}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
        <button disabled className={`inline-flex items-center font-bold rounded-full bg-primary/80 text-primary-foreground shadow-md ${sizeCls}`}>
          <Loader2 className={`${iconCls} animate-spin`} />
          Carregando...
        </button>
        {SpeedSelector}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <div className="inline-flex items-center gap-1">
        <button
          onClick={togglePause}
          className={`inline-flex items-center font-bold rounded-full bg-primary text-primary-foreground shadow-md hover:brightness-110 transition-all ${sizeCls}`}
        >
          {state === 'speaking' ? <Pause className={iconCls} /> : <Play className={iconCls} />}
          {state === 'speaking' ? 'Pausar' : 'Continuar'}
        </button>
        <button
          onClick={stop}
          className={`inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:brightness-110 transition-all ${size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'}`}
          title="Parar leitura"
        >
          <Square className={iconCls} />
        </button>
      </div>
      {SpeedSelector}
    </div>
  );
}
