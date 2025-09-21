// === Supabase Client (GitHub Pages / ESM) ===
// Substitua pelos seus valores do projeto
export const SUPABASE_URL  = "https://nmfjhprbjsnwhxpnjuyn.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZmpocHJianNud2h4cG5qdXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxMzcyMjgsImV4cCI6MjAyMTcxMzIyOH0.C-Ph-wh1wu5szc8q7eW8_3slUravPvWtUidhcSmn12w";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Nota: No painel do Supabase (Authentication → URL Configuration),
// inclua a URL completa do seu GitHub Pages (ex.: https://tcavalcantidesenv.github.io/condomi/app/index.html)
// em "Redirect URLs", pois usamos emailRedirectTo dinâmico nas telas de registro.

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // chave de storage específica do app (evita colisão com outros projetos na mesma origem):
    storageKey: "condo-app-session"
  },
  global: { headers: { "x-client": "condo-app" } }
});

// Helper: garante que só chamamos RPC autenticado quando há sessão
async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.warn("getSession error:", error);
  return session;
}

// Utilitário: obtém papéis efetivos (definido no SQL) ou [] se não autenticado
export async function fetchEffectiveRoles() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase.rpc("auth_effective_roles");
  if (error) {
    console.warn("auth_effective_roles RPC error:", error);
    return [];
  }
  // Normaliza para array de string
  return Array.isArray(data) ? data.map(String) : [];
}
