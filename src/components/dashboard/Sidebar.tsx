import { useState } from "react";
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
      {/* Desktop / tablet: expandable vertical rail */}
      <aside className="group hidden md:flex flex-col py-4 w-[76px] hover:w-60 shrink-0 transition-[width] duration-300 ease-out overflow-hidden">
        <div className="flex flex-col gap-4 px-2">
          <Link to="/" aria-label="Zelon" className="w-10 h-10 flex items-center justify-center shrink-0 mx-auto group-hover:mx-0">
            <img src={zelonZ} alt="Zelon" className="w-full h-full object-contain" />
          </Link>
          <nav className="flex flex-col gap-1 p-1.5 rounded-3xl glass-card overflow-hidden">
            {allItems.map(({ icon: Icon, to, label }) => {
              const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  title={label}
                  className={`relative flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 h-10 px-2.5 rounded-2xl transition-colors duration-200 ${
                    isActive
                      ? "bg-neon/15 text-neon"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-soft"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                  <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {label}
                  </span>
                </Link>
              );
            })}
            <div className="my-1 h-px bg-border/40 mx-2" />
            <button
              onClick={logout}
              title="Sair"
              aria-label="Sair"
              className="flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 h-10 px-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-card-soft transition-colors duration-200"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Sair
              </span>
            </button>
            <Link
              to="/profile"
              aria-label={profile.name || "Perfil"}
              title={profile.name || "Perfil"}
              className="flex items-center gap-3 h-10 px-1.5 rounded-2xl text-foreground hover:bg-card-soft transition-colors duration-200"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-accent to-primary p-[1.5px] overflow-hidden shrink-0">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-[10px] font-bold">
                    {(profile.name || "?").slice(0, 2).toUpperCase()}
                  </div>

                )}
              </div>
              <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                {profile.name || "Perfil"}
              </span>
            </Link>
          </nav>
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
              className={`relative flex-1 h-10 rounded-full flex items-center justify-center ${
                isActive ? "bg-neon/15 text-neon" : "text-muted-foreground"
              }`}
            >
              <Icon className="relative w-5 h-5" strokeWidth={2} />
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
