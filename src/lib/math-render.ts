/**
 * Renderização de fórmulas matemáticas com KaTeX.
 *
 * Suporta:
 *   - Inline:  $E = mc^2$  ou  \(E = mc^2\)
 *   - Bloco:   $$ ... $$   ou  \[ ... \]
 *
 * Implementação resiliente: se a fórmula for inválida, mostramos o texto
 * original em destaque (em vez de quebrar o render).
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderMathToHTML(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: 'html',
      trust: false,
      strict: 'ignore',
    });
  } catch {
    const safe = tex.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
    return `<code class="text-warning">${safe}</code>`;
  }
}

/**
 * Substitui delimitadores matemáticos em uma string por HTML KaTeX.
 * Ordem importa: bloco antes de inline; \[ ... \] e \( ... \) também aceitos.
 */
export function replaceMathDelimiters(input: string): string {
  if (!input) return input;
  let out = input;

  // Bloco $$...$$ e \[...\]
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => renderMathToHTML(tex.trim(), true));
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => renderMathToHTML(tex.trim(), true));

  // Inline \(...\)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex) => renderMathToHTML(tex.trim(), false));

  // Inline $...$ — exige caractere "matemático" para evitar pegar valores em moeda como "$10 e $20".
  // Aceita: $a^2$, $\frac{1}{2}$, $x_i$, $E=mc^2$ etc.
  out = out.replace(/(^|[^\\$])\$([^\n$]{1,200}?)\$(?!\d)/g, (full, pre, tex) => {
    const t = tex.trim();
    // Heurística: precisa parecer matemática (símbolo, barra invertida, =, ^, _, fração, sqrt etc.)
    if (!/[\\^_={}]|\\frac|\\sqrt|\\sum|\\int|\\pi|\\alpha|\\beta|\\theta|\\cdot|\\times|\\div|\\le|\\ge|\\ne|\\to|\\infty/.test(t)
        && !/[a-zA-Z][\^_]/.test(t)) {
      return full;
    }
    return pre + renderMathToHTML(t, false);
  });

  return out;
}

/** True se o texto contém algo que provavelmente é uma fórmula matemática. */
export function hasMath(input: string): boolean {
  if (!input) return false;
  return /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]{1,200}?\$/.test(input);
}
