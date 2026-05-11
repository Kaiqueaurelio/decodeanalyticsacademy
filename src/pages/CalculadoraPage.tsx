import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Plus, Trash2, Save, Trophy, AlertTriangle, Target, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeGrade, STATUS_COLORS, type GradeResult } from "@/lib/grade-calculator";
import { QuickGradeEstimator } from "@/components/QuickGradeEstimator";

type Row = {
  id?: string;
  subject: string;
  np1: number | null;
  np2: number | null;
  exam: number | null;
  notes?: string | null;
};

const numOrNull = (v: string): number | null => {
  if (v === "" || v === undefined) return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(10, n));
};

function GradeCard({ row, result, onChange, onRemove, onSave }: {
  row: Row;
  result: GradeResult;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const status = STATUS_COLORS[result.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <Card className={`p-5 border ${status.bg} backdrop-blur-sm`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <Input
              value={row.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              placeholder="Nome da disciplina"
              className="bg-background/40 border-border/60 text-base font-semibold"
            />
          </div>
          <Badge variant="outline" className={`${status.text} border-current`}>
            {status.label}
          </Badge>
          <Button size="icon" variant="ghost" onClick={onRemove} className="h-9 w-9">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["np1", "np2", "exam"] as const).map((field) => (
            <div key={field}>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {field === "exam" ? "Exame" : field.toUpperCase()}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="10"
                value={row[field] ?? ""}
                onChange={(e) => onChange({ [field]: numOrNull(e.target.value) })}
                placeholder="—"
                className="bg-background/40 border-border/60 mt-1 text-center font-mono"
              />
            </div>
          ))}
        </div>

        {/* Slider de simulação NP2 quando só NP1 está preenchida */}
        {row.np1 !== null && row.np2 === null && (
          <div className="mb-4 p-3 rounded-lg bg-background/30 border border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Simular NP2
              </span>
              <span className="text-sm font-mono text-primary">
                Simulando: {(row.np2 as any) ?? "0.0"}
              </span>
            </div>
            <Slider
              defaultValue={[5]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={([v]) => onChange({ np2: v })}
              className="my-2"
            />
          </div>
        )}

        <div className={`p-3 rounded-lg border ${status.bg} mb-3`}>
          <p className={`text-sm font-medium ${status.text}`}>{result.message}</p>
          {result.average !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Média NP1+NP2: <span className="font-mono">{result.average.toFixed(2)}</span>
              {result.finalGrade !== null && result.exam !== null && (
                <> · Final c/ exame: <span className="font-mono">{result.finalGrade.toFixed(2)}</span></>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {result.needNp2ForApproval !== null && row.np2 === null && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-emerald-300 font-semibold">Passar direto</div>
              <div className="font-mono text-emerald-200">NP2 ≥ {result.needNp2ForApproval.toFixed(1)}</div>
            </div>
          )}
          {result.needExam !== null && result.needExam > 0 && result.needExam <= 10 && row.exam === null && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="text-amber-300 font-semibold">Mínimo no exame</div>
              <div className="font-mono text-amber-200">≥ {result.needExam.toFixed(1)}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-3">
          <Button size="sm" variant="outline" onClick={onSave} className="gap-2">
            <Save className="h-3 w-3" /> Salvar
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function CalculadoraPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("calculator_grades")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setRows(data.map((d: any) => ({
          id: d.id, subject: d.subject, np1: d.np1, np2: d.np2, exam: d.exam, notes: d.notes,
        })));
      }
      setLoading(false);
    })();
  }, [user]);

  const results = useMemo(() => rows.map(r => computeGrade(r)), [rows]);

  const summary = useMemo(() => {
    const total = results.length;
    const ok = results.filter(r => r.status === "approved").length;
    const exam = results.filter(r => r.status === "exam").length;
    const fail = results.filter(r => r.status === "failed").length;
    return { total, ok, exam, fail };
  }, [results]);

  const addRow = () => {
    setRows([...rows, { subject: "", np1: null, np2: null, exam: null }]);
  };

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const removeRow = async (idx: number) => {
    const row = rows[idx];
    if (row.id) {
      await supabase.from("calculator_grades").delete().eq("id", row.id);
    }
    setRows(rows.filter((_, i) => i !== idx));
  };

  const saveRow = async (idx: number) => {
    const row = rows[idx];
    if (!user || !row.subject.trim()) {
      toast.error("Informe o nome da disciplina.");
      return;
    }
    const payload = {
      user_id: user.id,
      subject: row.subject.trim(),
      np1: row.np1,
      np2: row.np2,
      exam: row.exam,
    };
    if (row.id) {
      const { error } = await supabase.from("calculator_grades").update(payload).eq("id", row.id);
      if (error) { toast.error("Erro ao salvar"); return; }
    } else {
      const { data, error } = await supabase
        .from("calculator_grades")
        .upsert(payload, { onConflict: "user_id,subject" })
        .select()
        .single();
      if (error) { toast.error("Erro ao salvar"); return; }
      setRows(rows.map((r, i) => i === idx ? { ...r, id: data.id } : r));
    }
    toast.success(`${row.subject} salvo.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
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

        {/* Estimador rápido — sem precisar salvar nada */}
        <div className="mb-6">
          <QuickGradeEstimator />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <Card className="p-3 text-center bg-card/40 backdrop-blur">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Matérias</div>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/10 border-emerald-500/30">
            <div className="text-2xl font-bold text-emerald-300">{summary.ok}</div>
            <div className="text-[10px] text-emerald-300/80 uppercase">Aprovadas</div>
          </Card>
          <Card className="p-3 text-center bg-amber-500/10 border-amber-500/30">
            <div className="text-2xl font-bold text-amber-300">{summary.exam}</div>
            <div className="text-[10px] text-amber-300/80 uppercase">Exame</div>
          </Card>
          <Card className="p-3 text-center bg-rose-500/10 border-rose-500/30">
            <div className="text-2xl font-bold text-rose-300">{summary.fail}</div>
            <div className="text-[10px] text-rose-300/80 uppercase">Risco</div>
          </Card>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Carregando…</Card>
          ) : rows.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Adicione suas disciplinas e simule notas em tempo real.
              </p>
              <Button onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar disciplina
              </Button>
            </Card>
          ) : (
            rows.map((row, i) => (
              <GradeCard
                key={row.id ?? i}
                row={row}
                result={results[i]}
                onChange={(patch) => updateRow(i, patch)}
                onRemove={() => removeRow(i)}
                onSave={() => saveRow(i)}
              />
            ))
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button onClick={addRow} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar mais uma
            </Button>
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
