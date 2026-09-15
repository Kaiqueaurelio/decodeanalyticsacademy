import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/pages/AdminApostilaWorkbench.tsx', 'utf8');

describe('confirmação de salvamento e publicação', () => {
  it('não trata uma falha de leitura como apostila vazia nem abre o editor incompleto', () => {
    expect(source).toContain('[apRes.error, linksRes.error, countRes.error, pageResult.error]');
    expect(source.indexOf('if (loadErrors.length > 0)')).toBeLessThan(source.indexOf('applyMainState(mainState)'));
    expect(source).toContain('if (loadError) return (');
    expect(source).toContain('Tentar novamente</Button>');
    expect(source).not.toContain('const loadedPages = (pageRows || [])');
  });
  it('não mostra Salvo por temporizador e propaga falhas ao editor', () => {
    const editor = readFileSync('src/components/MarkdownEditor.tsx', 'utf8');
    expect(editor).not.toContain('__apsTimer');
    expect(editor).toContain('if (!onSave) return;');
    const action = source.slice(source.indexOf('const saveAndOpenApostilaManagement'), source.indexOf('const handleRestoreVersion'));
    expect(action.match(/return false;/g)).toHaveLength(2);
    expect(action).toContain('return true;');
  });

  it('usa persistência com revisão e bloqueia salvamento quando a leitura prévia falha', () => {
    const saveStart = source.indexOf('const persistChanges');
    const saveEnd = source.indexOf('// Limpar apenas o backup', saveStart);
    const save = source.slice(saveStart, saveEnd);
    expect(save).toContain('saveApostilaWithRevision');
    expect(save).toContain('expectedRevision');
    expect(save).toContain('currentApostilaError');
    expect(save).toContain('A edição foi mantida localmente');
    expect(save).not.toContain('.update(apostilaUpdate)');
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

  it('cria a página somente após salvar a edição atual e inicia a revisão da página criada', () => {
    const createStart = source.indexOf('const handleCreatePersistedPage');
    const create = source.slice(createStart, source.indexOf('createPersistedPageRef.current = handleCreatePersistedPage', createStart));
    expect(create).toContain('await doSave(true)');
    expect(create).toContain('await createApostilaPage(id, user.id)');
    expect(create).toContain('setPages((current) => upsertApostilaPage(current, newPage))');
    expect(create).toContain('setContentRevision(Number((newPage as any).content_revision ?? 0))');
    expect(create.indexOf("status: 'succeeded'")).toBeGreaterThan(create.indexOf('await createApostilaPage(id, user.id)'));
  });

  it('mantém a nova página no editor quando a recarga ainda não a encontrou', () => {
    const load = source.slice(source.indexOf('const loadApostila'), source.indexOf('useEffect(() => { if (id) loadApostila(id); }, [id, selectedPageId])'));
    expect(load).toContain('A nova página ainda não foi sincronizada. Tentando carregar novamente.');
    expect(load).toContain('void loadApostila(apostilaId)');
  });
});
