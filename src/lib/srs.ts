// SM-2 Spaced Repetition Algorithm
// Quality scale: 0=Again (errou), 3=Hard (difícil), 4=Good (bom), 5=Easy (fácil)

export type SRSQuality = 0 | 3 | 4 | 5;

export interface SRSState {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface SRSResult extends SRSState {
  next_review: string; // ISO datetime
}

/**
 * Calcula próxima data de revisão usando SM-2 (Anki-like).
 * - quality < 3 → reseta repetições (cartão "errado")
 * - quality >= 3 → avança no escalonamento
 */
export function sm2(prev: SRSState, quality: SRSQuality): SRSResult {
  let { ease_factor, interval_days, repetitions } = prev;

  if (quality < 3) {
    // Errou — volta pro início, mas mantém ease (penalizado abaixo)
    repetitions = 0;
    interval_days = 0; // mostrar ainda hoje (em ~10 min)
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
  }

  // Ajuste do ease factor (clamp em 1.3)
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const now = Date.now();
  const nextMs =
    interval_days === 0
      ? now + 10 * 60 * 1000 // 10 min para "errou"
      : now + interval_days * 24 * 3600 * 1000;

  return {
    ease_factor: Number(ease_factor.toFixed(2)),
    interval_days,
    repetitions,
    next_review: new Date(nextMs).toISOString(),
  };
}

export function formatNextReview(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'agora';
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
}
