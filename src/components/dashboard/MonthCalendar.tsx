import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  CalendarDays,
  Plus,
  FolderKanban,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, PRIORITY_META, STATUS_META } from "@/lib/types";
import { TaskModal } from "@/components/TaskModal";
import { ProjectModal } from "@/components/ProjectModal";

export function MonthCalendar() {
  const tasks = useApp((s) => s.tasks);
  const projects = useApp((s) => s.projects);
  const notes = useApp((s) => s.notes);
  const toggleTask = useApp((s) => s.toggleTask);

  const [cursor, setCursor] = useState(() => new Date());
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const dayMeta = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; overdue: number; hasProject: boolean; hasNote: boolean }
    >();
    const ensure = (k: string) =>
      map.get(k) ?? { total: 0, done: 0, overdue: 0, hasProject: false, hasNote: false };
    for (const t of tasks) {
      if (!t.date) continue;
      const m = ensure(t.date);
      m.total += 1;
      if (t.completed) m.done += 1;
      else if (t.date < todayStr) m.overdue += 1;
      map.set(t.date, m);
    }
    for (const p of projects) {
      if (!p.deadline) continue;
      const m = ensure(p.deadline);
      m.hasProject = true;
      map.set(p.deadline, m);
    }
    for (const n of notes) {
      const k = format(new Date(n.createdAt), "yyyy-MM-dd");
      const m = ensure(k);
      m.hasNote = true;
      map.set(k, m);
    }
    return map;
  }, [tasks, projects, notes, todayStr]);

  const dayTasks = useMemo(() => {
    if (!openDate) return [];
    return tasks
      .filter((t) => t.date === openDate)
      .sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));
  }, [openDate, tasks]);

  const dayProjects = useMemo(
    () => (openDate ? projects.filter((p) => p.deadline === openDate) : []),
    [openDate, projects],
  );

  const dayNotes = useMemo(() => {
    if (!openDate) return [];
    return notes.filter((n) => format(new Date(n.createdAt), "yyyy-MM-dd") === openDate);
  }, [openDate, notes]);

  const doneCount = dayTasks.filter((t) => t.completed).length;
  const isEmpty = dayTasks.length === 0 && dayProjects.length === 0 && dayNotes.length === 0;

  const weekdays = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-4 text-electric-foreground lg:self-start"
        style={{
          background: "linear-gradient(160deg, oklch(0.62 0.22 265), oklch(0.55 0.22 270))",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Seus dias ativos</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="w-6 h-6 rounded-full hover:bg-white/15 flex items-center justify-center"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium capitalize min-w-[70px] text-center">
              {format(cursor, "MMMM", { locale: ptBR })}
            </span>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="w-6 h-6 rounded-full hover:bg-white/15 flex items-center justify-center"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekdays.map((w) => (
            <div key={w} className="text-[10px] text-center text-white/65 font-semibold">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, cursor);
            const today = isToday(d);
            const meta = dayMeta.get(dateStr);
            const hasAny = !!meta;
            const hasOverdue = (meta?.overdue ?? 0) > 0;
            const allDone = meta && meta.total > 0 && meta.done === meta.total;

            return (
              <button
                key={dateStr}
                onClick={() => setOpenDate(dateStr)}
                className="relative aspect-square flex items-center justify-center group"
                aria-label={format(d, "PPP", { locale: ptBR })}
              >
                <span
                  className={[
                    "absolute inset-0.5 rounded-full transition-all",
                    today
                      ? "bg-neon glow-neon"
                      : inMonth
                      ? "bg-black/55 group-hover:bg-black/70"
                      : "border border-dashed border-white/35",
                  ].join(" ")}
                />
                <span
                  className={[
                    "relative text-[11px] font-semibold",
                    today
                      ? "text-neon-foreground"
                      : inMonth
                      ? "text-white"
                      : "text-white/55",
                  ].join(" ")}
                >
                  {format(d, "d")}
                </span>
                {hasAny && !today && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <span
                      className={[
                        "w-1 h-1 rounded-full",
                        hasOverdue
                          ? "bg-destructive"
                          : allDone
                          ? "bg-white/60"
                          : "bg-neon",
                      ].join(" ")}
                    />
                    {meta?.hasProject && <span className="w-1 h-1 rounded-full bg-electric" />}
                    {meta?.hasNote && <span className="w-1 h-1 rounded-full bg-white/50" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <Dialog open={!!openDate} onOpenChange={(o) => !o && setOpenDate(null)}>
        <DialogContent className="sm:max-w-md !bg-popover border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {openDate && format(parseISO(openDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>
              {isEmpty
                ? "Nenhuma atividade neste dia."
                : `${doneCount}/${dayTasks.length} tarefas · ${dayProjects.length} projetos · ${dayNotes.length} notas`}
            </DialogDescription>
          </DialogHeader>

          {isEmpty ? (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-8 h-8 opacity-50" />
              <p className="text-xs">Nenhuma atividade neste dia.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide"
            >
              {dayTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                    Tarefas
                  </p>
                  <ul className="space-y-1.5">
                    {dayTasks.map((t) => {
                      const overdue = !t.completed && openDate! < todayStr;
                      return (
                        <li
                          key={t.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-card-soft/60 hover:bg-card-soft transition-colors"
                        >
                          <button
                            onClick={() => toggleTask(t.id)}
                            className="shrink-0"
                            aria-label="Alternar conclusão"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-neon" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                t.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `${CATEGORY_META[t.category].color}30`,
                                  color: CATEGORY_META[t.category].color,
                                }}
                              >
                                {CATEGORY_META[t.category].label}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `${PRIORITY_META[t.priority].color}30`,
                                  color: PRIORITY_META[t.priority].color,
                                }}
                              >
                                {PRIORITY_META[t.priority].label}
                              </span>
                              {t.startTime && (
                                <span className="text-[10px] text-muted-foreground">
                                  {t.startTime}
                                  {t.endTime ? `–${t.endTime}` : ""}
                                </span>
                              )}
                              {overdue && (
                                <span className="text-[10px] text-destructive flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> atrasada
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {dayProjects.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                    Projetos com prazo
                  </p>
                  <ul className="space-y-1.5">
                    {dayProjects.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-card-soft/60"
                      >
                        <FolderKanban className="w-4 h-4 text-electric shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {STATUS_META[p.status].label}
                            {p.client ? ` · ${p.client}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dayNotes.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">
                    Notas
                  </p>
                  <ul className="space-y-1.5">
                    {dayNotes.map((n) => (
                      <li
                        key={n.id}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-card-soft/60"
                      >
                        <StickyNote className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {n.content && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {n.content}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              className="bg-neon text-neon-foreground hover:brightness-110 rounded-full h-8 text-xs"
              onClick={() => setTaskModal(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Nova tarefa
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full h-8 text-xs"
              onClick={() => setProjectModal(true)}
            >
              <FolderKanban className="w-3 h-3 mr-1" /> Novo projeto
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-8 text-xs ml-auto"
              onClick={() => setOpenDate(null)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TaskModal open={taskModal} onOpenChange={setTaskModal} defaultDate={openDate ?? undefined} />
      <ProjectModal
        open={projectModal}
        onOpenChange={setProjectModal}
        defaultDeadline={openDate ?? undefined}
      />
    </>
  );
}
