/**
 * Exportação do Plano de Estudos em PDF com a identidade visual oficial
 * do Decode Analytics Academy (logo, cores institucionais, cabeçalho e
 * rodapé padronizados).
 */
import jsPDF from 'jspdf';
import logoUrl from '@/assets/logo-decode.png';
import type { PlanContent, StudyPlan, StudyPlanTask } from '@/lib/study-plan';
import { KIND_LABEL, planProgress } from '@/lib/study-plan';

const APP_NAME = 'Decode Analytics Academy';
const CREDIT = 'Desenvolvido por: Kaique Aurelio & Decode Analytics';

// Cores institucionais (mesmos tokens do app).
const INK: [number, number, number] = [5, 5, 8];
const CYAN: [number, number, number] = [0, 176, 196];
const PURPLE: [number, number, number] = [138, 74, 214];
const MUTED: [number, number, number] = [110, 116, 128];
const LINE: [number, number, number] = [225, 228, 235];

const MARGIN = 16;

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

type Ctx = { doc: jsPDF; y: number; pageW: number; pageH: number };

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed <= ctx.pageH - 20) return;
  ctx.doc.addPage();
  ctx.y = 24;
}

function heading(ctx: Ctx, text: string) {
  ensureSpace(ctx, 18);
  ctx.doc.setFillColor(...CYAN);
  ctx.doc.rect(MARGIN, ctx.y - 3.4, 2.4, 8, 'F');
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(12.5);
  ctx.doc.setTextColor(...INK);
  ctx.doc.text(text, MARGIN + 6, ctx.y + 3);
  ctx.y += 11;
}

function paragraph(ctx: Ctx, text: string, size = 10) {
  if (!text) return;
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(45, 48, 56);
  const lines = ctx.doc.splitTextToSize(text, ctx.pageW - MARGIN * 2);
  for (const line of lines) {
    ensureSpace(ctx, 6);
    ctx.doc.text(line, MARGIN, ctx.y);
    ctx.y += 5;
  }
  ctx.y += 2;
}

function bullets(ctx: Ctx, items: string[] = []) {
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(10);
  ctx.doc.setTextColor(45, 48, 56);
  items.filter(Boolean).forEach((item) => {
    const lines = ctx.doc.splitTextToSize(String(item), ctx.pageW - MARGIN * 2 - 6);
    lines.forEach((line: string, i: number) => {
      ensureSpace(ctx, 6);
      if (i === 0) {
        ctx.doc.setFillColor(...PURPLE);
        ctx.doc.circle(MARGIN + 1.4, ctx.y - 1.4, 0.9, 'F');
      }
      ctx.doc.text(line, MARGIN + 6, ctx.y);
      ctx.y += 5;
    });
  });
  ctx.y += 2;
}

function infoRow(ctx: Ctx, pairs: [string, string][]) {
  const colW = (ctx.pageW - MARGIN * 2) / 2;
  pairs.forEach((pair, i) => {
    const col = i % 2;
    if (col === 0) ensureSpace(ctx, 11);
    const x = MARGIN + col * colW;
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(...MUTED);
    ctx.doc.text(pair[0].toUpperCase(), x, ctx.y);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(10);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(ctx.doc.splitTextToSize(pair[1] || '—', colW - 4)[0] ?? '—', x, ctx.y + 5);
    if (col === 1 || i === pairs.length - 1) ctx.y += 13;
  });
}

function scheduleTable(ctx: Ctx, plan: PlanContent) {
  (plan.cronograma ?? []).forEach((week) => {
    ensureSpace(ctx, 16);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setFontSize(10.5);
    ctx.doc.setTextColor(...PURPLE);
    ctx.doc.text(`Semana ${week.semana}${week.foco ? ` — ${week.foco}` : ''}`, MARGIN, ctx.y);
    ctx.y += 6;

    (week.dias ?? []).forEach((day) => {
      ensureSpace(ctx, 10);
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(9.5);
      ctx.doc.setTextColor(...INK);
      ctx.doc.text(day.dia, MARGIN + 2, ctx.y);
      ctx.y += 4.5;

      (day.blocos ?? []).forEach((block) => {
        ensureSpace(ctx, 6);
        ctx.doc.setFont('helvetica', 'normal');
        ctx.doc.setFontSize(9);
        ctx.doc.setTextColor(60, 64, 72);
        const label = `${block.titulo}${block.disciplina ? ` · ${block.disciplina}` : ''}`;
        const meta = `${KIND_LABEL[block.tipo ?? 'estudo'] ?? 'Estudo'} · ${block.minutos ?? 60} min`;
        const lines = ctx.doc.splitTextToSize(label, ctx.pageW - MARGIN * 2 - 40);
        ctx.doc.text(lines[0], MARGIN + 6, ctx.y);
        ctx.doc.setTextColor(...MUTED);
        ctx.doc.text(meta, ctx.pageW - MARGIN, ctx.y, { align: 'right' });
        ctx.y += 5;
      });
      ctx.y += 1.5;
    });

    ctx.doc.setDrawColor(...LINE);
    ensureSpace(ctx, 6);
    ctx.doc.line(MARGIN, ctx.y, ctx.pageW - MARGIN, ctx.y);
    ctx.y += 6;
  });
}

export async function exportStudyPlanPdf(
  planRow: StudyPlan,
  tasks: StudyPlanTask[],
  studentName: string,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const plan = planRow.plan ?? {};
  const logo = await loadLogo();
  const progress = planProgress(tasks);

  // Cabeçalho institucional
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 34, 'F');
  if (logo) {
    try { doc.addImage(logo, 'PNG', MARGIN, 8, 18, 18); } catch { /* logo opcional */ }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(APP_NAME, MARGIN + (logo ? 23 : 0), 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 240, 255);
  doc.text('Plano de Estudos Inteligente', MARGIN + (logo ? 23 : 0), 22.5);

  const ctx: Ctx = { doc, y: 46, pageW, pageH };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(plan.titulo || planRow.title, pageW - MARGIN * 2);
  titleLines.forEach((line: string) => {
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 8;
  });
  ctx.y += 2;

  infoRow(ctx, [
    ['Aluno', studentName || '—'],
    ['Gerado em', new Date().toLocaleDateString('pt-BR')],
    ['Nível', planRow.level],
    ['Área / curso', planRow.area || '—'],
    ['Carga diária', `${planRow.hours_per_day} h/dia · ${planRow.days_per_week} dias/semana`],
    ['Previsão de conclusão', plan.previsao_conclusao || (planRow.deadline ?? 'A definir')],
    ['Progresso atual', `${progress.pct}% (${progress.done}/${progress.total} atividades)`],
    ['Versão do plano', `v${planRow.version}`],
  ]);

  heading(ctx, 'Objetivo do plano');
  paragraph(ctx, plan.objetivo_principal || planRow.goal);
  if (plan.resumo) paragraph(ctx, plan.resumo);

  heading(ctx, 'Disciplinas e ordem recomendada');
  bullets(
    ctx,
    (plan.disciplinas ?? []).map(
      (d) => `${d.nome}${d.prioridade ? ` (prioridade ${d.prioridade})` : ''}${d.por_que ? ` — ${d.por_que}` : ''}`,
    ),
  );
  if (plan.ordem_recomendada?.length) {
    paragraph(ctx, `Ordem sugerida: ${plan.ordem_recomendada.join(' → ')}`, 9.5);
  }

  heading(ctx, 'Carga horária');
  bullets(ctx, [
    `Por dia: ${plan.carga_horaria?.por_dia_horas ?? planRow.hours_per_day} horas`,
    `Por semana: ${plan.carga_horaria?.por_semana_horas ?? planRow.hours_per_day * planRow.days_per_week} horas`,
    `Total estimado: ${plan.carga_horaria?.total_estimado_horas ?? '—'} horas`,
  ]);

  heading(ctx, 'Cronograma');
  scheduleTable(ctx, plan);

  heading(ctx, 'Metas');
  paragraph(ctx, 'Curto prazo', 10);
  bullets(ctx, plan.metas?.curto_prazo ?? []);
  paragraph(ctx, 'Médio prazo', 10);
  bullets(ctx, plan.metas?.medio_prazo ?? []);
  paragraph(ctx, 'Longo prazo', 10);
  bullets(ctx, plan.metas?.longo_prazo ?? []);

  if (plan.revisao?.length) {
    heading(ctx, 'Recomendações de revisão');
    bullets(ctx, plan.revisao);
  }
  if (plan.exercicios?.length) {
    heading(ctx, 'Sugestões de exercícios');
    bullets(ctx, plan.exercicios);
  }
  if (plan.pausas?.length) {
    heading(ctx, 'Pausas e descanso');
    bullets(ctx, plan.pausas);
  }
  if (plan.recomendacoes_finais?.length) {
    heading(ctx, 'Recomendações finais');
    bullets(ctx, plan.recomendacoes_finais);
  }

  // Rodapé padronizado em todas as páginas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(MARGIN, pageH - 14, pageW - MARGIN, pageH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${APP_NAME} · ${CREDIT}`, MARGIN, pageH - 9);
    doc.text(`${i}/${pages}`, pageW - MARGIN, pageH - 9, { align: 'right' });
  }

  const slug = (plan.titulo || planRow.title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'plano-de-estudos';

  doc.save(`${slug}.pdf`);
}
