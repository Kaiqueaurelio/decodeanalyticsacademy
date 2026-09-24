import jsPDF from 'jspdf';

export type ResumeProject = { name: string; description: string; technologies: string; link: string };

export type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  summary: string;
  education: string;
  skills: string;
  languages: string;
  courses: string;
  projects: ResumeProject[];
};

export const emptyResumeData = (): ResumeData => ({
  fullName: '', email: '', phone: '', city: '', linkedin: '', github: '',
  summary: '', education: '', skills: '', languages: '', courses: '', projects: [],
});

const clean = (value: string) => value.trim();

function writeSection(doc: jsPDF, title: string, body: string, y: number): number {
  const value = clean(body);
  if (!value) return y;
  if (y > 255) { doc.addPage(); y = 22; }
  doc.setDrawColor(16, 55, 92);
  doc.setLineWidth(0.55);
  doc.line(18, y, 192, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 55, 92);
  doc.text(title.toUpperCase(), 18, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(value, 174);
  doc.text(lines, 18, y);
  return y + lines.length * 4.5 + 6;
}

export function downloadResumePdf(data: ResumeData, targetRole: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(15, 23, 42);
  doc.text(clean(data.fullName) || 'Currículo profissional', 18, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const contact = [data.email, data.phone, data.city, data.linkedin, data.github].map(clean).filter(Boolean).join('  •  ');
  if (contact) { doc.text(doc.splitTextToSize(contact, 174), 18, y); y += 8; }
  if (targetRole) { doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 55, 92); doc.text(`OBJETIVO: ${clean(targetRole)}`, 18, y); y += 8; }
  y = writeSection(doc, 'Resumo profissional', data.summary, y);
  y = writeSection(doc, 'Formação acadêmica', data.education, y);
  y = writeSection(doc, 'Competências', data.skills, y);
  for (const project of data.projects) {
    const projectBody = [project.description, project.technologies ? `Tecnologias: ${project.technologies}` : '', project.link].filter(Boolean).join('\n');
    y = writeSection(doc, project.name || 'Projeto', projectBody, y);
  }
  y = writeSection(doc, 'Cursos e certificações', data.courses, y);
  writeSection(doc, 'Idiomas', data.languages, y);
  const filename = (clean(data.fullName) || 'curriculo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  doc.save(`${filename}-curriculo.pdf`);
}
