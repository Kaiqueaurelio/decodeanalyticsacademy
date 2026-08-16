import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { motion } from "framer-motion";
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
  const containerRef = useRef<HTMLDivElement>(null);

  if (!user) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;
  if (location.pathname === "/ella") return null;

  const contextHint = `Usuário está em ${location.pathname}${location.search}`;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[100]">
      <Sheet open={open} onOpenChange={setOpen}>
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          dragMomentum={false}
          className="fixed pointer-events-auto right-4 bottom-20 sm:bottom-28 md:bottom-6"
          whileDrag={{ scale: 1.1 }}
        >
        <SheetTrigger asChild>
          <Button
            aria-label="Abrir Ella"
            className={cn(
              "h-14 w-14 rounded-full shadow-[0_8px_30px_rgba(168,85,247,0.3)] p-0 overflow-hidden bg-background cursor-grab active:cursor-grabbing",
              "ring-2 ring-primary/60 hover:scale-110 transition-all duration-300 active:scale-95",
              "border-2 border-background"
            )}
            size="icon"
          >
            <Avatar className="h-full w-full pointer-events-none">
              <AvatarImage src={getEllaAvatarUrl()} alt="Ella Ribeiro" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
                <Wand2 className="h-6 w-6 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        </motion.div>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col pointer-events-auto">
          <EllaChat contextHint={contextHint} compact onAfterAction={() => { /* could refetch */ }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
