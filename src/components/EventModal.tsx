import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import type { EventItem, EventCategory } from "@/lib/types";
import { EVENT_CATEGORY_META } from "@/lib/types";
import { ChevronDown, Video, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: EventItem | null;
  defaults?: Partial<EventItem>;
}

const COLOR_OPTIONS: { key: EventCategory; color: string; label: string }[] = (
  Object.keys(EVENT_CATEGORY_META) as EventCategory[]
).map((k) => ({ key: k, color: EVENT_CATEGORY_META[k].color, label: EVENT_CATEGORY_META[k].label }));

export function EventModal({ open, onOpenChange, event, defaults }: Props) {
  const addEvent = useApp((s) => s.addEvent);
  const updateEvent = useApp((s) => s.updateEvent);
  const deleteEvent = useApp((s) => s.deleteEvent);

  const isEdit = !!event;
  const today = format(new Date(), "yyyy-MM-dd");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<EventCategory>("evento");
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src: Partial<EventItem> = event ?? defaults ?? {};
    const d = src.date ?? today;
    setTitle(src.title ?? "");
    setLocation(src.location ?? src.meetingLink ?? "");
    setDate(d);
    setEndDate(d);
    setStart(src.startTime ?? "09:00");
    setEnd(src.endTime ?? "10:00");
    setAllDay(!src.startTime && !src.endTime && isEdit);
    setGuests("");
    setNotes(src.description ?? "");
    setCategory((src.category as EventCategory) ?? "evento");
    setExpanded(false);
    setShowColorMenu(false);
  }, [open, event, defaults, isEdit, today]);

  const dateLabel = useMemo(() => {
    try {
      return format(parseISO(date), "d 'de' MMM. 'de' yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  }, [date]);

  const accent = EVENT_CATEGORY_META[category].color;

  const submit = () => {
    if (!title.trim()) {
      toast.error("Adicione um título para o evento");
      return;
    }
    const data = {
      title: title.trim(),
      description: notes.trim() || undefined,
      date,
      startTime: allDay ? undefined : start,
      endTime: allDay ? undefined : end,
      category,
      priority: "medium" as const,
      color: EVENT_CATEGORY_META[category].color,
      location: location.trim() || undefined,
      meetingLink: undefined,
      reminders: [],
    };
    if (event) {
      updateEvent(event.id, data);
      toast.success("Evento atualizado");
    } else {
      addEvent(data);
      toast.success("Novo evento criado");
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
      <DialogContent
        className="w-[380px] max-w-[95vw] p-0 rounded-2xl border border-white/10 bg-[#1f1f22] text-white shadow-2xl overflow-hidden gap-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          document.getElementById("event-modal-title")?.focus();
        }}
      >
        {/* Title row */}
        <div className="px-4 pt-3.5 pb-3 flex items-start gap-3">
          <input
            id="event-modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={isEdit ? "Título do evento" : "Novo Evento"}
            className="flex-1 bg-transparent text-[17px] font-semibold placeholder:text-white/90 focus:outline-none"
          />
          <div className="relative">
            <button
              onClick={() => setShowColorMenu((v) => !v)}
              className="flex items-center gap-1 h-6 px-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Categoria"
            >
              <span className="w-3 h-3 rounded-sm" style={{ background: accent }} />
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>
            {showColorMenu && (
              <div className="absolute right-0 mt-1 z-10 bg-[#2a2a2e] border border-white/10 rounded-lg p-1.5 shadow-xl grid grid-cols-4 gap-1 w-[140px]">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    title={c.label}
                    onClick={() => { setCategory(c.key); setShowColorMenu(false); }}
                    className={`w-6 h-6 rounded-md ring-1 ring-white/10 hover:scale-110 transition-transform ${category === c.key ? "ring-2 ring-white" : ""}`}
                    style={{ background: c.color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="px-4 pb-3 flex items-center gap-3 border-b border-white/10">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Adicionar Localização ou Ligação de Vídeo"
            className="flex-1 bg-transparent text-[13px] placeholder:text-white/40 focus:outline-none"
          />
          <Video className="w-4 h-4 text-white/60" />
        </div>

        {/* Date/time */}
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-full px-4 py-3 text-left text-[13px] font-medium hover:bg-white/5 transition-colors border-b border-white/10"
          >
            {allDay ? dateLabel : `${dateLabel}  ${start} a ${end}`}
          </button>
        ) : (
          <div className="px-4 py-3 border-b border-white/10 space-y-2 text-[12px]">
            <Row label="dia inteiro:">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-3.5 h-3.5"
                style={{ accentColor: accent }}
              />
            </Row>
            <Row label="começa:">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              />
              {!allDay && (
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none ml-2"
                />
              )}
            </Row>
            <Row label="termina:">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              />
              {!allDay && (
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none ml-2"
                />
              )}
            </Row>
          </div>
        )}

        {/* Guests */}
        <input
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Adicionar Convidados"
          className="w-full px-4 py-3 bg-transparent text-[13px] placeholder:text-white/40 focus:outline-none border-b border-white/10"
        />

        {/* Notes */}
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicionar Notas, URL ou Anexos"
          className="w-full px-4 py-3 bg-transparent text-[13px] placeholder:text-white/40 focus:outline-none"
        />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-black/20 border-t border-white/10">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="h-7 px-2 rounded-md text-[12px] text-red-300 hover:text-red-200 hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="h-7 px-3 rounded-md text-[12px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              className="h-7 px-3 rounded-md text-[12px] font-medium text-white hover:brightness-110 transition"
              style={{ background: accent }}
            >
              {isEdit ? "Salvar" : "+ Adicionar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <span className="text-white/50 text-right">{label}</span>
      <div className="flex items-center text-white">{children}</div>
    </div>
  );
}
