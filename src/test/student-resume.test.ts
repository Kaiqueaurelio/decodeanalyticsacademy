import { describe, expect, it, vi } from 'vitest';

const save = vi.fn();
vi.mock('jspdf', () => ({
  default: class MockPdf {
    setDrawColor = vi.fn(); setLineWidth = vi.fn(); line = vi.fn(); setFont = vi.fn(); setFontSize = vi.fn(); setTextColor = vi.fn(); text = vi.fn();
    splitTextToSize = (value: string) => [value]; addPage = vi.fn(); save = save;
  },
}));

import { downloadResumePdf, emptyResumeData } from '@/lib/student-resume';

describe('student resume', () => {
  it('starts with no invented professional information', () => {
    expect(emptyResumeData()).toEqual({
      fullName: '', email: '', phone: '', city: '', linkedin: '', github: '',
      summary: '', education: '', skills: '', languages: '', courses: '', projects: [],
    });
  });

  it('generates a safely named PDF from the information provided by the student', () => {
    downloadResumePdf({
      ...emptyResumeData(), fullName: 'Ana Ávila', email: 'ana@example.com',
      summary: 'Estudante com projeto real.', projects: [{ name: 'Portal acadêmico', description: 'Aplicação web.', technologies: 'React', link: '' }],
    }, 'Estágio em desenvolvimento');
    expect(save).toHaveBeenCalledWith('ana-avila-curriculo.pdf');
  });
});
