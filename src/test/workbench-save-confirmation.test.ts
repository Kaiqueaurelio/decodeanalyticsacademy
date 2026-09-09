import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/pages/AdminApostilaWorkbench.tsx', 'utf8');

describe('confirmação de salvamento e publicação', () => {
  it('não mostra Salvo por temporizador e propaga falhas ao editor', () => {
    const editor = readFileSync('src/components/MarkdownEditor.tsx', 'utf8');
    expect(editor).not.toContain('__apsTimer');
    expect(editor).toContain('if (!onSave) return;');
    const action = source.slice(source.indexOf('const saveAndOpenApostilaManagement'), source.indexOf('const handleRestoreVersion'));
    expect(action.match(/return false;/g)).toHaveLength(2);
    expect(action).toContain('return true;');
  });
  it('exige uma linha atualizada antes de confirmar o salvamento principal, inclusive no banco legado', () => {
    const save = source.slice(source.indexOf('let { error } = await supabase', source.indexOf('const apostilaUpdate =')), source.indexOf('// Limpar apenas o backup'));
    expect(save.match(/\.select\('id'\)\s*\.single\(\)/g)).toHaveLength(2);
    expect(save).toContain('return false;');
  });

  it('confirma a atualização do caderno pai e comunica falhas de visibilidade', () => {
    const publish = source.slice(source.indexOf('const { error: publishError }'), source.indexOf("phase: 'publish_guard'"));
    expect(publish).toMatch(/\.select\('id'\)\s*\.single\(\)/);
    expect(publish).toContain('não foi possível confirmar sua visibilidade');
  });

  it('a publicação explícita atualiza os dois indicadores de acesso e exige confirmação', () => {
    const toggle = source.slice(source.indexOf('const executeTogglePublish'), source.indexOf('const reloadMaterials'));
    expect(toggle).toContain("published: next, status: next ? 'liberada' : 'bloqueada'");
    expect(toggle).toMatch(/\.select\('id'\)\s*\.single\(\)/);
    expect(toggle.indexOf('setPublished(next)')).toBeGreaterThan(toggle.indexOf('if (error)'));
  });
});
