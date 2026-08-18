import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createApostilaPage } from '@/lib/apostila-pages';
import { toast } from 'sonner';

export function NewApostilaPageButton({ apostilaId, compact = false }: { apostilaId: string; compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = async () => {
    if (!user) return toast.error('Faça login novamente para criar a página.');
    
    // Se a apostila for um placeholder, precisamos garantir que ela exista antes de criar uma página
    let targetApostilaId = apostilaId;
    if (apostilaId.startsWith('placeholder')) {
      try {
        const { ensureApostilaExists } = await import('@/lib/create-placeholder-apostila');
        targetApostilaId = await ensureApostilaExists({ id: apostilaId, title: '' });
      } catch (err: any) {
        console.error('Erro ao converter placeholder antes de criar página:', err);
        return toast.error(err.message || 'Salve a apostila primeiro antes de adicionar páginas.');
      }
    }

    try {
      const page = await createApostilaPage(targetApostilaId, user.id);
      toast.success('Nova página criada.');
      // O navigate ja estava configurado para ir para a nova página, 
      // mas o usuário sente que "fica na página antiga". 
      // Garantimos o redirecionamento imediato para o editor da nova página.
      navigate(`/admin/apostilas/${apostilaId}?page=${page.id}&expanded=1`);
    } catch (error: any) {
      const message = String(error?.message || '');
      if (/apostila_pages|schema cache|does not exist|PGRST205/i.test(message)) {
        toast.error('O recurso Nova Página ainda não foi ativado no banco de produção.');
        return;
      }
      toast.error(error?.message || 'Não foi possível criar a página.');
    }
  };
  return (
    <Button size={compact ? 'icon' : 'sm'} variant="outline" onClick={create}
      className={compact ? 'h-8 w-8 text-primary' : 'h-8 gap-1.5 border-primary/60 text-primary hover:bg-primary/10'}
      title="Nova Página">
      <FilePlus2 className="h-3.5 w-3.5" />
      {!compact && <span>Nova Página</span>}
    </Button>
  );
}
