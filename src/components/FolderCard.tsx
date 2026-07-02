import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEvent } from "react";

interface FolderCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
  icon?: ReactNode;
  accent?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FolderCard({
  title,
  subtitle,
  meta,
  description,
  icon,
  accent,
  onClick,
  children,
  actions,
  className,
}: FolderCardProps) {
  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "folder-card group cursor-pointer flex flex-col min-h-[160px]",
        accent && "is-accent",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0",
              accent
                ? "bg-white/20 text-white"
                : "bg-card-soft text-foreground/70"
            )}
          >
            {icon}
          </div>
        )}
        {actions && (
          <div
            onClick={stop}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
          >
            {actions}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <h3
          className={cn(
            "font-semibold text-sm leading-tight truncate",
            accent ? "text-white" : "text-foreground"
          )}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className={cn(
              "text-[11px] mt-0.5 truncate",
              accent ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "text-[11px] mt-1 line-clamp-2",
              accent ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        )}
        {children}
        {meta && (
          <p
            className={cn(
              "text-[10px] mt-2",
              accent ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {meta}
          </p>
        )}
      </div>
    </motion.div>
  );
}
