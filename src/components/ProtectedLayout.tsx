import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NetflixNavbar } from "@/components/NetflixNavbar";
import { ContentProtection } from "@/components/ContentProtection";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg font-bold">DECODE</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ContentProtection />
      <NetflixNavbar />
      <main className="pt-14 sm:pt-16">{children}</main>
    </div>
  );
}
