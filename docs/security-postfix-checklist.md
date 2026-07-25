# Checklist de validação pós-correção — Segurança

Marque cada item somente depois de executar a verificação e observar o resultado esperado. Use `supabase/tests/security.test.ts` como âncora automatizada.

---

## 1. Vazamento de dados (Data Exposure)

- [ ] **Tabelas sensíveis com RLS ativo:** `profiles`, `user_roles`, `answers`, `user_xp`, `security_alerts`, `activity_logs`, `security_alerts` — anon retorna `[]` ou erro de permissão, nunca linhas.
  - Verificação: `deno test -A supabase/tests/security.test.ts` (bloco "RLS: anon não lê ...").
- [ ] **Bucket `books` privado:** GET direto em `/storage/v1/object/public/books/*` retorna 400/403/404.
- [ ] **Buckets públicos (`ads`, `announcements`, `apostila-covers`) não permitem LIST anônimo:** anon recebe erro ou array vazio.
- [ ] **URLs de mídia sensível são assinadas (`createSignedUrl`)** com expiração ≤ 1h — nada de `getPublicUrl` em `books`, `materials`, `tira-duvida`, `respostas-foto`, `calendar-pdfs`, `apostila-covers`.
- [ ] **Nenhum segredo no bundle do front:** `rg -n "SERVICE_ROLE|SECRET_KEY|GOOGLE_AI_API_KEY|ELEVENLABS" src/` retorna vazio.
- [ ] **Console/localStorage limpos** de tokens, e-mails ou payloads sensíveis (auditoria manual em DevTools após login).

## 2. Escalada de privilégios (Privilege Escalation)

- [ ] **Coluna `role` não existe em `profiles`** — papéis só em `public.user_roles`.
- [ ] **`user_roles` protegido:** usuário autenticado comum não consegue `INSERT/UPDATE/DELETE` no próprio registro para virar `admin` (RLS bloqueia).
- [ ] **Trigger `protect_profile_security_fields` ativo:** tentativa de alterar `is_blocked`, `login_attempts`, `content_scope` como usuário comum lança exceção.
- [ ] **Funções `SECURITY DEFINER` internas sem EXECUTE para PUBLIC/anon/authenticated:** `get_email_for_ra`, `delete_user_completely`, `get_student_rankings`, `get_student_detail`.
  - Verificação: chamar via RPC anon retorna erro de permissão.
- [ ] **Edge functions administrativas checam `has_role(auth.uid(), 'admin')`** antes de qualquer ação (broadcast, publish, delete-user, seed).
- [ ] **`content_scope='enem_only'`** — usuário Vivian (`G350776`) não vê apostilas fora de ENEM, não recebe anúncios, não acessa Calculadora/Flashcards/Tira-dúvidas.

## 3. Enumeração de usuários (User Enumeration)

- [ ] **Login por RA passa exclusivamente pela edge function `ra-login`** — nenhuma chamada direta a `get_email_for_ra` no front (`rg -n "get_email_for_ra" src/` → vazio).
- [ ] **Respostas de `ra-login` são genéricas:** RA inexistente e senha errada devolvem a **mesma** mensagem (ex.: "Credenciais inválidas") e o **mesmo** status (401). Sem diferenciar por tempo perceptível.
- [ ] **Rate-limit em `ra-login`:** 6ª tentativa/min do mesmo IP recebe 429. Verificação automatizada no test file.
- [ ] **Signup/Recuperação de senha** não confirmam existência de e-mail cadastrado (mensagem neutra: "Se o e-mail existir, enviamos um link").
- [ ] **Sem endpoint público que ecoe `email`, `ra` ou `full_name`** a partir de um identificador arbitrário.

## 4. Regressão funcional (não quebrou o que já funcionava)

- [ ] Login por e-mail/senha OK (admin + aluno).
- [ ] Login por RA OK (Vivian G350776).
- [ ] Dashboard do aluno carrega apostilas + XP + streak.
- [ ] Admin cria, edita e apaga anúncio; imagens renderizam.
- [ ] Ella responde no chat com avatar visível em mobile e desktop.
- [ ] Vídeo de fundo da landing carrega em mobile e desktop.

## 5. Execução do checklist

```bash
deno test -A supabase/tests/security.test.ts
```

Todos os testes devem passar. Qualquer falha ⇒ reabrir o item correspondente antes de considerar a correção concluída.
