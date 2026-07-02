import { useMemo, useRef, useState, useEffect } from "react";
import { Search, CheckSquare, CalendarDays, Briefcase, Users, FileText } from "lucide-react";
import { useApp } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";

type Hit = {
  id: string;
  label: string;
  sub?: string;
  icon: typeof Search;
  to: "/tasks" | "/calendar" | "/projects" | "/clients" | "/notes";
  date?: string;
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const tasks = useApp((s) => s.tasks);
  const events = useApp((s) => s.events);
  const projects = useApp((s) => s.projects);
  const clients = useApp((s) => s.clients);
  const notes = useApp((s) => s.notes);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const list: Hit[] = [];
    for (const t of tasks) if (t.title.toLowerCase().includes(term)) list.push({ id: `t-${t.id}`, label: t.title, sub: t.date ? `Tarefa · ${t.date}` : "Tarefa", icon: CheckSquare, to: "/tasks", date: t.date });
    for (const e of events) if (e.title.toLowerCase().includes(term)) list.push({ id: `e-${e.id}`, label: e.title, sub: e.date ? `Evento · ${e.date}${e.startTime ? " " + e.startTime : ""}` : "Evento", icon: CalendarDays, to: "/calendar", date: e.date });
    for (const p of projects) if (p.name.toLowerCase().includes(term)) list.push({ id: `p-${p.id}`, label: p.name, sub: "Projeto", icon: Briefcase, to: "/projects" });
    for (const c of clients) if (c.name.toLowerCase().includes(term)) list.push({ id: `c-${c.id}`, label: c.name, sub: "Cliente", icon: Users, to: "/clients" });
    for (const n of notes) if (n.title.toLowerCase().includes(term)) list.push({ id: `n-${n.id}`, label: n.title, sub: "Anotação", icon: FileText, to: "/notes" });
    return list.slice(0, 12);
  }, [q, tasks, events, projects, clients, notes]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    if (h.to === "/calendar" && h.date) {
      try { sessionStorage.setItem("flow-calendar-date", h.date); } catch {}
    }
    navigate({ to: h.to });
  };

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full glass-card w-60">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) go(hits[0]); if (e.key === "Escape") setOpen(false); }}
          placeholder="Buscar no app"
          className="bg-transparent outline-none text-xs w-full placeholder:text-muted-foreground text-foreground"
        />
      </div>
      {open && q.trim() && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-popover border border-border shadow-2xl z-50 p-1">
          {hits.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhum resultado</div>
          ) : (
            hits.map((h) => {
              const Icon = h.icon;
              return (
                <button
                  key={h.id}
                  onClick={() => go(h)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-card-soft text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-card-soft flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{h.label}</p>
                    {h.sub && <p className="text-[10px] text-muted-foreground truncate">{h.sub}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
