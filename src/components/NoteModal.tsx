import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import type { Note } from "@/lib/types";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { EventModal } from "@/components/EventModal";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  note?: Note | null;
  defaultTag?: string;
}

export function NoteModal({ open, onOpenChange, note, defaultTag }: Props) {
  const addNote = useApp((s) => s.addNote);
  const updateNote = useApp((s) => s.updateNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);


  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      setTags(note?.tags.join(", ") ?? (defaultTag ?? ""));
    }
  }, [open, note, defaultTag]);


  const submit = () => {
    if (!title.trim()) {
      toast.error("Adicione um título");
      return;
    }
    const data = {
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (note) {
      updateNote(note.id, data);
      toast.success("Anotação atualizada");
    } else {
      addNote(data);
      toast.success("Anotação criada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-popover border-border shadow-2xl max-w-xl">
        <DialogHeader>
          <DialogTitle>{note ? "Editar anotação" : "Nova anotação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ideia de logo" />
          </div>
          <div>
            <Label className="text-xs">Conteúdo</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Escreva aqui..." />
          </div>
          <div>
            <Label className="text-xs">Tags (separadas por vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="design, brand, ideia" />
          </div>
        </div>
        <DialogFooter className="!justify-between">
          <div>
            {note && (
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
      {note && (
        <EventModal
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          defaults={{
            title: note.title,
            description: note.content.slice(0, 500),
            noteId: note.id,
            category: "reuniao",
            priority: "medium",
            reminders: ["1h"],
          }}
        />
      )}
    </Dialog>

  );
}
