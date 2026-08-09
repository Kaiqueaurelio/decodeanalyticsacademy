/**
 * asset-scan — Varredura de componentes ausentes e validação de recursos.
 *
 * Percorre o DOM renderizado e o grafo de módulos do build para:
 *  1. Detectar componentes esperados que não foram montados na página.
 *  2. Validar imagens, fontes, folhas de estilo, scripts e ícones via HTTP HEAD.
 *  3. Listar todos os caminhos esperados (assets do código + rotas declaradas).
 *
 * Tudo roda client-side, sem dependências externas.
 */

export type ResourceKind = 'image' | 'font' | 'stylesheet' | 'script' | 'icon' | 'other';

export type ResourceCheck = {
  kind: ResourceKind;
  /** Caminho/URL esperado pelo app. */
  caminho_esperado: string;
  /** Status HTTP retornado (0 quando a requisição falhou por rede/CORS). */
  status_http: number;
  ok: boolean;
  /** Detalhe legível do problema, quando houver. */
  detalhe?: string;
  /** Onde o recurso foi encontrado (seletor ou origem). */
  origem?: string;
};

export type ComponentCheck = {
  nome: string;
  seletor: string;
  encontrado: boolean;
  obrigatorio: boolean;
};

export type ScanReport = {
  geradoEm: string;
  rota: string;
  componentes: ComponentCheck[];
  recursos: ResourceCheck[];
  caminhosEsperados: string[];
  caminhosNaoEncontrados: string[];
  resumo: {
    totalRecursos: number;
    comFalha: number;
    componentesAusentes: number;
    porTipo: Record<ResourceKind, { total: number; falhas: number }>;
  };
};

/**
 * Componentes estruturais que devem estar montados quando o app está saudável.
 * `obrigatorio: false` = depende da rota/estado (ausência não é erro crítico).
 */
export const EXPECTED_COMPONENTS: { nome: string; seletor: string; obrigatorio: boolean }[] = [
  { nome: 'Root da aplicação', seletor: '#root', obrigatorio: true },
  { nome: 'Providers / Router', seletor: '#root > *', obrigatorio: true },
  { nome: 'Toaster (sonner)', seletor: '[data-sonner-toaster], .toaster', obrigatorio: false },
  { nome: 'Sidebar de navegação', seletor: 'aside, [data-sidebar], nav', obrigatorio: false },
  { nome: 'Topbar / Header', seletor: 'header', obrigatorio: false },
  { nome: 'Conteúdo principal', seletor: 'main, [role="main"]', obrigatorio: false },
  { nome: 'Assistente Ella', seletor: '[data-ella-root], [data-ella-sidebar]', obrigatorio: false },
  { nome: 'Rodapé / Créditos', seletor: 'footer, [data-app-footer]', obrigatorio: false },
];

const norm = (u: string | null | undefined): string | null => {
  if (!u) return null;
  const v = u.trim();
  if (!v) return null;
  if (v.startsWith('data:') || v.startsWith('blob:') || v.startsWith('#')) return null;
  try {
    return new URL(v, window.location.href).href;
  } catch {
    return null;
  }
};

/** Extrai URLs de @font-face das folhas de estilo acessíveis. */
function collectFontUrls(): { url: string; origem: string }[] {
  const out: { url: string; origem: string }[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin: não é possível inspecionar
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (rule.constructor.name !== 'CSSFontFaceRule' && !(rule as CSSRule).cssText?.startsWith('@font-face')) continue;
      const matches = (rule as CSSRule).cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g);
      for (const m of matches) {
        const abs = norm(m[2]);
        if (abs && !seen.has(abs)) {
          seen.add(abs);
          out.push({ url: abs, origem: '@font-face' });
        }
      }
    }
  }
  return out;
}

type Target = { url: string; kind: ResourceKind; origem: string };

/** Coleta todos os recursos referenciados pela página atual. */
export function collectTargets(): Target[] {
  const targets: Target[] = [];
  const seen = new Set<string>();
  const push = (url: string | null, kind: ResourceKind, origem: string) => {
    if (!url || seen.has(url + kind)) return;
    seen.add(url + kind);
    targets.push({ url, kind, origem });
  };

  document.querySelectorAll('img').forEach((img) => push(norm(img.getAttribute('src')), 'image', '<img>'));
  document.querySelectorAll('source[srcset]').forEach((s) => {
    const first = s.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0];
    push(norm(first), 'image', '<source srcset>');
  });
  document.querySelectorAll('link[rel~="stylesheet"]').forEach((l) =>
    push(norm(l.getAttribute('href')), 'stylesheet', '<link rel="stylesheet">'),
  );
  document.querySelectorAll('link[rel~="icon"], link[rel~="apple-touch-icon"], link[rel="manifest"]').forEach((l) =>
    push(norm(l.getAttribute('href')), 'icon', `<link rel="${l.getAttribute('rel')}">`),
  );
  document.querySelectorAll('script[src]').forEach((s) =>
    push(norm(s.getAttribute('src')), 'script', '<script src>'),
  );
  collectFontUrls().forEach((f) => push(f.url, 'font', f.origem));
  // Google Fonts e afins entram como stylesheet acima; fontes .woff2 diretas:
  document.querySelectorAll('link[as="font"]').forEach((l) =>
    push(norm(l.getAttribute('href')), 'font', '<link as="font">'),
  );

  return targets;
}

/** Faz HEAD (com fallback para GET Range) e devolve o status HTTP. */
async function probe(url: string): Promise<{ status: number; detalhe?: string }> {
  const attempt = async (method: 'HEAD' | 'GET'): Promise<{ status: number; detalhe?: string }> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, {
        method,
        cache: 'no-cache',
        signal: ctrl.signal,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
      });
      return { status: res.status };
    } catch (err) {
      return { status: 0, detalhe: err instanceof Error ? err.message : 'Falha de rede/CORS' };
    } finally {
      clearTimeout(timer);
    }
  };

  const head = await attempt('HEAD');
  // Alguns CDNs bloqueiam HEAD (405) ou falham por CORS — tentamos GET parcial.
  if (head.status === 0 || head.status === 405 || head.status === 501) {
    const get = await attempt('GET');
    if (get.status !== 0) return get;
    return head.status === 0 ? get : head;
  }
  return head;
}

const isOk = (status: number) => status === 200 || status === 204 || status === 206 || status === 304;

/** Caminhos declarados no código-fonte (assets importáveis + rotas do app). */
export function collectExpectedPaths(routes: string[] = []): string[] {
  const modules = import.meta.glob('/src/assets/**/*', { eager: false });
  const assetPaths = Object.keys(modules);
  return Array.from(new Set([...assetPaths, ...routes])).sort();
}

/** Executa a varredura completa. */
export async function runResourceScan(routes: string[] = []): Promise<ScanReport> {
  const componentes: ComponentCheck[] = EXPECTED_COMPONENTS.map((c) => ({
    nome: c.nome,
    seletor: c.seletor,
    obrigatorio: c.obrigatorio,
    encontrado: Boolean(document.querySelector(c.seletor)),
  }));

  const targets = collectTargets();
  const recursos: ResourceCheck[] = [];

  // Concorrência limitada para não saturar a rede do dispositivo móvel.
  const queue = [...targets];
  const workers = Array.from({ length: Math.min(6, queue.length || 1) }, async () => {
    while (queue.length) {
      const t = queue.shift();
      if (!t) break;
      const { status, detalhe } = await probe(t.url);
      recursos.push({
        kind: t.kind,
        caminho_esperado: t.url,
        status_http: status,
        ok: isOk(status),
        detalhe: isOk(status) ? undefined : detalhe ?? `HTTP ${status || 'sem resposta'}`,
        origem: t.origem,
      });
    }
  });
  await Promise.all(workers);

  recursos.sort((a, b) => Number(a.ok) - Number(b.ok) || a.kind.localeCompare(b.kind));

  const caminhosEsperados = collectExpectedPaths(routes);
  const carregados = new Set(recursos.filter((r) => r.ok).map((r) => new URL(r.caminho_esperado).pathname));
  const caminhosNaoEncontrados = [
    ...recursos.filter((r) => !r.ok).map((r) => r.caminho_esperado),
    ...caminhosEsperados.filter((p) => p.startsWith('/src/assets') && !carregados.has(p)),
  ];

  const porTipo = {} as ScanReport['resumo']['porTipo'];
  (['image', 'font', 'stylesheet', 'script', 'icon', 'other'] as ResourceKind[]).forEach((k) => {
    const list = recursos.filter((r) => r.kind === k);
    porTipo[k] = { total: list.length, falhas: list.filter((r) => !r.ok).length };
  });

  return {
    geradoEm: new Date().toISOString(),
    rota: window.location.pathname,
    componentes,
    recursos,
    caminhosEsperados,
    caminhosNaoEncontrados,
    resumo: {
      totalRecursos: recursos.length,
      comFalha: recursos.filter((r) => !r.ok).length,
      componentesAusentes: componentes.filter((c) => !c.encontrado && c.obrigatorio).length,
      porTipo,
    },
  };
}
