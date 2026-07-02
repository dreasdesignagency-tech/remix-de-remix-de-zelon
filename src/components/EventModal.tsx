import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import type { EventItem, EventCategory, EventReminder, Priority } from "@/lib/types";
import { EVENT_CATEGORY_META, EVENT_REMINDER_META, PRIORITY_META } from "@/lib/types";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: EventItem | null;
  defaults?: Partial<EventItem>;
}

const REMINDER_KEYS: EventReminder[] = ["1d", "1h", "15m"];

export function EventModal({ open, onOpenChange, event, defaults }: Props) {
  const addEvent = useApp((s) => s.addEvent);
  const updateEvent = useApp((s) => s.updateEvent);
  const deleteEvent = useApp((s) => s.deleteEvent);
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);
  const tasks = useApp((s) => s.tasks);
  const notes = useApp((s) => s.notes);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("reuniao");
  const [priority, setPriority] = useState<Priority>("medium");
  const [color, setColor] = useState<string>("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [clientId, setClientId] = useState("none");
  const [projectId, setProjectId] = useState("none");
  const [taskId, setTaskId] = useState("none");
  const [noteId, setNoteId] = useState("none");
  const [reminders, setReminders] = useState<EventReminder[]>([]);

  useEffect(() => {
    if (!open) return;
    const src: Partial<EventItem> = event ?? defaults ?? {};
    setTitle(src.title ?? "");
    setDescription(src.description ?? "");
    setDate(src.date ?? "");
    setStartTime(src.startTime ?? "");
    setEndTime(src.endTime ?? "");
    setCategory((src.category as EventCategory) ?? "reuniao");
    setPriority((src.priority as Priority) ?? "medium");
    setColor(src.color ?? "");
    setLocation(src.location ?? "");
    setMeetingLink(src.meetingLink ?? "");
    setClientId(src.clientId ?? "none");
    setProjectId(src.projectId ?? "none");
    setTaskId(src.taskId ?? "none");
    setNoteId(src.noteId ?? "none");
    setReminders(src.reminders ?? []);
  }, [open, event, defaults]);

  const toggleReminder = (r: EventReminder) =>
    setReminders((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const submit = () => {
    if (!title.trim()) {
      toast.error("Adicione um título para o evento");
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
      color: color || undefined,
      location: location.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
      clientId: clientId === "none" ? undefined : clientId,
      projectId: projectId === "none" ? undefined : projectId,
      taskId: taskId === "none" ? undefined : taskId,
      noteId: noteId === "none" ? undefined : noteId,
      reminders,
    };
    if (event) {
      updateEvent(event.id, data);
      toast.success("Evento atualizado");
    } else {
      addEvent(data);
      toast.success("Evento criado");
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!event) return;
    deleteEvent(event.id);
    toast.success("Evento excluído");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-popover border-border shadow-2xl max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião de briefing" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_CATEGORY_META).map(([k, m]) => (
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tarefa relacionada</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {tasks.slice(0, 50).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Anotação relacionada</Label>
              <Select value={noteId} onValueChange={setNoteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {notes.slice(0, 50).map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Local</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço, sala..." />
            </div>
            <div>
              <Label className="text-xs">Link da reunião</Label>
              <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <Label className="text-xs">Cor</Label>
              <Input
                type="color"
                value={color || "#7c5cff"}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 p-1 cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs">Lembretes</Label>
              <div className="flex gap-1.5 mt-1.5">
                {REMINDER_KEYS.map((r) => {
                  const active = reminders.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleReminder(r)}
                      className={[
                        "px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
                        active
                          ? "bg-electric text-electric-foreground border-transparent"
                          : "bg-card-soft/60 text-muted-foreground border-border hover:text-foreground",
                      ].join(" ")}
                    >
                      {EVENT_REMINDER_META[r].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="!justify-between">
          <div>
            {event && (
              <Button variant="ghost" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} className="bg-neon text-neon-foreground hover:brightness-110">Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
