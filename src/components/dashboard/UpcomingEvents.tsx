import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar as CalIcon, MapPin, Video, Briefcase } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/lib/store";
import { EVENT_CATEGORY_META, type EventItem } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { EventModal } from "@/components/EventModal";

interface Props {
  filterClientId?: string;
  filterProjectId?: string;
  title?: string;
  limit?: number;
  showActions?: boolean;
}

export function UpcomingEvents({
  filterClientId,
  filterProjectId,
  title = "Próximos eventos",
  limit = 6,
  showActions = true,
}: Props) {
  const events = useApp((s) => s.events);
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [defaults, setDefaults] = useState<Partial<EventItem> | undefined>();

  const upcoming = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return events
      .filter((e) => !e.date || e.date >= today)
      .filter((e) => !filterClientId || e.clientId === filterClientId)
      .filter((e) => !filterProjectId || e.projectId === filterProjectId)
      .sort((a, b) =>
        ((a.date ?? "9999-12-31") + (a.startTime ?? "")).localeCompare(
          (b.date ?? "9999-12-31") + (b.startTime ?? ""),
        ),
      )
      .slice(0, limit);
  }, [events, filterClientId, filterProjectId, limit]);

  const openNew = () => {
    setEditing(null);
    setDefaults({ clientId: filterClientId, projectId: filterProjectId });
    setOpen(true);
  };

  const openEdit = (e: EventItem) => {
    setEditing(e);
    setDefaults(undefined);
    setOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-4 lg:col-span-2"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {upcoming.length === 0
                ? "Nenhum evento agendado"
                : `${upcoming.length} ${upcoming.length === 1 ? "evento" : "eventos"} pela frente`}
            </p>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={openNew}
                className="text-[11px] px-2.5 py-1 rounded-full bg-electric text-electric-foreground hover:brightness-110 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Novo evento
              </button>
              <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <CalIcon className="w-3 h-3" /> Agenda
              </Link>
            </div>
          )}
        </div>

        {upcoming.length === 0 ? (
          <button
            onClick={openNew}
            className="w-full py-8 rounded-2xl border-2 border-dashed border-border hover:border-electric/60 text-muted-foreground hover:text-electric transition-colors flex flex-col items-center justify-center gap-1.5"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[11px] font-medium">Novo evento</span>
          </button>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((e) => {
              const meta = EVENT_CATEGORY_META[e.category];
              const color = e.color || meta.color;
              const client = e.clientId ? clients.find((c) => c.id === e.clientId) : undefined;
              const project = e.projectId ? projects.find((p) => p.id === e.projectId) : undefined;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => openEdit(e)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-2xl bg-card-soft/60 hover:bg-card-soft transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: `${color}25`, color }}
                    >
                      {e.date ? (
                        <>
                          <span className="text-[9px] uppercase opacity-80">
                            {format(parseISO(e.date), "MMM", { locale: ptBR })}
                          </span>
                          <span className="text-sm font-bold leading-none">
                            {format(parseISO(e.date), "d")}
                          </span>
                        </>
                      ) : (
                        <CalIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: `${color}25`, color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                        {e.startTime && <span>{e.startTime}{e.endTime ? `–${e.endTime}` : ""}</span>}
                        {client && (
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="w-2.5 h-2.5" /> {client.name}
                          </span>
                        )}
                        {project && <span className="truncate">· {project.name}</span>}
                        {e.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-2.5 h-2.5" /> {e.location}
                          </span>
                        )}
                        {e.meetingLink && <Video className="w-2.5 h-2.5 text-electric" />}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
      <EventModal open={open} onOpenChange={setOpen} event={editing} defaults={defaults} />
    </>
  );
}
