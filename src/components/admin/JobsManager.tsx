import React from 'react';

export default function JobsManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestor de Vagas</h2>
          <p className="text-muted-foreground text-sm">Publique e gerencie vagas de emprego e estágio.</p>
        </div>
      </div>
      <div className="bg-card p-12 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-muted-foreground">O sistema de gestão de vagas está sendo inicializado.</p>
      </div>
    </div>
  );
}
