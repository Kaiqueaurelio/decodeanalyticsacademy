import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ChevronDown, LogOut, User, Shield, Upload, Users, Activity, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Início", path: "/dashboard" },
  { label: "Biblioteca", path: "/biblioteca" },
  { label: "Simulados", path: "/biblioteca?tipo=exam" },
  { label: "Vídeos", path: "/biblioteca?tipo=video" },
  { label: "Áudios", path: "/biblioteca?tipo=audio" },
];

export function NetflixNavbar() {
  const { isAdmin, signOut, profile } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/95 backdrop-blur-sm shadow-lg" : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 h-14 sm:h-16">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/dashboard" className="flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-black text-primary tracking-tight leading-none">
              DECODE
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || 
                (link.path.includes("?") && location.search.includes(link.path.split("?")[1]));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 text-[13px] font-medium transition-colors rounded-sm ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground">
                Navegar <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border-border">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link to={link.path} className="text-sm">{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/biblioteca" className="text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none group">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 rounded-sm border-0">
                <AvatarFallback className="rounded-sm text-[11px] bg-primary text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-200" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-sm border-border">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{profile?.full_name || "Aluno"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="gap-2"><User className="h-4 w-4" /> Perfil</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="gap-2"><Shield className="h-4 w-4" /> Painel Admin</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/materiais" className="gap-2"><Upload className="h-4 w-4" /> Materiais</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuários</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/logs" className="gap-2"><Activity className="h-4 w-4" /> Logs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/alertas" className="gap-2"><AlertTriangle className="h-4 w-4" /> Alertas</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
