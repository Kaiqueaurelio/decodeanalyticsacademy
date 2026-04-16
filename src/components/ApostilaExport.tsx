import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Presentation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

interface Section {
  title: string;
  level: number;
  content: string;
}

function parseContentToSections(raw: string | null): Section[] {
  if (!raw) return [];
  const lines = raw.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*)[.\s\-–]+\s*(.+)/);
    const hashMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (numberedMatch || hashMatch) {
      if (current) sections.push(current);
      const level = numberedMatch ? Math.min(numberedMatch[1].split('.').length, 3) : hashMatch![1].length;
      const title = (numberedMatch ? numberedMatch[2] : hashMatch![2]).trim();
      current = { title, level, content: '' };
    } else {
      if (!current) current = { title: 'Introdução', level: 1, content: '' };
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

async function exportPDF(apostila: Tables<'apostilas'>) {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.style.cssText = 'padding:40px;font-family:sans-serif;max-width:800px;color:#111;';

  const content = apostila.content || '';
  // Convert markdown-style images
  const htmlContent = content
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:12px 0;border-radius:8px;" />')
    .replace(/\n/g, '<br/>');

  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:8px;">${apostila.title}</h1>
    <p style="color:#666;font-size:12px;margin-bottom:24px;">${apostila.category}</p>
    <div style="font-size:14px;line-height:1.8;">${htmlContent}</div>
    <p style="color:#999;font-size:10px;margin-top:32px;text-align:center;">Decode Analytics · Exportado em ${new Date().toLocaleDateString('pt-BR')}</p>
  `;

  await html2pdf().set({
    margin: [15, 15, 15, 15],
    filename: `${apostila.title}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(container).save();
}

async function exportPPTX(apostila: Tables<'apostilas'>) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const sections = parseContentToSections(apostila.content);

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0F172A' };
  titleSlide.addText(apostila.title, {
    x: 0.8, y: 1.5, w: 11.5, h: 2,
    fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Arial',
  });
  titleSlide.addText(apostila.category, {
    x: 0.8, y: 3.6, w: 11.5, h: 0.6,
    fontSize: 16, color: 'D0FF00', fontFace: 'Arial',
  });
  titleSlide.addText('Decode Analytics', {
    x: 0.8, y: 6.5, w: 11.5, h: 0.4,
    fontSize: 10, color: '888888', fontFace: 'Arial',
  });

  // Content slides
  for (const section of sections) {
    if (section.level > 2) continue; // skip sub-subsections
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    slide.addText(section.title, {
      x: 0.8, y: 0.4, w: 11.5, h: 0.8,
      fontSize: 24, bold: true, color: '0F172A', fontFace: 'Arial',
    });

    // Add a subtle divider
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 1.25, w: 2, h: 0.04, fill: { color: 'D0FF00' },
    });

    const text = section.content.trim();
    if (text) {
      // Check for images
      const imgMatch = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const cleanText = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim();

      if (cleanText) {
        slide.addText(cleanText.substring(0, 1500), {
          x: 0.8, y: 1.5, w: imgMatch ? 6 : 11.5, h: 5,
          fontSize: 13, color: '333333', fontFace: 'Arial',
          valign: 'top', wrap: true, lineSpacingMultiple: 1.3,
        });
      }

      if (imgMatch) {
        try {
          slide.addImage({
            path: imgMatch[2],
            x: 7.5, y: 1.5, w: 4.8, h: 3.5,
          });
        } catch {}
      }
    }
  }

  await pptx.writeFile({ fileName: `${apostila.title}.pptx` });
}

export function ApostilaExport({ apostila }: { apostila: Tables<'apostilas'> }) {
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null);

  const handleExport = async (type: 'pdf' | 'pptx') => {
    setExporting(type);
    try {
      if (type === 'pdf') await exportPDF(apostila);
      else await exportPPTX(apostila);
      toast.success(`${type.toUpperCase()} exportado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 hover-lift" disabled={!!exporting}>
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
          <FileText className="h-4 w-4" /> Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pptx')} className="gap-2">
          <Presentation className="h-4 w-4" /> Exportar PowerPoint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
