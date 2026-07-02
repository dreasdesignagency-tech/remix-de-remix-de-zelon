import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zelonLogo from "@/assets/zelon.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — Zelon" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="glass-card rounded-3xl p-6 w-full max-w-sm space-y-4"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <img src={zelonLogo} alt="Zelon" className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen object-fill text-lg" />
          <h1 className="text-lg font-semibold">Entrar</h1>
          <p className="text-xs text-muted-foreground">Acesse seu espaço no Zelon</p>
        </div>
        <div>
          <Label className="text-xs">E-mail</Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">Senha</Label>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-neon text-neon-foreground hover:brightness-110">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-foreground">Esqueci a senha</Link>
          <Link to="/signup" className="hover:text-foreground">Criar conta</Link>
        </div>
      </form>
    </div>
  );
}
