import { jsPDF } from 'jspdf';

export type StudentPerformanceReport = {
  profile?: {
    full_name?: string | null;
    ra?: string | null;
    email?: string | null;
    course?: string | null;
    semester?: number | string | null;
  } | null;
  total?: number;
  hits?: number;
  errors?: number;
  accuracy?: number;
  by_apostila?: Array<{
    title?: string | null;
    total?: number;
    hits?: number;
    errors?: number;
    accuracy?: number;
    last_at?: string | null;
  }>;
  history?: Array<{
    id?: string;
    apostila_title?: string | null;
    question?: string | null;
    selected_answer?: string | null;
    is_correct?: boolean;
    created_at?: string | null;
  }>;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function clean(value: unknown, fallback = '—') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function dateTime(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? clean(value) : parsed.toLocaleString('pt-BR');
}

export function downloadStudentPerformancePdf(report: StudentPerformanceReport, fallbackProfile?: StudentPerformanceReport['profile']) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const addFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(`Decode Analytics Academy · Página ${page}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 22, { align: 'center' });
    doc.setTextColor(30, 30, 30);
  };

  const ensureSpace = (height: number) => {
    if (y + height > PAGE_HEIGHT - 48) {
      addFooter();
      doc.addPage();
      y = MARGIN;
    }
  };

  const paragraph = (value: unknown, size = 10, bold = false, color: [number, number, number] = [35, 35, 35]) => {
    const lines = doc.splitTextToSize(clean(value), CONTENT_WIDTH) as string[];
    const lineHeight = size + 4;
    ensureSpace(lines.length * lineHeight + 4);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(lines, MARGIN, y);
    y += lines.length * lineHeight + 4;
  };

  const heading = (value: string) => {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 74, 120);
    doc.text(value, MARGIN, y);
    y += 18;
    doc.setDrawColor(205, 215, 225);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 10;
    doc.setTextColor(30, 30, 30);
  };

  const row = (label: string, value: unknown) => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(clean(value), MARGIN + 92, y);
    y += 15;
  };

  const profile = report.profile || fallbackProfile || {};
  const apostilas = Array.isArray(report.by_apostila) ? report.by_apostila : [];
  const history = Array.isArray(report.history) ? report.history : [];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(23, 63, 102);
  doc.text('Relatório de desempenho acadêmico', MARGIN, y);
  y += 25;
  paragraph('Decode Analytics Academy · desempenho por apostila e por exercício', 10, false, [90, 90, 90]);

  heading('Identificação do aluno');
  row('Nome', profile.full_name);
  row('RA', profile.ra);
  row('E-mail', profile.email);
  row('Curso', profile.course);
  row('Semestre', profile.semester);
  row('Gerado em', new Date().toLocaleString('pt-BR'));

  heading('Resumo geral');
  row('Exercícios respondidos', report.total ?? 0);
  row('Acertos', report.hits ?? 0);
  row('Erros', report.errors ?? 0);
  row('Precisão', `${report.accuracy ?? 0}%`);

  heading('Desempenho por apostila');
  if (apostilas.length === 0) {
    paragraph('Não há respostas registradas para este aluno.', 10);
  } else {
    apostilas.forEach((book, index) => {
      ensureSpace(66);
      paragraph(`${index + 1}. ${clean(book.title, 'Apostila sem título')}`, 10, true, [30, 30, 30]);
      row('Total', book.total ?? 0);
      row('Resultado', `${book.hits ?? 0} acertos · ${book.errors ?? 0} erros · ${book.accuracy ?? 0}%`);
      row('Última atividade', dateTime(book.last_at));
      y += 3;
    });
  }

  heading('Desempenho por exercício');
  if (history.length === 0) {
    paragraph('Não há exercícios respondidos para detalhar.', 10);
  } else {
    history.forEach((exercise, index) => {
      ensureSpace(86);
      const status = exercise.is_correct ? 'ACERTO' : 'ERRO';
      const statusColor: [number, number, number] = exercise.is_correct ? [22, 120, 75] : [170, 45, 50];
      paragraph(`${index + 1}. ${status} · ${clean(exercise.apostila_title, 'Apostila sem título')}`, 10, true, statusColor);
      paragraph(`Questão: ${clean(exercise.question, 'Questão sem enunciado')}`, 9);
      row('Resposta escolhida', exercise.selected_answer);
      row('Respondida em', dateTime(exercise.created_at));
      y += 3;
    });
  }

  addFooter();
  const name = clean(profile.full_name, 'aluno').toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  doc.save(`relatorio-desempenho-${name || 'aluno'}.pdf`);
}
