import { supabase } from "../supabaseClient.js";

const $  = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);

const tbody = $("#tbody");
const dlg   = $("#dlg"), dlgTitle=$("#dlgTitle"), dlgBody=$("#dlgBody");
const toast = (m)=>{ const t=$("#toast"); t.textContent=m; t.style.display="block"; setTimeout(()=>t.style.display="none", 2200); };

const state = { items:[], sub:null, pageSize:50 };

const fmt = (iso)=> { try{ return new Date(iso).toLocaleString('pt-BR'); }catch{ return iso } };

async function load(){
  const q = $("#q").value.trim();
  const role = $("#fRole").value;
  const status = $("#fStatus").value;
  const [col, dir] = $("#fSort").value.split(".");

  let query = supabase.from("registration_requests")
    .select("*", { count:"exact" })
    .order(col, { ascending: dir!=="desc" })
    .range(0, state.pageSize-1);

  if (role)   query = query.eq("role_requested", role);
  if (status) query = query.eq("status", status);
  if (q)      query = query.or(`email.ilike.%${q}%,payload::text.ilike.%${q}%`);

  const { data, error } = await query;
  if (error){ tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444;padding:14px">Erro: ${error.message}</td></tr>`; return; }

  state.items = data;
  render();
}

function render(){
  if(!state.items.length){ tbody.innerHTML = `<tr><td colspan="6" style="color:#A3ADC2;padding:14px">Nenhum pedido.</td></tr>`; return; }
  tbody.innerHTML = state.items.map(r => `
    <tr data-id="${r.id}">
      <td>${fmt(r.created_at)}</td>
      <td>${r.email}</td>
      <td><b style="color:#c9b6ff">${r.role_requested}</b></td>
      <td><b style="color:${r.status==='PENDING'?'#F59E0B':(r.status==='APPROVED'?'#22C55E':'#EF4444')}">${r.status}</b></td>
      <td>${r.reason?`<span style="font-size:12px;color:#A3ADC2">motivo: ${r.reason}</span>`:''}</td>
      <td>
        <button class="btnApprove" style="background:linear-gradient(90deg,#6C2BD9,#8B5CF6);color:#fff;border:none;border-radius:10px;padding:8px 10px">Aprovar</button>
        <button class="btnReject"  style="background:#12182A;border:1px solid #223049;color:#E8ECF4;border-radius:10px;padding:8px 10px">Rejeitar</button>
        <button class="btnView"    style="background:#12182A;border:1px solid #223049;color:#E8ECF4;border-radius:10px;padding:8px 10px">Ver</button>
      </td>
    </tr>
  `).join("");
}

async function subscribe(){
  if (state.sub) supabase.removeChannel(state.sub);
  state.sub = supabase.channel("regreq-shell")
    .on("postgres_changes", { event:"*", schema:"public", table:"registration_requests" }, payload=>{
      const { eventType, new:row, old } = payload;
      if (eventType==="INSERT"){ state.items.unshift(row); }
      if (eventType==="UPDATE"){ const i=state.items.findIndex(x=>x.id===row.id); if(i>=0) state.items[i]=row; }
      if (eventType==="DELETE"){ const i=state.items.findIndex(x=>x.id===old.id); if(i>=0) state.items.splice(i,1); }
      render();
    }).subscribe();
}

async function approveOrReject(id, accept){
  let reason=null;
  if(!accept){
    dlgTitle.textContent = "Rejeitar solicitação";
    dlgBody.innerHTML = `<label style="color:#A3ADC2">Motivo (opcional)</label>
                         <div style="background:#12182A;border:1px solid #223049;border-radius:10px;padding:8px 10px;margin-top:6px">
                           <input id="reason" placeholder="Ex.: dados inconsistentes" style="background:transparent;border:none;outline:none;color:#E8ECF4;width:100%"/>
                         </div>`;
    const r = await dlg.showModal(); if (r!=="ok") return;
    reason = (document.getElementById("reason").value||"").trim();
  }
  const { error } = await supabase.rpc("approve_request", { p_request_id:id, p_accept:accept, p_reason: reason||null });
  if (error){ toast("Erro: "+error.message); return; }
  toast(accept ? "Aprovado!" : "Rejeitado.");
}

tbody.addEventListener("click",(e)=>{
  const tr = e.target.closest("tr"); if(!tr) return;
  const id = tr.dataset.id;
  const row = state.items.find(x=>x.id===id);
  if (e.target.classList.contains("btnApprove")) approveOrReject(id,true);
  if (e.target.classList.contains("btnReject"))  approveOrReject(id,false);
  if (e.target.classList.contains("btnView")){
    dlgTitle.textContent = "Detalhes do pedido";
    dlgBody.innerHTML = `<div style="color:#A3ADC2">E-mail: <b>${row.email}</b> • Tipo: <b>${row.role_requested}</b> • Status: <b>${row.status}</b></div>
                         <pre style="margin-top:8px;background:#0b1220;border:1px solid #19233a;border-radius:8px;padding:8px;max-height:260px;overflow:auto;color:#d8e1ff">${JSON.stringify(row.payload,null,2)}</pre>`;
    dlg.showModal();
  }
});

// filtros com debounce
const debounce=(fn,ms=350)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
$("#q").addEventListener("input", debounce(load));
$("#fRole").addEventListener("change", load);
$("#fStatus").addEventListener("change", load);
$("#fSort").addEventListener("change", load);
$("#btnRefresh").addEventListener("click", load);

// boot
await load();
await subscribe();
