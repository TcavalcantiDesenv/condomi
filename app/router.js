// roteador simples baseado em hash
export function initRouter({ routes, target, fallback }){
  async function load(){
    const key = location.hash || fallback;
    const def = routes[key] || routes[fallback];
    try{
      const html = await fetch(def.html, { cache:'no-store' }).then(r=>r.text());
      target.innerHTML = html;
    }catch(err){
      target.innerHTML = `<div class="placeholder">Falha ao carregar view: ${key}</div>`;
    }
  }
  window.addEventListener('hashchange', load);
  load();
}

export const navigate = (hash)=>{ location.hash = hash; };
