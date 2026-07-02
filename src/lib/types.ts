export type Category = "client" | "personal" | "project";
export type Priority = "low" | "medium" | "high";
export type ProjectStatus = "idea" | "in_progress" | "review" | "delivered";
export type ClientStatus = "ativo" | "pausado" | "encerrado";

export interface Client {
  id: string;
  name: string;
  company?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  niche?: string;
  status: ClientStatus;
  notes?: string;
  driveLinks?: { label: string; url: string }[];
  createdAt: number;
  updatedAt: number;
}

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; color: string }> = {
  ativo:     { label: "Ativo",     color: "oklch(0.62 0.22 265)" },
  pausado:   { label: "Pausado",   color: "oklch(0.78 0.17 55)" },
  encerrado: { label: "Encerrado", color: "oklch(0.65 0.04 270)" },
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  date?: string; // ISO date YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  category: Category;
  priority: Priority;
  completed: boolean;
  projectId?: string;
  clientId?: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  clientId?: string;
  description?: string;
  status: ProjectStatus;
  deadline?: string;
  createdAt: number;
}

export interface Profile {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  bio: string;
  weeklyGoal: number;
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  client: { label: "Cliente", color: "oklch(0.62 0.22 265)" },
  personal: { label: "Pessoal", color: "oklch(0.55 0.04 270)" },
  project: { label: "Projeto", color: "oklch(0.7 0.18 320)" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: "Baixa", color: "oklch(0.7 0.1 200)" },
  medium: { label: "Média", color: "oklch(0.78 0.17 55)" },
  high: { label: "Alta", color: "oklch(0.65 0.22 25)" },
};

export const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "Ideia", color: "oklch(0.6 0.1 270)" },
  in_progress: { label: "Em andamento", color: "oklch(0.62 0.22 265)" },
  review: { label: "Revisão", color: "oklch(0.78 0.17 55)" },
  delivered: { label: "Entregue", color: "oklch(0.55 0.18 230)" },
};

// ===== Events =====
export type EventCategory =
  | "reuniao"
  | "chamada"
  | "entrega"
  | "prazo"
  | "evento"
  | "foco"
  | "pessoal"
  | "outro";

export type EventReminder = "1d" | "1h" | "15m";

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  priority: Priority;
  color?: string;
  location?: string;
  meetingLink?: string;
  clientId?: string;
  projectId?: string;
  taskId?: string;
  noteId?: string;
  reminders: EventReminder[];
  createdAt: number;
  updatedAt: number;
}

export const EVENT_CATEGORY_META: Record<EventCategory, { label: string; color: string }> = {
  reuniao:  { label: "Reunião",        color: "oklch(0.62 0.22 265)" },
  chamada:  { label: "Chamada",        color: "oklch(0.7 0.18 200)" },
  entrega:  { label: "Entrega",        color: "oklch(0.78 0.17 145)" },
  prazo:    { label: "Prazo",          color: "oklch(0.65 0.22 25)" },
  evento:   { label: "Evento",         color: "oklch(0.7 0.2 320)" },
  foco:     { label: "Trabalho focado",color: "oklch(0.78 0.17 55)" },
  pessoal:  { label: "Pessoal",        color: "oklch(0.55 0.04 270)" },
  outro:    { label: "Outro",          color: "oklch(0.6 0.05 250)" },
};

export const EVENT_REMINDER_META: Record<EventReminder, { label: string; minutes: number }> = {
  "1d":  { label: "1 dia antes",      minutes: 60 * 24 },
  "1h":  { label: "1 hora antes",     minutes: 60 },
  "15m": { label: "15 minutos antes", minutes: 15 },
};

