// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Detecta se o build está rodando na Vercel
const isVercel = process.env.VERCEL === "1";

// Config TanStack Start: entry "server" aponta para src/server.ts (SSR error wrapper).
// Na Vercel usamos o preset nativo do Nitro que gera o handler automaticamente,
// então não forçamos o entry customizado — o Nitro cuida do servidor.
// No Lovable/Cloudflare Workers mantemos o entry original.
const tanstackStartOptions = isVercel
  ? {}
  : {
      server: { entry: "server" },
    };

// Nitro preset:
//  • "vercel"        → deploy na Vercel (serverless functions + static)
//  • true / omitido  → Lovable detecta sandbox e aplica cloudflare-module
//    ou defaultPreset cloudflare-module em builds locais
const nitroOptions = isVercel ? { preset: "vercel" } : true;

export default defineConfig({
  tanstackStart: tanstackStartOptions,
  nitro: nitroOptions,
});
