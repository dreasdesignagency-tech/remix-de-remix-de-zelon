import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pin, PinOff, Pencil, Trash2, Search, FolderOpen, Folder, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteModal } from "@/components/NoteModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderCard } from "@/components/FolderCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Note } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Anotações — Zelon" }] }),
});

const UNTAGGED = "__untagged__";

function NotesPage() {
  const notes = useApp((s) => s.notes);
  const togglePin = useApp((s) => s.togglePinNote);
  const deleteNote = useApp((s) => s.deleteNote);

  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [pendingTag, setPendingTag] = useState<string | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const folders = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      const key = n.tags[0]?.trim() || UNTAGGED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries())
      .map(([key, list]) => {
        const lastUpdated = Math.max(...list.map((n) => n.updatedAt));
        const sample = list.find((n) => n.content)?.content?.slice(0, 80);
        return { key, label: key === UNTAGGED ? "Sem categoria" : key, notes: list, lastUpdated, sample };
      })
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [notes]);

  const visibleFolders = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return folders;
    return folders.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.notes.some(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
        )
    );
  }, [folders, query]);

  const current = openFolder ? folders.find((f) => f.key === openFolder) : null;
  const currentNotes = useMemo(() => {
    if (!current) return [];
    return [...current.notes].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
    );
  }, [current]);

  const openNewNote = (tag?: string) => {
    setEditing(null);
    setPendingTag(tag);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="Anotações"
      subtitle="Suas ideias organizadas em pastas"
      actions={
        <Button
          onClick={() => openNewNote(undefined)}
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
            placeholder="Buscar pasta ou nota..."
            className="bg-transparent outline-none text-xs w-full"
          />
        </div>

        {visibleFolders.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <p className="text-sm text-muted-foreground">
              Sem anotações ainda. Adicione tags às suas notas para organizá-las em pastas.
            </p>
            <Button onClick={() => openNewNote(undefined)} variant="ghost" className="mt-3">
              <Plus className="w-4 h-4 mr-1" /> Criar anotação
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 pt-3">
            {visibleFolders.map((f, idx) => (
              <FolderCard
                key={f.key}
                title={f.label}
                subtitle={`${f.notes.length} ${f.notes.length === 1 ? "nota" : "notas"}`}
                description={f.sample}
                meta={`Atualizada ${format(f.lastUpdated, "dd MMM yyyy", { locale: ptBR })}`}
                icon={idx === 0 ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                accent={idx === 0}
                onClick={() => setOpenFolder(f.key)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!openFolder} onOpenChange={(v) => !v && setOpenFolder(null)}>
        <DialogContent className="!bg-popover border-border shadow-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button onClick={() => setOpenFolder(null)} className="p-1 rounded-lg hover:bg-card-soft">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <FolderOpen className="w-4 h-4" />
              {current?.label}
              <span className="text-xs text-muted-foreground font-normal">({currentNotes.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {currentNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Pasta vazia</p>
            ) : (
              currentNotes.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-3 bg-card-soft hover:bg-card-soft/70 cursor-pointer group"
                  onClick={() => {
                    setOpenFolder(null);
                    setEditing(n);
                    setPendingTag(undefined);
                    setModalOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold line-clamp-1">{n.title}</h4>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}
                        className="p-1 rounded hover:bg-background/50"
                        aria-label="Fixar"
                      >
                        {n.pinned ? (
                          <Pin className="w-3.5 h-3.5 text-neon fill-neon" />
                        ) : (
                          <PinOff className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFolder(null);
                          setEditing(n);
                          setPendingTag(undefined);
                          setModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(n.id); }}
                        className="p-1 rounded hover:bg-background/50 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                    {n.content || "Sem conteúdo"}
                  </p>
                  {n.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {n.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/60 text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {format(n.updatedAt, "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </motion.div>
              ))
            )}

            <Button
              variant="ghost"
              onClick={() => {
                const key = openFolder;
                setOpenFolder(null);
                openNewNote(key && key !== UNTAGGED ? key : undefined);
              }}
              className="w-full justify-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Nova nota nesta pasta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NoteModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setPendingTag(undefined);
        }}
        note={editing}
        defaultTag={pendingTag}
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
