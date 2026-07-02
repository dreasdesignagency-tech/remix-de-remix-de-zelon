import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import type { Task, Category, Priority } from "@/lib/types";
import { CATEGORY_META, PRIORITY_META } from "@/lib/types";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { EventModal } from "@/components/EventModal";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaultDate?: string;
  defaultProjectId?: string;
}

export function TaskModal({ open, onOpenChange, task, defaultDate, defaultProjectId }: Props) {
  const addTask = useApp((s) => s.addTask);
  const updateTask = useApp((s) => s.updateTask);
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<Category>("personal");
  const [priority, setPriority] = useState<Priority>("medium");
  const [projectId, setProjectId] = useState<string>("none");
  const [clientId, setClientId] = useState<string>("none");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setDate(task?.date ?? defaultDate ?? "");
      setStartTime(task?.startTime ?? "");
      setEndTime(task?.endTime ?? "");
      setCategory(task?.category ?? "personal");
      setPriority(task?.priority ?? "medium");
      setProjectId(task?.projectId ?? defaultProjectId ?? "none");
      setClientId(task?.clientId ?? "none");
    }
  }, [open, task, defaultDate, defaultProjectId]);


  const submit = () => {
    if (!title.trim()) {
      toast.error("Adicione um título para a tarefa");
      return;
    }
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: date || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      category,
      priority,
      projectId: projectId === "none" ? undefined : projectId,
      clientId: clientId === "none" ? undefined : clientId,
    };
    if (task) {
      updateTask(task.id, data);
      toast.success("Tarefa atualizada");
    } else {
      addTask(data);
      toast.success("Tarefa criada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-popover border-border shadow-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Enviar proposta" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalhes opcionais" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Projeto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="!justify-between">
          <div>
            {task && (
              <Button variant="ghost" onClick={() => setScheduleOpen(true)} className="text-electric hover:text-electric">
                <CalendarPlus className="w-4 h-4 mr-1" /> Agendar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} className="bg-neon text-neon-foreground hover:brightness-110">Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
      {task && (
        <EventModal
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          defaults={{
            title: task.title,
            description: task.description,
            date: task.date,
            startTime: task.startTime,
            endTime: task.endTime,
            taskId: task.id,
            clientId: task.clientId,
            projectId: task.projectId,
            category: "prazo",
            priority: task.priority,
            reminders: ["1d", "1h"],
          }}
        />
      )}
    </Dialog>

  );
}
