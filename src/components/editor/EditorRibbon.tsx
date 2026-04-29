/**
 * EditorRibbon — toolbar agrupada estilo Microsoft Word, com abas
 * (Início / Inserir / Layout / Revisar). Substitui as 2 fileiras achatadas
 * antigas, oferecendo organização por tarefa, separadores e legendas.
 */
import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Code2,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Highlighter, Palette, Table as TableIcon,
  Subscript as SubIcon, Superscript as SupIcon, CheckSquare,
  RemoveFormatting, Minus, Type, Search, FileText, ImageIcon, Pilcrow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploadButton } from '@/components/ImageUploadButton';

const TEXT_COLORS = [
  { name: 'Padrão', value: '' },
  { name: 'Ciano', value: '#00f0ff' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Branco', value: '#ffffff' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: '#fde047' },
  { name: 'Verde', value: '#86efac' },
  { name: 'Ciano', value: '#67e8f9' },
  { name: 'Rosa', value: '#f9a8d4' },
  { name: 'Laranja', value: '#fdba74' },
];

type RibbonTab = 'home' | 'insert' | 'layout' | 'review';

interface Props {
  editor: Editor;
  onInsertImage: (md: string) => void;
}

export function EditorRibbon({ editor, onInsertImage }: Props) {
  const [tab, setTab] = useState<RibbonTab>('home');

  const insertLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border-b border-border bg-muted/40">
      {/* Abas */}
      <div className="flex items-center gap-0.5 px-2 pt-1 border-b border-border/50">
        <TabBtn active={tab === 'home'} onClick={() => setTab('home')}>Início</TabBtn>
        <TabBtn active={tab === 'insert'} onClick={() => setTab('insert')}>Inserir</TabBtn>
        <TabBtn active={tab === 'layout'} onClick={() => setTab('layout')}>Layout</TabBtn>
        <TabBtn active={tab === 'review'} onClick={() => setTab('review')}>Revisão</TabBtn>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolBtn title="Desfazer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn title="Refazer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="px-2 py-1.5 min-h-[48px] flex items-stretch gap-1 flex-wrap">
        {tab === 'home' && (
          <>
            <Group label="Estilo">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 gap-1" title="Estilo do parágrafo">
                    <Type className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Parágrafo</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover z-50">
                  <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                    <Pilcrow className="h-3.5 w-3.5 mr-2" /> Texto normal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="h-3.5 w-3.5 mr-2" /> Título 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="h-3.5 w-3.5 mr-2" /> Título 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 className="h-3.5 w-3.5 mr-2" /> Título 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Group>

            <Group label="Fonte">
              <ToolBtn title="Negrito (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Itálico (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Sublinhado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Subscrito" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
                <SubIcon className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Sobrescrito" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
                <SupIcon className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>

            <Group label="Cor">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Cor do texto">
                    <Palette className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover z-50">
                  {TEXT_COLORS.map((c) => (
                    <DropdownMenuItem
                      key={c.name}
                      onClick={() =>
                        c.value
                          ? editor.chain().focus().setColor(c.value).run()
                          : editor.chain().focus().unsetColor().run()
                      }
                    >
                      <span
                        className="inline-block h-3 w-3 rounded mr-2 border border-border"
                        style={{ background: c.value || 'transparent' }}
                      />
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Realce">
                    <Highlighter className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover z-50">
                  <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>Sem realce</DropdownMenuItem>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <DropdownMenuItem
                      key={c.name}
                      onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}
                    >
                      <span className="inline-block h-3 w-3 rounded mr-2 border border-border" style={{ background: c.value }} />
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <ToolBtn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                <RemoveFormatting className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>

            <Group label="Parágrafo">
              <ToolBtn title="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Lista de tarefas" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
                <CheckSquare className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>

            <Group label="Alinhar">
              <ToolBtn title="Esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Centro" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                <AlignJustify className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
          </>
        )}

        {tab === 'insert' && (
          <>
            <Group label="Mídia">
              <div className="flex items-center">
                <ImageUploadButton onImageInserted={onInsertImage} />
              </div>
              <ToolBtn title="Tabela 3x3" onClick={insertTable}>
                <TableIcon className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
            <Group label="Conteúdo">
              <ToolBtn title="Link (Ctrl+K)" active={editor.isActive('link')} onClick={insertLink}>
                <LinkIcon className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Código inline" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Bloco de código" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code2 className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
            <Group label="Estrutura">
              <ToolBtn title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
          </>
        )}

        {tab === 'layout' && (
          <>
            <Group label="Alinhamento de bloco">
              <ToolBtn title="Esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Centro" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                <AlignJustify className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
            <Group label="Quebra">
              <ToolBtn title="Linha horizontal / divisão" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-3.5 w-3.5" />
              </ToolBtn>
            </Group>
            <Group label="Tabela">
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().addRowAfter().run()}>+ Linha</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Coluna</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-destructive" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().deleteTable().run()}>Excluir</Button>
            </Group>
          </>
        )}

        {tab === 'review' && (
          <>
            <Group label="Pesquisa">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 gap-1 text-[11px]"
                onClick={() => {
                  const term = window.prompt('Buscar no documento');
                  if (!term) return;
                  const text = editor.getText();
                  const idx = text.toLowerCase().indexOf(term.toLowerCase());
                  if (idx === -1) { window.alert('Não encontrado.'); return; }
                  // Aproximação: foca o editor; busca avançada virá no próximo passo
                  editor.commands.focus();
                  window.alert(`Encontrado próximo da posição ${idx} (use Ctrl+F do navegador para destacar).`);
                }}
              >
                <Search className="h-3.5 w-3.5" /> Buscar
              </Button>
            </Group>
            <Group label="Estatísticas">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 gap-1 text-[11px]"
                onClick={() => {
                  const text = editor.getText();
                  const w = text.trim() ? text.trim().split(/\s+/).length : 0;
                  const c = text.length;
                  const min = Math.max(1, Math.round(w / 200));
                  window.alert(`${w} palavras · ${c} caracteres · leitura ~${min} min`);
                }}
              >
                <FileText className="h-3.5 w-3.5" /> Contar
              </Button>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors',
        active
          ? 'bg-background text-foreground border border-border border-b-transparent -mb-px'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center pr-2 mr-1 border-r border-border/60 last:border-r-0">
      <div className="flex items-center gap-0.5">{children}</div>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 mt-0.5 select-none">{label}</span>
    </div>
  );
}

function ToolBtn({
  children, title, onClick, active, disabled,
}: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn('h-7 w-7', active && 'text-primary')}
    >
      {children}
    </Button>
  );
}
