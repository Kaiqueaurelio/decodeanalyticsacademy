import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createApostilaPage } from '@/lib/apostila-pages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NewApostilaPageButton({
  apostilaId,
  compact = false,
  className,
}: {
  apostilaId: string;
  compact?: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const create = async () => {
    if (!user) {
      toast.error('Faça login novamente para criar a página.');
      return;
    }

    let targetApostilaId = apostilaId;
    if (apostilaId.startsWith('placeholder')) {
      try {
        const { ensureApostilaExists } = await import('@/lib/create-placeholder-apostila');
        targetApostilaId = await ensureApostilaExists({ id: apostilaId, title: '' });
      } catch (err) {
        console.error('Erro ao converter placeholder antes de criar página:', err);
        toast.error('Salve a apostila primeiro antes de adicionar páginas.');
        return;
      }
    }

    try {
      const page = await createApostilaPage(targetApostilaId, user.id);
      toast.success('Nova página criada.');
      // Use o ID resolvido para não voltar ao placeholder e perder a página recém-criada.
      navigate(`/admin/apostilas/${targetApostilaId}?page=${page.id}&expanded=1`);
    } catch (error: any) {
      const message = String(error?.message || '');
      if (/row-level security|permission denied|42501/i.test(message)) {
        toast.error('Sua conta não tem permissão de administrador para criar páginas.');
        return;
      }
      if (/apostila_pages|schema cache|does not exist|PGRST205/i.test(message)) {
        toast.error('A tabela de páginas ainda não foi aplicada no banco de produção.');
        return;
      }
      toast.error(message || 'Não foi possível criar a página.');
      console.error('Erro ao criar página:', error);
    }
  };

  return (
    <Button
      size={compact ? 'icon' : 'sm'}
      variant="outline"
      onClick={create}
      className={cn(
        compact ? 'h-8 w-8 text-primary' : 'h-8 gap-1.5 border-primary/60 text-primary hover:bg-primary/10',
        className,
      )}
      title="Nova Página"
    >
      <FilePlus2 className="h-3.5 w-3.5" />
      {!compact && <span>Nova Página</span>}
    </Button>
  );
}
