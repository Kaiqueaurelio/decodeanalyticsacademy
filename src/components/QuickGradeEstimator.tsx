import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Target, AlertTriangle, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const parse = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(10, n));
};

const fmt = (n: number) => n.toFixed(1).replace(".", ",");

export function QuickGradeEstimator() {
  const [np1Str, setNp1Str] = useState("");
  const [np2Str, setNp2Str] = useState("");

  const np1 = parse(np1Str);
  const np2 = parse(np2Str);

  const result = useMemo(() => {
    if (np1 === null) return null;

    // Quanto precisa na NP2 para passar direto (média ≥ 7)
    const needNp2 = 14 - np1; // (NP1+NP2)/2 ≥ 7 ⇒ NP2 ≥ 14-NP1
    const np2Possible = needNp2 <= 10;
    const np2Capped = Math.max(0, Math.min(10, needNp2));

    if (np2 === null) {
      return {
        kind: "np1-only" as const,
        needNp2,
        np2Possible,
        np2Capped,
      };
    }

    const avg = (np1 + np2) / 2;
    if (avg >= 7) {
      return {
        kind: "approved" as const,
        avg,
      };
    }

    // Foi para exame: (Média + Exame)/2 ≥ 5 ⇒ Exame ≥ 10 - Média
    const needExam = 10 - avg;
    const examPossible = needExam <= 10;
    const examCapped = Math.max(0, Math.min(10, needExam));
    return {
      kind: "exam" as const,
      avg,
      needExam,
      examPossible,
      examCapped,
    };
  }, [np1, np2]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-5 bg-gradient-to-br from-primary/15 via-card/40 to-purple-500/15 border-primary/40 backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base">Estimador Rápido</h2>
            <p className="text-[11px] text-muted-foreground">
              Digite suas notas e veja quanto falta — sem precisar salvar nada
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Nota da NP1
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="10"
              value={np1Str}
              onChange={(e) => setNp1Str(e.target.value)}
              placeholder="Ex: 6,5"
              className="bg-background/50 border-border/60 mt-1 text-center text-lg font-mono h-12"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Nota da NP2 <span className="opacity-60">(opcional)</span>
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="10"
              value={np2Str}
              onChange={(e) => setNp2Str(e.target.value)}
              placeholder="—"
              className="bg-background/50 border-border/60 mt-1 text-center text-lg font-mono h-12"
            />
          </div>
        </div>

        {/* Resultados */}
        {result === null && (
          <p className="text-xs text-center text-muted-foreground py-3">
            Digite a nota da NP1 para ver a estimativa.
          </p>
        )}

        {result?.kind === "np1-only" && (
          <div className="space-y-3">
            {result.np2Possible ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-200 mb-1">
                      Para passar direto (sem exame)
                    </div>
                    <div className="text-emerald-100">
                      Você precisa tirar pelo menos{" "}
                      <span className="text-2xl font-bold font-mono text-emerald-300">
                        {fmt(result.np2Capped)}
                      </span>{" "}
                      na NP2.
                    </div>
                    <div className="text-[11px] text-emerald-300/70 mt-1">
                      Assim sua média fica ≥ 7,0 e você não vai para o exame.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-200 mb-1">
                      Não dá para passar direto
                    </div>
                    <div className="text-amber-100 text-sm">
                      Precisaria tirar{" "}
                      <span className="font-bold font-mono">{fmt(result.needNp2)}</span>{" "}
                      na NP2 (acima de 10). Você vai para o exame — informe a NP2 para
                      ver quanto precisa lá.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {result?.kind === "approved" && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-200 mb-1">
                  Aprovado direto! 🎉
                </div>
                <div className="text-emerald-100 text-sm">
                  Sua média é{" "}
                  <span className="text-xl font-bold font-mono text-emerald-300">
                    {fmt(result.avg)}
                  </span>{" "}
                  — sem exame, sem DP.
                </div>
              </div>
            </div>
          </div>
        )}

        {result?.kind === "exam" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-background/30 border border-border/40 text-sm">
              Sua média é{" "}
              <span className="font-mono font-bold text-amber-300">
                {fmt(result.avg)}
              </span>{" "}
              — abaixo de 7,0, então você vai para o <strong>exame</strong>.
            </div>
            {result.examPossible ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/40">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-200 mb-1">
                      Para não pegar DP no exame
                    </div>
                    <div className="text-amber-100">
                      Você precisa tirar pelo menos{" "}
                      <span className="text-2xl font-bold font-mono text-amber-300">
                        {fmt(result.examCapped)}
                      </span>{" "}
                      no exame.
                    </div>
                    <div className="text-[11px] text-amber-300/70 mt-1">
                      Fórmula: (Média + Exame) ÷ 2 ≥ 5,0
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/40">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-rose-200 mb-1">
                      Matematicamente impossível passar no exame
                    </div>
                    <div className="text-rose-100 text-sm">
                      Precisaria tirar{" "}
                      <span className="font-bold font-mono">{fmt(result.needExam)}</span>{" "}
                      no exame (acima de 10). Infelizmente é <strong>DP</strong>.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
