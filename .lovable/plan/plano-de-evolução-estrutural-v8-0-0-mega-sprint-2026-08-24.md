# Plano de Evolução Estrutural v8.0.0 - "Mega Sprint"

Este plano detalha a execução das 10 melhorias estratégicas sugeridas, integradas em uma única atualização massiva, mantendo a estética **Tech/Industrial Cyberpunk** e reforçando a infraestrutura do app.

## 📋 Lista de Implementação (10 Sugestões)

1.  **Ella AI Real-Time Feedback**: Integração no leitor de apostilas com suporte a explicações e TTS (Text-to-Speech).
2.  **Sistema de Notas em Margem**: Interface estilo Notion para anotações contextuais em apostilas.
3.  **Simulados Adaptativos (ML)**: Lógica de geração de simulados baseada em fraquezas históricas do aluno.
4.  **Widget Foco Pomodoro**: Timer Cyberpunk na sidebar com recompensas de XP.
5.  **Compartilhamento de Cadernos**: Sistema de publicação de resumos entre alunos.
6.  **Dashboard de "Calor de Dúvidas" (Admin)**: Visualização para o administrador sobre dificuldades comuns.
7.  **Busca Semântica (RAG)**: Melhoria na busca global para entender conceitos técnicos.
8.  **Flashcards Auto-Gerados**: Geração de cartões de revisão pós-leitura via IA.
9.  **Integração de Cronograma**: Sincronização básica de datas de estudo com calendários externos.
10. **Comunidade por Disciplina**: Mini-fóruns integrados às matérias para troca de conhecimento.

## 🛠️ Detalhes Técnicos

### Backend (Supabase)
- Novas tabelas: `public.notes` (notas em margem), `public.flashcards` (revisão), `public.forum_posts` (comunidade).
- Funções RPC para cálculo de "fraquezas" em simulados.
- Expansão de RLS para garantir que notas privadas fiquem isoladas e posts da comunidade sejam públicos aos alunos.

### Frontend (React/TanStack)
- **Refatoração do Leitor**: Injeção de componentes de UI (Ella, Notas) diretamente no fluxo de texto.
- **Sidebars Dinâmicas**: Expansão da sidebar para incluir o Widget Pomodoro.
- **Estética Cyberpunk**: Refinamento de bordas neon, fontes mono e animações de scanline em todos os novos componentes.

## 🚀 Próximos Passos
1. Criar as migrações de banco de dados necessárias.
2. Implementar a lógica de IA para Notas e Flashcards.
3. Construir as interfaces de UI (Pomodoro, Fórum, Dashboard Admin).
4. Realizar testes de integração e performance.
