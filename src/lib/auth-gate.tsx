import { useEffect, useState } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState<"checking" | "ready">("checking");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(!!session);
      setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setStatus("ready");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!authed && !isPublic) {
      router.navigate({ to: "/login" });
    } else if (authed && (pathname === "/login" || pathname === "/signup")) {
      router.navigate({ to: "/" });
    }
  }, [status, authed, pathname, router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.has(pathname);
  if (!authed && !isPublic) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Redirecionando…</div>
      </div>
    );
  }

  return <>{children}</>;
}
