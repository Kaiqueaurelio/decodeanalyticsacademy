/**
 * Normaliza o identificador removendo espaços e caracteres invisíveis.
 */
export function normalizeIdentifier(value: string): string {
  return (value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/**
 * Normaliza especificamente um RA removendo hífens, pontos e espaços.
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
 * Verifica se o identificador é um e-mail.
 * Para o Decode Analytics Academy, e-mails administrativos são tratados como "identificadores especiais"
 * para forçar o fluxo via Edge Function ra-auth, garantindo a normalização correta.
 */
export function isEmailIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  // Se for um dos identificadores especiais (admin), não tratamos como "e-mail comum"
  // para garantir que caia no bloco 'isSpecial' da LoginPage.
  if (isSpecialIdentifier(normalized)) return false;
  return normalized.includes('@') && !normalized.toLowerCase().endsWith('@ra.unip.local');
}

/**
 * Alias para isEmailIdentifier para manter compatibilidade com testes e outros componentes.
 */
export const isValidEmail = isEmailIdentifier;

/**
 * Verifica se o identificador é um RA (Registro Acadêmico).
 */
export function isRaIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  if (isSpecialIdentifier(normalized)) return true;
  // Padrão RA UNIP: Letras e números, geralmente 6-15 caracteres
  return /^[A-Z0-9]{6,15}$/i.test(normalized) || normalized.toLowerCase().startsWith('g');
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
