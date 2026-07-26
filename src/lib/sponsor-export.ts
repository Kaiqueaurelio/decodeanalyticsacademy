import jsPDF from 'jspdf';
import { SPONSOR_LEAD_CHANNEL_LABEL, SPONSOR_LEAD_STATUS } from '@/lib/sponsor-leads';

export type ExportLead = {
  id: string;
  company?: string;
  contact_name?: string;
  email?: string;
  plan: string | null;
  channel: string;
  source: string;
  status: string;
  created_at: string;
  cta_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

export type ExportStage = { label: string; count: number };
export type ExportGroup = { key: string; counts: number[] };

const statusLabel = (v: string) => SPONSOR_LEAD_STATUS.find((s) => s.value === v)?.label ?? v;
const channelLabel = (v: string) => SPONSOR_LEAD_CHANNEL_LABEL[v] ?? v;
const dt = (iso: string) => new Date(iso).toLocaleString('pt-BR');

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

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportSponsorCsv(
  leads: ExportLead[],
  stages: ExportStage[],
  groups: ExportGroup[],
  groupLabel: string,
  periodLabel: string,
) {
  const lines: string[] = [];
  lines.push(csvCell(`Funil comercial — ${periodLabel}`));
  lines.push('');
  lines.push(['Etapa', 'Quantidade', '% do topo'].map(csvCell).join(';'));
  const top = stages[0]?.count ?? 0;
  for (const s of stages) {
    lines.push([s.label, s.count, top ? Math.round((s.count / top) * 100) : 0].map(csvCell).join(';'));
  }
  lines.push('');
  lines.push([groupLabel, ...stages.map((s) => s.label), 'Conversão %'].map(csvCell).join(';'));
  for (const g of groups) {
    const conv = g.counts[0] ? Math.round((g.counts[3] / g.counts[0]) * 100) : 0;
    lines.push([g.key, ...g.counts, conv].map(csvCell).join(';'));
  }
  lines.push('');
  lines.push(
    [
      'Data',
      'Empresa',
      'Responsável',
      'E-mail',
      'Pacote',
      'Canal',
      'Origem',
      'CTA',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'Situação',
    ]
      .map(csvCell)
      .join(';'),
  );
  for (const l of leads) {
    lines.push(
      [
        dt(l.created_at),
        l.company ?? '',
        l.contact_name ?? '',
        l.email ?? '',
        l.plan ?? 'Não definido',
        channelLabel(l.channel),
        l.source,
        l.cta_id ?? '',
        l.utm_source ?? '',
        l.utm_medium ?? '',
        l.utm_campaign ?? '',
        statusLabel(l.status),
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  download(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `funil-patrocinio-${stamp()}.csv`);
}

export function exportSponsorPdf(
  leads: ExportLead[],
  stages: ExportStage[],
  groups: ExportGroup[],
  groupLabel: string,
  periodLabel: string,
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
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
  doc.text('Funil comercial de patrocínio', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${periodLabel} · gerado em ${new Date().toLocaleString('pt-BR')}`, margin, y);
  doc.setTextColor(20);
  y += 26;

  const top = stages[0]?.count ?? 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Etapas', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  stages.forEach((s, i) => {
    nextPage(28);
    const ratio = top ? s.count / top : 0;
    doc.text(`${i + 1}. ${s.label}`, margin, y);
    doc.text(`${s.count} (${Math.round(ratio * 100)}%)`, width - margin, y, { align: 'right' });
    y += 6;
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, y, width - margin * 2, 6, 'F');
    doc.setFillColor(30, 110, 160);
    doc.rect(margin, y, Math.max((width - margin * 2) * ratio, 2), 6, 'F');
    y += 18;
  });

  y += 10;
  nextPage(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Detalhe ${groupLabel.toLowerCase()}`, margin, y);
  y += 16;
  doc.setFontSize(9);
  const cols = [margin, margin + 170, margin + 240, margin + 310, margin + 380, margin + 450];
  const headers = [groupLabel, 'Cliques', 'Leads', 'Contatos', 'Negoc.', 'Conv.'];
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, width - margin, y);
  y += 12;
  doc.setFont('helvetica', 'normal');
  for (const g of groups) {
    nextPage(20);
    const conv = g.counts[0] ? Math.round((g.counts[3] / g.counts[0]) * 100) : 0;
    const cells = [g.key.slice(0, 30), ...g.counts.map(String), `${conv}%`];
    cells.forEach((c, i) => doc.text(c, cols[i], y));
    y += 14;
  }

  y += 16;
  nextPage(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Interações registradas', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const l of leads.slice(0, 120)) {
    nextPage(16);
    const line = `${dt(l.created_at)} · ${(l.company ?? '').slice(0, 24)} · ${l.plan ?? 'Não definido'} · ${channelLabel(
      l.channel,
    )} · ${l.cta_id ?? l.source} · ${statusLabel(l.status)}`;
    doc.text(line.slice(0, 150), margin, y);
    y += 12;
  }

  doc.save(`funil-patrocinio-${stamp()}.pdf`);
}
