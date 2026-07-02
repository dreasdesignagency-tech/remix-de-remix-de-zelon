import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { addDays, format, startOfDay } from "date-fns";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MAX_PER_DAY = 10;
const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

interface Props {
  className?: string;
  label?: string;
}

export function OrganizeWeekButton({ className, label = "Organizar minha semana" }: Props) {
  const tasks = useApp((s) => s.tasks);
  const events = useApp((s) => s.events);
  const updateTask = useApp((s) => s.updateTask);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // Candidates: uncompleted tasks that are either undated OR overdue
  const candidates = tasks
    .filter((t) => !t.completed)
    .filter((t) => !t.date || t.date < todayStr)
    .sort(
      (a, b) =>
        (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0) ||
        a.createdAt - b.createdAt,
    );

  // Compute plan
  const plan = (() => {
    const days: { date: string; label: string; capacity: number; assigned: string[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const used =
        tasks.filter((t) => t.date === dateStr && !t.completed && !candidates.find((c) => c.id === t.id)).length +
        events.filter((e) => e.date === dateStr).length;
      days.push({
        date: dateStr,
        label: format(d, "EEE dd/MM"),
        capacity: Math.max(0, MAX_PER_DAY - used),
        assigned: [],
      });
    }

    let idx = 0;
    for (const task of candidates) {
      // find day with lowest load and remaining capacity
      let target = -1;
      let bestLoad = Infinity;
      for (let i = 0; i < days.length; i++) {
        const d = days[(idx + i) % days.length];
        if (d.assigned.length < d.capacity && d.assigned.length < bestLoad) {
          bestLoad = d.assigned.length;
          target = (idx + i) % days.length;
        }
      }
      if (target === -1) break; // no capacity anywhere
      days[target].assigned.push(task.id);
      idx = (target + 1) % days.length;
    }
    return days;
  })();

  const totalPlanned = plan.reduce((s, d) => s + d.assigned.length, 0);
  const overflow = candidates.length - totalPlanned;

  const apply = () => {
    setBusy(true);
    for (const day of plan) {
      for (const taskId of day.assigned) {
        updateTask(taskId, { date: day.date });
      }
    }
    setBusy(false);
    setOpen(false);
    toast.success(
      `Distribuídas ${totalPlanned} ${totalPlanned === 1 ? "tarefa" : "tarefas"} na semana.`,
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "text-[11px] px-3 py-1.5 rounded-full bg-card-soft/70 hover:bg-card-soft border border-border text-foreground flex items-center gap-1.5 transition-colors"
        }
      >
        <CalendarClock className="w-3.5 h-3.5" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-electric" />
              Organizar minha semana
            </DialogTitle>
            <DialogDescription>
              Distribui tarefas pendentes ao longo dos próximos 7 dias, respeitando prioridade,
              eventos existentes e no máximo {MAX_PER_DAY} tarefas por dia.
            </DialogDescription>
          </DialogHeader>

          {candidates.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa pendente sem data para reorganizar.
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto space-y-1.5 -mx-1 px-1">
                {plan.map((d) => (
                  <div
                    key={d.date}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card-soft/50"
                  >
                    <div>
                      <p className="text-xs font-medium capitalize">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.assigned.length} nova(s) · capacidade {d.capacity}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: MAX_PER_DAY }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-4 rounded-full ${
                            i < d.assigned.length
                              ? "bg-electric"
                              : i < d.capacity
                                ? "bg-card-soft"
                                : "bg-border/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {overflow > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {overflow} {overflow === 1 ? "tarefa não coube" : "tarefas não couberam"} na
                  semana e continuarão sem data.
                </p>
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={apply}
              disabled={busy || totalPlanned === 0}
              className="bg-electric text-electric-foreground hover:brightness-110"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Aplicar distribuição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
