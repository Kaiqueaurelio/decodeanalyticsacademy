import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, Trophy, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeGrade } from "@/lib/grade-calculator";

export function GradeCalculatorWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, ok: 0, exam: 0, fail: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("calculator_grades")
        .select("np1, np2, exam");
      if (data) {
        const results = data.map((d: any) => computeGrade(d));
        setStats({
          total: results.length,
          ok: results.filter(r => r.status === "approved").length,
          exam: results.filter(r => r.status === "exam").length,
          fail: results.filter(r => r.status === "failed").length,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={() => navigate("/calculadora")}
        className="p-4 cursor-pointer bg-gradient-to-br from-primary/10 via-card/40 to-purple-500/10 border-primary/30 hover:border-primary/60 transition-all backdrop-blur"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Calculadora de Aprovação</h3>
              <p className="text-[11px] text-muted-foreground">Simule notas e veja seu status</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="h-12 animate-pulse bg-muted/30 rounded" />
        ) : stats.total === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Toque para calcular suas notas UNIP
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-center gap-1 text-emerald-300">
                <Trophy className="h-3 w-3" />
                <span className="font-bold">{stats.ok}</span>
              </div>
              <div className="text-[10px] text-emerald-300/70 uppercase">Aprovadas</div>
            </div>
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="text-amber-300 font-bold">{stats.exam}</div>
              <div className="text-[10px] text-amber-300/70 uppercase">Exame</div>
            </div>
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center justify-center gap-1 text-rose-300">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-bold">{stats.fail}</span>
              </div>
              <div className="text-[10px] text-rose-300/70 uppercase">Risco</div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
