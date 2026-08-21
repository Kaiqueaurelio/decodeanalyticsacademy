/**
 * Textos canônicos de segurança usados na área administrativa e no fluxo de sessão.
 *
 * Manter as mensagens em um único módulo evita divergências entre navegação,
 * cabeçalhos, painéis de auditoria e notificações de autenticação.
 */
export const SECURITY_COPY = {
  navigationDescription: 'Alertas, bloqueios e auditoria de permissões.',
  pageDescription: 'O servidor bloqueia ações sem permissão e registra cada tentativa para auditoria.',
  alertsDescription: 'O servidor bloqueia automaticamente ações sem permissão e registra cada tentativa para auditoria.',
  academicAuditDescription: 'Acessos autorizados e recusados a gabaritos, respostas e submissões ficam registrados para auditoria.',
  sessionRefreshTitle: 'Sessão expirada',
  sessionRefreshDescription: 'Por segurança, faça login novamente para continuar.',
  loginErrorTitle: 'Não foi possível entrar',
  loginErrorDescription: 'Verifique suas credenciais ou aguarde se o acesso estiver temporariamente bloqueado.',
  passwordResetError: 'Não foi possível processar a redefinição de senha.',
} as const;
