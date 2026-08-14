/**
 * 🔒 Testes automatizados de regressao — RLS & RPC
 *
 * Protegem contra:
 *  - vazamento de gabaritos (exercises / simulado_questions)
 *  - leitura de conteudo nao publicado (apostila_chapters)
 *  - leitura de configuracoes sensiveis (app_settings)
 *  - bypass de escopo em simulados (weekly_simulados)
 *
 * Requerem rede. Rode com: RUN_SECURITY_TESTS=1 npm run test:security
 */
import { describe, it, expect } from "vitest";
import { restSelect, rpc, signIn } from "./anon-client";

const ENABLED = process.env.RUN_SECURITY_TESTS === "1";
const d = ENABLED ? describe : describe.skip;

d("🔐 RLS — Gabaritos nao vazam para anonimos", () => {
  it("❌ anon nao le exercises.correct_answer", async () => {
    const r = await restSelect("exercises", "select=id,correct_answer&limit=1");
    expect(r.denied).toBe(true);
  });

  it("❌ anon nao le simulado_questions.correct_answer", async () => {
    const r = await restSelect("simulado_questions", "select=id,correct_answer&limit=1");
    expect(r.denied).toBe(true);
  });

  it("❌ anon nao lista weekly_simulados", async () => {
    const r = await restSelect("weekly_simulados", "select=id&limit=1");
    expect(r.denied).toBe(true);
  });
});

d("🔐 RLS — Conteudo e configuracoes protegidos", () => {
  it("❌ anon nao le app_settings sensiveis", async () => {
    const r = await restSelect("app_settings", "select=*&limit=1");
    expect(r.denied).toBe(true);
  });

  it("❌ anon nao le apostila_chapters", async () => {
    const r = await restSelect("apostila_chapters", "select=id&limit=1");
    expect(r.denied).toBe(true);
  });

  it("❌ anon nao le user_roles (escalonamento de privilegio)", async () => {
    const r = await restSelect("user_roles", "select=user_id,role&limit=1");
    expect(r.denied).toBe(true);
  });
});

d("🔐 RPC — check_simulado_answer nao expone gabarito", () => {
  it("❌ anon nao executa a RPC de correcao", async () => {
    const r = await rpc("check_simulado_answer", {
      p_question_id: "00000000-0000-0000-0000-000000000000",
      p_answer: "A",
    });
    expect(r.denied).toBe(true);
  });
});

d("🔐 Sessao autenticada (opcional)", () => {
  const email = process.env.TEST_STUDENT_EMAIL;
  const pass = process.env.TEST_STUDENT_PASSWORD;
  const run = email && pass ? it : it.skip;

  run("❌ aluno autenticado tambem nao le correct_answer", async () => {
    const token = await signIn(email!, pass!);
    expect(token).toBeTruthy();
    const r = await restSelect("exercises", "select=id,correct_answer&limit=1", token!);
    expect(r.denied).toBe(true);
  });
});
