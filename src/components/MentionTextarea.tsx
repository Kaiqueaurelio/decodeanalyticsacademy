import {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
  onSubmitShortcut?: () => void; // called on Enter (no shift) only when popup closed
  excludeUserId?: string;
}

const handleFromName = (name: string, email: string) => {
  const base = (name || email?.split('@')[0] || 'aluno').toLowerCase();
  return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 24) || 'aluno';
};

const initials = (name: string, email: string) => {
  if (name) return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return email?.[0]?.toUpperCase() || '?';
};

// shared cache
let profilesCache: Profile[] | null = null;
let inflight: Promise<Profile[]> | null = null;
async function loadProfiles(): Promise<Profile[]> {
  if (profilesCache) return profilesCache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase.from('profiles').select('user_id, full_name, email').limit(500);
    profilesCache = ((data as any[]) || []) as Profile[];
    inflight = null;
    return profilesCache;
  })();
  return inflight;
}

export interface MentionTextareaHandle {
  focus: () => void;
}

export const MentionTextarea = forwardRef<MentionTextareaHandle, MentionTextareaProps>(function MentionTextarea(
  { value, onChange, placeholder, className, maxLength, rows, onSubmitShortcut, excludeUserId }, ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  useEffect(() => { loadProfiles().then(setProfiles); }, []);

  // detect @ trigger from caret position
  const detectMention = (text: string, caret: number) => {
    // walk back from caret
    let i = caret - 1;
    while (i >= 0) {
      const c = text[i];
      if (c === '@') {
        const prev = i === 0 ? ' ' : text[i - 1];
        if (/\s|^/.test(prev) || i === 0) {
          return { start: i, query: text.slice(i + 1, caret) };
        }
        return null;
      }
      if (/\s/.test(c)) return null;
      i--;
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);
    const caret = e.target.selectionStart ?? text.length;
    const m = detectMention(text, caret);
    if (m && m.query.length <= 24) {
      setOpen(true);
      setQuery(m.query);
      setMentionStart(m.start);
      setActiveIndex(0);
    } else {
      setOpen(false);
      setMentionStart(-1);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = profiles.filter(p => p.user_id !== excludeUserId);
    if (q) {
      list = list.filter(p => {
        const handle = handleFromName(p.full_name, p.email);
        return handle.includes(q)
          || p.full_name?.toLowerCase().includes(q)
          || p.email?.toLowerCase().includes(q);
      });
    }
    return list.slice(0, 6);
  }, [profiles, query, excludeUserId]);

  const insertMention = (p: Profile) => {
    if (mentionStart < 0 || !textareaRef.current) return;
    const handle = handleFromName(p.full_name, p.email);
    const before = value.slice(0, mentionStart);
    const after = value.slice((textareaRef.current.selectionStart ?? value.length));
    const insertion = `@${handle} `;
    const next = before + insertion + after;
    onChange(next);
    setOpen(false);
    setMentionStart(-1);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = (before + insertion).length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && filtered.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % filtered.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + filtered.length) % filtered.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filtered[activeIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    }
    if (!open && onSubmitShortcut && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmitShortcut();
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        rows={rows}
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute left-2 right-2 sm:right-auto sm:max-w-xs bottom-full mb-1 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
          role="listbox"
        >
          <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Mencionar aluno
          </div>
          {filtered.map((p, idx) => {
            const handle = handleFromName(p.full_name, p.email);
            return (
              <button
                key={p.user_id}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertMention(p); }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors',
                  idx === activeIndex ? 'bg-primary/15' : 'hover:bg-secondary/60'
                )}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {initials(p.full_name, p.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {p.full_name || p.email?.split('@')[0] || 'Aluno'}
                  </p>
                  <p className="text-[10px] text-primary font-mono truncate leading-tight">@{handle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

/** Renderer that highlights @mentions in plain content */
export function MentionContent({ children, className }: { children: string; className?: string }) {
  const parts = useMemo(() => {
    const re = /(^|[\s(])(@[a-z0-9_]{2,24})/gi;
    const out: Array<{ t: 'text' | 'mention'; v: string }> = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(children)) !== null) {
      const idx = m.index + m[1].length;
      if (idx > last) out.push({ t: 'text', v: children.slice(last, idx) });
      out.push({ t: 'mention', v: m[2] });
      last = idx + m[2].length;
    }
    if (last < children.length) out.push({ t: 'text', v: children.slice(last) });
    return out;
  }, [children]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.t === 'mention'
          ? (
            <span
              key={i}
              className="text-primary font-semibold bg-primary/10 px-1 rounded"
            >{p.v}</span>
          )
          : <span key={i}>{p.v}</span>
      )}
    </span>
  );
}
