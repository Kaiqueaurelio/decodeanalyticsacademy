import { Instagram, MessageCircle, Share2, ExternalLink, PenLine, Sparkles, CheckCircle, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_APP_URL = 'https://decodeanalyticsacademydev.vercel.app/';
const SHARE_TEXT = 'Conheça a Decode Analytics Academy — plataforma de estudos para alunos de Tecnologia 🚀';
const WRITELAB_URL = 'https://writelab-one.vercel.app';

const SOCIALS = [
  {
    name: '@kaiqueaurelio.ai',
    label: 'Criador',
    icon: Instagram,
    url: 'https://instagram.com/kaiqueaurelio.ai',
  },
  {
    name: '@decode.analytics',
    label: 'Decode Analytics',
    icon: Instagram,
    url: 'https://instagram.com/decode.analytics',
  },
  {
    name: '+55 11 93922-2885',
    label: 'WhatsApp',
    icon: MessageCircle,
    url: 'https://wa.me/5511939222885?text=' + encodeURIComponent('Olá! Vim pela Decode Analytics 👋'),
  },
];

function buildShareTargets(appUrl: string) {
  return [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + ' ' + appUrl)}`,
    },
    {
      label: 'Telegram',
      icon: Share2,
      href: `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    },
    {
      label: 'Twitter / X',
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(appUrl)}`,
    },
  ];
}

export function SocialAndProjectsSection() {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState<string>(DEFAULT_APP_URL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'share_app_url')
        .maybeSingle();
      const raw = data?.value as unknown;
      if (!cancelled && typeof raw === 'string' && raw.trim()) {
        setAppUrl(raw.trim());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const shareTargets = buildShareTargets(appUrl);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Decode Analytics Academy', text: SHARE_TEXT, url: appUrl });
        return;
      } catch { /* user cancelled */ }
    }
    handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <section className="relative py-20 px-5 overflow-hidden bg-black">
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-[0.05]" style={{ background: '#ffffff' }} />
      <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-[0.05]" style={{ background: '#ffffff' }} />

      <div className="max-w-5xl mx-auto relative space-y-12">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-3">
            // siga · compartilhe · explore
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl leading-tight text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Acompanhe o projeto
            <br />
            e descubra novidades
          </h2>
        </div>

        {/* REDES SOCIAIS */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 mb-4 text-center">
            Nossas redes
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {SOCIALS.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass group rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold truncate text-white">{s.name}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* COMPARTILHAR */}
        <div className="liquid-glass-strong rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
                <Share2 className="h-4 w-4 text-white" strokeWidth={1.5} /> Compartilhar com a turma
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Indique para colegas que também precisam estudar.
              </p>
            </div>
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shrink-0 bg-white text-black"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Compartilhar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {shareTargets.map(t => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold text-white hover:scale-[1.03] transition-transform"
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t.label}
              </a>
            ))}
            <button
              onClick={handleCopy}
              className="liquid-glass flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold text-white hover:scale-[1.03] transition-transform"
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </div>

        {/* WRITELAB */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 mb-4 text-center">
            Conheça nossos outros apps
          </h3>

          <a
            href={WRITELAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-glass-strong group block rounded-2xl p-6 sm:p-8 relative overflow-hidden hover:scale-[1.01] transition-transform"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-[0.08] pointer-events-none" style={{ background: '#ffffff' }} />

            <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-5 items-center">
              <div className="liquid-glass h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 mx-auto md:mx-0">
                <PenLine className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>

              <div className="text-center md:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="liquid-glass text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white/80">
                    <Sparkles className="h-2.5 w-2.5 inline mr-1" strokeWidth={1.5} />
                    Beta
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50">
                    Novo projeto
                  </span>
                </div>
                <h4
                  className="text-2xl sm:text-3xl mb-1 text-white"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  WriteLab
                </h4>
                <p className="text-sm text-white/60 leading-relaxed mb-3">
                  Laboratório de escrita para estudantes — organize textos, ensaios e
                  trabalhos acadêmicos com ferramentas de revisão, estrutura e foco.
                  Em fase beta de testes.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {['Editor de textos', 'Revisão estruturada', 'Foco e produtividade'].map(t => (
                    <span
                      key={t}
                      className="liquid-glass text-[10px] px-2 py-0.5 rounded-full text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform shrink-0 bg-white text-black">
                  Testar agora <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
