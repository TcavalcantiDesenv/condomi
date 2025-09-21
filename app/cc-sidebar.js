const tpl = document.createElement('template');
tpl.innerHTML = `
<style>
:host{
  display:block; background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  border-right:1px solid rgba(255,255,255,.08);
}
.nav{ position:sticky; top:0; height:100vh; padding:12px; display:flex; flex-direction:column; gap:8px }
.brand{ display:flex; align-items:center; gap:10px; color:#E8ECF4; font-weight:800; margin-bottom:8px }
.toggle{ border:1px solid #ffffff22; background:#ffffff10; color:#fff; border-radius:10px; padding:8px 10px; cursor:pointer; }
.group{ margin-top:6px }
.group h4{ margin:8px 0 6px; color:#A3ADC2; font-size:12px; letter-spacing:.08em; text-transform:uppercase }
a.item{ display:flex; align-items:center; gap:8px; color:#E8ECF4; text-decoration:none; padding:10px 10px; border-radius:10px }
a.item:hover{ background:#ffffff10 }
a.item.active{ background:#8B5CF622; outline:1px solid #8B5CF655 }
.sub{ margin-left:8px; padding-left:8px; border-left:1px dashed #ffffff22; display:grid; gap:4px }
@media (max-width:980px){
  .nav{ position:fixed; left:0; top:0; width:min(76vw, 300px); transform:translateX(-102%); transition:transform .2s ease; background:#0F1420; z-index:5 }
  :host([open]) .nav{ transform:none }
}
.scrim{ display:none } :host([open]) .scrim{ position:fixed; inset:0; background:#0008; display:block; z-index:4 }
</style>
<div class="scrim"></div>
<nav class="nav" role="navigation" aria-label="Menu">
  <div class="brand">Menu</div>
  <button class="toggle" id="btnToggle">☰</button>

  <div class="group">
    <h4>Geral</h4>
    <a href="/" data-path="/" class="item">Dashboard</a>
  </div>

  <div class="group">
    <h4>Operacional</h4>
    <div class="sub">
      <a href="/aprovacoes" data-path="/aprovacoes" class="item">Aprovações</a>
      <!-- outras entradas futuras -->
    </div>
  </div>
</nav>
`;

class CcSidebar extends HTMLElement{
  static get observedAttributes(){ return ["open"]; }
  constructor(){
    super(); this.attachShadow({mode:"open"}).appendChild(tpl.content.cloneNode(true));
  }
  connectedCallback(){
    const nav = this.shadowRoot.querySelector(".nav");
    const scrim = this.shadowRoot.querySelector(".scrim");
    const toggle = this.shadowRoot.getElementById("btnToggle");

    // toggle mobile
    toggle.addEventListener("click", ()=> this.toggle());
    scrim.addEventListener("click", ()=> this.removeAttribute("open"));

    // intercepta navegação
    nav.addEventListener("click",(e)=>{
      const a = e.target.closest("a.item"); if(!a) return;
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("cc:navigate", { bubbles:true, composed:true, detail:{ path:a.dataset.path } }));
      this.removeAttribute("open");
      // marca ativo
      nav.querySelectorAll("a.item").forEach(n=>n.classList.toggle("active", n===a));
    });

    // abre automaticamente no desktop: nada a fazer; mobile usa toggle
  }
  toggle(){ this.hasAttribute("open") ? this.removeAttribute("open") : this.setAttribute("open",""); }
}
customElements.define("cc-sidebar", CcSidebar);
