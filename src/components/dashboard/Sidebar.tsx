import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, ListTodo, StickyNote, FolderKanban, CalendarDays, User, LogOut, Menu, Users } from "lucide-react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import zelonZ from "@/assets/zelon-z.png";

const allItems = [
  { icon: LayoutDashboard, to: "/" as const, label: "Dashboard" },
  { icon: CalendarDays, to: "/calendar" as const, label: "Agenda" },
  { icon: ListTodo, to: "/tasks" as const, label: "Tarefas" },
  { icon: FolderKanban, to: "/projects" as const, label: "Projetos" },
  { icon: Users, to: "/clients" as const, label: "Clientes" },
  { icon: StickyNote, to: "/notes" as const, label: "Anotações" },
  { icon: User, to: "/profile" as const, label: "Perfil" },
];

const mobileBottomItems = allItems.slice(0, 3);

function useLogout() {
  const navigate = useNavigate();
  return async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else navigate({ to: "/login" });
  };
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useApp((s) => s.profile);
  const logout = useLogout();

  return (
    <>
      {/* Desktop / tablet: vertical rail */}
      <aside className="hidden md:flex flex-col items-center justify-between py-4 w-12 shrink-0">
        <div className="flex flex-col items-center gap-5">
          <Link to="/" aria-label="Zelon" className="w-8 h-8 flex items-center justify-center">
            <img src={zelonZ} alt="Zelon" className="w-full h-full object-contain" />
          </Link>
          <nav className="flex flex-col gap-1.5 p-1.5 rounded-full glass-card">
            {allItems.map(({ icon: Icon, to, label }) => {
              const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className="group relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-desktop"
                      className="absolute inset-0 rounded-full bg-neon glow-neon"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`relative w-4 h-4 ${isActive ? "text-neon-foreground" : ""}`} strokeWidth={2} />
                  <span className="pointer-events-none absolute left-full ml-2 px-3 py-1.5 rounded-lg bg-popover border border-border shadow-lg text-xs font-medium whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 text-popover-foreground">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={logout}
            title="Sair"
            aria-label="Sair"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
          </button>
          <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-accent to-primary p-[1.5px] overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-[10px] font-bold">
                {(profile.name || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile: 3-item bottom nav */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-card rounded-full px-2 py-2 flex items-center justify-between gap-1"
      >
        {mobileBottomItems.map(({ icon: Icon, to, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className="relative flex-1 h-10 rounded-full flex items-center justify-center text-muted-foreground"
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-mobile"
                  className="absolute inset-0 rounded-full bg-neon glow-neon"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`relative w-5 h-5 ${isActive ? "text-neon-foreground" : ""}`} strokeWidth={2} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function MobileMenuButton() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useApp((s) => s.profile);
  const logout = useLogout();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menu"
          className="md:hidden w-9 h-9 rounded-full glass-card flex items-center justify-center text-foreground hover:text-electric transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img src={zelonZ} alt="Zelon" className="w-6 h-6 object-contain" />
            Zelon
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-card-soft/60">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-accent to-primary p-[1.5px] overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-xs font-bold">
                {(profile.name || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.name || "Você"}</p>
            <p className="text-[11px] text-muted-foreground">Conta</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {allItems.map(({ icon: Icon, to, label }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive ? "bg-neon text-neon-foreground" : "text-foreground hover:bg-card-soft"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            setOpen(false);
            logout();
          }}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </SheetContent>
    </Sheet>
  );
}
