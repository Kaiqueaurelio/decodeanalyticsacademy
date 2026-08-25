import { ReactNode, useState } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { DashboardTopbar } from './DashboardTopbar';

interface StudentAppShellProps {
  children: ReactNode;
}

/**
 * Shell visual das áreas autenticadas do aluno.
 * Mantém sidebar, topbar, fundo e espaçamento iguais em todas as abas.
 */
export function StudentAppShell({ children }: StudentAppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <StudentSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((previous) => !previous)}
      />
      <div
        className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-out ${
          sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'
        }`}
      >
        <DashboardTopbar />
        <main className="min-w-0 flex-1 bg-background/95 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default StudentAppShell;
