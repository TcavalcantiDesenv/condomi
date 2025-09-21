import { fetchEffectiveRoles } from "./supabaseClient.js";

let cfg = null;
export function initRouter(config){
  cfg = config;
  // navegação inicial
  const path = location.hash?.slice(1) || "/";
  navigate(path, true);

  // back/forward
  window.addEventListener("popstate", ()=> {
    const p = location.hash?.slice(1) || "/";
    navigate(p, true);
  });
}

export async function navigate(path, silent=false){
  if (!cfg) return;
  const def = cfg.routes[path] || cfg.routes[cfg.fallback];
  if (!def) return;

  // guard por papéis (se houver)
  if (def.roles){
    const roles = await fetchEffectiveRoles();
    const ok = roles.some(r => def.roles.includes(r));
    if (!ok){
      cfg.target.innerHTML = `<div class="guard-msg">Você não tem permissão para acessar esta área.</div>`;
      if (!silent) location.hash = "#/";
      return;
    }
  }

  // carrega HTML fragment
  const html = await fetch(def.html, { cache:"no-store" }).then(r=>r.text());
  cfg.target.innerHTML = html;

  // carrega JS da view (se existir)
  if (def.js){
    // garante recarregar o módulo (cache-busting leve)
    const url = new URL(def.js, location.origin); url.searchParams.set("v", Date.now());
    await import(url.href);
  }

  if (!silent) location.hash = "#" + path;
}
