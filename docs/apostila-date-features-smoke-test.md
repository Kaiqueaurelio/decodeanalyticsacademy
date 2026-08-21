# Evidências do smoke test — recursos por data

Data da verificação: 21/08/2026.

A aplicação local iniciou pelo Vite em `http://localhost:8080/` após a conclusão do build de produção. A landing page renderizou com o título Decode Analytics Academy, navegação principal, CTA de login e conteúdo da plataforma. O console registrou apenas mensagens já existentes de atualização/limpeza de cache e eventos normais de hidratação da autenticação; não houve exceção JavaScript fatal.

A navegação direta para `http://localhost:8080/aula-do-dia` respeitou o `ProtectedRoute` e redirecionou para `/login?next=%2Faula-do-dia`. Isso comprova que a rota está registrada e protegida para usuários não autenticados. A autenticação real e a consulta ao Supabase permanecem pendentes de validação em uma sessão autenticada; nenhuma credencial foi exposta neste registro.

Gates automatizados executados: TypeScript sem erros; Vitest com 14 arquivos e 96 testes aprovados; Vite build concluído; `git diff --check` sem apontamentos. O build ainda emite avisos conhecidos de chunks grandes, sem falha de compilação.
