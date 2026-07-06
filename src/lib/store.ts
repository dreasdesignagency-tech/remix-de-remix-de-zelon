import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Task, Note, Project, Profile, Category, Priority, ProjectStatus, Client, ClientStatus, EventItem, EventCategory, EventReminder } from "./types";


const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const defaultProfile: Profile = {
  name: "",
  role: "",
  bio: "",
  weeklyGoal: 20,
};

// ---------- DB <-> App mappers ----------
type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  category: string;
  priority: string;
  completed: boolean;
  project_id: string | null;
  created_at: string;
};
type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[] | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};
type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  client: string | null;
  client_id: string | null;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
};
type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  niche: string | null;
  status: string;
  notes: string | null;
  drive_links?: { label: string; url: string }[] | null;
  created_at: string;
  updated_at: string;
};
type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  bio: string | null;
  weekly_goal: number;
};

const taskFromRow = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  date: r.date ?? undefined,
  startTime: r.start_time ?? undefined,
  endTime: r.end_time ?? undefined,
  category: r.category as Category,
  priority: r.priority as Priority,
  completed: r.completed,
  projectId: r.project_id ?? undefined,
  clientId: (r as TaskRow & { client_id?: string | null }).client_id ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

const noteFromRow = (r: NoteRow): Note => ({
  id: r.id,
  title: r.title,
  content: r.content,
  tags: r.tags ?? [],
  pinned: r.pinned,
  createdAt: new Date(r.created_at).getTime(),
  updatedAt: new Date(r.updated_at).getTime(),
});

const projectFromRow = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  client: r.client ?? undefined,
  clientId: r.client_id ?? undefined,
  description: r.description ?? undefined,
  status: r.status as ProjectStatus,
  deadline: r.deadline ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

const clientFromRow = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  company: r.company ?? undefined,
  instagram: r.instagram ?? undefined,
  whatsapp: r.whatsapp ?? undefined,
  email: r.email ?? undefined,
  site: r.site ?? undefined,
  niche: r.niche ?? undefined,
  status: (r.status as ClientStatus) ?? "ativo",
  notes: r.notes ?? undefined,
  driveLinks: Array.isArray(r.drive_links) ? r.drive_links : [],
  createdAt: new Date(r.created_at).getTime(),
  updatedAt: new Date(r.updated_at).getTime(),
});

const profileFromRow = (r: ProfileRow): Profile => ({
  name: r.name ?? "",
  email: r.email ?? undefined,
  phone: r.phone ?? undefined,
  avatar: r.avatar ?? undefined,
  role: r.role ?? "",
  bio: r.bio ?? "",
  weeklyGoal: r.weekly_goal ?? 20,
});

// ---- Events ----
type EventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  category: string;
  priority: string;
  color: string | null;
  location: string | null;
  meeting_link: string | null;
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  note_id: string | null;
  reminders: EventReminder[] | null;
  created_at: string;
  updated_at: string;
};

const eventFromRow = (r: EventRow): EventItem => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  date: r.date ?? undefined,
  startTime: r.start_time ? r.start_time.slice(0, 5) : undefined,
  endTime: r.end_time ? r.end_time.slice(0, 5) : undefined,
  category: (r.category as EventCategory) ?? "reuniao",
  priority: (r.priority as Priority) ?? "medium",
  color: r.color ?? undefined,
  location: r.location ?? undefined,
  meetingLink: r.meeting_link ?? undefined,
  clientId: r.client_id ?? undefined,
  projectId: r.project_id ?? undefined,
  taskId: r.task_id ?? undefined,
  noteId: r.note_id ?? undefined,
  reminders: Array.isArray(r.reminders) ? r.reminders : [],
  createdAt: new Date(r.created_at).getTime(),
  updatedAt: new Date(r.updated_at).getTime(),
});

interface AppState {
  userId: string | null;
  loaded: boolean;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  clients: Client[];
  events: EventItem[];
  profile: Profile;

  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  addTask: (t: Omit<Task, "id" | "createdAt" | "completed"> & { completed?: boolean }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt" | "pinned"> & { pinned?: boolean }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  addProject: (p: Omit<Project, "id" | "createdAt">) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addClient: (c: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string, opts?: { cascade?: boolean }) => void;

  addEvent: (e: Omit<EventItem, "id" | "createdAt" | "updatedAt">) => EventItem;
  updateEvent: (id: string, patch: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;

  updateProfile: (patch: Partial<Profile>) => void;
}

const handle = (label: string) => (err: { message?: string } | null) => {
  if (err) console.error(`[store:${label}]`, err.message ?? err);
};

export const useApp = create<AppState>((set, get) => ({
  userId: null,
  loaded: false,
  tasks: [],
  notes: [],
  projects: [],
  clients: [],
  events: [],
  profile: defaultProfile,

  reset: () =>
    set({ userId: null, loaded: false, tasks: [], notes: [], projects: [], clients: [], events: [], profile: defaultProfile }),

  loadAll: async (userId) => {
    set({ userId, loaded: false });
    const [tasksRes, notesRes, projectsRes, clientsRes, eventsRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("notes").select("*").order("updated_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("freelancer_clients").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    set({
      tasks: ((tasksRes.data as TaskRow[] | null) ?? []).map(taskFromRow),
      notes: ((notesRes.data as NoteRow[] | null) ?? []).map(noteFromRow),
      projects: ((projectsRes.data as ProjectRow[] | null) ?? []).map(projectFromRow),
      clients: ((clientsRes.data as ClientRow[] | null) ?? []).map(clientFromRow),
      events: ((eventsRes.data as EventRow[] | null) ?? []).map(eventFromRow),
      profile: profileRes.data ? profileFromRow(profileRes.data as ProfileRow) : defaultProfile,
      loaded: true,
    });
  },


  // ---- Tasks ----
  addTask: (t) => {
    const userId = get().userId;
    const task: Task = {
      id: uid(),
      createdAt: Date.now(),
      completed: t.completed ?? false,
      title: t.title,
      description: t.description,
      date: t.date,
      startTime: t.startTime,
      endTime: t.endTime,
      category: t.category,
      priority: t.priority,
      projectId: t.projectId,
      clientId: t.clientId,
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    if (userId) {
      void supabase
        .from("tasks")
        .insert({
          id: task.id,
          user_id: userId,
          title: task.title,
          description: task.description ?? null,
          date: task.date ?? null,
          start_time: task.startTime ?? null,
          end_time: task.endTime ?? null,
          category: task.category,
          priority: task.priority,
          completed: task.completed,
          project_id: task.projectId ?? null,
          client_id: task.clientId ?? null,
        } as never)
        .then(({ error }) => handle("addTask")(error));
    }
    return task;
  },
  updateTask: (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    if (!get().userId) return;
    const row: Record<string, unknown> = {};
    if ("title" in patch) row.title = patch.title;
    if ("description" in patch) row.description = patch.description ?? null;
    if ("date" in patch) row.date = patch.date ?? null;
    if ("startTime" in patch) row.start_time = patch.startTime ?? null;
    if ("endTime" in patch) row.end_time = patch.endTime ?? null;
    if ("category" in patch) row.category = patch.category;
    if ("priority" in patch) row.priority = patch.priority;
    if ("completed" in patch) row.completed = patch.completed;
    if ("projectId" in patch) row.project_id = patch.projectId ?? null;
    if ("clientId" in patch) row.client_id = patch.clientId ?? null;
    void supabase.from("tasks").update(row as never).eq("id", id).then(({ error }) => handle("updateTask")(error));
  },
  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
    if (!get().userId) return;
    void supabase.from("tasks").delete().eq("id", id).then(({ error }) => handle("deleteTask")(error));
  },
  toggleTask: (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    get().updateTask(id, { completed: !t.completed });
  },

  // ---- Notes ----
  addNote: (n) => {
    const userId = get().userId;
    const now = Date.now();
    const note: Note = {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      pinned: n.pinned ?? false,
      title: n.title,
      content: n.content,
      tags: n.tags,
    };
    set((s) => ({ notes: [note, ...s.notes] }));
    if (userId) {
      void supabase
        .from("notes")
        .insert({
          id: note.id,
          user_id: userId,
          title: note.title,
          content: note.content,
          tags: note.tags,
          pinned: note.pinned,
        })
        .then(({ error }) => handle("addNote")(error));
    }
    return note;
  },
  updateNote: (id, patch) => {
    set((s) => ({
      notes: s.notes.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
    if (!get().userId) return;
    const row: Record<string, unknown> = {};
    if ("title" in patch) row.title = patch.title;
    if ("content" in patch) row.content = patch.content;
    if ("tags" in patch) row.tags = patch.tags;
    if ("pinned" in patch) row.pinned = patch.pinned;
    void supabase.from("notes").update(row as never).eq("id", id).then(({ error }) => handle("updateNote")(error));
  },
  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((x) => x.id !== id) }));
    if (!get().userId) return;
    void supabase.from("notes").delete().eq("id", id).then(({ error }) => handle("deleteNote")(error));
  },
  togglePinNote: (id) => {
    const n = get().notes.find((x) => x.id === id);
    if (!n) return;
    get().updateNote(id, { pinned: !n.pinned });
  },

  // ---- Projects ----
  addProject: (p) => {
    const userId = get().userId;
    const project: Project = { id: uid(), createdAt: Date.now(), ...p };
    set((s) => ({ projects: [project, ...s.projects] }));
    if (userId) {
      void supabase
        .from("projects")
        .insert({
          id: project.id,
          user_id: userId,
          name: project.name,
          client: project.client ?? null,
          client_id: project.clientId ?? null,
          description: project.description ?? null,
          status: project.status,
          deadline: project.deadline ?? null,
        } as never)
        .then(({ error }) => handle("addProject")(error));
    }
    return project;
  },
  updateProject: (id, patch) => {
    set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    if (!get().userId) return;
    const row: Record<string, unknown> = {};
    if ("name" in patch) row.name = patch.name;
    if ("client" in patch) row.client = patch.client ?? null;
    if ("clientId" in patch) row.client_id = patch.clientId ?? null;
    if ("description" in patch) row.description = patch.description ?? null;
    if ("status" in patch) row.status = patch.status;
    if ("deadline" in patch) row.deadline = patch.deadline ?? null;
    void supabase.from("projects").update(row as never).eq("id", id).then(({ error }) => handle("updateProject")(error));
  },
  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((x) => x.id !== id),
      tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
    }));
    if (!get().userId) return;
    void supabase.from("projects").delete().eq("id", id).then(({ error }) => handle("deleteProject")(error));
  },

  // ---- Clients ----
  addClient: (c) => {
    const userId = get().userId;
    const now = Date.now();
    const client: Client = { id: uid(), createdAt: now, updatedAt: now, ...c };
    set((s) => ({ clients: [client, ...s.clients] }));
    if (userId) {
      void supabase
        .from("freelancer_clients")
        .insert({
          id: client.id,
          user_id: userId,
          name: client.name,
          company: client.company ?? null,
          instagram: client.instagram ?? null,
          whatsapp: client.whatsapp ?? null,
          email: client.email ?? null,
          site: client.site ?? null,
          niche: client.niche ?? null,
          status: client.status,
          notes: client.notes ?? null,
          drive_links: client.driveLinks ?? [],
        } as never)
        .then(({ error }) => handle("addClient")(error));
    }
    return client;
  },
  updateClient: (id, patch) => {
    set((s) => ({
      clients: s.clients.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
    if (!get().userId) return;
    const row: Record<string, unknown> = {};
    if ("name" in patch) row.name = patch.name;
    if ("company" in patch) row.company = patch.company ?? null;
    if ("instagram" in patch) row.instagram = patch.instagram ?? null;
    if ("whatsapp" in patch) row.whatsapp = patch.whatsapp ?? null;
    if ("email" in patch) row.email = patch.email ?? null;
    if ("site" in patch) row.site = patch.site ?? null;
    if ("niche" in patch) row.niche = patch.niche ?? null;
    if ("status" in patch) row.status = patch.status;
    if ("notes" in patch) row.notes = patch.notes ?? null;
    if ("driveLinks" in patch) row.drive_links = patch.driveLinks ?? [];
    void supabase
      .from("freelancer_clients")
      .update(row as never)
      .eq("id", id)
      .then(({ error }) => handle("updateClient")(error));
  },
  deleteClient: (id, opts) => {
    const cascade = opts?.cascade ?? false;
    set((s) => ({
      clients: s.clients.filter((x) => x.id !== id),
      projects: cascade
        ? s.projects.filter((p) => p.clientId !== id)
        : s.projects.map((p) => (p.clientId === id ? { ...p, clientId: undefined } : p)),
      tasks: cascade
        ? s.tasks.filter((t) => t.clientId !== id)
        : s.tasks.map((t) => (t.clientId === id ? { ...t, clientId: undefined } : t)),
    }));
    if (!get().userId) return;
    if (cascade) {
      void supabase.from("projects").delete().eq("client_id", id).then(({ error }) => handle("deleteClient.projects")(error));
      void supabase.from("tasks").delete().eq("client_id", id).then(({ error }) => handle("deleteClient.tasks")(error));
    }
    void supabase.from("freelancer_clients").delete().eq("id", id).then(({ error }) => handle("deleteClient")(error));
  },

  // ---- Events ----
  addEvent: (e) => {
    const userId = get().userId;
    const now = Date.now();
    const ev: EventItem = { id: uid(), createdAt: now, updatedAt: now, ...e, reminders: e.reminders ?? [] };
    set((s) => ({ events: [ev, ...s.events] }));
    if (userId) {
      void supabase
        .from("events")
        .insert({
          id: ev.id,
          user_id: userId,
          title: ev.title,
          description: ev.description ?? null,
          date: ev.date ?? null,
          start_time: ev.startTime ?? null,
          end_time: ev.endTime ?? null,
          category: ev.category,
          priority: ev.priority,
          color: ev.color ?? null,
          location: ev.location ?? null,
          meeting_link: ev.meetingLink ?? null,
          client_id: ev.clientId ?? null,
          project_id: ev.projectId ?? null,
          task_id: ev.taskId ?? null,
          note_id: ev.noteId ?? null,
          reminders: ev.reminders,
        } as never)
        .then(({ error }) => handle("addEvent")(error));
    }
    return ev;
  },
  updateEvent: (id, patch) => {
    set((s) => ({
      events: s.events.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }));
    if (!get().userId) return;
    const row: Record<string, unknown> = {};
    if ("title" in patch) row.title = patch.title;
    if ("description" in patch) row.description = patch.description ?? null;
    if ("date" in patch) row.date = patch.date ?? null;
    if ("startTime" in patch) row.start_time = patch.startTime ?? null;
    if ("endTime" in patch) row.end_time = patch.endTime ?? null;
    if ("category" in patch) row.category = patch.category;
    if ("priority" in patch) row.priority = patch.priority;
    if ("color" in patch) row.color = patch.color ?? null;
    if ("location" in patch) row.location = patch.location ?? null;
    if ("meetingLink" in patch) row.meeting_link = patch.meetingLink ?? null;
    if ("clientId" in patch) row.client_id = patch.clientId ?? null;
    if ("projectId" in patch) row.project_id = patch.projectId ?? null;
    if ("taskId" in patch) row.task_id = patch.taskId ?? null;
    if ("noteId" in patch) row.note_id = patch.noteId ?? null;
    if ("reminders" in patch) row.reminders = patch.reminders ?? [];
    void supabase.from("events").update(row as never).eq("id", id).then(({ error }) => handle("updateEvent")(error));
  },
  deleteEvent: (id) => {
    set((s) => ({ events: s.events.filter((x) => x.id !== id) }));
    if (!get().userId) return;
    void supabase.from("events").delete().eq("id", id).then(({ error }) => handle("deleteEvent")(error));
  },

  // ---- Profile ----

  updateProfile: (patch) => {
    set((s) => ({ profile: { ...s.profile, ...patch } }));
    const userId = get().userId;
    if (!userId) return;
    const row: Record<string, unknown> = {};
    if ("name" in patch) row.name = patch.name;
    if ("phone" in patch) row.phone = patch.phone ?? null;
    if ("avatar" in patch) row.avatar = patch.avatar ?? null;
    // NOTE: `role` in the DB is a system enum (user_role) protected by an RLS
    // WITH CHECK that forbids changing it from the client. The UI "Área de
    // atuação" field is stored in `bio`-adjacent free text via `bio` only —
    // do not send `role` here or the whole UPDATE fails and nothing saves.
    if ("bio" in patch) row.bio = patch.bio ?? null;
    if ("weeklyGoal" in patch) row.weekly_goal = patch.weeklyGoal;
    if (Object.keys(row).length === 0) return;
    void supabase
      .from("profiles")
      .update(row as never)
      .eq("id", userId)
      .then(({ error }) => handle("updateProfile")(error));
  },

}));

export function projectProgress(projectId: string, tasks: Task[]) {
  const list = tasks.filter((t) => t.projectId === projectId);
  if (!list.length) return 0;
  return Math.round((list.filter((t) => t.completed).length / list.length) * 100);
}

// ---- Auth wiring: load/clear data when session changes ----
if (typeof window !== "undefined") {
  const init = async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) await useApp.getState().loadAll(uid);
    else useApp.setState({ loaded: true });
  };
  void init();

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      useApp.getState().reset();
      useApp.setState({ loaded: true });
      return;
    }
    const userId = session.user.id;
    if (useApp.getState().userId !== userId) {
      void useApp.getState().loadAll(userId);
    }
  });
}
