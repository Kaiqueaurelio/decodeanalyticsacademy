import React, { useState } from 'react';
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Code, 
  Link as LinkIcon, 
  StickyNote, 
  CheckSquare, 
  Play, 
  File,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BlockType = 'text' | 'image' | 'code' | 'link' | 'note' | 'checklist' | 'video' | 'file';

export interface BlockData {
  id: string;
  type: BlockType;
  content: any;
}

interface NotionBlockEditorProps {
  blocks: BlockData[];
  onChange: (blocks: BlockData[]) => void;
  readOnly?: boolean;
}

export function NotionBlockEditor({ blocks, onChange, readOnly = false }: NotionBlockEditorProps) {
  const addBlock = (type: BlockType) => {
    const newBlock: BlockData = {
      id: crypto.randomUUID(),
      type,
      content: type === 'checklist' ? { checked: false, text: '' } : ''
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: any) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-4 pb-20">
      {blocks.map((block) => (
        <div key={block.id} className="group relative flex gap-2 items-start">
          {!readOnly && (
            <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => addBlock('text')}>
                    <Type className="h-4 w-4 mr-2" /> Texto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addBlock('note')}>
                    <StickyNote className="h-4 w-4 mr-2" /> Anotação
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addBlock('code')}>
                    <Code className="h-4 w-4 mr-2" /> Código
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeBlock(block.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex-1">
            <BlockRenderer 
              block={block} 
              onChange={(val) => updateBlock(block.id, val)} 
              readOnly={readOnly} 
            />
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="pt-4 border-t border-border/40 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addBlock('text')} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Adicionar Bloco
          </Button>
        </div>
      )}
    </div>
  );
}

function BlockRenderer({ block, onChange, readOnly }: { block: BlockData, onChange: (val: any) => void, readOnly: boolean }) {
  switch (block.type) {
    case 'text':
      return (
        <textarea
          value={block.content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreva algo ou use '/' para comandos..."
          className="w-full bg-transparent border-none resize-none focus:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/30 min-h-[1.5em]"
          disabled={readOnly}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
      );
    case 'note':
      return (
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex gap-4 transition-all hover:shadow-sm">
           <div className="mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center bg-card shadow-sm shrink-0 border-[0.5px] border-primary/40">
            <StickyNote className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Anotação</p>
            <textarea
              value={block.content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Insira uma anotação importante..."
              className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm leading-relaxed text-foreground/80 placeholder:text-primary/20"
              disabled={readOnly}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        </div>
      );
    case 'code':
      return (
        <div className="bg-[#22272e] p-0 rounded-xl font-mono text-xs border border-border/40 shadow-xl overflow-hidden group/code">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary/70" />
              <span className="text-[10px] uppercase tracking-wider text-white/60">Código</span>
            </div>
            <Code className="h-3 w-3 text-white/40" />
          </div>
          <textarea
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="// Digite seu código aqui..."
            className="w-full bg-transparent border-none resize-none focus:ring-0 text-emerald-400 placeholder:text-slate-700 p-4 leading-relaxed font-mono"
            disabled={readOnly}
            rows={2}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
      );
    default:
      return null;
  }
}
