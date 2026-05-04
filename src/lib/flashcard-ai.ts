import { invokeFunction } from "./invoke-function";
import { toast } from "sonner";

export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

/**
 * Usa IA para gerar flashcards a partir do conteúdo de uma apostila.
 */
export async function generateFlashcardsFromContent(
  title: string,
  content: string,
  count: number = 5
): Promise<GeneratedFlashcard[]> {
  const prompt = `
    Você é um professor especialista em TI. 
    Analise o conteúdo da apostila "${title}" abaixo e crie ${count} flashcards de estudo ativo.
    Cada flashcard deve ter uma "pergunta" (frente) e uma "resposta" (verso) curta e objetiva.
    Foque em conceitos-chave, definições e comandos importantes.
    
    Retorne APENAS um JSON no formato:
    [
      {"question": "pergunta 1", "answer": "resposta 1"},
      ...
    ]

    CONTEÚDO DA APOSTILA:
    ${content.slice(0, 4000)}
  `;

  const { data, error } = await invokeFunction<{ cards: GeneratedFlashcard[] }>("generate-content", {
    body: { prompt, format: 'json' },
    errorTitle: "Erro ao gerar flashcards",
  });

  if (error || !data) {
    throw new Error(error?.message || "Falha na comunicação com a IA");
  }

  // A resposta pode vir direto como array ou dentro de um objeto dependendo da Edge Function
  return Array.isArray(data) ? data : (data.cards || []);
}
