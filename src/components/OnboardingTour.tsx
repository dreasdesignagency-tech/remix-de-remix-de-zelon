import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  UserCircle2,
  Users,
  FolderKanban,
  ListChecks,
  CalendarDays,
  StickyNote,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STORAGE_PREFIX = "zelon:onboarding:done:";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: UserCircle2,
    title: "Bem-vindo(a) ao Zelon 👋",
    description:
      "Este é o passo a passo rápido para você começar. Em poucos cliques seu espaço estará pronto.",
  },
  {
    icon: UserCircle2,
    title: "1. Complete seu perfil",
    description:
      "Adicione seu nome e uma foto. Eles ficam salvos na sua conta e aparecem no topo do sistema.",
    action: { label: "Ir para o perfil", to: "/profile" },
  },
  {
    icon: Users,
    title: "2. Cadastre seus clientes",
    description:
      "Centralize contatos, empresa, WhatsApp e links importantes de cada cliente.",
    action: { label: "Abrir clientes", to: "/clients" },
  },
  {
    icon: FolderKanban,
    title: "3. Crie seus projetos",
    description:
      "Organize entregas por projeto, com status, prazo e vínculo ao cliente.",
    action: { label: "Abrir projetos", to: "/projects" },
  },
  {
    icon: ListChecks,
    title: "4. Registre tarefas",
    description:
      "Quebre o trabalho em tarefas com prioridade e data. Elas aparecem na agenda automaticamente.",
    action: { label: "Abrir tarefas", to: "/tasks" },
  },
  {
    icon: CalendarDays,
    title: "5. Marque compromissos",
    description:
      "Use a agenda para reuniões, prazos e chamadas. Tudo em um só lugar.",
    action: { label: "Abrir agenda", to: "/calendar" },
  },
  {
    icon: StickyNote,
    title: "6. Guarde ideias e anotações",
    description:
      "Use as anotações para briefings, referências e ideias rápidas.",
    action: { label: "Abrir anotações", to: "/notes" },
  },
  {
    icon: Check,
    title: "Tudo pronto! 🎉",
    description:
      "Você pode acessar novamente este guia a qualquer momento pelo botão de ajuda no seu perfil.",
  },
];

export function OnboardingTour() {
  const userId = useApp((s) => s.userId);
  const loaded = useApp((s) => s.loaded);
  const profile = useApp((s) => s.profile);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!loaded || !userId) return;
    const key = STORAGE_PREFIX + userId;
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(key);
    // Show for brand new users: no avatar and empty/default name
    const looksNew = !profile.avatar && (!profile.name || profile.name === "Usuário");
    if (!done && looksNew) {
      setStep(0);
      setOpen(true);
    }
  }, [loaded, userId, profile.avatar, profile.name]);

  const finish = () => {
    if (userId && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_PREFIX + userId, "1");
    }
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-accent to-primary flex items-center justify-center mb-2">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-neon" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            className="text-xs text-muted-foreground"
          >
            Pular
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            {current.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate({ to: current.action!.to });
                  setStep((s) => Math.min(STEPS.length - 1, s + 1));
                }}
              >
                {current.action.label}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish} className="bg-neon text-neon-foreground hover:brightness-110">
                Concluir <Check className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="bg-neon text-neon-foreground hover:brightness-110"
              >
                Próximo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function openOnboardingTour(userId: string | null) {
  if (!userId || typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + userId);
  window.location.reload();
}
