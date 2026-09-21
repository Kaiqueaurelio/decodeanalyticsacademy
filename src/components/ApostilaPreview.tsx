interface ApostilaPreviewProps {
  content: string;
  isLoggedIn: boolean;
}

/**
 * Fallback público da apostila.
 *
 * O leitor autenticado já renderiza o conteúdo editorial completo em ApostilaPage.
 * Para visitantes, também exibimos o conteúdo completo em vez de cortar em 500
 * caracteres e aplicar um bloqueio visual. O corte anterior fazia apostilas
 * grandes parecerem incompletas mesmo quando estavam integralmente salvas.
 */
export function ApostilaPreview({
  content,
  isLoggedIn,
}: ApostilaPreviewProps) {
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="relative w-full">
      <article
        className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap text-foreground/95"
        aria-label="Conteúdo completo da apostila"
      >
        {content}
      </article>
    </div>
  );
}
