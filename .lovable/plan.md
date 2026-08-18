# Plano de Implementação: Visibilidade e Destaque de Vagas

O sistema de **Vagas e Estágios** será aprimorado para garantir que os alunos visualizem as oportunidades diretamente no Dashboard e tenham acesso fácil ao painel de gestão.

## Melhorias nas Vagas e Estágios

### 1. Painel Administrativo (Gestão)
- **Correção de Visibilidade**: Finalizar a integração do `JobsManager` no `AdminPage.tsx` para garantir que a aba "Vagas e Estágios" renderize corretamente o componente de gestão.
- **Feedback Visual**: Garantir que o link na sidebar administrativa aponte corretamente para a aba de vagas.

### 2. Dashboard do Aluno (Destaque Híbrido)
- **Widget de Vagas Recentes**: Criar um componente `FeaturedJobsWidget` que exibe as últimas vagas publicadas.
- **Design Híbrido**:
    - **Visualização Compacta**: Um card de destaque no topo (abaixo do Hero) para a vaga mais urgente/recente.
    - **Lista no Feed**: Uma seção "Oportunidades Recomendadas" integrada ao feed central de estudos.
- **Informações Completas**: Exibição de logo da empresa, título, tipo de vaga (Estágio/CLT), localização e salário (conforme selecionado "tudo" e "híbrido" pelo usuário).

### 3. Navegação e Fluxo
- **Redirecionamento**: Ao clicar no widget do Dashboard, o aluno será levado para a página completa `/vagas`.
- **Persistência**: Garantir que a página `/vagas` carregue corretamente todos os dados e tenha uma UX fluida para mobile.

## Detalhes Técnicos
- **Consultas Supabase**: Otimizar o fetch de vagas para buscar apenas `is_active = true`.
- **Componentes**: Uso de `framer-motion` para animações de entrada e `Lucide React` para iconografia consistente.
- **Responsividade**: Garantir que o widget de vagas no dashboard se ajuste perfeitamente em telas de iPhone/Android.
