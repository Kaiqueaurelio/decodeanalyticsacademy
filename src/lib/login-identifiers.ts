import { normalizeIdentifier } from "./login-normalization";

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
 * Verifica se o identificador é um RA (Registro Acadêmico).
 */
export function isRaIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  if (isSpecialIdentifier(normalized)) return true;
  // Padrão RA UNIP: Letras e números, geralmente 7-10 caracteres
  return /^[A-Z0-9]{6,15}$/i.test(normalized) || normalized.toLowerCase().startsWith('g');
}

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
