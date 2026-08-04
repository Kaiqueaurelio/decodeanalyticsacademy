import { toast } from "sonner";

/**
 * Utilitário para logging seguro em produção.
 * Em desenvolvimento, exibe detalhes no console.
 * Em produção, mascara erros técnicos e pode enviar para um serviço de telemetria.
 */
export const safeLog = (error: any, context?: string) => {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.group(`[Debug Log] ${context || 'General Error'}`);
    console.error(error);
    console.groupEnd();
  }

  // Aqui poderíamos integrar Sentry/Logtail se houvesse uma chave configurada
};

/**
 * Exibe um toast de erro amigável sem expor detalhes técnicos.
 */
export const showFriendlyError = (error: any, fallbackMessage: string = "Ocorreu um erro inesperado. Tente novamente.") => {
  safeLog(error);
  
  // Tenta extrair uma mensagem de erro legível do Supabase ou similar
  const message = error?.message || error?.error_description || fallbackMessage;
  
  // Filtra mensagens que contenham termos técnicos sensíveis
  const isSensitive = /table|column|relation|syntax|pg_|^42/i.test(message);
  
  toast.error(isSensitive ? fallbackMessage : message);
};
