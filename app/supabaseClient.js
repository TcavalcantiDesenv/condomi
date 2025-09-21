// Substitua pelos seus valores do projeto
export const SUPABASE_URL  = "https://nmfjhprbjsnwhxpnjuyn.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZmpocHJianNud2h4cG5qdXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxMzcyMjgsImV4cCI6MjAyMTcxMzIyOH0.C-Ph-wh1wu5szc8q7eW8_3slUravPvWtUidhcSmn12w";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: { headers: { "x-client": "condo-app" } }
});

// Utilitário: obtém papéis efetivos após login (definido no SQL)
export async function fetchEffectiveRoles() {
  const { data, error } = await supabase.rpc("auth_effective_roles");
  if (error) console.warn("auth_effective_roles", error);
  return data || [];
}
