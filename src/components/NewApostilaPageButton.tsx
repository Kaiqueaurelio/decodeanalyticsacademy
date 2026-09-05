import { useState } from 'react';
import { FilePlus2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createApostilaPage } from '@/lib/apostila-pages';
import { ensureApostilaExists } from '@/lib/create-placeholder-apostila';
import { toast } from 'sonner';

interface NewApostilaPageButtonProps {
  apostilaId: string;
  compact?: boolean;
  beforeCreate?: () => Promise<boolean>;
  className?: string;
}

export function NewApostilaPageButton({
  apostilaId,
  compact = false,
  className = '',
  beforeCreate,
}: NewApostilaPageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const create = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (creating) return;
    if (!user) {
      toast.error('Faça login novamente para criar a página.');
      return;
    }

    setCreating(true);
    try {
      if (beforeCreate) {
        const saved = await beforeCreate();
        if (!saved) return;
      }
      // Se a apostila for um placeholder, converta-a antes de criar a página.
      let targetApostilaId = apostilaId;
      if (apostilaId.startsWith('placeholder')) {
        targetApostilaId = await ensureApostilaExists({ id: apostilaId, title: '' });
      }

      const page = await createApostilaPage(targetApostilaId, user.id);
      toast.success('Nova página criada. Preencha o título e o conteúdo para salvar.');
      navigate(`/admin/apostilas/${targetApostilaId}?page=${page.id}&expanded=1`);
    } catch (error: any) {
      console.error('Erro ao criar página da apostila:', error);
      const message = String(error?.message || '');
      if (/apostila_pages|schema cache|does not exist|PGRST205/i.test(message)) {
        toast.error('A criação de páginas ainda não está habilitada no banco de produção. Aplique a migração de apostila_pages.');
      } else if (/row-level security|permission denied|42501/i.test(message)) {
        toast.error('Seu usuário não tem permissão para criar páginas nesta apostila. Verifique o perfil de administrador.');
      } else {
        toast.error(error?.message || 'Não foi possível criar a página.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button
      size={compact ? 'icon' : 'sm'}
      variant="outline"
      onClick={create}
      disabled={creating}
      className={`${compact ? 'h-8 w-8 text-primary' : 'h-8 gap-1.5 border-primary/60 text-primary hover:bg-primary/10'} ${className}`}
      title={creating ? 'Criando página...' : 'Nova Página'}
      aria-label={creating ? 'Criando página' : 'Criar nova página'}
    >
      {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
      {!compact && <span>{creating ? 'Criando...' : 'Nova Página'}</span>}
    </Button>
  );
}
