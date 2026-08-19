# Verificação funcional da build local

Data da execução: 19 de agosto de 2026.

A build de produção local foi servida em `http://localhost:4174/` após `pnpm build`. A landing montou com o branding independente Decode Analytics Academy, recursos da plataforma, gamificação, CTA de login e sem referência visual ao portal da UNIP.

A rota `http://localhost:4174/login` montou o formulário correto de autenticação, com campos de RA/e-mail e senha, alternância acessível de senha, aceite de termos e estados de acesso. A rota não retornou a landing page.

A rota `http://localhost:4174/vagas` montou o portal público e exibiu busca, filtro por tipo, publicidade e proteção de ações. Nesta execução local, a consulta retornou zero oportunidades, o que é compatível com a ausência de dados de produção no ambiente/consulta atual; a interface exibiu o estado vazio de forma controlada, sem erro de runtime.

## Resultado técnico

- `pnpm exec tsc --noEmit`: aprovado.
- `pnpm build`: aprovado; PWA gerado com 28 entradas de precache e 569,18 KiB.
- `pnpm test --run`: 9 arquivos e 60 testes aprovados.
- `pnpm test:security`: 5 testes de defesa contra prompt injection aprovados.
- `pnpm lint`: falhou por 798 problemas preexistentes distribuídos pelo projeto; a verificação direcionada dos arquivos alterados não apontou erro novo filtrável além dos `any` históricos.
