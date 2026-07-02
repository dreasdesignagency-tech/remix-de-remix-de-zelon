import { useMemo, useState } from "react";
import { Bell, AlertTriangle, Clock, CalendarClock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { format, parseISO, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notif = {
  id: string;
  kind: "overdue" | "due_today" | "due_soon" | "due_tomorrow" | "project_deadline";
  title: string;
  subtitle: string;
  icon: typeof Bell;
  color: string;
};

export function NotificationsBell() {
  const tasks = useApp((s) => s.tasks);
  const projects = useApp((s) => s.projects);
  const events = useApp((s) => s.events);
  const [open, setOpen] = useState(false);


  const notifications = useMemo<Notif[]>(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const list: Notif[] = [];
    for (const t of tasks) {
      if (t.completed || !t.date) continue;
      if (t.date < todayStr) {
        list.push({
          id: `overdue-${t.id}`,
          kind: "overdue",
          title: t.title,
          subtitle: `Atrasada — vencia ${format(parseISO(t.date), "d MMM", { locale: ptBR })}`,
          icon: AlertTriangle,
          color: "oklch(0.62 0.22 25)",
        });
        continue;
      }
      const d = parseISO(t.date);
      if (isToday(d)) {
        if (t.startTime) {
          const [h, m] = t.startTime.split(":").map(Number);
          const due = new Date(); due.setHours(h, m || 0, 0, 0);
          const mins = differenceInMinutes(due, now);
          if (mins >= 0 && mins <= 60) {
            list.push({
              id: `soon-${t.id}`,
              kind: "due_soon",
              title: t.title,
              subtitle: `Em ${mins} min · ${t.startTime}`,
              icon: Clock,
              color: "oklch(0.72 0.17 55)",
            });
            continue;
          }
        }
        list.push({
          id: `today-${t.id}`,
          kind: "due_today",
          title: t.title,
          subtitle: t.startTime ? `Hoje às ${t.startTime}` : "Vence hoje",
          icon: CalendarClock,
          color: "oklch(0.62 0.22 265)",
        });
      } else if (isTomorrow(d)) {
        list.push({
          id: `tom-${t.id}`,
          kind: "due_tomorrow",
          title: t.title,
          subtitle: t.startTime ? `Amanhã às ${t.startTime}` : "Vence amanhã",
          icon: CalendarClock,
          color: "oklch(0.55 0.04 270)",
        });
      }
    }
    for (const p of projects) {
      if (!p.deadline || p.status === "delivered") continue;
      const d = parseISO(p.deadline);
      if (isToday(d) || isTomorrow(d) || p.deadline < todayStr) {
        list.push({
          id: `proj-${p.id}`,
          kind: "project_deadline",
          title: p.name,
          subtitle: p.deadline < todayStr ? "Projeto atrasado" : isToday(d) ? "Prazo do projeto hoje" : "Prazo do projeto amanhã",
          icon: AlertTriangle,
          color: "oklch(0.62 0.22 265)",
        });
      }
    }
    for (const e of events) {
      if (!e.date) continue;
      const d = parseISO(e.date);
      const when = e.startTime ? ` às ${e.startTime}` : "";
      if (e.date === todayStr) {
        list.push({
          id: `evt-today-${e.id}`,
          kind: "due_today",
          title: e.title,
          subtitle: `Evento hoje${when}`,
          icon: CalendarClock,
          color: e.color ?? "oklch(0.62 0.22 265)",
        });
      } else if (isTomorrow(d)) {
        list.push({
          id: `evt-tom-${e.id}`,
          kind: "due_tomorrow",
          title: e.title,
          subtitle: `Evento amanhã${when}`,
          icon: CalendarClock,
          color: e.color ?? "oklch(0.55 0.04 270)",
        });
      } else if (e.date > todayStr && d <= new Date(Date.now() + 7 * 86400000)) {
        list.push({
          id: `evt-soon-${e.id}`,
          kind: "due_tomorrow",
          title: e.title,
          subtitle: `${format(d, "d MMM", { locale: ptBR })}${when}`,
          icon: CalendarClock,
          color: e.color ?? "oklch(0.55 0.04 270)",
        });
      }
    }
    return list.sort((a, b) => {
      const order = { overdue: 0, due_soon: 1, due_today: 2, project_deadline: 3, due_tomorrow: 4 };
      return order[a.kind] - order[b.kind];
    });
  }, [tasks, projects, events]);


  const count = notifications.length;
  const badge = count > 9 ? "9+" : String(count);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative w-9 h-9 rounded-full glass-card flex items-center justify-center text-foreground hover:text-electric transition-colors"
        >
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[oklch(0.62_0.22_25)] text-white text-[9px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 !bg-popover border-border shadow-2xl">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-[11px] text-muted-foreground">{count === 0 ? "Tudo em dia" : `${count} item${count > 1 ? "s" : ""}`}</p>
          </div>
          <Bell className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Você não tem lembretes no momento.</div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <li key={n.id}>
                    <Link
                      to="/tasks"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 p-3 hover:bg-card-soft/60 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${n.color}20`, color: n.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.subtitle}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="p-2 border-t border-border">
          <Link to="/tasks" onClick={() => setOpen(false)} className="block text-center text-[11px] py-1.5 text-muted-foreground hover:text-foreground">
            Ver todas as tarefas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}