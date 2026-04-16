import { useState } from 'react';
import { Globe, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const APP_URL = 'https://decodeanalyticsacademy.vercel.app';

export function LiveAppSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Decode Analytics Academy',
      text: 'Plataforma de estudos para alunos de Ciência da Computação — apostilas, exercícios e comunidade.',
      url: APP_URL,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <div
          className="relative rounded-2xl p-6 md:p-10 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(168,85,247,0.06))',
            border: '1px solid rgba(0,240,255,0.18)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'rgba(0,240,255,0.15)' }}
          />

          <div className="relative">
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                // versão online · ao vivo
              </p>
            </div>

            <h2 className="font-display text-2xl md:text-4xl mb-3">
              Acesse o app <span className="text-primary">agora</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl">
              Estamos rodando em produção na Vercel. Abra direto no navegador, instale como PWA
              ou compartilhe com sua turma — tudo pelo mesmo link.
            </p>

            {/* URL Pill */}
            <div
              className="flex items-center gap-2 rounded-xl p-2 pl-4 mb-4"
              style={{
                background: 'rgba(5,5,8,0.6)',
                border: '1px solid rgba(0,240,255,0.25)',
              }}
            >
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs sm:text-sm font-mono text-foreground/90 truncate hover:text-primary transition-colors"
              >
                decodeanalyticsacademy.vercel.app
              </a>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg transition-colors hover:bg-primary/10 shrink-0"
                aria-label="Copiar link"
                title="Copiar link"
              >
                {copied
                  ? <Check className="h-4 w-4 text-primary" />
                  : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: '#00f0ff', color: '#050508' }}
              >
                <ExternalLink className="h-4 w-4" /> Acessar o app
              </a>
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                }}
              >
                <Share2 className="h-4 w-4" /> Compartilhar com a turma
              </button>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-4">
              Hospedado na Vercel · HTTPS · PWA instalável · Funciona offline
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
