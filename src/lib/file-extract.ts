// Extração client-side de texto de PDF, DOCX e TXT.
// Roda 100% no navegador — sem edge function, sem timeout.

import * as pdfjsLib from 'pdfjs-dist';
// Worker via URL importável pelo Vite (evita problema de CDN/CORS)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface ExtractProgress {
  stage: 'reading' | 'parsing' | 'done';
  current?: number;
  total?: number;
  message: string;
}

export type ProgressCb = (p: ExtractProgress) => void;

export async function extractTextFromFile(
  file: File,
  onProgress?: ProgressCb,
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx 25MB.`);
  }

  const name = file.name.toLowerCase();
  onProgress?.({ stage: 'reading', message: `Lendo ${file.name}...` });

  // TXT — leitura direta
  if (name.endsWith('.txt') || file.type === 'text/plain') {
    const text = await file.text();
    onProgress?.({ stage: 'done', message: 'Pronto' });
    return text;
  }

  // PDF — usa pdf.js
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    onProgress?.({ stage: 'parsing', message: 'Processando PDF...' });
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let full = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.({ stage: 'parsing', current: i, total: pdf.numPages, message: `Página ${i}/${pdf.numPages}` });
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: any) => ('str' in it ? it.str : ''))
        .join(' ');
      full += pageText + '\n\n';
    }
    onProgress?.({ stage: 'done', message: 'PDF lido com sucesso' });
    return full.trim();
  }

  // DOCX — usa mammoth
  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    onProgress?.({ stage: 'parsing', message: 'Processando DOCX...' });
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    onProgress?.({ stage: 'done', message: 'DOCX lido com sucesso' });
    return result.value.trim();
  }

  // .doc legado — não suportado no browser
  if (name.endsWith('.doc')) {
    throw new Error('Formato .doc legado não suportado. Salve como .docx no Word e tente novamente.');
  }

  throw new Error('Formato não suportado. Use PDF, DOCX ou TXT.');
}
