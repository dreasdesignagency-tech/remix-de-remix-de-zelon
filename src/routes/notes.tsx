import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, Search, Pin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteModal } from "@/components/NoteModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostItCard } from "@/components/PostItCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Note } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Anotações — Zelon" }] }),
});

function NotesPage() {
  const notes = useApp((s) => s.notes);
  const togglePin = useApp((s) => s.togglePinNote);
  const deleteNote = useApp((s) => s.deleteNote);

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const visibleNotes = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
        )
      : notes;
    return [...list].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
    );
  }, [notes, query]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="Anotações"
      subtitle="Suas ideias em post-its"
      actions={
        <Button
          onClick={openNew}
          className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full text-xs h-9"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar anotação..."
            className="bg-transparent outline-none text-xs w-full"
          />
        </div>

        {visibleNotes.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <p className="text-sm text-muted-foreground">
              Sem anotações ainda. Crie sua primeira nota.
            </p>
            <Button onClick={openNew} variant="ghost" className="mt-3">
              <Plus className="w-4 h-4 mr-1" /> Criar anotação
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10 pt-4 px-2">
            {visibleNotes.map((n, idx) => (
              <PostItCard
                key={n.id}
                title={n.title || "Sem título"}
                subtitle={n.tags.length > 0 ? n.tags.map((t) => `#${t}`).join(" ") : undefined}
                description={n.content || undefined}
                meta={format(n.updatedAt, "dd MMM yyyy", { locale: ptBR })}
                variant={idx}
                onClick={() => openEdit(n)}
                actions={
                  <>
                    <button
                      onClick={() => togglePin(n.id)}
                      className="p-1 rounded hover:bg-background/40"
                      aria-label="Fixar"
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${n.pinned ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => openEdit(n)}
                      className="p-1 rounded hover:bg-background/40"
                      aria-label="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(n.id)}
                      className="p-1 rounded hover:bg-background/40 text-destructive"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      <NoteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        note={editing}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Excluir anotação?"
        onConfirm={() => {
          if (deleteId) {
            deleteNote(deleteId);
            toast.success("Anotação excluída");
            setDeleteId(null);
          }
        }}
      />
    </AppLayout>
  );
}
