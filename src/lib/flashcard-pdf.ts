import jsPDF from 'jspdf';

export interface FlashcardPdfItem {
  question: string;
  answer: string;
}

export interface FlashcardPdfOptions {
  title?: string;
  studentName?: string;
}

const COLORS = {
  background: [12, 14, 18] as const,
  surface: [24, 27, 34] as const,
  surfaceSoft: [238, 242, 250] as const,
  primary: [216, 255, 62] as const,
  accent: [95, 127, 255] as const,
  white: [248, 250, 252] as const,
  dark: [24, 27, 34] as const,
  muted: [150, 158, 174] as const,
};

function cleanPdfText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .trim();
}

function fitLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  maxHeight: number,
  preferredSize: number,
  minimumSize: number,
) {
  let fontSize = preferredSize;
  let lines: string[] = [];
  let lineHeight = fontSize * 1.35;

  while (fontSize >= minimumSize) {
    doc.setFontSize(fontSize);
    lines = doc.splitTextToSize(cleanPdfText(text), maxWidth) as string[];
    lineHeight = fontSize * 1.35;
    if (lines.length * lineHeight <= maxHeight) break;
    fontSize -= 1;
  }

  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let lastLine = lines[maxLines - 1].replace(/[.\s]+$/, '');
    while (lastLine.length > 1 && doc.getTextWidth(`${lastLine}...`) > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }
    lines[maxLines - 1] = `${lastLine}...`;
  }

  return { fontSize, lineHeight, lines };
}

function drawCardFace(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    text: string;
    fill: readonly [number, number, number];
    border: readonly [number, number, number];
    textColor: readonly [number, number, number];
    labelColor: readonly [number, number, number];
  },
) {
  const { x, y, width, height, label, text, fill, border, textColor, labelColor } = options;
  doc.setFillColor(...fill);
  doc.setDrawColor(...border);
  doc.setLineWidth(1.5);
  doc.roundedRect(x, y, width, height, 16, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...labelColor);
  doc.text(label.toUpperCase(), x + 24, y + 34);

  const fitted = fitLines(doc, text, width - 48, height - 86, 21, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fitted.fontSize);
  doc.setTextColor(...textColor);
  const blockHeight = fitted.lines.length * fitted.lineHeight;
  const textY = Math.max(y + 70, y + (height - blockHeight) / 2 + fitted.fontSize);
  doc.text(fitted.lines, x + width / 2, textY, {
    align: 'center',
    lineHeightFactor: 1.35,
    maxWidth: width - 48,
  });
}

export function createFlashcardsPdf(cards: FlashcardPdfItem[], options: FlashcardPdfOptions = {}) {
  if (cards.length === 0) throw new Error('Nenhum flashcard disponível para exportação.');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const title = cleanPdfText(options.title || 'Meus Flashcards');

  cards.forEach((card, index) => {
    if (index > 0) doc.addPage();

    doc.setFillColor(...COLORS.background);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.text('DECODE ANALYTICS ACADEMY', 44, 46);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(`FLASHCARD ${index + 1} DE ${cards.length}`, pageWidth - 44, 46, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.white);
    doc.text(title, 44, 78, { maxWidth: pageWidth - 88 });

    if (options.studentName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text(`Estudante: ${cleanPdfText(options.studentName)}`, 44, 96, { maxWidth: pageWidth - 88 });
    }

    drawCardFace(doc, {
      x: 44,
      y: 118,
      width: pageWidth - 88,
      height: 276,
      label: 'Pergunta',
      text: card.question,
      fill: COLORS.surface,
      border: COLORS.primary,
      textColor: COLORS.white,
      labelColor: COLORS.primary,
    });

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(pageWidth / 2 - 48, 408, 96, 24, 12, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.text('FRENTE / VERSO', pageWidth / 2, 424, { align: 'center' });

    drawCardFace(doc, {
      x: 44,
      y: 446,
      width: pageWidth - 88,
      height: 300,
      label: 'Resposta',
      text: card.answer,
      fill: COLORS.surfaceSoft,
      border: COLORS.accent,
      textColor: COLORS.dark,
      labelColor: COLORS.accent,
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text('decodeanalyticsacademy.vercel.app', 44, pageHeight - 28);
    doc.text(`${index + 1} / ${cards.length}`, pageWidth - 44, pageHeight - 28, { align: 'right' });
  });

  doc.setProperties({
    title,
    subject: 'Flashcards de estudo',
    author: 'Decode Analytics Academy',
    creator: 'Decode Analytics Academy',
  });

  return doc;
}

export async function exportFlashcardsToPdf(cards: FlashcardPdfItem[], options: FlashcardPdfOptions = {}) {
  const doc = createFlashcardsPdf(cards, options);
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`flashcards-decode-${date}.pdf`);
}
