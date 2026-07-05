import { Sidebar, MobileMenuButton } from "@/components/dashboard/Sidebar";
import { Moon, Sun, User } from "lucide-react";
import { useApp } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/NotificationsBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { OnboardingTour } from "@/components/OnboardingTour";



interface Props {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, actions, children }: Props) {
  const profile = useApp((s) => s.profile);
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-pattern p-3 md:p-4 flex gap-1">
      <Sidebar />
      <main className="flex-1 glass-card rounded-3xl p-3 md:p-5 min-w-0 flex flex-col mb-20 md:mb-0 overflow-hidden">
        <header className="flex items-center justify-between gap-2 md:gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-semibold tracking-tight truncate">
              {title ?? `Olá, ${(profile.name || "você").split(" ")[0]}!`}
            </h1>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle ?? "Pronto para organizar seu dia?"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <GlobalSearch />

            <button
              onClick={toggle}
              aria-label="Alternar tema"
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
              className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-foreground hover:text-electric transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsBell />
            <Link
              to="/profile"
              aria-label="Perfil"
              title="Perfil"
              className="w-9 h-9 rounded-full glass-card overflow-hidden flex items-center justify-center text-foreground hover:text-electric transition-colors shrink-0"
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name || "Perfil"} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
            {actions}
            <MobileMenuButton />
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">{children}</div>
      </main>
      <OnboardingTour />
    </div>
  );
}

