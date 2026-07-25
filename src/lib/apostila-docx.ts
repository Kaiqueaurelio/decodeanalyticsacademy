import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Footer,
  Header,
  PageNumber,
  BorderStyle,
  TableOfContents,
  Numbering,
  LevelFormat,
  UnderlineType,
} from "docx";
import { saveAs } from "file-saver";
import type { ApostilaSection } from "./apostila-parser";

interface ExportOpts {
  title: string;
  category: string;
  sections: ApostilaSection[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function stripMd(s: string) {
  return (s || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/g, "")
    .trim();
}

/** Parse inline markdown (**bold**, *italic*, `code`, [link](url)) into TextRuns */
function inlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  if (!text) return runs;
  // simple tokenizer: bold **x**, italic *x* or _x_, code `x`, link [t](u)
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index) }));
    const tok = m[0];
    if (tok.startsWith("**") || tok.startsWith("__")) {
      runs.push(new TextRun({ text: tok.slice(2, -2), bold: true }));
    } else if (tok.startsWith("`")) {
      runs.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas" }));
    } else if (tok.startsWith("[")) {
      const linkM = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkM) {
        runs.push(
          new TextRun({
            text: linkM[1],
            color: "0EA5E9",
            underline: { type: UnderlineType.SINGLE },
          }),
        );
      }
    } else {
      runs.push(new TextRun({ text: tok.slice(1, -1), italics: true }));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs;
}

/** Convert one markdown-ish section body into an array of Paragraphs */
function bodyToParagraphs(raw: string): Paragraph[] {
  const out: Paragraph[] = [];
  if (!raw) return out;
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];

  const flushPara = () => {
    const t = para.join(" ").trim();
    if (t) out.push(new Paragraph({ children: inlineRuns(t), spacing: { after: 160 } }));
    para = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      if (inCode) {
        out.push(
          new Paragraph({
            children: [new TextRun({ text: codeBuf.join("\n"), font: "Consolas", size: 20 })],
            shading: { fill: "F1F5F9", type: "clear", color: "auto" },
            spacing: { after: 160 },
          }),
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushPara();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (!trimmed) {
      flushPara();
      continue;
    }

    // image: mostra como legenda (não embedamos binário para manter simples)
    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      flushPara();
      const label = img[1] || "Imagem";
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: `🖼 ${label}: `, bold: true, italics: true, color: "6B7280" }),
            new TextRun({ text: img[2], italics: true, color: "0EA5E9" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
        }),
      );
      continue;
    }

    // heading residual
    const h = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushPara();
      const lvl = h[1].length;
      out.push(
        new Paragraph({
          children: inlineRuns(h[2]),
          heading:
            lvl <= 2
              ? HeadingLevel.HEADING_3
              : lvl === 3
                ? HeadingLevel.HEADING_4
                : HeadingLevel.HEADING_5,
          spacing: { before: 200, after: 120 },
        }),
      );
      continue;
    }

    // list
    const li = trimmed.match(/^[*+\-•]\s+(.+)$/);
    if (li) {
      flushPara();
      out.push(new Paragraph({ children: inlineRuns(li[1]), bullet: { level: 0 }, spacing: { after: 80 } }));
      continue;
    }
    const oli = trimmed.match(/^\d+\.\s+(.+)$/);
    if (oli) {
      flushPara();
      out.push(new Paragraph({ children: inlineRuns(oli[1]), numbering: { reference: "num-default", level: 0 }, spacing: { after: 80 } }));
      continue;
    }

    // blockquote
    if (/^>\s+/.test(trimmed)) {
      flushPara();
      const q = trimmed.replace(/^>\s+/, "");
      out.push(
        new Paragraph({
          children: inlineRuns(q),
          indent: { left: 400 },
          border: { left: { color: "0EA5E9", size: 12, style: BorderStyle.SINGLE, space: 8 } },
          spacing: { after: 160 },
        }),
      );
      continue;
    }

    para.push(line);
  }
  flushPara();
  if (codeBuf.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: codeBuf.join("\n"), font: "Consolas", size: 20 })],
        spacing: { after: 160 },
      }),
    );
  }
  return out;
}

export async function exportApostilaToDOCX(opts: ExportOpts): Promise<void> {
  const { title, category, sections } = opts;
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // Capa
  const cover: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "DECODE ANALYTICS ACADEMY", bold: true, color: "0EA5E9", size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: category.toUpperCase(), color: "6B7280", size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 60, color: "0F172A" })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Material didático · ${sections.length} seções`, color: "6B7280", size: 20 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Gerado em ${today}`, color: "6B7280", size: 20 })],
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Desenvolvido por: Kaique Aurelio & Decode Analytics", color: "94A3B8", size: 18 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // Sumário nativo do Word
  const toc: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Sumário", bold: true, size: 40, color: "0F172A" })],
      spacing: { after: 300 },
    }),
    // TableOfContents is a special Paragraph-like element; casting keeps types happy across docx versions.
    new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }) as unknown as Paragraph,
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // Seções
  const body: Paragraph[] = [];
  sections.forEach((s) => {
    const clean = stripMd(s.title);
    body.push(
      new Paragraph({
        children: [new TextRun({ text: clean, bold: true, color: "0F172A" })],
        heading:
          s.level === 1
            ? HeadingLevel.HEADING_1
            : s.level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 },
      }),
    );
    body.push(...bodyToParagraphs(s.content));
  });

  const doc = new Document({
    creator: "Decode Analytics Academy",
    title,
    description: `Apostila · ${category}`,
    numbering: {
      config: [
        {
          reference: "num-default",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } }, // 11pt
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${title}`, color: "94A3B8", size: 16 }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Desenvolvido por: Kaique Aurelio & Decode Analytics · página ",
                    color: "94A3B8",
                    size: 16,
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], color: "94A3B8", size: 16 }),
                  new TextRun({ text: " / ", color: "94A3B8", size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "94A3B8", size: 16 }),
                ],
              }),
            ],
          }),
        },
        children: [...cover, ...toc, ...body],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slugify(title) || "apostila"}.docx`);
}
