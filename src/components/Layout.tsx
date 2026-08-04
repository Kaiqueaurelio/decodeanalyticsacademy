import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Shell raiz responsivo em dark mode usando CSS Grid.
 *
 * Layout desktop (>= md):
 *   ┌──────────────────────────┐
 *   │         header           │
 *   ├──────────┬───────────────┤
 *   │ sidebar  │    main       │
 *   ├──────────┴───────────────┤
 *   │         footer           │
 *   └──────────────────────────┘
 *
 * Layout mobile (< md): colunas colapsam em uma única coluna,
 * sidebar aparece acima do conteúdo principal.
 */
export function Layout({ header, sidebar, footer, children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        "dark min-h-dvh bg-background text-foreground",
        "grid grid-cols-1 md:grid-cols-[auto_1fr]",
        "grid-rows-[auto_1fr_auto]",
        "[grid-template-areas:'header'_'sidebar'_'main'_'footer'] md:[grid-template-areas:'header_header'_'sidebar_main'_'footer_footer']",
        className
      )}
    >
      {header && (
        <header
          className="[grid-area:header] sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          {header}
        </header>
      )}

      {sidebar && (
        <aside
          className="[grid-area:sidebar] border-b md:border-b-0 md:border-r border-border/60 bg-card/40 hidden md:block"
        >
          {sidebar}
        </aside>
      )}

      <main className="[grid-area:main] min-w-0 p-4 md:p-6 lg:p-8">
        {children}
      </main>

      {footer && (
        <footer className="[grid-area:footer] border-t border-border/60 bg-card/40">
          {footer}
        </footer>
      )}
    </div>
  );
}

export default Layout;
