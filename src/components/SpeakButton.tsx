import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Pause, Play } from 'lucide-react';
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

const chunkText = (text: string, maxLen = 200): string[] => {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    const sentence = s.trim();
    if (!sentence) continue;
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

/** Escolhe a voz PT-BR mais natural disponível no dispositivo. */
const pickBestPtVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
  const pt = voices.filter(v => v.lang?.toLowerCase().startsWith('pt'));
  if (!pt.length) return undefined;

  // Prioridades por qualidade de voz (neurais/premium primeiro)
  const priorities = [
    /google.*portugu/i,            // Google PT-BR (Chrome/Android) — mais natural
    /microsoft.*(francisca|antonio|thalita|brenda|elza|fabiola|giovanna|leticia|manuela|yara).*natural/i,
    /microsoft.*natural/i,         // Microsoft Neural voices (Edge)
    /microsoft.*(francisca|antonio|maria|daniel|helena)/i,
    /luciana|joana|catarina/i,     // Apple premium PT (iOS/macOS)
    /pt.?br/i,
    /pt/i,
  ];

  for (const re of priorities) {
    const match = pt.find(v => re.test(v.name) || re.test(v.lang));
    if (match) return match;
  }
  return pt[0];
};

export function SpeakButton({ getText, label = 'Ouvir em voz', className = '', size = 'md' }: Props) {
  const [state, setState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const cancelledRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);

  useEffect(() => {
    // Pré-carrega lista de vozes (algumas plataformas só populam após onvoiceschanged)
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const load = () => { voiceRef.current = pickBestPtVoice(synth.getVoices()); };
    load();
    synth.onvoiceschanged = load;
    return () => { try { synth.cancel(); } catch {} };
  }, []);

  const speakNext = () => {
    if (cancelledRef.current) return;
    const synth = window.speechSynthesis;
    if (indexRef.current >= queueRef.current.length) {
      setState('idle');
      return;
    }
    const chunk = queueRef.current[indexRef.current];
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.lang = 'pt-BR';
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    const voice = voiceRef.current || pickBestPtVoice(synth.getVoices());
    if (voice) utter.voice = voice;
    utter.onend = () => { indexRef.current += 1; speakNext(); };
    utter.onerror = (e: any) => {
      if (e?.error === 'canceled' || e?.error === 'interrupted') return;
      indexRef.current += 1;
      speakNext();
    };
    synth.speak(utter);
  };

  const start = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta leitura em voz');
      return;
    }
    const synth = window.speechSynthesis;

    // iOS Safari: precisa de speak() síncrono no gesto do usuário
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0; primer.lang = 'pt-BR';
    synth.cancel();
    synth.speak(primer);

    const text = cleanText(getText() || '');
    if (!text) { toast.message('Nada para ler'); return; }

    // Garante que pegamos a melhor voz disponível neste momento
    voiceRef.current = pickBestPtVoice(synth.getVoices());

    queueRef.current = chunkText(text, 200);
    indexRef.current = 0;
    cancelledRef.current = false;
    setState('speaking');
    setTimeout(() => speakNext(), 50);
  };

  const togglePause = () => {
    const synth = window.speechSynthesis;
    if (state === 'speaking') { synth.pause(); setState('paused'); }
    else if (state === 'paused') { synth.resume(); setState('speaking'); }
  };

  const stop = () => {
    cancelledRef.current = true;
    queueRef.current = [];
    indexRef.current = 0;
    window.speechSynthesis?.cancel();
    setState('idle');
  };

  const sizeCls =
    size === 'sm' ? 'h-8 px-3 text-xs gap-1.5' :
    size === 'lg' ? 'h-11 px-5 text-sm gap-2' :
    'h-9 px-4 text-xs gap-1.5';
  const iconCls = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  if (state === 'idle') {
    return (
      <button
        onClick={start}
        className={`inline-flex items-center font-bold rounded-full bg-primary text-primary-foreground shadow-md hover:brightness-110 hover:-translate-y-px transition-all ${sizeCls} ${className}`}
      >
        <Volume2 className={iconCls} />
        {label}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
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
  );
}
