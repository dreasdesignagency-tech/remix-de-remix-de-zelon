import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Coffee, Pencil, Trash2,
  Copy, CheckCircle2, Circle, X, Clock, Briefcase, User as UserIcon,
  Filter, TrendingUp, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/TaskModal";
import { EventModal } from "@/components/EventModal";
import { QuickEventPopover } from "@/components/QuickEventPopover";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CATEGORY_META, EVENT_CATEGORY_META, type Task, type EventCategory, type Category, type EventItem } from "@/lib/types";

const EVENT_TO_CAT: Record<EventCategory, Category> = {
  reuniao: "project", chamada: "project", entrega: "project", prazo: "project",
  evento: "personal", foco: "project", pessoal: "personal", outro: "personal",
};

function eventToTask(e: EventItem): Task {
  return {
    id: `evt-${e.id}`,
    title: e.title,
    description: e.description,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    category: EVENT_TO_CAT[e.category],
    priority: e.priority,
    completed: false,
    projectId: e.projectId,
    clientId: e.clientId,
    createdAt: e.createdAt,
  };
}

function isEventItem(t: Task) {
  return t.id.startsWith("evt-");
}

function itemColor(t: Task, eventCatMap: Map<string, EventCategory>, eventColorMap: Map<string, string | undefined>) {
  if (isEventItem(t)) {
    const override = eventColorMap.get(t.id);
    if (override) return override;
    const cat = eventCatMap.get(t.id);
    if (cat) return EVENT_CATEGORY_META[cat].color;
  }
  return CATEGORY_META[t.category].color;
}

function getItemLabel(t: Task, _eventCatMap: Map<string, EventCategory>) {
  if (isEventItem(t)) return "Evento";
  return "Tarefa";
}

import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Agenda — Zelon" }] }),
});

type View = "day" | "week" | "month";

const HOUR_START = 0;
const HOUR_END = 23;
const HOUR_PX = 56;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function toMin(t?: string) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function CalendarPage() {
  const tasks = useApp((s) => s.tasks);
  const events = useApp((s) => s.events);
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);
  const toggleTask = useApp((s) => s.toggleTask);
  const deleteTask = useApp((s) => s.deleteTask);
  const addTask = useApp((s) => s.addTask);

  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [filter, setFilter] = useState<"all" | keyof typeof CATEGORY_META>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [editing, setEditing] = useState<Task | null>(null);
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [dayOverview, setDayOverview] = useState<Date | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const didInitDate = useRef(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("flow-calendar-date");
      if (saved) {
        const d = parseISO(saved);
        if (!Number.isNaN(d.getTime())) { setSelected(d); setCursor(d); }
        sessionStorage.removeItem("flow-calendar-date");
        didInitDate.current = true;
      }
    } catch {}
  }, []);

  // Auto-jump to the nearest date with content so users see something on open.
  useEffect(() => {
    if (didInitDate.current) return;
    if (tasks.length === 0 && events.length === 0) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dates: string[] = [];
    tasks.forEach((t) => { if (t.date) dates.push(t.date); });
    events.forEach((e) => { if (e.date) dates.push(e.date); });
    if (dates.length === 0) { didInitDate.current = true; return; }
    const upcoming = dates.filter((d) => d >= todayStr).sort();
    const past = dates.filter((d) => d < todayStr).sort();
    const target = upcoming[0] ?? past[past.length - 1];
    if (target) {
      const d = parseISO(target);
      if (!Number.isNaN(d.getTime())) { setSelected(d); setCursor(d); }
    }
    didInitDate.current = true;
  }, [tasks, events]);

  useEffect(() => {
    if (!timelineRef.current) return;
    const key = format(selected, "yyyy-MM-dd");
    const items = tasksByDay.get(key) ?? [];
    const times = items
      .map((t) => toMin(t.startTime))
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    const targetMin = times[0] ?? (now.getHours() * 60 + now.getMinutes());
    const offset = ((targetMin - HOUR_START * 60) / 60) * HOUR_PX - 80;
    timelineRef.current.scrollTop = Math.max(0, offset);
  }, [view, selected, tasksByDay]); // eslint-disable-line

  const eventCatMap = useMemo(() => {
    const m = new Map<string, EventCategory>();
    events.forEach((e) => m.set(`evt-${e.id}`, e.category));
    return m;
  }, [events]);
  const eventColorMap = useMemo(() => {
    const m = new Map<string, string | undefined>();
    events.forEach((e) => m.set(`evt-${e.id}`, e.color));
    return m;
  }, [events]);
  const eventById = useMemo(() => {
    const m = new Map<string, EventItem>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const allItems = useMemo(() => [...tasks, ...events.map(eventToTask)], [tasks, events]);

  const filteredTasks = useMemo(
    () => (filter === "all" ? allItems : allItems.filter((t) => t.category === filter)),
    [allItems, filter]
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach((t) => {
      if (!t.date) return;
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return map;
  }, [filteredTasks]);

  const monthDays = useMemo(() => {
    const s = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const e = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: s, end: e });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(selected, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [selected]);

  const selectedStr = format(selected, "yyyy-MM-dd");
  const dayTasks = (tasksByDay.get(selectedStr) ?? [])
    .sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));

  // --- metrics ---
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayList = tasks.filter((t) => t.date === todayStr);
  const next7Days = useMemo(() => {
    const end = addDays(new Date(), 7);
    return tasks.filter((t) => {
      if (!t.date) return false;
      const d = parseISO(t.date);
      return d >= new Date() && d <= end;
    });
  }, [tasks]);
  const overdue = tasks.filter((t) => t.date && t.date < todayStr && !t.completed);
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const plannedHrs = useMemo(() => {
    return tasks.reduce((acc, t) => {
      const a = toMin(t.startTime), b = toMin(t.endTime);
      if (a != null && b != null && b > a) return acc + (b - a) / 60;
      return acc;
    }, 0);
  }, [tasks]);
  const doneHrs = useMemo(() => {
    return tasks.filter((t) => t.completed).reduce((acc, t) => {
      const a = toMin(t.startTime), b = toMin(t.endTime);
      if (a != null && b != null && b > a) return acc + (b - a) / 60;
      return acc;
    }, 0);
  }, [tasks]);

  const headerTitle = view === "month"
    ? format(cursor, "MMMM 'de' yyyy", { locale: ptBR })
    : view === "week"
      ? `${format(weekDays[0], "d MMM", { locale: ptBR })} – ${format(weekDays[6], "d MMM yyyy", { locale: ptBR })}`
      : format(selected, "EEEE, d 'de' MMMM", { locale: ptBR });

  const goPrev = () => {
    if (view === "month") setCursor(subMonths(cursor, 1));
    else if (view === "week") setSelected(subWeeks(selected, 1));
    else setSelected(addDays(selected, -1));
  };
  const goNext = () => {
    if (view === "month") setCursor(addMonths(cursor, 1));
    else if (view === "week") setSelected(addWeeks(selected, 1));
    else setSelected(addDays(selected, 1));
  };
  const goToday = () => { const t = new Date(); setSelected(t); setCursor(t); };


  const openCreate = (preset?: { date?: string }) => {
    setEditing(null);
    setPresetDate(preset?.date ?? selectedStr);
    setModalOpen(true);
  };

  const [preview, setPreview] = useState<Task | null>(null);

  const handlePickItem = (t: Task) => {
    setPreview(t);
  };

  const handleEditFromPreview = () => {
    if (!preview) return;
    if (isEventItem(preview)) {
      const ev = eventById.get(preview.id.slice(4));
      if (ev) { setEditingEvent(ev); setEventOpen(true); }
    } else {
      setEditing(preview);
      setModalOpen(true);
    }
    setPreview(null);
  };

  const openNewEvent = () => { setEditingEvent(null); setEventOpen(true); };
  const getColor = (t: Task) => itemColor(t, eventCatMap, eventColorMap);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => openCreate({ date: selectedStr })}
        size="sm"
        variant="ghost"
        className="rounded-full h-9 text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1" /> Nova tarefa
      </Button>
      <QuickEventPopover defaultDate={selectedStr}>
        <Button
          size="sm"
          className="bg-electric text-white hover:brightness-110 rounded-full h-9 text-xs glow-electric"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo evento
        </Button>
      </QuickEventPopover>
    </div>
  );


  return (
    <AppLayout title="Agenda" subtitle="Planeje seus dias com clareza" actions={headerActions}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 rounded-full glass-card text-xs font-medium hover:text-electric transition-colors">Hoje</button>
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover:text-electric transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover:text-electric transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-sm md:text-base font-semibold capitalize ml-1">{headerTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 p-1 rounded-full glass-card">
            <button onClick={() => setFilter("all")} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${filter === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              <Filter className="w-3 h-3 inline mr-1" />Todos
            </button>
            {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${filter === k ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
                style={filter === k ? { background: CATEGORY_META[k].color } : undefined}
              >
                {CATEGORY_META[k].label}
              </button>
            ))}
          </div>
          {/* View switch */}
          <div className="flex items-center gap-1 p-1 rounded-full glass-card">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-colors ${view === v ? "bg-electric text-white glow-electric" : "text-muted-foreground hover:text-foreground"}`}
              >
                {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 min-h-0">
        {/* LEFT SIDEBAR */}
        <aside className="space-y-3">
          {/* Mini calendar */}
          <div className="glass-card rounded-3xl p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-semibold capitalize">{format(cursor, "MMMM yyyy", { locale: ptBR })}</h3>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-1 rounded-md hover:bg-card-soft"><ChevronLeft className="w-3 h-3" /></button>
                <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-1 rounded-md hover:bg-card-soft"><ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[9px] font-semibold text-muted-foreground mb-1">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (<div key={i} className="text-center">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {monthDays.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const isSel = isSameDay(d, selected);
                const inMonth = isSameMonth(d, cursor);
                const has = (tasksByDay.get(key)?.length ?? 0) > 0;
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setSelected(d); if (view === "month") setView("day"); }}
                    className={`aspect-square rounded-full text-[10px] font-medium flex items-center justify-center relative transition-all ${
                      isSel ? "bg-electric text-white glow-electric"
                      : isToday(d) ? "ring-1 ring-electric text-foreground"
                      : inMonth ? "text-foreground hover:bg-card-soft"
                      : "text-muted-foreground/40 hover:bg-card-soft/40"
                    }`}
                  >
                    {format(d, "d")}
                    {has && !isSel && (<span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-neon" />)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day summary */}
          <div className="glass-card rounded-3xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-electric/15 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-electric" />
              </div>
              <div>
                <p className="text-sm font-semibold">{isToday(selected) ? "Hoje" : format(selected, "d MMM", { locale: ptBR })}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{format(selected, "EEEE", { locale: ptBR })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Mini label="Tarefas" value={dayTasks.length} />
              <Mini label="Concluídas" value={dayTasks.filter(t => t.completed).length} />
            </div>
            {dayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-card-soft/60 flex items-center justify-center mb-2"><Coffee className="w-4 h-4 text-muted-foreground" /></div>
                <p className="text-[11px] font-medium">Dia livre</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-hide">
                {dayTasks.slice(0, 8).map((t) => (
                  <button key={t.id} onClick={() => handlePickItem(t)} className="w-full flex items-center gap-2 text-[11px] text-left p-1.5 rounded-lg hover:bg-card-soft transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: itemColor(t, eventCatMap, eventColorMap) }} />
                    {t.startTime && <span className="text-muted-foreground tabular-nums">{t.startTime}</span>}
                    <span className={`truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="glass-card rounded-3xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-3">LEGENDA</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((k) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_META[k].color }} />
                  <span>{CATEGORY_META[k].label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN VIEW */}
        <section className="glass-card rounded-3xl overflow-hidden flex flex-col min-h-[640px]">
          {view === "month" && (
            <MonthView
              cursor={cursor}
              days={monthDays}
              selected={selected}
              tasksByDay={tasksByDay}
              onPick={(d) => { setSelected(d); setDayOverview(d); }}
              getColor={getColor}
              eventCatMap={eventCatMap}
            />
          )}
          {view === "week" && (
            <WeekTimeline
              days={weekDays}
              tasksByDay={tasksByDay}
              selected={selected}
              onPickDay={(d) => setSelected(d)}
              onPickTask={handlePickItem}
              onCreateAt={(date) => openCreate({ date })}
              timelineRef={timelineRef}
              getColor={getColor}
              eventCatMap={eventCatMap}
            />
          )}
          {view === "day" && (
            <WeekTimeline
              days={[selected]}
              tasksByDay={tasksByDay}
              selected={selected}
              onPickDay={(d) => setSelected(d)}
              onPickTask={handlePickItem}
              onCreateAt={(date) => openCreate({ date })}
              timelineRef={timelineRef}
              getColor={getColor}
              eventCatMap={eventCatMap}
            />
          )}
        </section>
      </div>

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editing} defaultDate={presetDate ?? selectedStr} />
      <EventModal
        open={eventOpen}
        onOpenChange={(v) => { setEventOpen(v); if (!v) setEditingEvent(null); }}
        event={editingEvent}
        defaults={editingEvent ? undefined : { date: selectedStr, category: "reuniao", priority: "medium", reminders: ["1h"] }}
      />


      {/* QUICK PREVIEW (title + description + edit) */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-md overflow-hidden">
          {preview && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: getColor(preview) }}
                  />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    {getItemLabel(preview, eventCatMap)}
                  </span>
                </div>
                <DialogTitle className="text-lg leading-tight pr-8 break-words [overflow-wrap:anywhere]">{preview.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {(preview.date || preview.startTime) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {preview.date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(parseISO(preview.date), "d 'de' MMM yyyy", { locale: ptBR })}
                      </span>
                    )}
                    {preview.startTime && (
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {preview.startTime}{preview.endTime ? ` – ${preview.endTime}` : ""}
                      </span>
                    )}
                  </div>
                )}
                {preview.description ? (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
                    {preview.description}
                  </p>

                ) : (
                  <p className="text-sm text-muted-foreground italic">Sem descrição</p>
                )}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleEditFromPreview}
                    size="sm"
                    className="bg-electric text-white hover:brightness-110 rounded-full"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Excluir evento?"
        onConfirm={() => { if (deleteId) { deleteTask(deleteId); toast.success("Evento excluído"); setDeleteId(null); setDetail(null); } }}
      />

      {/* RIGHT SIDE PANEL */}
      <EventDetailPanel
        task={detail}
        onClose={() => setDetail(null)}
        projects={projects}
        clients={clients}
        onToggle={(id) => toggleTask(id)}
        onEdit={(t) => { setEditing(t); setModalOpen(true); setDetail(null); }}
        onDuplicate={(t) => {
          const { id: _id, createdAt: _c, completed: _done, ...rest } = t;
          addTask({ ...rest, completed: false });
          toast.success("Evento duplicado");
        }}
        onDelete={(id) => setDeleteId(id)}
      />

      {/* DAY OVERVIEW MODAL */}
      <DayOverviewModal
        date={dayOverview}
        onClose={() => setDayOverview(null)}
        tasks={tasks}
        projects={projects}
        onOpenTask={(t) => { setDayOverview(null); setPreview(t); }}
      />
    </AppLayout>
  );
}

// ---------- Metric card ----------
function MetricCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent: "electric" | "neon" | "danger" }) {
  const accentClass =
    accent === "electric" ? "bg-electric/15 text-electric"
    : accent === "neon" ? "bg-neon/15 text-neon"
    : "bg-[oklch(0.65_0.22_25)]/15 text-[oklch(0.65_0.22_25)]";
  return (
    <div className="glass-card rounded-2xl p-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase truncate">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card-soft/50 p-2 text-center">
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground tracking-wider uppercase mt-1">{label}</p>
    </div>
  );
}

// ---------- Week / Day Timeline ----------
interface WeekTimelineProps {
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  selected: Date;
  onPickDay: (d: Date) => void;
  onPickTask: (t: Task) => void;
  onCreateAt: (date: string) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  getColor: (t: Task) => string;
  eventCatMap: Map<string, EventCategory>;
}

function WeekTimeline({ days, tasksByDay, selected, onPickDay, onPickTask, onCreateAt, timelineRef, getColor, eventCatMap }: WeekTimelineProps) {
  const hasAllDay = days.some((d) => (tasksByDay.get(format(d, "yyyy-MM-dd")) ?? []).some((t) => !t.startTime));
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="grid border-b border-border/40" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => {
          const isSel = isSameDay(d, selected);
          const today = isToday(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-card-soft/40 transition-colors"
            >
              <span className={`text-[9px] font-semibold tracking-widest uppercase ${isSel || today ? "text-electric" : "text-muted-foreground"}`}>
                {format(d, "EEE", { locale: ptBR })}
              </span>
              <span className={`text-base font-semibold w-9 h-9 rounded-full flex items-center justify-center ${
                isSel ? "bg-electric text-white glow-electric"
                : today ? "text-electric" : "text-foreground"
              }`}>
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {hasAllDay && (
        <div className="grid border-b border-border/40 bg-card-soft/20" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
          <div className="flex items-start justify-end pr-2 pt-1.5">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground">Dia</span>
          </div>
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const allDay = (tasksByDay.get(key) ?? []).filter((t) => !t.startTime);
            return (
              <div key={d.toISOString()} className="border-l border-border/30 p-1 space-y-0.5 min-h-[28px] max-h-24 overflow-y-auto scrollbar-hide">
                {allDay.map((t) => {
                  const color = getColor(t);
                  return (
                    <button
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); onPickTask(t); }}
                      className="w-full text-left text-[10px] truncate px-1.5 py-0.5 rounded text-white hover:brightness-110 transition flex items-center gap-1"
                      style={{ background: color }}
                      title={`${getItemLabel(t, eventCatMap)}: ${t.title}`}
                    >
                      <span className="text-[8px] px-1 rounded bg-black/25 font-medium shrink-0">{getItemLabel(t, eventCatMap)}</span>
                      <span className={t.completed ? "line-through opacity-80 truncate" : "truncate"}>{t.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}


      <div ref={timelineRef} className="flex-1 overflow-y-auto scrollbar-hide relative">
        <div className="grid relative" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="relative">
                <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground tabular-nums">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const list = tasksByDay.get(key) ?? [];
            const today = isToday(d);
            return (
              <div key={d.toISOString()} className="relative border-l border-border/30">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    style={{ height: HOUR_PX }}
                    onClick={() => onCreateAt(key)}
                    className="w-full border-b border-border/20 hover:bg-electric/5 transition-colors block"
                  />
                ))}

                {list.map((t) => {
                  const startM = toMin(t.startTime);
                  if (startM == null) return null;
                  const endM = toMin(t.endTime) ?? startM + 60;
                  const minTop = 0;
                  const maxBottom = (HOUR_END - HOUR_START + 1) * HOUR_PX;
                  const rawTop = ((startM - HOUR_START * 60) / 60) * HOUR_PX;
                  const rawBottom = ((endM - HOUR_START * 60) / 60) * HOUR_PX;
                  const top = Math.max(minTop, rawTop);
                  const bottom = Math.min(maxBottom, rawBottom);
                  const height = Math.max(28, bottom - top - 2);
                  const color = getColor(t);
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={(e) => { e.stopPropagation(); onPickTask(t); }}
                      className="absolute left-1 right-1 rounded-2xl p-2 text-left overflow-hidden z-10 border transition-all hover:scale-[1.02] hover:z-30 text-white"
                      style={{
                        top, height, background: color,
                        borderColor: `color-mix(in oklab, ${color} 70%, black)`,
                        boxShadow: `0 6px 18px color-mix(in oklab, ${color} 35%, transparent)`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 overflow-hidden">
                        <span className="text-[8px] px-1 py-0.5 rounded bg-black/25 text-white font-medium shrink-0">
                          {getItemLabel(t, eventCatMap)}
                        </span>
                        <span className="text-[9px] text-white/85 tabular-nums font-medium truncate">
                          {t.startTime}{t.endTime ? `–${t.endTime}` : ""}
                        </span>
                      </div>
                      <p className={`text-xs font-semibold leading-tight line-clamp-2 ${t.completed ? "line-through opacity-70" : ""}`}>{t.title}</p>
                      {height > 60 && t.description && (<p className="text-[10px] text-white/80 mt-1 line-clamp-2">{t.description}</p>)}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Month View ----------
function MonthView({ cursor, days, selected, tasksByDay, onPick, getColor, eventCatMap }: { cursor: Date; days: Date[]; selected: Date; tasksByDay: Map<string, Task[]>; onPick: (d: Date) => void; getColor: (t: Task) => string; eventCatMap: Map<string, EventCategory> }) {
  return (
    <div className="flex flex-col h-full p-3">
      <div className="grid grid-cols-7 text-[10px] font-semibold text-muted-foreground tracking-widest mb-2 px-2">
        {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d) => (<div key={d} className="text-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const list = tasksByDay.get(key) ?? [];
          const isSel = isSameDay(d, selected);
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPick(d)}
              className={`rounded-2xl p-2 flex flex-col gap-1 text-left transition-all border ${
                isSel ? "bg-electric/15 border-electric glow-electric"
                : today ? "bg-card-soft/60 border-electric/40"
                : inMonth ? "bg-card-soft/30 border-transparent hover:bg-card-soft/60"
                : "bg-transparent border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <span className={`text-xs font-semibold ${today ? "text-electric" : ""}`}>{format(d, "d")}</span>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {list.slice(0, 3).map((t) => {
                  const color = getColor(t);
                  return (
                    <div key={t.id} className="text-[9px] truncate px-1.5 py-0.5 rounded text-white flex items-center gap-1" style={{ background: color }}>
                      <span className="text-[8px] px-1 rounded bg-black/25 font-medium shrink-0">{getItemLabel(t, eventCatMap)}</span>
                      {t.startTime && <span className="opacity-80 mr-1">{t.startTime}</span>}
                      <span className="truncate">{t.title}</span>
                    </div>
                  );
                })}
                {list.length > 3 && (<div className="text-[9px] text-muted-foreground px-1.5">+{list.length - 3}</div>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Event Detail Side Panel ----------
function EventDetailPanel({
  task, onClose, projects, clients, onToggle, onEdit, onDuplicate, onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  onToggle: (id: string) => void;
  onEdit: (t: Task) => void;
  onDuplicate: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const project = task?.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const client = task?.clientId ? clients.find((c) => c.id === task.clientId) : undefined;
  const color = task ? CATEGORY_META[task.category].color : undefined;

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-popover border-l border-border z-50 shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{CATEGORY_META[task.category].label}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-card-soft flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <h3 className={`text-xl font-bold leading-tight ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                {task.description && (<p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{task.description}</p>)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoTile icon={<CalendarDays className="w-3.5 h-3.5" />} label="Data" value={task.date ? format(parseISO(task.date), "d MMM yyyy", { locale: ptBR }) : "—"} />
                <InfoTile icon={<Clock className="w-3.5 h-3.5" />} label="Horário" value={task.startTime ? `${task.startTime}${task.endTime ? ` – ${task.endTime}` : ""}` : "—"} />
                <InfoTile icon={<UserIcon className="w-3.5 h-3.5" />} label="Cliente" value={client?.name ?? "—"} />
                <InfoTile icon={<Briefcase className="w-3.5 h-3.5" />} label="Projeto" value={project?.name ?? "—"} />
              </div>

              <button
                onClick={() => onToggle(task.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-card-soft hover:bg-card-soft/70 text-sm font-medium transition-colors"
              >
                {task.completed ? <><CheckCircle2 className="w-4 h-4 text-electric" /> Concluído</> : <><Circle className="w-4 h-4" /> Marcar como concluído</>}
              </button>
            </div>

            <div className="p-4 border-t border-border grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="rounded-full">
                <Pencil className="w-3.5 h-3.5 mr-1" />Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDuplicate(task)} className="rounded-full">
                <Copy className="w-3.5 h-3.5 mr-1" />Duplicar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(task.id)} className="rounded-full text-[oklch(0.65_0.22_25)] hover:text-[oklch(0.65_0.22_25)]">
                <Trash2 className="w-3.5 h-3.5 mr-1" />Excluir
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card-soft/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[9px] font-semibold tracking-widest uppercase">{label}</span></div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

// ---------- Day Overview Modal ----------
function DayOverviewModal({
  date, onClose, tasks, projects, onOpenTask,
}: {
  date: Date | null;
  onClose: () => void;
  tasks: Task[];
  projects: { id: string; name: string }[];
  onOpenTask: (t: Task) => void;
}) {
  if (!date) return null;
  const key = format(date, "yyyy-MM-dd");
  const list = tasks.filter((t) => t.date === key).sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));
  const done = list.filter((t) => t.completed);
  const pending = list.filter((t) => !t.completed);
  const minutes = list.reduce((acc, t) => {
    const a = toMin(t.startTime), b = toMin(t.endTime);
    if (a != null && b != null && b > a) return acc + (b - a);
    return acc;
  }, 0);
  const relatedProjectIds = Array.from(new Set(list.map((t) => t.projectId).filter(Boolean) as string[]));
  const relatedProjects = projects.filter((p) => relatedProjectIds.includes(p.id));

  return (
    <Dialog open={!!date} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{format(date, "d 'de' MMMM, yyyy", { locale: ptBR })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Mini label="Total" value={list.length} />
            <Mini label="Concluídas" value={done.length} />
            <Mini label="Pendentes" value={pending.length} />
          </div>

          {list.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Nenhum evento neste dia</div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {list.map((t) => {
                const color = CATEGORY_META[t.category].color;
                return (
                  <button key={t.id} onClick={() => onOpenTask(t)} className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-card-soft text-left transition-colors">
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-electric shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    {t.startTime && <span className="text-[11px] text-muted-foreground tabular-nums w-24 shrink-0">{t.startTime}{t.endTime ? ` – ${t.endTime}` : ""}</span>}
                    <span className={`text-sm flex-1 truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {relatedProjects.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground tracking-widest mb-2">PROJETOS RELACIONADOS</p>
              <div className="flex flex-wrap gap-1.5">
                {relatedProjects.map((p) => (
                  <span key={p.id} className="text-[11px] px-2 py-1 rounded-full bg-card-soft">{p.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Tempo produtivo</span>
            <span className="text-base font-bold text-electric">{(minutes / 60).toFixed(1)}h</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}