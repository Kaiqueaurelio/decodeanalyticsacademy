import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Pause, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  getText: () => string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  voiceId?: string;
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

/** Divide texto em chunks ~maxLen respeitando frases. */
const chunkText = (text: string, maxLen = 3800): string[] => {
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

export function SpeakButton({ getText, label = 'Ouvir em voz', className = '', size = 'md', voiceId }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'speaking' | 'paused'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const cancelledRef = useRef(false);
  const useFallbackRef = useRef(false);

  useEffect(() => () => {
    cancelledRef.current = true;
    try { audioRef.current?.pause(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  // ===== Fallback Web Speech API =====
  const speakNextNative = () => {
    if (cancelledRef.current) return;
    const synth = window.speechSynthesis;
    if (indexRef.current >= queueRef.current.length) {
      setState('idle');
      return;
    }
    const chunk = queueRef.current[indexRef.current];
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.lang = 'pt-BR';
    const voices = synth.getVoices();
    const ptVoice = voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
    if (ptVoice) utter.voice = ptVoice;
    utter.onend = () => { indexRef.current += 1; speakNextNative(); };
    utter.onerror = (e: any) => {
      if (e?.error === 'canceled' || e?.error === 'interrupted') return;
      indexRef.current += 1;
      speakNextNative();
    };
    synth.speak(utter);
  };

  const startNativeFallback = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta leitura em voz');
      setState('idle');
      return;
    }
    useFallbackRef.current = true;
    const synth = window.speechSynthesis;
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0; primer.lang = 'pt-BR';
    synth.cancel(); synth.speak(primer);
    queueRef.current = chunkText(text, 200);
    indexRef.current = 0;
    setState('speaking');
    setTimeout(() => speakNextNative(), 50);
  };

  // ===== ElevenLabs =====
  const playNextElevenLabs = async () => {
    if (cancelledRef.current) return;
    if (indexRef.current >= queueRef.current.length) {
      setState('idle');
      return;
    }
    const chunk = queueRef.current[indexRef.current];
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text: chunk, voiceId },
      });
      if (error || !data?.audioContent) throw new Error(error?.message || 'no audio');

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { indexRef.current += 1; playNextElevenLabs(); };
      audio.onerror = () => { indexRef.current += 1; playNextElevenLabs(); };
      setState('speaking');
      await audio.play();
    } catch (e) {
      console.warn('[SpeakButton] ElevenLabs falhou, fallback nativo:', e);
      // Fallback: junta restante e usa Web Speech
      const remaining = queueRef.current.slice(indexRef.current).join(' ');
      startNativeFallback(remaining);
    }
  };

  const start = async () => {
    const text = cleanText(getText() || '');
    if (!text) { toast.message('Nada para ler'); return; }

    cancelledRef.current = false;
    useFallbackRef.current = false;
    indexRef.current = 0;
    queueRef.current = chunkText(text, 3800);
    setState('loading');

    // iOS: destrava audio context com play silencioso síncrono
    try {
      const silent = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//FJAhN89UrU7T1pTPNVT3X8JP/9vpfwj/r/0/9/3P//');
      silent.volume = 0;
      await silent.play().catch(() => {});
    } catch {}

    await playNextElevenLabs();
  };

  const togglePause = () => {
    if (useFallbackRef.current) {
      const synth = window.speechSynthesis;
      if (state === 'speaking') { synth.pause(); setState('paused'); }
      else if (state === 'paused') { synth.resume(); setState('speaking'); }
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (state === 'speaking') { a.pause(); setState('paused'); }
    else if (state === 'paused') { a.play(); setState('speaking'); }
  };

  const stop = () => {
    cancelledRef.current = true;
    queueRef.current = [];
    indexRef.current = 0;
    try { audioRef.current?.pause(); audioRef.current = null; } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
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

  if (state === 'loading') {
    return (
      <button
        disabled
        className={`inline-flex items-center font-bold rounded-full bg-primary/80 text-primary-foreground shadow-md ${sizeCls} ${className}`}
      >
        <Loader2 className={`${iconCls} animate-spin`} />
        Carregando voz...
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
