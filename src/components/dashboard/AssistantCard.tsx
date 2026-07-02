import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wand2, TrendingUp, PauseCircle, CheckCircle2, Target, Flame } from "lucide-react";
import { format, differenceInCalendarDays, parseISO, startOfWeek } from "date-fns";
import { useApp } from "@/lib/store";

type Insight = {
  id: string;
  icon: typeof Wand2;
  message: string;
  accent: string;
};

export function AssistantCard() {
  const tasks    = useApp((s) => s.tasks);
  const projects = useApp((s) => s.projects);
  const profile  = useApp((s) => s.profile);

  const insights = useMemo<Insight[]>(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const out: Insight[] = [];

    // Pending tasks
    const pending = tasks.filter((t) => !t.completed).length;
    if (pending > 0) {
      out.push({
        id: "pending",
        icon: Flame,
        message: `Você tem ${pending} ${pending === 1 ? "tarefa pendente" : "tarefas pendentes"}.`,
        accent: "oklch(0.72 0.22 25)",
      });
    }

    // Stalled project (created more than 7 days ago, no completed tasks recently)
    const stalled = projects.find((p) => {
      if (p.status === "delivered") return false;
      const projTasks = tasks.filter((t) => t.projectId === p.id);
      const latest = Math.max(
        p.createdAt,
        ...projTasks.map((t) => t.createdAt),
      );
      const days = differenceInCalendarDays(new Date(), new Date(latest));
      return days >= 7;
    });
    if (stalled) {
      const days = differenceInCalendarDays(
        new Date(),
        new Date(
          Math.max(
            stalled.createdAt,
            ...tasks.filter((t) => t.projectId === stalled.id).map((t) => t.createdAt),
          ),
        ),
      );
      out.push({
        id: "stalled",
        icon: PauseCircle,
        message: `“${stalled.name}” está parado há ${days} dias.`,
        accent: "oklch(0.78 0.17 55)",
      });
    }

    // Weekly goal progress
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const doneThisWeek = tasks.filter(
      (t) => t.completed && new Date(t.createdAt) >= weekStart,
    ).length;
    const goal = profile.weeklyGoal || 20;
    const pct = Math.round((doneThisWeek / goal) * 100);
    if (pct > 0) {
      out.push({
        id: "goal",
        icon: Target,
        message:
          pct >= 100
            ? `Meta semanal batida! ${doneThisWeek}/${goal} tarefas concluídas.`
            : `Você já concluiu ${pct}% da sua meta semanal.`,
        accent: "oklch(0.92 0.21 125)",
      });
    }

    // Project close to completion
    const almostDone = projects
      .filter((p) => p.status !== "delivered")
      .map((p) => {
        const list = tasks.filter((t) => t.projectId === p.id);
        const done = list.filter((t) => t.completed).length;
        const total = list.length;
        const percent = total ? done / total : 0;
        return { p, percent, total };
      })
      .filter((x) => x.total >= 2 && x.percent >= 0.7 && x.percent < 1)
      .sort((a, b) => b.percent - a.percent)[0];
    if (almostDone) {
      out.push({
        id: "finish",
        icon: CheckCircle2,
        message: `Hoje é um bom dia para finalizar “${almostDone.p.name}”.`,
        accent: "oklch(0.62 0.22 265)",
      });
    }

    // Done today streak
    const doneToday = tasks.filter((t) => t.completed && t.date === today).length;
    if (doneToday >= 3) {
      out.push({
        id: "streak",
        icon: TrendingUp,
        message: `Ritmo excelente: ${doneToday} tarefas concluídas hoje.`,
        accent: "oklch(0.7 0.2 320)",
      });
    }

    if (out.length === 0) {
      out.push({
        id: "empty",
        icon: Wand2,
        message: "Cadastre tarefas e projetos para receber recomendações.",
        accent: "oklch(0.55 0.04 270)",
      });
    }

    return out.slice(0, 4);
  }, [tasks, projects, profile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-electric" />
            Assistente
          </h3>
          <p className="text-[11px] text-muted-foreground">Insights automáticos</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {insights.map((i) => {
          const Icon = i.icon;
          return (
            <li
              key={i.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-card-soft/50"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${i.accent}25`, color: i.accent }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs leading-snug flex-1">{i.message}</p>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
