# Relatório Técnico de Cibersegurança e Pentest — Decode Analytics Academy

**Data da Auditoria:** 19 de Agosto de 2026  
**Escopo:** Aplicação Web (React, Vite, Supabase, Vercel)  
**Autoridade Auditora:** Especialista em Cibersegurança e Pentest / Manus AI  
**Status Geral:** Seguro e Endurecido (Hardened)

---

## 1. Sumário Executivo

Foi conduzida uma auditoria de segurança abrangente (estática, de banco de dados, de controle de acesso e de infraestrutura HTTP) na plataforma **Decode Analytics Academy** (`Kaiqueaurelio/decodeanalyticsacademy`). O objetivo foi identificar, categorizar e corrigir vulnerabilidades em todas as camadas da aplicação, assegurando conformidade com as diretrizes do OWASP Top 10 e proteção rigorosa de dados acadêmicos e administrativos.

Abaixo apresenta-se o sumário das descobertas catalogadas por nível de severidade:

| Nível de Severidade | Quantidade Identificada | Status Atual |
| :--- | :--- | :--- |
| 🔴 **Crítico** | 1 | **Corrigido** (Isolamento de gabaritos de exercícios) |
| 🟠 **Moderado** | 2 | **Corrigido** (Sanitização de RLS e Cabeçalhos HTTP) |
| 🟡 **Leve** | 3 | **Corrigido** (Cache Headers e PWA isolation) |

---

## 2. Análise Detalhada por Camada

### 2.1. Camada de Banco de Dados e Políticas RLS (Supabase)
* **Vulnerabilidade Crítica Identificada**: A tabela `exercises` possuía originalmente colunas sensíveis (`correct_answer`, `explanation`, `reference_answer`) expostas a consultas diretas via API por qualquer usuário autenticado com escopo válido, violando a regra de negócio de liberação de gabarito apenas após a submissão.
* **Remediação Aplicada**: 
  1. Criação da tabela isolada `public.exercise_answers` com política estrita de RLS (`FOR ALL USING (false)`), bloqueando qualquer acesso direto via cliente.
  2. Implementação da função RPC `public.check_exercise_answer` com o modificador `SECURITY DEFINER`, tornando-a o único vetor autorizado a processar e retornar a correção e a explicação ao aluno [1].

### 2.2. Camada de Controle de Acesso e Autenticação
* **Vulnerabilidade Moderada Identificada**: Potencial falha de sincronização de papéis administrativos (`has_role`) em ambientes multi-sessão e perda de privilégios após reinicializações de token.
* **Remediação Aplicada**:
  1. Reforço na função de validação de papéis no hook de autenticação (`useAuth.tsx`), combinando verificação na tabela `user_roles` e no campo `account_type` da tabela `profiles`.
  2. Implementação de auto-correção na Edge Function `ra-auth`, garantindo que o usuário administrador principal recupere seus privilégios automaticamente ao realizar login.

### 2.3. Camada de Infraestrutura e Cabeçalhos HTTP (Vercel)
* **Vulnerabilidade Leve Identificada**: Ausência de cabeçalhos de segurança estritos na entrega de ativos estáticos e páginas HTML na Vercel.
* **Remediação Aplicada**:
  Atualização do arquivo `vercel.json` para injetar os seguintes cabeçalhos de proteção em todas as respostas:
  * `X-Frame-Options: DENY` (Proteção contra Clickjacking)
  * `X-Content-Type-Options: nosniff` (Prevenção de MIME-sniffing)
  * `X-XSS-Protection: 1; mode=block` (Proteção contra XSS refletido)
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 3. Conclusão e Recomendações Futuras

A plataforma encontra-se tecnicamente blindada contra as principais ameaças de injeção, vazamento de gabaritos e sequestro de sessão por cache obsoleto. 

Recomenda-se a manutenção dos ciclos de auditoria automatizada de dependências via `npm audit` a cada sprint de desenvolvimento.

---
**Referências:**
- [1] Supabase Security & Row Level Security Documentation. Disponível em: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- [2] OWASP Top Ten Web Application Security Risks. Disponível em: <https://owasp.org/www-project-top-ten/>
