/**
 * SplashDownloader — gera um PNG 1080x1920 idêntico à tela de splash
 * (logo da coruja sobre fundo escuro com brilho ciano/amarelo) para o admin
 * baixar e usar em lojas/apps/branding.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logoDecode from '@/assets/owl-icon.png';

type Size = { w: number; h: number; label: string; file: string };

const SIZES: Size[] = [
  { w: 1080, h: 1920, label: 'Vertical (1080×1920)', file: 'splash-1080x1920.png' },
  { w: 1920, h: 1080, label: 'Horizontal (1920×1080)', file: 'splash-1920x1080.png' },
  { w: 1024, h: 1024, label: 'Quadrado (1024×1024)', file: 'splash-1024x1024.png' },
];

async function renderSplash(size: Size): Promise<Blob> {
  const { w, h } = size;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Fundo base
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, h);

  // Gradiente linear de profundidade
  const lin = ctx.createLinearGradient(0, 0, w, h);
  lin.addColorStop(0, 'rgba(4,6,12,0.96)');
  lin.addColorStop(0.38, 'rgba(5,5,8,0.86)');
  lin.addColorStop(0.72, 'rgba(3,18,28,0.92)');
  lin.addColorStop(1, 'rgba(5,5,8,0.98)');
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, w, h);

  // Glow ciano central
  const cyan = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.6);
  cyan.addColorStop(0, 'rgba(0,240,255,0.34)');
  cyan.addColorStop(0.28, 'rgba(0,240,255,0.1)');
  cyan.addColorStop(0.54, 'rgba(0,240,255,0)');
  ctx.fillStyle = cyan;
  ctx.fillRect(0, 0, w, h);

  // Glow amarelo abaixo
  const yellow = ctx.createRadialGradient(w * 0.48, h * 0.56, 0, w * 0.48, h * 0.56, Math.max(w, h) * 0.6);
  yellow.addColorStop(0, 'rgba(223,255,31,0.12)');
  yellow.addColorStop(0.28, 'rgba(223,255,31,0.04)');
  yellow.addColorStop(0.58, 'rgba(223,255,31,0)');
  ctx.fillStyle = yellow;
  ctx.fillRect(0, 0, w, h);

  // Grade neon sutil
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = 'rgba(0,240,255,0.5)';
  ctx.lineWidth = 1;
  const step = Math.round(Math.min(w, h) / 20);
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(223,255,31,0.35)';
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();

  // Carrega logo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = logoDecode;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('logo'));
  });

  // Brilho atrás do logo
  const cx = w / 2;
  const cy = h / 2;
  const logoSize = Math.min(w, h) * 0.55;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, logoSize * 0.9);
  glow.addColorStop(0, 'rgba(0,240,255,0.28)');
  glow.addColorStop(0.38, 'rgba(223,255,31,0.06)');
  glow.addColorStop(0.7, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Logo com drop-shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,240,255,0.62)';
  ctx.shadowBlur = 60;
  ctx.drawImage(img, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
  ctx.shadowColor = 'rgba(223,255,31,0.35)';
  ctx.shadowBlur = 120;
  ctx.drawImage(img, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
  ctx.restore();

  return await new Promise<Blob>((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png');
  });
}

export function SplashDownloader() {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (size: Size) => {
    setBusy(size.file);
    try {
      const blob = await renderSplash(size);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = size.file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Imagem baixada: ${size.file}`);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao gerar a imagem.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Imagem de abertura (Splash)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Baixe a imagem mostrada quando o app é iniciado. Útil para lojas de apps, materiais de divulgação e branding.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {SIZES.map((s) => (
          <Button
            key={s.file}
            variant="outline"
            size="sm"
            onClick={() => download(s)}
            disabled={busy !== null}
            className="justify-start"
          >
            {busy === s.file ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-2" />
            )}
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
