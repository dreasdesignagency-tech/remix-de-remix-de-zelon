import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
  defaultDeadline?: string;
}

export function ProjectModal({ open, onOpenChange, project, defaultDeadline }: Props) {
  const addProject = useApp((s) => s.addProject);
  const updateProject = useApp((s) => s.updateProject);

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setClient(project?.client ?? "");
      setDescription(project?.description ?? "");
      setStatus(project?.status ?? "idea");
      setDeadline(project?.deadline ?? defaultDeadline ?? "");
    }
  }, [open, project, defaultDeadline]);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Adicione um nome para o projeto");
      return;
    }
    const data = {
      name: name.trim(),
      client: client.trim() || undefined,
      description: description.trim() || undefined,
      status,
      deadline: deadline || undefined,
    };
    if (project) {
      updateProject(project.id, data);
      toast.success("Projeto atualizado");
    } else {
      addProject(data);
      toast.success("Projeto criado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-popover border-border shadow-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Editar projeto" : "Novo projeto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Rebrand Acme" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Cliente</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-neon text-neon-foreground hover:brightness-110">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
