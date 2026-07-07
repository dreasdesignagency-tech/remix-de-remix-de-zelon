import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Instagram,
  MessageCircle,
  Mail,
  Globe,
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Activity,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CLIENT_STATUS_META, type Client, type ClientStatus } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
  head: () => ({ meta: [{ title: "Clientes — Zelon" }] }),
});

const STATUS_FILTERS: { value: "all" | ClientStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "pausado", label: "Pausados" },
  { value: "encerrado", label: "Encerrados" },
];

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function ClientsPage() {
  const clients = useApp((s) => s.clients);
  const projects = useApp((s) => s.projects);
  const tasks = useApp((s) => s.tasks);
  const deleteClient = useApp((s) => s.deleteClient);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ClientStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projetos" | "tarefas" | "eventos" | "arquivos" | "links">("projetos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => (filter === "all" ? true : c.status === filter))
      .filter((c) =>
        !q
          ? true
          : c.name.toLowerCase().includes(q) ||
            (c.company?.toLowerCase().includes(q) ?? false) ||
            (c.niche?.toLowerCase().includes(q) ?? false),
      );
  }, [clients, query, filter]);

  const open = useMemo(() => clients.find((c) => c.id === openId) ?? null, [clients, openId]);
  const openProjects = useMemo(
    () => (open ? projects.filter((p) => p.clientId === open.id) : []),
    [projects, open],
  );
  const openTasks = useMemo(
    () => (open ? tasks.filter((t) => t.clientId === open.id) : []),
    [tasks, open],
  );

  return (
    <AppLayout
      title="Clientes"
      subtitle="Organize seus clientes, projetos e demandas em um só lugar."
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full text-xs h-9"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Cliente
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full glass-card flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, empresa ou nicho"
              className="bg-transparent outline-none text-xs w-full placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`h-9 px-3 rounded-full glass-card flex items-center gap-1.5 text-xs ${showFilters ? "text-electric" : "text-foreground"}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  filter === f.value
                    ? "bg-foreground text-background border-transparent"
                    : "bg-card-soft/60 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <p className="text-sm text-muted-foreground">
              {clients.length === 0
                ? "Cadastre seu primeiro cliente para começar."
                : "Nenhum cliente encontrado para o filtro atual."}
            </p>
            {clients.length === 0 && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                variant="ghost"
                className="mt-3"
              >
                <Plus className="w-4 h-4 mr-1" /> Novo cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6 pt-3">
            {filtered.map((c, idx) => {
              const clientProjects = projects.filter((p) => p.clientId === c.id);
              const clientTasks = tasks.filter((t) => t.clientId === c.id);
              const lastActivity =
                Math.max(
                  c.updatedAt,
                  ...clientTasks.map((t) => t.createdAt),
                  ...clientProjects.map((p) => p.createdAt),
                  0,
                ) || c.updatedAt;
              const meta = CLIENT_STATUS_META[c.status];
              const accent = idx === 0;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpenId(c.id);
                    setActiveTab("projetos");
                  }}
                  className={`folder-card text-left w-full ${accent ? "is-accent" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        accent ? "bg-white/20 text-white" : "bg-electric/15 text-electric"
                      }`}
                    >
                      {initialsFor(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p
                        className={`text-[11px] truncate ${
                          accent ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {c.company || c.niche || "Sem empresa"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span
                      className="px-2 py-0.5 rounded-full font-medium"
                      style={
                        accent
                          ? { background: "rgba(255,255,255,0.2)", color: "white" }
                          : { background: `${meta.color}25`, color: meta.color }
                      }
                    >
                      {meta.label}
                    </span>
                    <span className={accent ? "text-white/85" : "text-muted-foreground"}>
                      {format(new Date(lastActivity), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>

                  <div
                    className={`mt-3 grid grid-cols-2 gap-2 text-[11px] ${
                      accent ? "text-white/90" : "text-foreground"
                    }`}
                  >
                    <div
                      className={`rounded-xl px-2 py-1.5 flex items-center gap-1.5 ${
                        accent ? "bg-white/15" : "bg-card-soft/70"
                      }`}
                    >
                      <FolderKanban className="w-3 h-3" />
                      {clientProjects.length} proj.
                    </div>
                    <div
                      className={`rounded-xl px-2 py-1.5 flex items-center gap-1.5 ${
                        accent ? "bg-white/15" : "bg-card-soft/70"
                      }`}
                    >
                      <ListTodo className="w-3 h-3" />
                      {clientTasks.length} tarefas
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenId(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 p-3"
            >
              <div className="h-full glass-card rounded-3xl flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-electric/15 text-electric flex items-center justify-center text-sm font-bold">
                      {initialsFor(open.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{open.name}</p>
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5"
                        style={{
                          background: `${CLIENT_STATUS_META[open.status].color}25`,
                          color: CLIENT_STATUS_META[open.status].color,
                        }}
                      >
                        {CLIENT_STATUS_META[open.status].label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenId(null)}
                    className="w-8 h-8 rounded-full hover:bg-card-soft flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 space-y-4">
                  {/* Contacts */}
                  <section className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Contatos
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {open.instagram && (
                        <ContactLine
                          icon={<Instagram className="w-3.5 h-3.5" />}
                          label={open.instagram}
                          href={`https://instagram.com/${open.instagram.replace(/^@/, "")}`}
                        />
                      )}
                      {open.whatsapp && (
                        <ContactLine
                          icon={<MessageCircle className="w-3.5 h-3.5" />}
                          label={open.whatsapp}
                          href={`https://wa.me/${open.whatsapp.replace(/\D/g, "")}`}
                        />
                      )}
                      {open.email && (
                        <ContactLine
                          icon={<Mail className="w-3.5 h-3.5" />}
                          label={open.email}
                          href={`mailto:${open.email}`}
                        />
                      )}
                      {open.site && (
                        <ContactLine
                          icon={<Globe className="w-3.5 h-3.5" />}
                          label={open.site}
                          href={open.site.startsWith("http") ? open.site : `https://${open.site}`}
                        />
                      )}
                      {!open.instagram && !open.whatsapp && !open.email && !open.site && (
                        <p className="text-[11px] text-muted-foreground">Sem contatos cadastrados.</p>
                      )}
                    </div>
                  </section>

                  {open.notes && (
                    <section className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Observações
                      </p>
                      <p className="text-xs whitespace-pre-wrap bg-card-soft/60 rounded-2xl p-3">
                        {open.notes}
                      </p>
                    </section>
                  )}

                  {/* Tabs */}
                  <section className="space-y-2">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                      {(
                        [
                          { v: "projetos", l: "Projetos" },
                          { v: "tarefas", l: "Tarefas" },
                          { v: "eventos", l: "Eventos" },
                          { v: "arquivos", l: "Arquivos" },
                          { v: "links", l: "Links" },
                        ] as const
                      ).map((t) => (

                        <button
                          key={t.v}
                          onClick={() => setActiveTab(t.v)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                            activeTab === t.v
                              ? "bg-foreground text-background"
                              : "bg-card-soft/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      {activeTab === "projetos" &&
                        (openProjects.length === 0 ? (
                          <EmptyTab text="Sem projetos vinculados." />
                        ) : (
                          <ul className="space-y-1.5">
                            {openProjects.map((p) => (
                              <li
                                key={p.id}
                                className="p-2.5 rounded-2xl bg-card-soft/60 flex items-center gap-2"
                              >
                                <FolderKanban className="w-3.5 h-3.5 text-electric shrink-0" />
                                <p className="text-xs font-medium truncate flex-1">{p.name}</p>
                              </li>
                            ))}
                          </ul>
                        ))}
                      {activeTab === "tarefas" &&
                        (openTasks.length === 0 ? (
                          <EmptyTab text="Sem tarefas vinculadas." />
                        ) : (
                          <ul className="space-y-1.5">
                            {openTasks.map((t) => (
                              <li
                                key={t.id}
                                className="p-2.5 rounded-2xl bg-card-soft/60 flex items-center gap-2"
                              >
                                {t.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-neon shrink-0" />
                                ) : (
                                  <ListTodo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                )}
                                <span
                                  className={`text-xs flex-1 truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {t.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ))}
                      {activeTab === "eventos" && (
                        <UpcomingEvents
                          filterClientId={open.id}
                          title="Eventos do cliente"
                          limit={20}
                          showActions
                        />
                      )}
                      {activeTab === "arquivos" && (

                        <DriveLinksTab client={open} />
                      )}
                      {activeTab === "links" && (
                        <EmptyTab icon={<LinkIcon className="w-4 h-4" />} text="Sem links salvos." />
                      )}
                    </div>
                  </section>

                  {/* Stats */}
                  <section className="grid grid-cols-2 gap-2">
                    <MiniStat
                      icon={<FolderKanban className="w-3.5 h-3.5 text-electric" />}
                      label="Projetos ativos"
                      value={openProjects.filter((p) => p.status !== "delivered").length}
                    />
                    <MiniStat
                      icon={<ListTodo className="w-3.5 h-3.5 text-orange-accent" />}
                      label="Tarefas abertas"
                      value={openTasks.filter((t) => !t.completed).length}
                    />
                    <MiniStat
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-neon" />}
                      label="Tarefas concluídas"
                      value={openTasks.filter((t) => t.completed).length}
                    />
                    <MiniStat
                      icon={<Activity className="w-3.5 h-3.5 text-electric" />}
                      label="Taxa de entrega"
                      value={
                        openTasks.length
                          ? `${Math.round((openTasks.filter((t) => t.completed).length / openTasks.length) * 100)}%`
                          : "—"
                      }
                    />
                  </section>
                </div>

                <footer className="p-3 border-t border-border flex gap-2">
                  <Button
                    onClick={() => {
                      setEditing(open);
                      setModalOpen(true);
                    }}
                    variant="ghost"
                    className="flex-1 rounded-full text-xs h-9"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteId(open.id)}
                    variant="ghost"
                    className="flex-1 rounded-full text-xs h-9 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                  </Button>
                </footer>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ClientModal open={modalOpen} onOpenChange={setModalOpen} client={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode excluir apenas o cliente (mantendo projetos e tarefas sem vínculo) ou
              excluir tudo o que está associado a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                deleteClient(deleteId, { cascade: false });
                toast.success("Cliente excluído. Projetos e tarefas mantidos.");
                setDeleteId(null);
                setOpenId(null);
              }}
              className="bg-card-soft text-foreground hover:bg-card-soft/80"
            >
              Manter projetos e tarefas
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                deleteClient(deleteId, { cascade: true });
                toast.success("Cliente e dados vinculados excluídos.");
                setDeleteId(null);
                setOpenId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function ContactLine({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 p-2 rounded-xl bg-card-soft/60 hover:bg-card-soft transition-colors"
    >
      <span className="text-electric">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function EmptyTab({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="py-6 text-center text-[11px] text-muted-foreground flex flex-col items-center gap-1.5">
      {icon}
      {text}
    </div>
  );
}

// ----- Drive Links tab -----
function DriveLinksTab({ client }: { client: Client }) {
  const updateClient = useApp((s) => s.updateClient);
  const links = client.driveLinks ?? [];
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("Informe a URL do Drive");
      return;
    }
    const next = [...links, { label: label.trim() || trimmedUrl, url: trimmedUrl }];
    updateClient(client.id, { driveLinks: next });
    setLabel("");
    setUrl("");
    toast.success("Link adicionado");
  };

  const remove = (idx: number) => {
    const next = links.filter((_, i) => i !== idx);
    updateClient(client.id, { driveLinks: next });
  };

  return (
    <div className="space-y-2">
      {links.length === 0 ? (
        <EmptyTab
          icon={<LinkIcon className="w-4 h-4" />}
          text="Cole abaixo links do Google Drive para anexar arquivos."
        />
      ) : (
        <ul className="space-y-1.5">
          {links.map((l, idx) => (
            <li
              key={`${l.url}-${idx}`}
              className="p-2.5 rounded-2xl bg-card-soft/60 flex items-center gap-2"
            >
              <LinkIcon className="w-3.5 h-3.5 text-electric shrink-0" />
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium truncate flex-1 hover:text-electric"
                title={l.url}
              >
                {l.label}
              </a>
              <button
                onClick={() => remove(idx)}
                className="w-6 h-6 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                aria-label="Remover link"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rótulo (opcional) — ex.: Briefing"
          className="text-xs h-8"
        />
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="text-xs h-8 flex-1"
          />
          <Button
            onClick={add}
            size="sm"
            className="bg-electric text-electric-foreground rounded-full h-8 text-xs px-3"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----- Modal -----
function ClientModal({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client | null;
}) {
  const addClient = useApp((s) => s.addClient);
  const updateClient = useApp((s) => s.updateClient);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [niche, setNiche] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ClientStatus>("ativo");

  // sync when opening
  useEffect(() => {
    if (open) {
      setName(client?.name ?? "");
      setCompany(client?.company ?? "");
      setInstagram(client?.instagram ?? "");
      setWhatsapp(client?.whatsapp ?? "");
      setEmail(client?.email ?? "");
      setSite(client?.site ?? "");
      setNiche(client?.niche ?? "");
      setNotes(client?.notes ?? "");
      setStatus(client?.status ?? "ativo");
    }
  }, [open, client]);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    const payload = {
      name: name.trim(),
      company: company.trim() || undefined,
      instagram: instagram.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      site: site.trim() || undefined,
      niche: niche.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    };
    if (client) {
      updateClient(client.id, payload);
      toast.success("Cliente atualizado");
    } else {
      addClient(payload);
      toast.success("Cliente cadastrado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-popover border-border max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <section className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Informações Básicas
            </p>
            <Field label="Nome*">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Livvi" />
            </Field>
            <Field label="Empresa">
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nome da empresa"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Instagram">
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+55 11 9..."
                />
              </Field>
            </div>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </Field>
          </section>

          <section className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Dados Extras
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Site">
                <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="site.com" />
              </Field>
              <Field label="Nicho">
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Moda, Tech…" />
              </Field>
            </div>
            <Field label="Status">
              <div className="flex gap-1.5">
                {(["ativo", "pausado", "encerrado"] as ClientStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                      status === s
                        ? "bg-foreground text-background border-transparent"
                        : "bg-card-soft/60 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {CLIENT_STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Observações">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anotações rápidas sobre o cliente"
              />
            </Field>
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            className="bg-electric text-electric-foreground glow-electric hover:brightness-110 rounded-full"
          >
            Salvar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}