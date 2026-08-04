import { getSubjectColor } from '@/lib/subject-colors';
import { DEFAULT_COVER_THEME, type CoverTheme } from '@/lib/cover-theme';

export const COVER_W = 600;
export const COVER_H = 900;

export interface CoverSubject {
  title: string;
  category?: string | null;
  semester?: number | null;
  teacher?: string | null;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function applyTokens(tpl: string, s: CoverSubject) {
  return tpl
    .replace(/\{categoria\}/gi, s.category || 'Estudos')
    .replace(/\{titulo\}/gi, s.title)
    .replace(/\{professor\}/gi, s.teacher || '')
    .replace(/\{semestre\}/gi, s.semester ? `${s.semester}º semestre` : 'Extracurricular');
}

/** Quebra o título em linhas por largura aproximada de caractere */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const joinedLen = lines.join(' ').length;
    if (joinedLen < text.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  }
  return lines;
}

export function buildCoverSvg(subject: CoverSubject, theme: CoverTheme = DEFAULT_COVER_THEME): string {
  const { grid, palette, typography: t, content } = theme;
  const accent =
    palette.accentMode === 'subject' ? getSubjectColor(subject.category || 'Geral') : palette.accentColor;

  const m = grid.margin;
  const kicker = applyTokens(content.kicker, subject).toUpperCase();
  const subtitle = applyTokens(content.subtitle, subject);
  const signature = applyTokens(content.signature, subject);

  const maxChars = Math.max(8, Math.round(((COVER_W - m * 2) / (t.titleSize * 0.5)) * 1));
  const titleLines = wrap(subject.title, maxChars, 4);
  const lineHeight = t.titleSize * 1.08;

  const gridLines: string[] = [];
  if (grid.enabled && grid.size > 4) {
    for (let x = grid.size; x < COVER_W; x += grid.size)
      gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${COVER_H}" />`);
    for (let y = grid.size; y < COVER_H; y += grid.size)
      gridLines.push(`<line x1="0" y1="${y}" x2="${COVER_W}" y2="${y}" />`);
  }

  const titleBaseline = COVER_H - m - 150;
  const titleTop = titleBaseline - (titleLines.length - 1) * lineHeight;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}" viewBox="0 0 ${COVER_W} ${COVER_H}" role="img" aria-label="${esc(subject.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${palette.background}"/>
      <stop offset="100%" stop-color="${palette.backgroundAlt}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.15" r="0.7">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${COVER_W}" height="${COVER_H}" fill="url(#bg)"/>
  <rect width="${COVER_W}" height="${COVER_H}" fill="url(#glow)"/>
  <g stroke="${palette.text}" stroke-opacity="${grid.opacity}" stroke-width="1">${gridLines.join('')}</g>
  ${grid.accentBar > 0 ? `<rect x="0" y="0" width="${COVER_W}" height="${grid.accentBar}" fill="${accent}"/>` : ''}
  ${grid.rules ? `<line x1="${m}" y1="${m + 46}" x2="${COVER_W - m}" y2="${m + 46}" stroke="${palette.muted}" stroke-opacity="0.35"/>` : ''}
  <text x="${m}" y="${m + 26}" fill="${accent}" font-family="${esc(t.kickerFont)}" font-size="${t.kickerSize}" font-weight="600" letter-spacing="${t.kickerTracking}">${esc(kicker)}</text>
  <g fill="${palette.text}" font-family="${esc(t.titleFont)}" font-size="${t.titleSize}" ${t.titleItalic ? 'font-style="italic"' : ''}>
    ${titleLines
      .map((l, i) => `<text x="${m}" y="${titleTop + i * lineHeight}">${esc(l)}</text>`)
      .join('\n    ')}
  </g>
  <text x="${m}" y="${COVER_H - m - 92}" fill="${palette.muted}" font-family="${esc(t.subtitleFont)}" font-size="${t.subtitleSize}">${esc(subtitle)}</text>
  ${grid.rules ? `<line x1="${m}" y1="${COVER_H - m - 62}" x2="${COVER_W - m}" y2="${COVER_H - m - 62}" stroke="${palette.muted}" stroke-opacity="0.35"/>` : ''}
  <circle cx="${m + 5}" cy="${COVER_H - m - 27}" r="5" fill="${accent}"/>
  <text x="${m + 20}" y="${COVER_H - m - 22}" fill="${palette.text}" fill-opacity="0.85" font-family="${esc(t.signatureFont)}" font-size="${t.signatureSize}" letter-spacing="1.5">${esc(signature)}</text>
</svg>`;
  return svg;
}

export function buildCoverDataUri(subject: CoverSubject, theme?: CoverTheme): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildCoverSvg(subject, theme))}`;
}
