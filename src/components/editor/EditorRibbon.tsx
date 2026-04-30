/**
 * EditorRibbon — Ribbon visualmente idêntico ao Microsoft Word (Office 365).
 * Abas: Arquivo (azul) · Página Inicial · Inserir · Layout · Revisão.
 * Grupos com label embaixo, separadores verticais, seletor de fonte/tamanho,
 * botões grandes para ações principais (estilo "split button").
 *
 * Estados visuais (Office):
 *   - hover: fundo cinza claro
 *   - active (formatação aplicada): fundo azul claro + borda azul Word
 *   - disabled: 40% opacidade, sem hover
 */
import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Code2,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Palette, Table as TableIcon,
  Subscript as SubIcon, Superscript as SupIcon, CheckSquare,
  RemoveFormatting, Minus, Type, Search, FileText, ChevronDown,
  Indent, Outdent, Save, Printer, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RibbonImageButton } from '@/components/editor/RibbonImageButton';
import { TableGridPicker } from '@/components/editor/TableGridPicker';

const TEXT_COLORS = [
  { name: 'Automático', value: '' },
  { name: 'Preto', value: '#000000' },
  { name: 'Azul Word', value: '#2B579A' },
  { name: 'Vermelho', value: '#C00000' },
  { name: 'Verde', value: '#107C10' },
  { name: 'Laranja', value: '#D83B01' },
  { name: 'Roxo', value: '#5C2D91' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', value: '#FFFF00' },
  { name: 'Verde', value: '#00FF00' },
  { name: 'Ciano', value: '#00FFFF' },
  { name: 'Rosa', value: '#FF00FF' },
  { name: 'Azul', value: '#0070C0' },
];

const FONTS = ['Aptos', 'Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

type RibbonTab = 'home' | 'insert' | 'layout' | 'review';

interface Props {
  editor: Editor;
  onInsertImage: (md: string, opts?: { tempUrl?: string; finalUrl?: string }) => void;
  onSave?: () => void;
  saveStatus?: 'saved' | 'unsaved' | 'idle';
}

export function EditorRibbon({ editor, onInsertImage, onSave, saveStatus = 'idle' }: Props) {
  const [tab, setTab] = useState<RibbonTab>('home');
  const [font, setFont] = useState('Aptos');
  const [size, setSize] = useState(11);
  const [tableOpen, setTableOpen] = useState(false);

  const insertLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Endereço do link', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableOpen(false);
  };


  return (
    <div className="word-ribbon">
      {/* Abas */}
      <div className="word-tabs">
        <button type="button" className="word-tab word-file-tab" title="Arquivo">Arquivo</button>
        <button type="button" className={cn('word-tab', tab === 'home' && 'active')} onClick={() => setTab('home')}>Página Inicial</button>
        <button type="button" className={cn('word-tab', tab === 'insert' && 'active')} onClick={() => setTab('insert')}>Inserir</button>
        <button type="button" className={cn('word-tab', tab === 'layout' && 'active')} onClick={() => setTab('layout')}>Layout</button>
        <button type="button" className={cn('word-tab', tab === 'review' && 'active')} onClick={() => setTab('review')}>Revisão</button>
      </div>

      {/* Corpo do ribbon */}
      <div className="word-ribbon-body">
        {tab === 'home' && (
          <>
            <Group label="Arquivo">
              <button
                className={cn('word-btn word-btn-tall', saveStatus === 'saved' && 'active')}
                title="Salvar (Ctrl+S)"
                onClick={() => onSave?.()}
                disabled={!onSave}
              >
                {saveStatus === 'saved' ? <Check style={{ color: '#107C10' }} /> : <Save />}
                <span>{saveStatus === 'unsaved' ? 'Salvar*' : 'Salvar'}</span>
              </button>
              <button
                className="word-btn word-btn-tall"
                title="Imprimir (Ctrl+P)"
                onClick={() => window.print()}
              >
                <Printer />
                <span>Imprimir</span>
              </button>
            </Group>

            <Group label="Fonte">
              <div className="word-group-content" style={{ flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <div className="flex items-center gap-1">
                  {/* Seletor de fonte */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="word-btn" style={{ width: 110, justifyContent: 'space-between', padding: '0 6px', height: 22 }}>
                        <span style={{ fontFamily: font, fontSize: 11 }}>{font}</span>
                        <ChevronDown style={{ width: 10, height: 10, opacity: 0.6 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover z-50">
                      {FONTS.map((f) => (
                        <DropdownMenuItem key={f} onClick={() => setFont(f)} style={{ fontFamily: f }}>{f}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="word-btn" style={{ width: 44, justifyContent: 'space-between', padding: '0 6px', height: 22 }}>
                        <span style={{ fontSize: 11 }}>{size}</span>
                        <ChevronDown style={{ width: 10, height: 10, opacity: 0.6 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover z-50 max-h-64 overflow-y-auto">
                      {SIZES.map((s) => (
                        <DropdownMenuItem key={s} onClick={() => setSize(s)}>{s}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-0.5">
                  <ToolBtn title="Negrito (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
                  </ToolBtn>
                  <ToolBtn title="Itálico (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Sublinhado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Subscrito" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
                    <SubIcon style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Sobrescrito" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
                    <SupIcon style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="word-btn" title="Cor da fonte" style={{ flexDirection: 'column', height: 22, padding: '0 4px', gap: 0 }}>
                        <Palette style={{ width: 12, height: 12 }} />
                        <div style={{ width: 14, height: 3, background: '#C00000', marginTop: 1 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover z-50">
                      {TEXT_COLORS.map((c) => (
                        <DropdownMenuItem key={c.name} onClick={() => c.value ? editor.chain().focus().setColor(c.value).run() : editor.chain().focus().unsetColor().run()}>
                          <span className="inline-block h-3 w-3 rounded-sm mr-2 border border-border" style={{ background: c.value || 'transparent' }} />
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="word-btn" title="Cor de realce do texto" style={{ flexDirection: 'column', height: 22, padding: '0 4px', gap: 0 }}>
                        <Highlighter style={{ width: 12, height: 12 }} />
                        <div style={{ width: 14, height: 3, background: '#FFFF00', marginTop: 1 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover z-50">
                      <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>Sem realce</DropdownMenuItem>
                      {HIGHLIGHT_COLORS.map((c) => (
                        <DropdownMenuItem key={c.name} onClick={() => editor.chain().focus().toggleHighlight({ color: c.value }).run()}>
                          <span className="inline-block h-3 w-3 rounded-sm mr-2 border border-border" style={{ background: c.value }} />
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ToolBtn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                    <RemoveFormatting style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                </div>
              </div>
            </Group>

            <Group label="Parágrafo">
              <div className="word-group-content" style={{ flexDirection: 'column', gap: 2 }}>
                <div className="flex items-center gap-0.5">
                  <ToolBtn title="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Lista de tarefas" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
                    <CheckSquare style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Diminuir recuo" onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
                    <Outdent style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Aumentar recuo" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
                    <Indent style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                </div>
                <div className="flex items-center gap-0.5">
                  <ToolBtn title="Alinhar à esquerda (Ctrl+L)" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Centralizar (Ctrl+E)" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Alinhar à direita (Ctrl+R)" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Justificar (Ctrl+J)" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                    <AlignJustify style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                  <ToolBtn title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote style={{ width: 14, height: 14 }} />
                  </ToolBtn>
                </div>
              </div>
            </Group>

            <Group label="Estilos">
              <div className="word-group-content" style={{ gap: 4 }}>
                <StyleChip label="Normal" preview="11pt" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} />
                <StyleChip label="Título 1" preview="20pt" blue onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} />
                <StyleChip label="Título 2" preview="16pt" blue onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} />
                <StyleChip label="Título 3" preview="13pt" blue onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} />
              </div>
            </Group>
          </>
        )}

        {tab === 'insert' && (
          <>
            <Group label="Páginas">
              <button className="word-btn word-btn-tall" title="Inserir quebra de página" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <FileText />
                <span>Quebra</span>
              </button>
            </Group>
            <Group label="Tabelas">
              <Popover open={tableOpen} onOpenChange={setTableOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn('word-btn word-btn-tall', editor.isActive('table') && 'active')}
                    title="Inserir tabela"
                  >
                    <TableIcon />
                    <span>Tabela ▾</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="p-0 border-0 bg-transparent shadow-none w-auto">
                  <TableGridPicker onPick={insertTable} />
                </PopoverContent>
              </Popover>
            </Group>
            <Group label="Ilustrações">
              <RibbonImageButton onImageInserted={onInsertImage} />
            </Group>
            <Group label="Links">
              <button className="word-btn word-btn-tall" title="Inserir link (Ctrl+K)" data-active={editor.isActive('link')} onClick={insertLink}>
                <LinkIcon />
                <span>Link</span>
              </button>
            </Group>
            <Group label="Texto">
              <ToolBtn title="Código inline" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Bloco de código" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code2 style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus style={{ width: 14, height: 14 }} />
              </ToolBtn>
            </Group>
            <Group label="Cabeçalhos">
              <ToolBtn title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 style={{ width: 14, height: 14 }} />
              </ToolBtn>
            </Group>
          </>
        )}

        {tab === 'layout' && (
          <>
            <Group label="Configurar Página">
              <button className="word-btn word-btn-tall" title="Margens (1in)" disabled>
                <FileText />
                <span>Margens</span>
              </button>
              <button className="word-btn word-btn-tall" title="Orientação Retrato" disabled>
                <FileText />
                <span>Retrato</span>
              </button>
              <button className="word-btn word-btn-tall" title="Tamanho A4" disabled>
                <FileText />
                <span>A4</span>
              </button>
            </Group>
            <Group label="Parágrafo">
              <ToolBtn title="Esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Centro" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight style={{ width: 14, height: 14 }} />
              </ToolBtn>
              <ToolBtn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                <AlignJustify style={{ width: 14, height: 14 }} />
              </ToolBtn>
            </Group>
            <Group label="Tabela">
              <button className="word-btn" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().addRowAfter().run()} style={{ padding: '0 8px', height: 22 }}>+ Linha</button>
              <button className="word-btn" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().addColumnAfter().run()} style={{ padding: '0 8px', height: 22 }}>+ Coluna</button>
              <button className="word-btn" disabled={!editor.isActive('table')} onClick={() => editor.chain().focus().deleteTable().run()} style={{ padding: '0 8px', height: 22, color: '#C00000' }}>Excluir</button>
            </Group>
          </>
        )}

        {tab === 'review' && (
          <>
            <Group label="Revisão">
              <button
                className="word-btn word-btn-tall"
                title="Localizar no documento (Ctrl+F)"
                onClick={() => {
                  const term = window.prompt('Localizar');
                  if (!term) return;
                  const text = editor.getText();
                  const idx = text.toLowerCase().indexOf(term.toLowerCase());
                  if (idx === -1) { window.alert('Termo não encontrado.'); return; }
                  editor.commands.focus();
                  window.alert(`Encontrado próximo da posição ${idx}.`);
                }}
              >
                <Search />
                <span>Localizar</span>
              </button>
            </Group>
            <Group label="Idioma">
              <button className="word-btn word-btn-tall" title="Idioma do documento" disabled>
                <Type />
                <span>Português</span>
              </button>
            </Group>
            <Group label="Estatísticas">
              <button
                className="word-btn word-btn-tall"
                title="Contagem de palavras"
                onClick={() => {
                  const text = editor.getText();
                  const w = text.trim() ? text.trim().split(/\s+/).length : 0;
                  const c = text.length;
                  const min = Math.max(1, Math.round(w / 200));
                  window.alert(`${w} palavras · ${c} caracteres · leitura ~${min} min`);
                }}
              >
                <FileText />
                <span>Contar</span>
              </button>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="word-group">
      <div className="word-group-content">{children}</div>
      <div className="word-group-label">{label}</div>
    </div>
  );
}

function ToolBtn({
  children, title, onClick, active, disabled,
}: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={cn('word-btn', active && 'active')}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function StyleChip({
  label, preview, onClick, active, blue,
}: { label: string; preview: string; onClick: () => void; active?: boolean; blue?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('word-btn', active && 'active')}
      style={{
        flexDirection: 'column',
        height: 56,
        minWidth: 64,
        padding: '4px 6px',
        gap: 2,
        fontFamily: 'Aptos, Calibri, sans-serif',
      }}
      title={label}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: blue ? '#2B579A' : '#000' }}>{label}</span>
      <span style={{ fontSize: 9, color: '#605E5C' }}>{preview}</span>
    </button>
  );
}
