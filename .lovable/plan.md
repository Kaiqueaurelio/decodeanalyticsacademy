
O usuário quer adicionar uma opção de cadastro via **RA da UNIP** (além do email tradicional). O aluno escolheria entre duas formas:
1. **RA + senha** (acesso rápido, sem precisar de email)
2. **Email + senha** (fluxo atual)

## Análise técnica

O Supabase Auth exige um email válido para criar conta — não aceita "RA" como identificador nativo. Solução padrão: gerar um pseudo-email interno a partir do RA (ex: `2312345678@ra.unip.local`) e armazenar o RA no perfil. O aluno só vê e digita o RA; o email é montado automaticamente nos bastidores.

**Validação do RA UNIP**: RAs UNIP têm tipicamente 10-13 dígitos numéricos. Validamos formato (apenas números, comprimento mínimo) antes de permitir cadastro.

**Sem verificação de email** para cadastros via RA (não há email real). Para email tradicional, mantém o fluxo atual com confirmação.

## Plano

### 1. Banco de dados (migração)
- Adicionar coluna `ra` (text, nullable, unique) na tabela `profiles`
- Adicionar coluna `account_type` (text, default `'email'`, valores: `'email'` ou `'ra'`)
- Atualizar a função `handle_new_user` para extrair `ra` do `raw_user_meta_data` quando presente

### 2. UI da página de Login (`src/pages/LoginPage.tsx`)
Na aba **Cadastro**, adicionar um seletor (tabs ou toggle) no topo:
- **"Sou aluno UNIP (RA)"** → mostra campo RA + senha + confirmar senha
- **"Usar email"** → mostra fluxo atual (email + senha)

Na aba **Login**, adicionar o mesmo seletor:
- **"Entrar com RA"** → campo RA + senha
- **"Entrar com email"** → fluxo atual

### 3. Lógica de auth
- **Cadastro RA**: validar RA (apenas dígitos, 8-13 chars) → montar email pseudo `${ra}@ra.unip.local` → `supabase.auth.signUp` com metadata `{ ra, account_type: 'ra' }` → login automático (sem confirmação de email)
- **Login RA**: montar mesmo pseudo-email → `signInWithPassword`
- **Recuperação de senha via RA**: bloquear (mostrar aviso "Cadastro por RA não permite recuperação por email — contate o admin"), pois não há email real

### 4. Texto/UX
- Adicionar dica visual: "Cadastro por RA é mais rápido, mas você não poderá recuperar sua senha por email"
- Manter a estética cyber atual (ciano/roxo, Space Grotesk)
- Footer obrigatório "Desenvolvido por: Kaique Aurelio & Decode Analytics" mantido

### 5. Memória
Salvar regra em `mem://auth/credentials-and-recovery` sobre o fluxo dual RA/Email.

## Arquivos afetados
- `supabase/migrations/` (nova migração: colunas `ra`, `account_type` + atualizar `handle_new_user`)
- `src/pages/LoginPage.tsx` (UI e lógica do toggle)
- `mem://auth/credentials-and-recovery` (atualizar memória)

## Pontos a confirmar
- Formato do RA UNIP: aceito **8 a 13 dígitos numéricos** (cobre formatos antigos e novos). OK?
- Domínio interno: `@ra.unip.local` (nunca enviado, apenas interno). OK?
- Recuperação de senha para contas RA: **bloqueada** com aviso para contatar admin. OK?
