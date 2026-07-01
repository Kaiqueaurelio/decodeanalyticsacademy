import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Plus, Trash2, Save, Trophy, AlertTriangle, Target, Sparkles, Download, BookOpen, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickGradeEstimator } from "@/components/QuickGradeEstimator";
import { getCurriculumSubjects, subjectKey } from "@/lib/curriculum-subjects";

type Row = {
  id?: string;
  subject: string;
  np1: number | null;
  np2: number | null;
  exam: number | null;
};

const parse = (v: string): number | null => {
  if (v === "" || v === undefined) return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(10, n));
};

const fmt = (n: number) => n.toFixed(1).replace(".", ",");

type Estimate =
  | { kind: "empty" }
  | { kind: "np1-only"; needNp2: number; possible: boolean }
  | { kind: "approved"; avg: number }
  | { kind: "exam-pending"; avg: number; needExam: number; possible: boolean }
  | { kind: "passed-exam"; avg: number; finalGrade: number }
  | { kind: "failed-exam"; avg: number; finalGrade: number };

function estimate(row: Row): Estimate {
  const { np1, np2, exam } = row;
  if (np1 === null && np2 === null) return { kind: "empty" };

  if (np1 !== null && np2 === null) {
    const needNp2 = 14 - np1;
    return { kind: "np1-only", needNp2, possible: needNp2 <= 10 };
  }

  if (np1 !== null && np2 !== null) {
    const avg = (np1 + np2) / 2;
    if (avg >= 7) return { kind: "approved", avg };

    if (exam !== null) {
      const finalGrade = (avg + exam) / 2;
      return finalGrade >= 5
        ? { kind: "passed-exam", avg, finalGrade }
        : { kind: "failed-exam", avg, finalGrade };
    }

    const needExam = 10 - avg;
    return { kind: "exam-pending", avg, needExam, possible: needExam <= 10 };
  }

  return { kind: "empty" };
}

function GradeRow({ row, onChange, onRemove }: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const est = estimate(row);
  const showExam =
    est.kind === "exam-pending" ||
    est.kind === "passed-exam" ||
    est.kind === "failed-exam" ||
    row.exam !== null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
    >
      <Card className="p-4 bg-card/50 backdrop-blur border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Input
            value={row.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="Nome da disciplina"
            className="bg-background/40 border-border/60 font-semibold flex-1"
          />
          <Button size="icon" variant="ghost" onClick={onRemove} className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Excluir">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className={`grid gap-2 mb-3 ${showExam ? "grid-cols-3" : "grid-cols-2"}`}>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">NP1</Label>
            <Input
              type="number" inputMode="decimal" step="0.1" min="0" max="10"
              value={row.np1 ?? ""}
              onChange={(e) => onChange({ np1: parse(e.target.value) })}
              placeholder="—"
              className="bg-background/40 border-border/60 mt-1 text-center font-mono h-11 text-base"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">NP2</Label>
            <Input
              type="number" inputMode="decimal" step="0.1" min="0" max="10"
              value={row.np2 ?? ""}
              onChange={(e) => onChange({ np2: parse(e.target.value) })}
              placeholder="—"
              className="bg-background/40 border-border/60 mt-1 text-center font-mono h-11 text-base"
            />
          </div>
          {showExam && (
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-amber-300">Exame</Label>
              <Input
                type="number" inputMode="decimal" step="0.1" min="0" max="10"
                value={row.exam ?? ""}
                onChange={(e) => onChange({ exam: parse(e.target.value) })}
                placeholder="—"
                className="bg-background/40 border-amber-500/40 mt-1 text-center font-mono h-11 text-base"
              />
            </div>
          )}
        </div>

        {/* Resultado simples */}
        <AnimatePresence mode="wait">
          {est.kind === "empty" && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground text-center py-2">
              Digite a NP1 para ver quanto falta.
            </motion.div>
          )}

          {est.kind === "np1-only" && est.possible && (
            <motion.div key="np1" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Target className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <div className="text-sm text-emerald-100">
                Precisa tirar <span className="text-lg font-bold font-mono text-emerald-300">{fmt(est.needNp2)}</span> na NP2 para passar direto
              </div>
            </motion.div>
          )}

          {est.kind === "np1-only" && !est.possible && (
            <motion.div key="np1-imp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-300 flex-shrink-0" />
              <div className="text-sm text-amber-100">Vai para o exame — informe a NP2 para ver o mínimo.</div>
            </motion.div>
          )}

          {est.kind === "approved" && (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <div className="text-sm text-emerald-100 flex-1">
                Aprovado direto · média <span className="font-mono font-bold text-emerald-300">{fmt(est.avg)}</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40">Sem exame</Badge>
            </motion.div>
          )}

          {est.kind === "exam-pending" && est.possible && (
            <motion.div key="exam" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Média <span className="font-mono text-amber-300">{fmt(est.avg)}</span> — vai para o exame
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Target className="h-4 w-4 text-amber-300 flex-shrink-0" />
                <div className="text-sm text-amber-100">
                  Precisa tirar <span className="text-lg font-bold font-mono text-amber-300">{fmt(est.needExam)}</span> no exame para não pegar DP
                </div>
              </div>
            </motion.div>
          )}

          {est.kind === "exam-pending" && !est.possible && (
            <motion.div key="dp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <XCircle className="h-4 w-4 text-rose-300 flex-shrink-0" />
              <div className="text-sm text-rose-100">
                Média <span className="font-mono">{fmt(est.avg)}</span> — DP (precisaria tirar {fmt(est.needExam)} no exame)
              </div>
            </motion.div>
          )}

          {est.kind === "passed-exam" && (
            <motion.div key="pe" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Trophy className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <div className="text-sm text-emerald-100 flex-1">
                Aprovado no exame · final <span className="font-mono font-bold text-emerald-300">{fmt(est.finalGrade)}</span>
              </div>
            </motion.div>
          )}

          {est.kind === "failed-exam" && (
            <motion.div key="fe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <XCircle className="h-4 w-4 text-rose-300 flex-shrink-0" />
              <div className="text-sm text-rose-100">
                DP · final <span className="font-mono font-bold text-rose-300">{fmt(est.finalGrade)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function CalculadoraPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [profile, setProfile] = useState<{ course: string | null; semester: number | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: grades }, { data: prof }] = await Promise.all([
        supabase.from("calculator_grades").select("*").order("created_at", { ascending: true }),
        supabase.from("profiles").select("course, semester").eq("user_id", user.id).maybeSingle(),
      ]);
      if (grades) {
        setRows(grades.map((d: any) => ({
          id: d.id, subject: d.subject, np1: d.np1, np2: d.np2, exam: d.exam,
        })));
      }
      setProfile(prof ?? null);
      setLoading(false);
    })();
  }, [user]);

  const summary = useMemo(() => {
    const ests = rows.map(estimate);
    const ok = ests.filter(e => e.kind === "approved" || e.kind === "passed-exam").length;
    const exam = ests.filter(e => e.kind === "exam-pending").length;
    const fail = ests.filter(e => e.kind === "failed-exam" || (e.kind === "exam-pending" && !e.possible)).length;
    return { total: rows.length, ok, exam, fail };
  }, [rows]);

  const addRow = () => setRows([...rows, { subject: "", np1: null, np2: null, exam: null }]);

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.id) await supabase.from("calculator_grades").delete().eq("id", row.id);
    setRows(rows.filter((_, i) => i !== idx));
  };

  const pullMySubjects = async () => {
    if (!user) return;
    setPulling(true);
    try {
      if (!profile?.semester) {
        toast.info("Cadastre seu curso e semestre no perfil para puxar as matérias.");
        return;
      }

      // 1) Grade canônica do curso/semestre
      const canonical = getCurriculumSubjects(profile.course, profile.semester);

      // 2) Apostilas publicadas do mesmo semestre (complementa a grade)
      const { data, error } = await supabase
        .from("apostilas")
        .select("category, course, semester")
        .eq("published", true)
        .eq("semester", profile.semester);
      if (error) throw error;

      const fromApostilas = (data ?? [])
        .filter((d: any) => {
          if (!profile.course) return true;
          if (!d.course || d.course.length === 0) return true;
          return d.course.includes(profile.course);
        })
        .map((d: any) => (d.category || "").trim())
        .filter(Boolean);

      // 3) Mescla deduplicando por chave normalizada (canônica tem prioridade no nome)
      const seen = new Map<string, string>();
      for (const s of canonical) seen.set(subjectKey(s), s);
      for (const s of fromApostilas) {
        const k = subjectKey(s);
        if (!seen.has(k)) seen.set(k, s);
      }
      const allSubjects = Array.from(seen.values()).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      );

      // 4) Adiciona apenas as que ainda não estão no boletim
      const existing = new Set(
        rows.map((r) => subjectKey(r.subject)).filter(Boolean)
      );
      const toAdd = allSubjects
        .filter((s) => !existing.has(subjectKey(s)))
        .map((s) => ({ subject: s, np1: null, np2: null, exam: null } as Row));

      if (toAdd.length === 0) {
        toast.info("Todas as matérias do seu semestre já estão na lista.");
      } else {
        setRows([...rows, ...toAdd]);
        toast.success(
          `${toAdd.length} matéria${toAdd.length > 1 ? "s" : ""} adicionada${toAdd.length > 1 ? "s" : ""} (${profile.semester}º sem).`
        );
      }
    } catch (e: any) {
      toast.error("Erro ao buscar matérias: " + (e?.message ?? ""));
    } finally {
      setPulling(false);
    }
  };

  const saveAll = async () => {
    if (!user) return;
    const valid = rows.filter(r => r.subject.trim());
    if (valid.length === 0) {
      toast.error("Adicione ao menos uma disciplina.");
      return;
    }
    setSavingAll(true);
    try {
      const payload = valid.map(r => ({
        user_id: user.id,
        subject: r.subject.trim(),
        np1: r.np1, np2: r.np2, exam: r.exam,
      }));
      const { data, error } = await supabase
        .from("calculator_grades")
        .upsert(payload, { onConflict: "user_id,subject" })
        .select();
      if (error) throw error;
      const byKey = new Map((data ?? []).map((d: any) => [d.subject.toLowerCase(), d.id]));
      setRows(rows.map(r => {
        const id = byKey.get(r.subject.trim().toLowerCase());
        return id ? { ...r, id } : r;
      }));
      toast.success(`Boletim salvo (${valid.length} matéria${valid.length > 1 ? "s" : ""}).`);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e?.message ?? ""));
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 border border-primary/40 flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Calculadora de Aprovação</h1>
              <p className="text-sm text-muted-foreground">
                Regra UNIP: média ≥ 7 passa direto, senão exame com final ≥ 5
              </p>
            </div>
          </div>
        </motion.div>

        {/* Estimador rápido */}
        <div className="mb-6">
          <QuickGradeEstimator />
        </div>

        {/* Boletim por disciplina */}
        <div className="flex items-center justify-between mb-3 mt-8">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Meu boletim
          </h2>
          {rows.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {summary.ok} aprovada{summary.ok !== 1 ? "s" : ""} · {summary.exam} exame · {summary.fail} risco
            </span>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Carregando…</Card>
          ) : rows.length === 0 ? (
            <Card className="p-8 text-center bg-card/40 backdrop-blur">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {profile?.semester
                  ? `Puxar as ${"matérias"} do seu ${profile.semester}º semestre ou adicionar manualmente.`
                  : "Puxe automaticamente as matérias do seu semestre ou adicione manualmente."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={pullMySubjects} disabled={pulling} className="gap-2">
                  {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Puxar minhas matérias
                </Button>
                <Button onClick={addRow} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Adicionar manualmente
                </Button>
              </div>
            </Card>
          ) : (
            <AnimatePresence>
              {rows.map((row, i) => (
                <GradeRow
                  key={row.id ?? `new-${i}`}
                  row={row}
                  onChange={(patch) => updateRow(i, patch)}
                  onRemove={() => removeRow(i)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2 sticky bottom-4 z-10">
            <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-background/80 backdrop-blur border border-border/60 shadow-lg">
              <Button onClick={pullMySubjects} disabled={pulling} variant="outline" size="sm" className="gap-2">
                {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Puxar matérias
              </Button>
              <Button onClick={addRow} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
              <Button onClick={saveAll} disabled={savingAll} size="sm" className="gap-2">
                {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar boletim
              </Button>
            </div>
          </div>
        )}

        {/* Como funciona */}
        <Card className="mt-8 p-5 bg-card/30 backdrop-blur border-border/40">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Como a UNIP calcula sua nota
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <span className="text-foreground">Média</span> = (NP1 + NP2) ÷ 2</li>
            <li>• Se Média <span className="text-emerald-300">≥ 7</span> → aprovado direto</li>
            <li>• Se Média &lt; 7 → vai para <span className="text-amber-300">Exame</span></li>
            <li>• Final = (Média + Exame) ÷ 2 — precisa <span className="text-emerald-300">≥ 5</span> para passar</li>
            <li>• <AlertTriangle className="h-3 w-3 inline text-amber-300" /> Frequência mínima 75% (não calculada aqui)</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
