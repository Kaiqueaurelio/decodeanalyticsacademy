import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function generateSimulado(userId: string, options: { 
  apostilaIds?: string[], 
  subjectId?: string,
  limit?: number 
}) {
  const { apostilaIds = [], subjectId, limit = 20 } = options;
  
  // 1. Get student performance history (wrong answers)
  const { data: history } = await supabase
    .from("answers")
    .select("exercise_id, is_correct")
    .eq("user_id", userId)
    .eq("is_correct", false)
    .limit(50);
  
  const wrongExerciseIds = history?.map(h => h.exercise_id) || [];

  // 2. Fetch exercises, prioritizing those in wrongExerciseIds or new ones
  let query = supabase
    .from("exercises")
    .select("*, apostilas!inner(title, category, semester)");

  if (apostilaIds.length > 0) {
    query = query.in("apostila_id", apostilaIds);
  }
  
  if (subjectId) {
    query = query.eq("apostilas.category", subjectId);
  }

  const { data: exercises, error } = await query.limit(100);

  if (error || !exercises) {
    throw new Error("Falha ao buscar exercícios para o simulado.");
  }

  // 3. Adaptive Scoring Logic
  const scoredExercises = exercises.map(ex => {
    let score = Math.random();
    
    // Weight exercises previously failed
    if (wrongExerciseIds.includes(ex.id)) {
      score += 2.0; 
    }
    
    // Weight exercises from "hot" (difficult) apostilas (simplified placeholder)
    if (ex.apostilas.title.includes("Resolução") || ex.apostilas.title.includes("Gabarito")) {
      score += 0.5;
    }
    
    return { ...ex, score };
  });

  // Sort by score and take limit
  return scoredExercises
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
