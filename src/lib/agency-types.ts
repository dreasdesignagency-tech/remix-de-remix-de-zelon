export type DemandStatus = "a_fazer" | "em_andamento" | "revisao" | "ajustes" | "finalizado";
export type DemandPriority = "baixa" | "media" | "alta" | "urgente";
export type DemandType =
  | "post_estatico" | "carrossel" | "reels" | "stories"
  | "copy" | "planejamento" | "roteiro" | "captacao"
  | "edicao_video" | "identidade_visual" | "landing_page" | "outro";
export type Sector = "social_media" | "audiovisual" | "design" | "planejamento" | "copy" | "diretoria";
export type UserRole =
  | "diretor"
  | "social_media"
  | "designer_grafico"
  | "designer_web"
  | "videomaker"
  | "copywriter";

export interface DemandRow {
  id: string;
  title: string;
  briefing: string | null;
  type: DemandType;
  status: DemandStatus;
  priority: DemandPriority;
  sector: Sector;
  deadline: string | null;
  position: number;
  links: Record<string, string>;
  internal_notes: string | null;
  client_id: string | null;
  assignee_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  company: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  status: "ativo" | "pausado" | "encerrado";
  notes: string | null;
  created_at: string;
}

export interface AgencyProfileRow {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: UserRole;
  status: "ativo" | "inativo";
}

export const STATUS_META: Record<DemandStatus, { label: string; color: string }> = {
  a_fazer:      { label: "A fazer",      color: "oklch(0.7 0.04 270)" },
  em_andamento: { label: "Em andamento", color: "oklch(0.62 0.22 265)" },
  revisao:      { label: "Em revisão",   color: "oklch(0.78 0.17 55)" },
  ajustes:      { label: "Ajustes",      color: "oklch(0.65 0.22 25)" },
  finalizado:   { label: "Finalizado",   color: "oklch(0.85 0.21 125)" },
};

export const PRIORITY_META: Record<DemandPriority, { label: string; color: string }> = {
  baixa:   { label: "Baixa",   color: "oklch(0.7 0.1 200)" },
  media:   { label: "Média",   color: "oklch(0.78 0.17 55)" },
  alta:    { label: "Alta",    color: "oklch(0.7 0.2 35)" },
  urgente: { label: "Urgente", color: "oklch(0.6 0.25 25)" },
};

export const TYPE_LABEL: Record<DemandType, string> = {
  post_estatico: "Post estático",
  carrossel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
  copy: "Copy",
  planejamento: "Planejamento",
  roteiro: "Roteiro",
  captacao: "Captação",
  edicao_video: "Edição de vídeo",
  identidade_visual: "Identidade visual",
  landing_page: "Landing page",
  outro: "Outro",
};

export const SECTOR_LABEL: Record<Sector, string> = {
  social_media: "Social Media",
  audiovisual: "Audiovisual",
  design: "Design",
  planejamento: "Planejamento",
  copy: "Copy",
  diretoria: "Diretoria",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  diretor: "Diretor",
  social_media: "Social Media",
  designer_grafico: "Designer Gráfico",
  designer_web: "Designer Web",
  videomaker: "Videomaker",
  copywriter: "Copywriter",
};

export const STATUS_ORDER: DemandStatus[] = ["a_fazer", "em_andamento", "revisao", "ajustes", "finalizado"];

export function roleToSector(role: UserRole): Sector | null {
  switch (role) {
    case "diretor": return "diretoria";
    case "social_media": return "social_media";
    case "designer_grafico":
    case "designer_web": return "design";
    case "videomaker": return "audiovisual";
    case "copywriter": return "copy";
    default: return null;
  }
}

export const isDirector = (role?: UserRole) => role === "diretor";
export const isLeader = (_role?: UserRole) => false;
export const canCreateDemand = (role?: UserRole) => isDirector(role);
