import jsPDF from 'jspdf';

export type AuditExportRow = {
  created_at: string;
  user_id: string;
  user_name?: string | null;
  user_ra?: string | null;
  user_role: string;
  content_scope: string;
  tool_name: string;
  allowed: boolean;
  outcome: string;
  denial_reason?: string | null;
  result_summary?: string | null;
  request_id: string;
  params?: Record<string, unknown> | null;
};

const OUTCOME_LABEL: Record<string, string> = {
  success: 'Concluída',
  error: 'Falhou',
  denied: 'Negada',
  unknown: 'Indefinida',
};

export const outcomeLabel = (v: string) => OUTCOME_LABEL[v] ?? v;
export const roleLabel = (v: string) => (v === 'admin' ? 'Administrador' : 'Aluno');
const dt = (iso: string) => new Date(iso).toLocaleString('pt-BR');
const stamp = () => new Date().toISOString().slice(0, 10);

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const who = (r: AuditExportRow) =>
  r.user_name?.trim() || (r.user_ra ? `RA ${r.user_ra}` : `Usuário ${r.user_id.slice(0, 8)}`);

/** Exporta os registros filtrados em CSV (separador ";" para abrir direto no Excel). */
export function exportAuditCsv(rows: AuditExportRow[], filterLabel: string) {
  const lines: string[] = [];
  lines.push(csvCell(`Auditoria da assistente — ${filterLabel}`));
  lines.push(csvCell(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${rows.length} registro(s)`));
  lines.push('');
  lines.push(
    ['Data', 'Usuário', 'RA', 'Papel', 'Escopo', 'Ação', 'Autorizada', 'Resultado', 'Detalhe', 'Requisição', 'Parâmetros']
      .map(csvCell)
      .join(';'),
  );
  for (const r of rows) {
    lines.push(
      [
        dt(r.created_at),
        who(r),
        r.user_ra ?? '',
        roleLabel(r.user_role),
        r.content_scope,
        r.tool_name,
        r.allowed ? 'Sim' : 'Não',
        outcomeLabel(r.outcome),
        r.denial_reason ?? r.result_summary ?? '',
        r.request_id,
        JSON.stringify(r.params ?? {}).slice(0, 500),
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  download(
    new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }),
    `auditoria-assistente-${stamp()}.csv`,
  );
}

/** Exporta um relatório em PDF com resumo por ação e a lista completa de registros filtrados. */
export function exportAuditPdf(rows: AuditExportRow[], filterLabel: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  let y = margin;

  const nextPage = (needed = 24) => {
    if (y + needed > height - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Auditoria da assistente', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`${filterLabel} · gerado em ${new Date().toLocaleString('pt-BR')}`, margin, y, {
    maxWidth: width - margin * 2,
  });
  y += 14;
  doc.text(`${rows.length} registro(s)`, margin, y);
  doc.setTextColor(20);
  y += 24;

  // Resumo por ação
  const summary = new Map<string, { total: number; denied: number }>();
  for (const r of rows) {
    const s = summary.get(r.tool_name) ?? { total: 0, denied: 0 };
    s.total += 1;
    if (!r.allowed) s.denied += 1;
    summary.set(r.tool_name, s);
  }
  const ordered = [...summary.entries()].sort((a, b) => b[1].total - a[1].total);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Resumo por ação', margin, y);
  y += 16;
  doc.setFontSize(9);
  doc.text('Ação', margin, y);
  doc.text('Total', width - margin - 120, y, { align: 'right' });
  doc.text('Negadas', width - margin, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, width - margin, y);
  y += 12;
  doc.setFont('helvetica', 'normal');
  for (const [tool, s] of ordered) {
    nextPage(18);
    doc.text(tool.slice(0, 60), margin, y);
    doc.text(String(s.total), width - margin - 120, y, { align: 'right' });
    doc.text(String(s.denied), width - margin, y, { align: 'right' });
    y += 14;
  }

  y += 18;
  nextPage(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Registros', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const r of rows) {
    nextPage(30);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dt(r.created_at)} · ${who(r).slice(0, 40)} (${roleLabel(r.user_role)})`, margin, y);
    y += 11;
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${r.tool_name} · ${outcomeLabel(r.outcome)}${r.allowed ? '' : ' · NEGADA'}`.slice(0, 140),
      margin,
      y,
    );
    y += 11;
    const detail = (r.denial_reason ?? r.result_summary ?? '').slice(0, 180);
    if (detail) {
      doc.setTextColor(110);
      doc.text(detail, margin, y, { maxWidth: width - margin * 2 });
      doc.setTextColor(20);
      y += 11;
    }
    y += 6;
  }

  doc.save(`auditoria-assistente-${stamp()}.pdf`);
}
