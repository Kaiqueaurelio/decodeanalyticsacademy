import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { EllaChat } from "./EllaChat";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/", "/login", "/reset-password", "/termos"];

export function EllaSidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;
  if (location.pathname === "/ella") return null;

  const contextHint = `Usuário está em ${location.pathname}${location.search}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Abrir Ella"
          className={cn(
            "fixed z-40 right-4 bottom-28 md:bottom-6 h-14 w-14 rounded-full shadow-xl",
            "bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform",
            "border-2 border-background"
          )}
          size="icon"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <EllaChat contextHint={contextHint} compact onAfterAction={() => { /* could refetch */ }} />
      </SheetContent>
    </Sheet>
  );
}
