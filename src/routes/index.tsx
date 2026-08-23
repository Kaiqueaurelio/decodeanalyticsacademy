import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#050508] text-[#00f0ff] p-8 font-mono">
      <div className="max-w-4xl mx-auto border border-[#00f0ff]/30 p-6 rounded-lg bg-[#0a0a0f] shadow-[0_0_20px_rgba(0,240,255,0.1)]">
        <h1 className="text-2xl mb-4 border-b border-[#00f0ff]/30 pb-2">SYSTEM_LOG: VISUAL_TEXT_EDIT</h1>
        <div className="whitespace-pre-wrap leading-relaxed">
          Implemente um dashboard para o aluno visualizar suas apostilas, progresso e desempenho.
          {"\n\n"}
          Crie um painel para o admin clonar apostilas por link e gerenciar seções, glossário, questionário e gabarito gerados.
          {"\n\n"}
          Adicione uma página com listagem de apostilas para o aluno, incluindo busca, ordenação e acesso ao conteúdo.
          {"\n\n"}
          Implemente controle de acesso por perfil para que admin veja todas as rotas e alunos comuns vejam apenas as apostilas liberadas.
          {"\n\n"}
          Antes de executar qualquer ação, faça de 2 a 5 perguntas INTERATIVAS para entender melhor o que eu quero (alvo, valores, escopo) — não digite o texto das perguntas na sua resposta; quero elas interativas, para eu marcar ou responder direto na caixa de perguntas. Não implemente nada até eu responder. Se o pedido já estiver totalmente especificado (alvo + valor + escopo), aí sim execute direto.
        </div>
      </div>
    </div>
  );
};

export default Index;
