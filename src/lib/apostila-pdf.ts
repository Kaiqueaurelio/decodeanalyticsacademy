import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
}

interface ExportOpts {
  title: string;
  category: string;
  sections: Section[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/** Constrói o HTML "print-ready" da apostila inteira, fora da tela. */
function buildPrintContainer({ title, category, sections }: ExportOpts): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: 794px; /* A4 @ 96dpi */
    background: #ffffff; color: #111827;
    font-family: 'Georgia', 'Times New Roman', serif;
    padding: 56px 64px 80px;
    box-sizing: border-box;
    line-height: 1.7;
  `;

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ========== CAPA ==========
  const cover = document.createElement('div');
  cover.style.cssText = `
    height: 940px; display: flex; flex-direction: column;
    justify-content: space-between; page-break-after: always;
    border-top: 6px solid #0ea5e9;
    border-bottom: 1px solid #e5e7eb;
  `;
  cover.innerHTML = `
    <div style="padding-top: 60px;">
      <div style="font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #0ea5e9; margin-bottom: 28px;">
        Decode Analytics Academy
      </div>
      <div style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">
        ${escapeHtml(category)}
      </div>
      <h1 style="font-size: 44px; line-height: 1.15; margin: 0 0 24px 0; font-weight: 700; color: #0f172a; font-family: 'Georgia', serif;">
        ${escapeHtml(title)}
      </h1>
      <div style="height: 3px; width: 80px; background: #0ea5e9; margin-top: 8px;"></div>
    </div>
    <div style="font-size: 12px; color: #6b7280; line-height: 1.6;">
      <div>Material didático · ${sections.length} seções</div>
      <div style="margin-top: 4px;">Gerado em ${today}</div>
      <div style="margin-top: 18px; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8;">
        Desenvolvido por: Kaique Aurelio &amp; Decode Analytics
      </div>
    </div>
  `;
  wrap.appendChild(cover);

  // ========== SUMÁRIO ==========
  if (sections.length > 1) {
    const toc = document.createElement('div');
    toc.style.cssText = 'page-break-after: always; padding-top: 8px;';
    toc.innerHTML = `
      <div style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">
        Índice
      </div>
      <h2 style="font-size: 26px; margin: 0 0 24px 0; color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
        Sumário
      </h2>
      <ol style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
        ${sections.map((s, i) => `
          <li style="display: flex; align-items: baseline; gap: 12px; margin-bottom: ${s.level === 1 ? '12px' : '6px'}; padding-left: ${(s.level - 1) * 18}px; ${s.level === 1 ? 'font-weight: 600; color: #0f172a;' : 'color: #475569; font-size: 13px;'}">
            <span style="font-family: 'Courier New', monospace; font-size: 11px; color: #94a3b8; min-width: 28px;">${String(i + 1).padStart(2, '0')}</span>
            <span style="flex: 1;">${escapeHtml(stripMd(s.title))}</span>
          </li>
        `).join('')}
      </ol>
    `;
    wrap.appendChild(toc);
  }

  // ========== SEÇÕES ==========
  const audioLinks: { label: string; url: string }[] = [];

  sections.forEach((section, idx) => {
    const sec = document.createElement('section');
    sec.style.cssText = 'margin-bottom: 32px;';

    const num = String(idx + 1).padStart(2, '0');
    const titleClean = escapeHtml(stripMd(section.title));

    if (section.level === 1) {
      sec.innerHTML = `
        <div style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #0ea5e9; margin-bottom: 6px;">
          Seção ${num}
        </div>
        <h2 style="font-size: 26px; line-height: 1.25; margin: 0 0 6px 0; color: #0f172a; font-family: 'Georgia', serif;">${titleClean}</h2>
        <div style="height: 2px; width: 48px; background: #0ea5e9; margin-bottom: 20px;"></div>
      `;
    } else if (section.level === 2) {
      sec.innerHTML = `
        <h3 style="font-size: 20px; margin: 24px 0 12px 0; color: #0f172a; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; font-family: 'Georgia', serif;">${titleClean}</h3>
      `;
    } else {
      sec.innerHTML = `
        <h4 style="font-size: 16px; margin: 18px 0 10px 0; color: #0369a1; font-family: 'Georgia', serif;">${titleClean}</h4>
      `;
    }

    const body = document.createElement('div');
    body.innerHTML = renderMarkdownToHtml(section.content, audioLinks);
    sec.appendChild(body);

    wrap.appendChild(sec);
  });

  // ========== ÁUDIOS (lista no fim, se houver) ==========
  if (audioLinks.length) {
    const audioBlock = document.createElement('div');
    audioBlock.style.cssText = 'margin-top: 40px; padding: 18px 20px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;';
    audioBlock.innerHTML = `
      <div style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #0369a1; margin-bottom: 10px;">
        Áudios explicativos
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155;">
        ${audioLinks.map((a) => `<li style="margin-bottom: 6px;">${escapeHtml(a.label)} — <a href="${escapeAttr(a.url)}" style="color: #0ea5e9; word-break: break-all;">${escapeHtml(a.url)}</a></li>`).join('')}
      </ul>
    `;
    wrap.appendChild(audioBlock);
  }

  document.body.appendChild(wrap);
  return wrap;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function stripMd(s: string): string {
  return (s || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/g, '')
    .trim();
}

const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i;

/** Mini-renderer markdown → HTML inline para o PDF. */
function renderMarkdownToHtml(raw: string, audioBucket: { label: string; url: string }[]): string {
  if (!raw) return '';
  const out: string[] = [];

  // separa blocos de código primeiro
  const codeRe = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const segments: { text: string; code?: { lang: string; code: string } }[] = [];
  while ((m = codeRe.exec(raw)) !== null) {
    if (m.index > lastIdx) segments.push({ text: raw.slice(lastIdx, m.index) });
    segments.push({ text: '', code: { lang: m[1] || 'text', code: m[2].replace(/\n$/, '') } });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < raw.length) segments.push({ text: raw.slice(lastIdx) });

  for (const seg of segments) {
    if (seg.code) {
      out.push(`
        <div style="margin: 14px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #f8fafc;">
          <div style="padding: 6px 12px; background: #f1f5f9; font-family: 'Courier New', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; border-bottom: 1px solid #e5e7eb;">${escapeHtml(seg.code.lang)}</div>
          <pre style="margin: 0; padding: 12px 14px; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.55; color: #0f172a; white-space: pre-wrap; word-break: break-word;">${escapeHtml(seg.code.code)}</pre>
        </div>
      `);
      continue;
    }

    const lines = seg.text.split('\n');
    let para: string[] = [];
    let listBuf: string[] = [];

    const flushPara = () => {
      const t = para.join(' ').trim();
      if (t) out.push(`<p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.75; color: #1f2937; text-align: justify;">${inlineMd(t)}</p>`);
      para = [];
    };
    const flushList = () => {
      if (!listBuf.length) return;
      out.push(`<ul style="margin: 0 0 14px 18px; padding: 0; font-size: 13px; line-height: 1.7; color: #1f2937;">${listBuf.map((li) => `<li style="margin-bottom: 6px;">${inlineMd(li)}</li>`).join('')}</ul>`);
      listBuf = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { flushPara(); flushList(); continue; }
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) { flushPara(); flushList(); continue; }

      // imagem
      const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (img) {
        const url = img[2]; const label = img[1];
        flushPara(); flushList();
        if (AUDIO_RE.test(url)) {
          audioBucket.push({ label: label || 'Áudio explicativo', url });
        } else {
          out.push(`
            <figure style="margin: 16px 0; text-align: center;">
              <img src="${escapeAttr(url)}" alt="${escapeAttr(label)}" crossorigin="anonymous" style="max-width: 100%; max-height: 360px; border: 1px solid #e5e7eb; border-radius: 6px;" />
              ${label ? `<figcaption style="font-size: 11px; color: #6b7280; font-style: italic; margin-top: 6px;">${escapeHtml(label)}</figcaption>` : ''}
            </figure>
          `);
        }
        continue;
      }

      // áudio link cru
      if (/^https?:\/\/\S+$/.test(trimmed) && AUDIO_RE.test(trimmed)) {
        audioBucket.push({ label: 'Áudio explicativo', url: trimmed });
        continue;
      }

      // blockquote
      if (/^>\s+/.test(trimmed)) {
        flushPara(); flushList();
        const q = trimmed.replace(/^>\s+/, '');
        out.push(`<blockquote style="margin: 14px 0; padding: 10px 16px; border-left: 4px solid #0ea5e9; background: #f0f9ff; font-style: italic; color: #334155; font-size: 13px;">${inlineMd(q)}</blockquote>`);
        continue;
      }

      // lista
      const li = trimmed.match(/^[*+\-•]\s+(.+)$/);
      if (li) { flushPara(); listBuf.push(li[1]); continue; }

      // callout "Importante: ..."
      if (/^\*?\*?(Importante|Dica|Atenção|Observação|Nota):\*?\*?\s+/i.test(trimmed)) {
        flushPara(); flushList();
        const [, kind, rest] = trimmed.match(/^\*?\*?(Importante|Dica|Atenção|Observação|Nota):\*?\*?\s+(.+)$/i)!;
        out.push(`
          <div style="margin: 14px 0; padding: 12px 14px; background: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 4px; font-size: 13px; color: #422006;">
            <strong style="display: block; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #92400e; margin-bottom: 4px;">${escapeHtml(kind)}</strong>
            ${inlineMd(rest)}
          </div>
        `);
        continue;
      }

      // heading hash residual
      const h = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (h) {
        flushPara(); flushList();
        const lvl = h[1].length;
        const sz = [22, 18, 16, 15, 14, 13][Math.min(lvl - 1, 5)];
        out.push(`<h${Math.min(lvl + 2, 6)} style="font-size: ${sz}px; margin: 18px 0 8px 0; color: #0f172a;">${inlineMd(h[2])}</h${Math.min(lvl + 2, 6)}>`);
        continue;
      }

      flushList();
      para.push(line);
    }
    flushPara();
    flushList();
  }

  return out.join('\n');
}

function inlineMd(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<![*\w])\*([^*\n]+?)\*(?!\w)/g, '<em>$1</em>')
    .replace(/(?<![_\w])_([^_\n]+?)_(?!\w)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="font-family: \'Courier New\', monospace; font-size: 12px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #0ea5e9;">$1</a>');
}

/**
 * Exporta a apostila inteira como PDF A4 (multi-página).
 * Renderiza um container off-screen + html2canvas + jspdf.
 */
export async function exportApostilaToPDF(opts: ExportOpts): Promise<void> {
  const container = buildPrintContainer(opts);

  // espera imagens carregarem
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) return res();
          img.onload = () => res();
          img.onerror = () => res();
        })
    )
  );

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const footerH = 28;
    const usableH = pageHeight - footerH;

    const imgW = pageWidth;
    const imgH = (canvas.height * imgW) / canvas.width;

    // pagina o canvas em fatias de altura usableH
    const pxPerPage = (canvas.width / imgW) * usableH;
    let renderedHeight = 0;
    let pageIdx = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pxPerPage, canvas.height - renderedHeight);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, sliceHeight);
      ctx.drawImage(canvas, 0, -renderedHeight);

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      if (pageIdx > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, (sliceHeight * imgW) / canvas.width);

      // rodapé
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.text(
        'Desenvolvido por: Kaique Aurelio & Decode Analytics',
        24,
        pageHeight - 12
      );
      pdf.text(
        `${pageIdx + 1}`,
        pageWidth - 24,
        pageHeight - 12,
        { align: 'right' }
      );

      renderedHeight += sliceHeight;
      pageIdx++;
    }

    pdf.save(`${slugify(opts.title) || 'apostila'}.pdf`);
  } finally {
    container.remove();
  }
}
