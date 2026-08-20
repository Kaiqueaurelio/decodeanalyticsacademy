import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export interface StudentPerformanceReport {
  studentName: string;
  studentRa?: string;
  apostilaTitle: string;
  totalExercises: number;
  answeredCount: number;
  correctCount: number;
  score: number;
  details: {
    question: string;
    type: 'multiple_choice' | 'essay';
    status: 'correct' | 'incorrect' | 'submitted' | 'unanswered';
    userAnswer: string;
  }[];
}

export async function generateStudentPerformancePdf(data: StudentPerformanceReport) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 240, 255); // Ciano Decode
    doc.text("RELATÓRIO DE DESEMPENHO ACADÊMICO", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 28, { align: "right" });
    
    // Student & Apostila Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("ALUNO:", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.studentName} ${data.studentRa ? `(RA: ${data.studentRa})` : ""}`, 45, 40);
    
    doc.setFont("helvetica", "bold");
    doc.text("APOSTILA:", 20, 48);
    doc.setFont("helvetica", "normal");
    doc.text(data.apostilaTitle, 45, 48);
    
    // Summary Stats
    const statsX = 20;
    const statsY = 60;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(statsX, statsY, pageWidth - 40, 25, "F");
    
    doc.setFontSize(10);
    doc.text("Total Questões", statsX + 10, statsY + 10);
    doc.text("Respondidas", statsX + 50, statsY + 10);
    doc.text("Acertos", statsX + 90, statsY + 10);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(data.totalExercises), statsX + 10, statsY + 20);
    doc.text(String(data.answeredCount), statsX + 50, statsY + 20);
    doc.text(String(data.correctCount), statsX + 90, statsY + 20);
    
    // Score Big
    doc.setFontSize(10);
    doc.text("APROVEITAMENTO", statsX + 130, statsY + 10);
    doc.setFontSize(18);
    const scoreColor = data.score >= 70 ? [0, 150, 0] : data.score >= 50 ? [150, 150, 0] : [200, 0, 0];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${data.score}%`, statsX + 130, statsY + 20);
    
    // Table Details
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Detalhamento por Exercício", 20, 100);
    
    const tableData = data.details.map((d, i) => [
      i + 1,
      d.question.length > 80 ? d.question.substring(0, 77) + "..." : d.question,
      d.type === 'multiple_choice' ? "Objetiva" : "Dissertativa",
      d.status.toUpperCase(),
      d.userAnswer.length > 30 ? d.userAnswer.substring(0, 27) + "..." : d.userAnswer
    ]);
    
    autoTable(doc, {
      startY: 105,
      head: [['#', 'Questão', 'Tipo', 'Status', 'Resposta']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] }, // Roxo Decode
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 40 }
      }
    });
    
    const fileName = `desempenho-${data.studentName.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
    toast.success("Relatório de desempenho baixado com sucesso!");
    
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Não foi possível gerar o relatório em PDF.");
  }
}

export async function fetchAndGenerateApostilaReport(apostilaId: string, userId: string) {
  try {
    const [
      { data: profile },
      { data: apostila },
      { data: exercises },
      { data: answers }
    ] = await Promise.all([
      supabase.from('profiles').select('full_name, ra').eq('user_id', userId).single(),
      supabase.from('apostilas').select('title').eq('id', apostilaId).single(),
      supabase.from('exercises').select('id, question, type, question_type').eq('apostila_id', apostilaId).order('sort_order'),
      supabase.from('answers').select('exercise_id, selected_answer, is_correct').eq('user_id', userId)
    ]);

    if (!profile || !apostila || !exercises) throw new Error("Dados incompletos");

    const answerMap = new Map((answers || []).map(a => [a.exercise_id, a]));
    
    const details = exercises.map(ex => {
      const ans = answerMap.get(ex.id);
      const isMc = (ex.type !== 'essay' && ex.question_type !== 'essay');
      return {
        question: ex.question,
        type: (isMc ? 'multiple_choice' : 'essay') as any,
        status: (ans ? (isMc ? (ans.is_correct ? 'correct' : 'incorrect') : 'submitted') : 'unanswered') as any,
        userAnswer: ans?.selected_answer || "—"
      };
    });

    const mcTotal = details.filter(d => d.type === 'multiple_choice').length;
    const mcCorrect = details.filter(d => d.status === 'correct').length;
    const score = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 100;

    await generateStudentPerformancePdf({
      studentName: profile.full_name || "Estudante",
      studentRa: profile.ra,
      apostilaTitle: apostila.title,
      totalExercises: exercises.length,
      answeredCount: answers?.length || 0,
      correctCount: mcCorrect,
      score,
      details
    });

  } catch (error) {
    console.error("Erro ao preparar relatório:", error);
    toast.error("Erro ao coletar dados para o relatório.");
  }
}
