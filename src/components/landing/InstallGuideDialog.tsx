import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Smartphone } from 'lucide-react';

interface InstallGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appOrigin: string;
}

export function InstallGuideDialog({ open, onOpenChange, appOrigin }: InstallGuideDialogProps) {
  const displayUrl = appOrigin.replace(/^https?:\/\//, '');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        style={{ background: '#0a0a12', border: '1px solid rgba(0,240,255,0.1)', color: '#e2e8f0' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Smartphone className="w-5 h-5" style={{ color: '#00f0ff' }} />
            Instalar o App
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Para instalar, abra o site publicado no navegador do seu celular:
          </p>
          <div
            className="p-3 rounded-lg"
            style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.12)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#00f0ff' }}>
              Link:
            </p>
            <a
              href={appOrigin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline break-all"
              style={{ color: '#00f0ff' }}
            >
              {displayUrl}
            </a>
          </div>
          <div className="space-y-3 text-sm" style={{ color: '#94a3b8' }}>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>
                iPhone / iPad (Safari)
              </p>
              <p>
                1. Abra no <strong>Safari</strong> → 2. <strong>Compartilhar ↑</strong> → 3.{' '}
                <strong>Adicionar à Tela</strong>
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>
                Android (Chrome)
              </p>
              <p>
                1. Abra no <strong>Chrome</strong> → 2. <strong>Menu ⋮</strong> → 3.{' '}
                <strong>Instalar app</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: '#00f0ff', color: '#050508' }}
          >
            Entendi
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
