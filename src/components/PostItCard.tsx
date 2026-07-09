import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEvent } from "react";

interface PostItCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
  variant?: number;
  onClick?: () => void;
  actions?: ReactNode;
  className?: string;
}

// Post-it palettes using the app's semantic tokens (electric/primary/neon/orange-accent)
const VARIANTS = [
  {
    bg: "bg-[color-mix(in_oklab,var(--electric)_28%,var(--card))]",
    tape: "bg-[color-mix(in_oklab,var(--electric)_55%,transparent)]",
    tilt: "-rotate-2",
    ring: "ring-electric/30",
  },
  {
    bg: "bg-[color-mix(in_oklab,var(--orange-accent)_30%,var(--card))]",
    tape: "bg-[color-mix(in_oklab,var(--orange-accent)_55%,transparent)]",
    tilt: "rotate-1",
    ring: "ring-orange-accent/30",
  },
  {
    bg: "bg-[color-mix(in_oklab,var(--neon)_25%,var(--card))]",
    tape: "bg-[color-mix(in_oklab,var(--neon)_55%,transparent)]",
    tilt: "-rotate-1",
    ring: "ring-neon/30",
  },
  {
    bg: "bg-[color-mix(in_oklab,var(--primary)_22%,var(--card))]",
    tape: "bg-[color-mix(in_oklab,var(--primary)_55%,transparent)]",
    tilt: "rotate-2",
    ring: "ring-primary/30",
  },
];

export function PostItCard({
  title,
  subtitle,
  meta,
  description,
  variant = 0,
  onClick,
  actions,
  className,
}: PostItCardProps) {
  const v = VARIANTS[variant % VARIANTS.length];
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, rotate: 0 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, rotate: 0, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer select-none group",
        "aspect-[1/1] min-h-[180px] p-4 pt-6 flex flex-col",
        "rounded-[6px] shadow-[0_10px_25px_-8px_rgba(0,0,0,0.45),0_2px_6px_-2px_rgba(0,0,0,0.35)]",
        "ring-1 text-foreground",
        v.bg,
        v.ring,
        v.tilt,
        className
      )}
    >
      {/* Tape */}
      <div
        className={cn(
          "absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-[2px] opacity-80 shadow-sm",
          v.tape
        )}
      />

      {actions && (
        <div
          onClick={stop}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
        >
          {actions}
        </div>
      )}

      <h3 className="font-semibold text-sm leading-tight line-clamp-2 tracking-tight">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[11px] mt-1 font-medium opacity-80">{subtitle}</p>
      )}
      {description && (
        <p className="text-[11px] mt-2 line-clamp-4 opacity-75 whitespace-pre-wrap">
          {description}
        </p>
      )}
      {meta && (
        <p className="text-[10px] mt-auto pt-2 opacity-60 italic">{meta}</p>
      )}
    </motion.div>
  );
}
