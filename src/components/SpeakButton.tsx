import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** Função que retorna o texto a ler. Chamada apenas no clique para evitar custo. */
  getText: () => string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Botão de leitura em voz reutilizável usando Web Speech API (sem custos, offline). */
export function SpeakButton({ getText, label = 'Ouvir em voz', className = '', size = 'md' }: Props) {
  const [state, setState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch {} }, []);

  const cleanText = (raw: string) =>
    raw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#>~]+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const start = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta leitura em voz');
      return;
    }
    const synth = window.speechSynthesis;
    const text = cleanText(getText() || '');
    if (!text) {
      toast.message('Nada para ler');
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 1;
    utter.pitch = 1;
    const voices = synth.getVoices();
    const ptVoice = voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
    if (ptVoice) utter.voice = ptVoice;
    utter.onend = () => setState('idle');
    utter.onerror = () => setState('idle');
    utterRef.current = utter;
    setState('speaking');
    synth.speak(utter);
  };

  const togglePause = () => {
    const synth = window.speechSynthesis;
    if (state === 'speaking') {
      synth.pause();
      setState('paused');
    } else if (state === 'paused') {
      synth.resume();
      setState('speaking');
    }
  };

  const stop = () => {
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
