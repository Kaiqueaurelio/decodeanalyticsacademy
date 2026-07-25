import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { EllaChat } from "./EllaChat";
import { getEllaAvatarUrl } from "@/lib/ellaAvatar";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/", "/login", "/reset-password", "/termos"];

export function EllaSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;
  if (location.pathname === "/ella") return null;

  const contextHint = `Usuário está em ${location.pathname}${location.search}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Abrir Ella"
          className={cn(
            "fixed z-40 right-4 bottom-28 md:bottom-6 h-14 w-14 rounded-full shadow-xl p-0 overflow-hidden",
            "ring-2 ring-primary/60 hover:scale-105 transition-transform",
            "border-2 border-background"
          )}
          size="icon"
        >
          <img
            src={getEllaAvatarUrl()}
            alt="Ella Ribeiro"
            className="h-full w-full object-cover rounded-full"
            onError={(e) => {
              try { localStorage.removeItem('decode_ella_avatar_url_v5'); } catch {}
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== DEFAULT_ELLA_AVATAR) img.src = DEFAULT_ELLA_AVATAR;
            }}
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <EllaChat contextHint={contextHint} compact onAfterAction={() => { /* could refetch */ }} />
      </SheetContent>
    </Sheet>
  );
}
