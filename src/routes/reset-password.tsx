import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zelonLogo from "@/assets/zelon.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  head: () => ({ meta: [{ title: "Nova senha — Zelon" }] }),
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo 6 caracteres");
    if (password !== confirm) return toast.error("Senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <img src={zelonLogo} alt="Zelon" className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen object-fill text-lg" />
          <h1 className="text-lg font-semibold">Definir nova senha</h1>
          <p className="text-xs text-muted-foreground">Escolha uma senha segura</p>
        </div>
        <div>
          <Label className="text-xs">Nova senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">Confirmar senha</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-neon text-neon-foreground hover:brightness-110">
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
