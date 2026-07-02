import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  FolderKanban,
  Target,
  ArrowUpRight,
  Briefcase,
  Heart,
  Sparkles,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/TaskModal";
import { format } from "date-fns";

import { CATEGORY_META, type Category } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { SuggestionsToday } from "@/components/dashboard/SuggestionsToday";
import { AssistantCard } from "@/components/dashboard/AssistantCard";
import { OrganizeWeekButton } from "@/components/dashboard/OrganizeWeekButton";



export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Zelon" }] }),
});

const CAT_ICON: Record<Category, typeof Briefcase> = {
  client: Briefcase,
  personal: Heart,
  project: Sparkles,
};

function Dashboard() {
  const tasks = useApp((s) => s.tasks);
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);
  const profile = useApp((s) => s.profile);
  const toggleTask = useApp((s) => s.toggleTask);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | Category>("all");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const doneToday = todayTasks.filter((t) => t.completed).length;
  const activeProjects = projects.filter((p) => p.status !== "delivered").length;

  const allActivities = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          ((b.date ?? "") + (b.startTime ?? "")).localeCompare((a.date ?? "") + (a.startTime ?? "")) ||
          b.createdAt - a.createdAt,
      ),
    [tasks],
  );
  const filteredToday = useMemo(
    () => (filter === "all" ? allActivities : allActivities.filter((t) => t.category === filter)),
    [filter, allActivities],
  );

  const weekDone = tasks.filter((t) => t.completed).length;


  return (
    <AppLayout
      actions={
        <div className="flex items-center gap-2">
          <OrganizeWeekButton />
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Nova tarefa
          </Button>
        </div>
      }
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 auto-rows-min">
        <StatCard
          label="Concluídas hoje"
          value={`${doneToday}/${todayTasks.length || 0}`}
          icon={<CheckCircle2 className="w-4 h-4 text-neon" />}
          accent="oklch(0.92 0.21 125)"
        />
        <StatCard
          label="Projetos ativos"
          value={String(activeProjects)}
          icon={<FolderKanban className="w-4 h-4 text-electric" />}
          accent="oklch(0.62 0.22 265)"
        />
        <StatCard
          label="Meta semanal"
          value={`${weekDone}/${profile.weeklyGoal}`}
          icon={<Target className="w-4 h-4 text-orange-accent" />}
          accent="oklch(0.78 0.17 55)"
        />

        {/* Activities (today's tasks) — card grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-4 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">Minhas atividades</h3>
              <p className="text-[11px] text-muted-foreground">
                Você tem {allActivities.length} {allActivities.length === 1 ? "atividade" : "atividades"} no total
              </p>
            </div>
            <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todas
            </Link>
          </div>

          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="Todas" highlight />
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <FilterPill
                key={c}
                active={filter === c}
                onClick={() => setFilter(c)}
                label={CATEGORY_META[c].label}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredToday.slice(0, 3).map((t, i) => {
              const Icon = CAT_ICON[t.category];
              const color = CATEGORY_META[t.category].color;
              const isHero = i === 0;
              const client = t.clientId ? clients.find((c) => c.id === t.clientId) : undefined;
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className={[
                    "group relative text-left p-3 rounded-2xl aspect-[1.05] flex flex-col justify-between transition-all border",
                    isHero
                      ? "text-electric-foreground border-transparent"
                      : "bg-card-soft/70 hover:bg-card-soft border-border",
                  ].join(" ")}
                  style={
                    isHero
                      ? { background: `linear-gradient(160deg, ${color}, oklch(0.55 0.22 270))` }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: isHero ? "rgba(255,255,255,0.18)" : `${color}25`,
                        color: isHero ? "white" : color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 ${isHero ? "text-white/90" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold leading-tight break-words line-clamp-2 ${
                        t.completed && !isHero ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </p>
                    {client && (
                      <p className={`text-[10px] mt-0.5 flex items-center gap-1 truncate ${isHero ? "text-white/85" : "text-muted-foreground"}`}>
                        <Building2 className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{client.name}</span>
                      </p>
                    )}
                    <p className={`text-[11px] mt-0.5 ${isHero ? "text-white/80" : "text-muted-foreground"}`}>
                      {t.startTime ?? CATEGORY_META[t.category].label}
                    </p>
                  </div>
                </button>
              );
            })}
            {filteredToday.length > 3 && (
              <Link
                to="/tasks"
                className="aspect-[1.05] p-3 rounded-2xl bg-card-soft/70 hover:bg-card-soft border border-border flex flex-col items-center justify-center gap-1 text-foreground transition-colors"
              >
                <span className="text-3xl font-bold leading-none text-electric">
                  +{Math.min(filteredToday.length - 3, 9)}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">Ver mais tarefas</span>
              </Link>
            )}
            {filteredToday.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="aspect-[1.05] p-3 rounded-2xl border-2 border-dashed border-border hover:border-electric/60 text-muted-foreground hover:text-electric transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[11px] font-medium">Adicionar atividade</span>
              </button>
            )}
            {filteredToday.length === 0 && (
              <div className="col-span-2 sm:col-span-2 lg:col-span-3 flex items-center text-xs text-muted-foreground px-2">
                Nenhuma atividade nesta categoria.
              </div>
            )}
          </div>
        </motion.div>

        {/* Month Calendar — replaces weekly heatmap */}
        <MonthCalendar />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Projetos</h3>
            <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todos
            </Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState text="Crie seu primeiro projeto." />
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 3).map((p) => {
                const list = tasks.filter((t) => t.projectId === p.id);
                const pct = list.length
                  ? Math.round((list.filter((t) => t.completed).length / list.length) * 100)
                  : 0;
                return (
                  <li key={p.id} className="p-2.5 rounded-2xl bg-card-soft/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-card overflow-hidden">
                      <div className="h-full bg-electric" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        <SuggestionsToday />
        <AssistantCard />

        <UpcomingEvents />




      </div>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border",
        active
          ? highlight
            ? "bg-neon text-neon-foreground border-transparent"
            : "bg-foreground text-background border-transparent"
          : "bg-card-soft/60 text-muted-foreground border-border hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-4 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: `${accent}25` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-8 text-center text-xs text-muted-foreground">{text}</div>;
}
