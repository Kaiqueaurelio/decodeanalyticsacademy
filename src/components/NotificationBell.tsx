// Sino de notificações in-app (visível em qualquer lugar do header).
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2, ExternalLink, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { enablePushNotifications, isPushEnabled, pushSupported } from "@/lib/push";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, unreadCount, markAsRead, markAllAsRead, remove } =
    useNotifications();
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    isPushEnabled().then(setPushOn);
  }, []);

  if (!user) return null;

  const handleEnablePush = async () => {
    const ok = await enablePushNotifications(user.id);
    if (ok) {
      setPushOn(true);
      toast.success("Notificações ativadas");
    } else {
      toast.error("Permissão de notificação negada");
    }
  };

  const handleClick = async (n: typeof items[0]) => {
    if (!n.read) await markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-mono font-bold text-primary-foreground flex items-center justify-center leading-none">
              {badge}
            </span>
          )}
          {unreadCount === 0 && pushSupported() && !pushOn && (
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-background animate-pulse"
              title="Ative as notificações push"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card border-border"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Notificações
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {pushSupported() && !pushOn && (
          <button
            onClick={handleEnablePush}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left bg-primary/5 hover:bg-primary/10 border-b border-border transition-colors"
          >
            <BellRing className="h-3.5 w-3.5 text-primary" />
            <span className="text-primary font-medium">
              Ativar notificações push
            </span>
          </button>
        )}

        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              Nenhuma notificação ainda
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`group px-3 py-2.5 hover:bg-muted/40 transition-colors ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleClick(n)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <p className="text-xs font-medium text-foreground truncate">
                          {n.title}
                        </p>
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                        {formatDistanceToNow(new Date(n.created_at), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </p>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {n.link && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(n.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
