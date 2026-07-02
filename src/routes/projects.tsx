import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";

import { useApp, projectProgress } from "@/lib/store";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalIcon,
  User,
  FolderOpen,
  Folder,
  ArrowLeft,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectModal } from "@/components/ProjectModal";
import { TaskModal } from "@/components/TaskModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderCard } from "@/components/FolderCard";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_META, type Project } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projetos — Zelon" }] }),
});

function ProjectsPage() {
  const projects = useApp((s) => s.projects);
  const tasks = useApp((s) => s.tasks);
  const deleteProject = useApp((s) => s.deleteProject);
  const toggleTask = useApp((s) => s.toggleTask);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const openProject = useMemo(
    () => projects.find((p) => p.id === openProjectId) ?? null,
    [projects, openProjectId]
  );
  const projectTasks = useMemo(
    () =>
      openProject
        ? tasks
            .filter((t) => t.projectId === openProject.id)
            .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt)
        : [],
    [tasks, openProject]
  );

  return (
    <AppLayout
      title="Projetos"
      subtitle="Suas pastas de projetos"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full text-xs h-9"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo
        </Button>
      }
    >
      {projects.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <p className="text-sm text-muted-foreground">
            Crie seu primeiro projeto para organizar tarefas e prazos.
          </p>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            variant="ghost"
            className="mt-3"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 pt-3">
          {projects.map((p, idx) => {
            const pct = projectProgress(p.id, tasks);
            const linkedTasks = tasks.filter((t) => t.projectId === p.id);
            const meta = STATUS_META[p.status];
            const accent = idx === 0;
            return (
              <FolderCard
                key={p.id}
                title={p.name}
                subtitle={p.client ? `Cliente: ${p.client}` : "Sem cliente"}
                description={p.description}
                icon={accent ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                accent={accent}
                onClick={() => setOpenProjectId(p.id)}
                actions={
                  <>
                    <button
                      onClick={() => {
                        setEditing(p);
                        setModalOpen(true);
                      }}
                      className={`p-1.5 rounded-lg ${accent ? "hover:bg-white/15" : "hover:bg-card-soft"}`}
                      aria-label="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className={`p-1.5 rounded-lg ${accent ? "hover:bg-white/15 text-white" : "hover:bg-card-soft text-destructive"}`}
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                }
              >
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={
                        accent
                          ? { background: "rgba(255,255,255,0.2)", color: "white" }
                          : { background: `${meta.color}25`, color: meta.color }
                      }
                    >
                      {meta.label}
                    </span>
                    <span className={accent ? "text-white/90 font-semibold" : "font-semibold"}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${accent ? "bg-white/20" : "bg-card-soft"}`}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className={accent ? "h-full bg-white" : "h-full bg-neon"}
                    />
                  </div>
                  <div
                    className={`flex items-center justify-between mt-2 text-[10px] ${accent ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    <span>
                      {linkedTasks.length} {linkedTasks.length === 1 ? "tarefa" : "tarefas"}
                    </span>
                    {p.deadline && (
                      <span className="flex items-center gap-1">
                        <CalIcon className="w-3 h-3" />
                        {format(parseISO(p.deadline), "dd MMM", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </FolderCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!openProjectId} onOpenChange={(v) => !v && setOpenProjectId(null)}>
        <DialogContent className="!bg-popover border-border shadow-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                onClick={() => setOpenProjectId(null)}
                className="p-1 rounded-lg hover:bg-card-soft"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <FolderOpen className="w-4 h-4" />
              {openProject?.name}
            </DialogTitle>
          </DialogHeader>

          {openProject && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: `${STATUS_META[openProject.status].color}25`,
                    color: STATUS_META[openProject.status].color,
                  }}
                >
                  {STATUS_META[openProject.status].label}
                </span>
                {openProject.client && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <User className="w-3 h-3" /> {openProject.client}
                  </span>
                )}
                {openProject.deadline && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalIcon className="w-3 h-3" />
                    {format(parseISO(openProject.deadline), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {projectProgress(openProject.id, tasks)}% concluído
                </span>
              </div>

              {openProject.description && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {openProject.description}
                </p>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Tarefas ({projectTasks.length})</p>
                {projectTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Nenhuma tarefa vinculada ainda.</p>
                ) : (
                  projectTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t.id)}
                      className="w-full flex items-center gap-2 rounded-xl p-2 bg-card-soft hover:bg-card-soft/70 text-left"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`text-xs flex-1 truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {t.title}
                      </span>
                      {t.date && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(parseISO(t.date), "dd MMM", { locale: ptBR })}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              <UpcomingEvents
                filterProjectId={openProject.id}
                title="Cronograma & eventos"
                limit={20}
                showActions
              />



              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setTaskModalOpen(true)}
                  className="bg-electric text-electric-foreground hover:brightness-110 rounded-full text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Nova tarefa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(openProject);
                    setOpenProjectId(null);
                    setModalOpen(true);
                  }}
                  className="rounded-full text-xs h-8"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar projeto
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDeleteId(openProject.id);
                    setOpenProjectId(null);
                  }}
                  className="rounded-full text-xs h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProjectModal open={modalOpen} onOpenChange={setModalOpen} project={editing} />
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        defaultProjectId={openProjectId ?? undefined}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Excluir projeto?"
        description="As tarefas vinculadas serão desvinculadas mas não excluídas."
        onConfirm={() => {
          if (deleteId) {
            deleteProject(deleteId);
            toast.success("Projeto excluído");
            setDeleteId(null);
          }
        }}
      />
    </AppLayout>
  );
}
