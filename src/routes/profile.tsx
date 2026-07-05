import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Perfil — Zelon" }] }),
});


const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function ProfilePage() {
  const profile = useApp((s) => s.profile);
  const userId = useApp((s) => s.userId);
  const updateProfile = useApp((s) => s.updateProfile);

  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio);
  const [weeklyGoal, setWeeklyGoal] = useState(profile.weeklyGoal);
  const [preview, setPreview] = useState<string | undefined>(profile.avatar);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use uma imagem PNG, JPG ou WEBP");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    if (!userId) {
      toast.error("Faça login para salvar a foto");
      return;
    }
    // instant local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      updateProfile({ avatar: url });
      toast.success("Foto atualizada");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a foto");
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    updateProfile({
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim(),
      weeklyGoal: Math.max(1, Number(weeklyGoal) || 1),
    });
    toast.success("Perfil atualizado");
  };


  return (
    <AppLayout title="Perfil" subtitle="Personalize sua conta">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 max-w-4xl">
        <div className="glass-card rounded-3xl p-5 flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-accent to-primary p-1">
              {preview ? (
                <img src={preview} alt={name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <button disabled={uploading} onClick={() => inputRef.current?.click()} className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-neon text-neon-foreground flex items-center justify-center glow-neon hover:brightness-110 disabled:opacity-60">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>

            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </div>
          <h2 className="mt-4 font-semibold">{name || "Sem nome"}</h2>
          <p className="text-xs text-muted-foreground">{role || "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-3">PNG, JPG ou WEBP até 5MB</p>
        </div>

        <div className="glass-card rounded-3xl p-5 lg:col-span-2 space-y-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Área de atuação</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Designer, Dev, Redator..." />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input value={profile.email ?? ""} disabled />
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000" />
          </div>
          <div>
            <Label className="text-xs">Bio curta</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Meta semanal de tarefas</Label>
            <Input type="number" min={1} value={weeklyGoal} onChange={(e) => setWeeklyGoal(Number(e.target.value))} />
          </div>
          <div className="pt-2">
            <Button onClick={save} className="bg-neon text-neon-foreground hover:brightness-110">
              <Save className="w-4 h-4 mr-2" /> Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
