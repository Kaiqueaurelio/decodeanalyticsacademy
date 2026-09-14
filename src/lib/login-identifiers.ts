/**
 * Normaliza o identificador removendo espaços e caracteres invisíveis.
 */
export function normalizeIdentifier(value: string): string {
  return (value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/**
 * Normaliza especificamente um e-mail.
 *
 * Regra deliberadamente limitada: somente trim + lowercase.
 * Pontos, sublinhados, hífens e + do local-part são dados válidos
 * e nunca devem ser removidos ou reinterpretados.
 */
export function normalizeEmail(value: string): string {
  return (value || "").trim().toLowerCase();
}

/**
 * Normaliza especificamente um RA removendo hífens, pontos e espaços.
 * Nunca reutilizar esta função para e-mails.
 */
export function normalizeRa(value: string): string {
  return normalizeIdentifier(value).replace(/[\s._-]/g, "").toUpperCase();
}

/**
 * Constrói o e-mail fictício para login por RA no Supabase Auth.
 */
export function buildRaEmail(ra: string): string {
  const cleanRa = normalizeRa(ra).toLowerCase();
  return `${cleanRa}@ra.unip.local`;
}

/**
 * Detecta um identificador que deve ser tratado como entrada de e-mail
 * enquanto o usuário ainda está digitando.
 *
 * O LoginPage historicamente aplicava normalizeRa() enquanto o texto ainda
 * não continha "@". Isso removia o ponto de um e-mail parcial, por exemplo
 * "vivi." antes de o usuário conseguir digitar "@gmail.com".
 *
 * Um RA formatado válido continua sendo reconhecido como RA e mantém a
 * normalização existente. Já caracteres típicos do local-part de e-mail
 * são preservados durante a digitação.
 */
export function isEmailIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  const lower = normalized.toLowerCase();

  if (lower.includes('@')) {
    return !lower.endsWith('@ra.unip.local');
  }

  // Não tratar a formatação tradicional de RA (ex.: G-802.144) como e-mail.
  const looksLikeFormattedRa = /^[a-z]+(?:[-.]?\d+)+$/i.test(normalized);
  if (looksLikeFormattedRa) return false;

  // Durante a digitação, preserve caracteres válidos do local-part do e-mail.
  return /[._+\-]/.test(normalized);
}

/**
 * Validação de e-mail completa. Ao contrário de isEmailIdentifier(),
 * exige que o endereço esteja completo antes do envio.
 */
export function isValidEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    && !normalized.endsWith('@ra.unip.local');
}

/**
 * Verifica se o identificador é um RA (Registro Acadêmico).
 */
export function isRaIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  if (isSpecialIdentifier(normalized)) return true;
  // Padrão de RA: somente letras e números, geralmente 6–15 caracteres.
  // Identificadores especiais já foram tratados acima; não aceitar sufixos ou símbolos extras.
  return /^[A-Z0-9]{6,15}$/i.test(normalized);
}

/**
 * Alias para isRaIdentifier para manter compatibilidade com testes e outros componentes.
 */
export const isValidRa = isRaIdentifier;

/**
 * Lista de identificadores que requerem processamento especial via ra-auth
 */
export function isSpecialIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value).toLowerCase();
  // 'g802144' e 'decoanalytics@outlook.com.br' precisam do ra-auth para mapeamento/RPC
  return normalized === 'juliana' || 
         normalized === 'decoanalytics@outlook.com.br' || 
         normalized === 'decianalytics@outlook.com.br' || 
         normalized === 'g802144';
}
