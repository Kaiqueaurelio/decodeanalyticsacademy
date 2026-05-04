import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { useUserProfile } from '@/hooks/queries/useUserProfile';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <AppHeader />
      <main className="container py-12 px-4 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-4">Olá, {profile?.full_name || 'Aluno'}! 👋</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Seu app está sendo restaurado para garantir estabilidade total.
        </p>
        <div className="p-8 border rounded-2xl bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">
            Estamos simplificando o painel para eliminar o erro de tela branca. 
            Em breve, todas as suas estatísticas e materiais estarão de volta aqui.
          </p>
        </div>
      </main>
    </div>
  );
}
