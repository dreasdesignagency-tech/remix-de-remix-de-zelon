import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zelonLogo from "@/assets/zelon.png";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
  head: () => ({ meta: [{ title: "Recuperar senha — Zelon" }] }),
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("E-mail enviado");
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <img src={zelonLogo} alt="Zelon" className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen object-fill text-lg" />
          <h1 className="text-lg font-semibold">Recuperar senha</h1>
          <p className="text-xs text-muted-foreground">Enviaremos um link para você criar uma nova senha</p>
        </div>
        <div>
          <Label className="text-xs">E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading || sent} className="w-full bg-neon text-neon-foreground hover:brightness-110">
          {sent ? "Enviado" : loading ? "Enviando…" : "Enviar link"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          <Link to="/login" className="hover:text-foreground underline">Voltar para entrar</Link>
        </p>
      </form>
    </div>
  );
}
