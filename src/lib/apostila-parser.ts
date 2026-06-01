export interface ApostilaSection {
  id: string;
  title: string;
  level: number;
  content: string;
}

const IMG_LINE_RE = /^\s*!\[[^\]]*\]\([^)]+\)\s*$/;

function isNumberedHeadingCandidate(number: string, title: string) {
  const cleanTitle = title.trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);

  if (!cleanTitle) return false;
  if (cleanTitle.length > 90 || words.length > 12) return false;
  if (/[.!?;:]$/.test(cleanTitle)) return false;

  // Top-level numbered lines are often questions or ordered-list items.
  // Only split them into sections when they look like compact topic titles.
  if (!number.includes('.')) {
    return words.length <= 6 && /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9]/.test(cleanTitle);
  }

  // Sub-numbered outlines such as 2.1 or 3.1.2 are usually structure.
  return true;
}

function redistributeOrphanImages(sections: ApostilaSection[]): ApostilaSection[] {
  const orphanImages: string[] = [];
  const cleaned = sections.map((s) => {
    const lines = s.content.split('\n');
    while (lines.length) {
      const last = lines[lines.length - 1];
      if (last.trim() === '') { lines.pop(); continue; }
      if (IMG_LINE_RE.test(last)) {
        orphanImages.unshift(last.trim());
        lines.pop();
        continue;
      }
      break;
    }
    return { ...s, content: lines.join('\n') };
  });

  if (!orphanImages.length) return sections;

  const targets = cleaned
    .map((s, idx) => ({ idx, paragraphs: s.content.split(/\n\s*\n/).filter((p) => p.trim() && !IMG_LINE_RE.test(p.trim())).length }))
    .filter((t) => t.paragraphs >= 1);

  if (!targets.length) {
    cleaned[cleaned.length - 1].content += '\n\n' + orphanImages.join('\n\n');
    return cleaned;
  }

  orphanImages.forEach((imgLine, i) => {
    const target = targets[i % targets.length];
    const sec = cleaned[target.idx];
    const paragraphs = sec.content.split(/\n\s*\n/);
    const realParagraphs = paragraphs.filter((p) => p.trim() && !IMG_LINE_RE.test(p.trim()));
    const insertAfter = Math.max(1, Math.ceil(realParagraphs.length / 2) + (i % 2));
    let count = 0;
    let insertIdx = paragraphs.length;
    for (let p = 0; p < paragraphs.length; p++) {
      const t = paragraphs[p].trim();
      if (t && !IMG_LINE_RE.test(t)) {
        count++;
        if (count >= insertAfter) { insertIdx = p + 1; break; }
      }
    }
    paragraphs.splice(insertIdx, 0, imgLine);
    cleaned[target.idx] = { ...sec, content: paragraphs.join('\n\n') };
  });

  return cleaned;
}

export function parseApostilaContent(raw: string | null): ApostilaSection[] {
  if (!raw) return [{ id: 'intro', title: 'Introdução', level: 1, content: '' }];

  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line));

  const sections: ApostilaSection[] = [];
  let current: ApostilaSection | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const numberedMatch = trimmedLine.match(/^(\d+(?:\.\d+)*)[.\s\-–]+\s*(.+)/);
    const hashMatch = trimmedLine.match(/^(#{1,3})\s+(.+)/);

    if (hashMatch) {
      if (current && (current.title.trim() || current.content.trim())) sections.push(current);
      const level = hashMatch[1].length;
      const title = hashMatch[2].trim();
      const id = `section-${sections.length}`;
      current = { id, title, level, content: '' };
    } else if (numberedMatch && isNumberedHeadingCandidate(numberedMatch[1], numberedMatch[2])) {
      if (current && (current.title.trim() || current.content.trim())) sections.push(current);
      const depth = numberedMatch[1].split('.').length;
      const title = numberedMatch[2].trim();
      const id = `section-${sections.length}`;
      current = { id, title, level: Math.min(depth, 3), content: '' };
    } else {
      if (!current) {
        current = { id: 'section-0', title: 'Introdução', level: 1, content: '' };
      }
      current.content += line + '\n';
    }
  }

  if (current && (current.title.trim() || current.content.trim())) sections.push(current);

  const result = sections.length > 0 ? sections : [{ id: 'intro', title: 'Conteúdo', level: 1, content: raw }];
  return redistributeOrphanImages(result);
}
