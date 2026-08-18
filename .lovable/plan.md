# Plano de Auditoria e Estabilidade v6.2.0

Este plano visa resolver a instabilidade reportada no avatar da Ella, a falha na exibição das apostilas do 6º semestre e realizar uma auditoria completa de funcionamento do aplicativo.

## Mudanças Técnicas

### 1. Estabilização do Avatar da Ella
* **Arquivo:** `src/lib/ellaAvatar.ts` e `src/components/ella/EllaSidebar.tsx`
* **Ação:** Simplificar a lógica de cache-busting. Atualmente, a URL é regenerada a cada 2 segundos, o que pode causar piscadas ou falhas de carregamento se o navegador não processar a imagem a tempo.
* **Melhoria:** Usar uma URL estática e apenas atualizar quando houver mudança real detectada via storage events ou manual refresh.

### 2. Visibilidade de Apostilas (6º Semestre)
* **Arquivo:** `src/hooks/queries/useDashboardData.ts` e `src/pages/DashboardPage.tsx`
* **Ação:** 
    * Corrigir o mapeamento de semestres no hook `useApostilasList`. 
    * Garantir que "Sistemas Operacionais e Mobile" seja corretamente identificado como 6º semestre.
    * Adicionar logs de diagnóstico no dashboard para rastrear falhas de renderização silenciosas.
* **Resiliência:** Garantir que matérias "Bônus" e "Canivete Suíço" apareçam independentemente do semestre selecionado.

### 3. Auditoria Técnica e UX
* **Arquivos:** Vários componentes do Dashboard e Admin.
* **Ação:**
    * Validar se o filtro de semestre (`SemesterFilter`) está visível para o admin e alunos.
    * Verificar se o `SubjectFolderGrid` está renderizando as matérias corretamente após o login.
    * Testar o fluxo de "Continuar de onde parou" para garantir que não quebra o layout inicial.

### 4. Correção de Login Especial
* **Arquivo:** `src/pages/LoginPage.tsx`
* **Ação:** Reforçar o tratamento de erros no login por RA especial (`G802144` e `Juliana`) para evitar timeouts ou falhas intermitentes na Edge Function.

## Auditoria Detalhada
Após as correções, realizarei uma nova rodada de testes automatizados com Playwright simulando:
1. Login Admin (G802144) -> Verificação de Dashboard e Avatar.
2. Login Aluno (Juliana) -> Verificação de Dashboard e restrições de conteúdo.
3. Clique em cada item do menu lateral para validar rotas.
