import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Clock, Flag, Calendar, Building2 } from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useApp } from "@/lib/store";
import { PRIORITY_META } from "@/lib/types";

type Suggestion = {
  id: string;
  icon: typeof Sparkles;
  label: string;
  tone: "urgent" | "today" | "soon" | "info";
};

const TONE: Record<Suggestion["tone"], { bg: string; fg: string }> = {
  urgent: { bg: "oklch(0.65 0.22 25 / 0.15)", fg: "oklch(0.72 0.22 25)" },
  today:  { bg: "oklch(0.62 0.22 265 / 0.15)", fg: "oklch(0.72 0.2 265)" },
  soon:   { bg: "oklch(0.78 0.17 55 / 0.15)", fg: "oklch(0.82 0.17 55)" },
  info:   { bg: "oklch(0.55 0.04 270 / 0.2)",  fg: "oklch(0.8 0.03 270)" },
};

export function SuggestionsToday() {
  const tasks    = useApp((s) => s.tasks);
  const projects = useApp((s) => s.projects);
  const clients  = useApp((s) => s.clients);
  const events   = useApp((s) => s.events);

  const suggestions = useMemo<Suggestion[]>(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const list: Suggestion[] = [];

    // Overdue tasks
    tasks
      .filter((t) => !t.completed && t.date && t.date < today)
      .slice(0, 2)
      .forEach((t) =>
        list.push({
          id: `overdue-${t.id}`,
          icon: AlertTriangle,
          label: `Atrasada: ${t.title}`,
          tone: "urgent",
        }),
      );

    // High priority today
    const todayTasks = tasks.filter((t) => !t.completed && t.date === today);
    todayTasks
      .filter((t) => t.priority === "high")
      .slice(0, 3)
      .forEach((t) =>
        list.push({
          id: `prio-${t.id}`,
          icon: Flag,
          label: `Prioridade: ${t.title}`,
          tone: "today",
        }),
      );

    // Other today tasks
    todayTasks
      .filter((t) => t.priority !== "high")
      .slice(0, 3)
      .forEach((t) =>
        list.push({
          id: `today-${t.id}`,
          icon: Clock,
          label: `${t.startTime ? t.startTime + " · " : ""}${t.title}`,
          tone: "today",
        }),
      );

    // Events today or within 2 days
    events
      .filter((e) => e.date && e.date >= today)
      .filter((e) => {
        const d = differenceInCalendarDays(parseISO(e.date!), new Date());
        return d <= 2;
      })
      .slice(0, 3)
      .forEach((e) =>
        list.push({
          id: `ev-${e.id}`,
          icon: Calendar,
          label: `${e.startTime ? e.startTime + " · " : ""}${e.title}`,
          tone: e.date === today ? "today" : "soon",
        }),
      );

    // Projects with deadline within 3 days
    projects
      .filter((p) => p.deadline && p.status !== "delivered")
      .filter((p) => {
        const d = differenceInCalendarDays(parseISO(p.deadline!), new Date());
        return d >= 0 && d <= 3;
      })
      .slice(0, 2)
      .forEach((p) =>
        list.push({
          id: `proj-${p.id}`,
          icon: Sparkles,
          label: `Prazo próximo: ${p.name}`,
          tone: "soon",
        }),
      );

    // Clients waiting delivery: has active project past deadline
    projects
      .filter((p) => p.deadline && p.deadline < today && p.status !== "delivered" && p.clientId)
      .slice(0, 2)
      .forEach((p) => {
        const c = clients.find((x) => x.id === p.clientId);
        if (c)
          list.push({
            id: `client-${p.id}`,
            icon: Building2,
            label: `${c.name} aguarda entrega de ${p.name}`,
            tone: "urgent",
          });
      });

    // Dedupe by label, cap at 6
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true))).slice(0, 6);
  }, [tasks, projects, clients, events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-electric" />
            Sugestões para hoje
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {suggestions.length === 0
              ? "Tudo em dia por aqui"
              : `${suggestions.length} ${suggestions.length === 1 ? "item" : "itens"} para focar`}
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-card-soft/70 text-muted-foreground">
          {PRIORITY_META.high.label} primeiro
        </span>
      </div>

      {suggestions.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Sem sugestões no momento. Aproveite o dia leve.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {suggestions.map((s) => {
            const Icon = s.icon;
            const tone = TONE[s.tone];
            return (
              <li
                key={s.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-card-soft/50"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: tone.bg, color: tone.fg }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs leading-tight flex-1 truncate">{s.label}</p>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
