import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import zelonLogo from "@/assets/zelon.png";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Criar conta — Zelon" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe seu nome completo");
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name: name.trim(), phone: phone.trim() },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/" });
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card rounded-3xl p-6 w-full max-w-sm space-y-3">
        <div className="flex flex-col items-center text-center gap-2">
          <img src={zelonLogo} alt="Zelon" className="h-10 w-auto mix-blend-multiply dark:mix-blend-screen object-fill text-lg" />
          <h1 className="text-lg font-semibold">Criar conta</h1>
          <p className="text-xs text-muted-foreground">Seu espaço privado para tarefas e projetos</p>
        </div>
        <div>
          <Label className="text-xs">Nome completo</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">E-mail</Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">Telefone</Label>
          <Input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000" />
        </div>
        <div>
          <Label className="text-xs">Senha</Label>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">Confirmar senha</Label>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-neon text-neon-foreground hover:brightness-110">
          {loading ? "Criando…" : "Criar conta"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          Já tem conta? <Link to="/login" className="hover:text-foreground underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
