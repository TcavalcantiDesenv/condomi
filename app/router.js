import { fetchEffectiveRoles } from "./supabaseClient.js";

let cfg = null;

function resolveURL(pathLike) {
  // Garante resolução relativa ao arquivo atual (inclui subpath do GitHub Pages)
  return new URL(pathLike, document.baseURI).href;
}

function currentPath() {
  // Extrai a parte após o '#', garantindo sempre o formato "/..."
  const h = (location.hash || "").replace(/^#/, "");
  return h ? h : "/";
}

export function initRouter(config){
  cfg = config;

  // Navegação inicial
  navigate(currentPath(), true);

  // Para rotas com hash, o evento correto é 'hashchange'
  window.addEventListener("hashchange", () => {
    navigate(currentPath(), true);
  });
}

export async function navigate(path, silent = false){
  if (!cfg) return;

  // Normaliza: sempre começar com "/"
  if (!path.startsWith("/")) path = "/" + path.replace(/^\/+/, "");

  const def = cfg.routes[path] || cfg.routes[cfg.fallback];
  if (!def){
    if (!silent) location.hash = "#"+cfg.fallback;
    return;
  }

  // Guard por papéis (se houver)
  if (def.roles){
    try{
      const roles = await fetchEffectiveRoles();
      const ok = Array.isArray(roles) && roles.some(r => def.roles.includes(r));
      if (!ok){
        cfg.target.innerHTML = `<div class="guard-msg">Você não tem permissão para acessar esta área.</div>`;
        if (!silent) location.hash = "#/";
        return;
      }
    }catch(err){
      cfg.target.innerHTML = `<div class="guard-msg">Não foi possível verificar suas permissões.</div>`;
      return;
    }
  }

  // Carrega HTML fragment (resolvido contra o subpath correto)
  let html = "";
  try{
    const htmlURL = resolveURL(def.html);
    const res = await fetch(htmlURL, { cache:"no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  }catch(err){
    cfg.target.innerHTML = `<div class="guard-msg">Erro ao carregar a view: ${def.html}. ${String(err)}</div>`;
    return;
  }

  cfg.target.innerHTML = html;

  // Carrega JS da view (se existir), com cache-busting leve
  if (def.js){
    try{
      const jsURL = new URL(def.js, document.baseURI);
      jsURL.searchParams.set("v", Date.now());
      await import(jsURL.href);
    }catch(err){
      // Mantém o HTML no ar e apenas informa falha do módulo
      console.error("Falha ao carregar módulo da view:", def.js, err);
    }
  }

  // Atualiza hash somente se necessário (evita loops)
  if (!silent) {
    const targetHash = "#"+path;
    if (location.hash !== targetHash) location.hash = targetHash;
  }

  // UX: sobe para o topo ao trocar de view
  try { window.scrollTo({ top:0, behavior:"instant" }); } catch {}
}
