import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Circle, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/TaskModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { format, parseISO, isToday } from "date-fns";
import { CATEGORY_META, PRIORITY_META, type Task } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tarefas — Zelon" }] }),
});

type Filter = "all" | "today" | "pending" | "done" | "client" | "personal" | "project";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "today", label: "Hoje" },
  { key: "pending", label: "Pendentes" },
  { key: "done", label: "Concluídas" },
  { key: "client", label: "Cliente" },
  { key: "personal", label: "Pessoal" },
  { key: "project", label: "Projeto" },
];

function TasksPage() {
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const deleteTask = useApp((s) => s.deleteTask);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return tasks
      .filter((t) => {
        if (filter === "today") return t.date === todayStr;
        if (filter === "pending") return !t.completed;
        if (filter === "done") return t.completed;
        if (["client", "personal", "project"].includes(filter)) return t.category === filter;
        return true;
      })
      .filter((t) => !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.description?.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, filter, query]);

  return (
    <AppLayout
      title="Tarefas"
      subtitle="Organize e conclua seu dia"
      actions={
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full text-xs h-9">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tarefa..." className="bg-transparent outline-none text-xs w-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`relative px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${filter === f.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {filter === f.key && <motion.span layoutId="task-filter" className="absolute inset-0 rounded-full bg-card-soft border border-border" />}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }} variant="ghost" className="mt-3">
              <Plus className="w-4 h-4 mr-1" /> Criar tarefa
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => (
              <motion.li key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-3 flex items-center gap-3 group">
                <button onClick={() => toggleTask(t.id)} className="shrink-0">
                  {t.completed ? <CheckCircle2 className="w-5 h-5 text-neon" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${CATEGORY_META[t.category].color}30`, color: CATEGORY_META[t.category].color }}>
                      {CATEGORY_META[t.category].label}
                    </span>
                    {t.date && (
                      <span className={`text-[10px] ${isToday(parseISO(t.date)) ? "text-neon" : "text-muted-foreground"}`}>
                        {format(parseISO(t.date), "dd/MM")}{t.startTime ? ` · ${t.startTime}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <span className="w-1 h-6 rounded-full" style={{ background: PRIORITY_META[t.priority].color }} title={PRIORITY_META[t.priority].label} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(t); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-card-soft"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-card-soft text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editing} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Excluir tarefa?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => { if (deleteId) { deleteTask(deleteId); toast.success("Tarefa excluída"); setDeleteId(null); } }}
      />
    </AppLayout>
  );
}
