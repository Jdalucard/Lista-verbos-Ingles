import { VERBS } from '../data/verbs.js';
import { lc, first, future, examples } from './utils.js';

/* ================= APRENDER ================= */
function initLearn(){
  let cur = VERBS.findIndex(v=>first(v.s)==='eat'); if(cur<0) cur=0;

  function renderVerb(i){
    cur = (i + VERBS.length) % VERBS.length;
    const v = VERBS[cur], ex = examples(v);
    const isReg = v.t === 'R';
    document.getElementById('verbDetail').innerHTML = `
      <div class="verb-head">
        <span class="verb-word">${lc(v.s)}</span>
        <span class="pill ${v.t}">${isReg?'Regular':'Irregular'}</span>
        <span class="muted">#${v.n} de 486</span>
      </div>
      <div class="verb-mean">${v.m}</div>
      <table class="tenses">
        <tr><th>Tiempo</th><th>Forma</th></tr>
        <tr><td class="tname">Presente simple<small>hábitos y rutinas</small></td>
            <td><span class="form-word">${lc(v.s)}</span> <span class="muted">· she/he/it → <b>${lc(v.th)}</b></span><div class="ex">${ex.pres}</div></td></tr>
        <tr><td class="tname">Pasado simple<small>acciones terminadas</small></td>
            <td><span class="form-word">${lc(v.p)}</span><div class="ex">${ex.past}</div></td></tr>
        <tr><td class="tname">Futuro<small>planes y predicciones</small></td>
            <td><span class="form-word">${future(v)}</span><div class="ex">${ex.fut}</div></td></tr>
        <tr><td class="tname">Gerundio (-ing)<small>acción en progreso</small></td>
            <td><span class="form-word">${lc(v.g)}</span><div class="ex">${ex.cont}</div></td></tr>
        <tr><td class="tname">Participio pasado<small>tiempos perfectos</small></td>
            <td><span class="form-word">${lc(v.pp)}</span><div class="ex">${ex.perf}</div></td></tr>
      </table>
      <div class="note">${isReg
        ? `💡 <b>Verbo regular:</b> su pasado y participio se forman agregando <b>-ed</b> (${lc(v.s)} → ${lc(v.p)}). Si memorizas la regla, ¡ya conoces dos formas gratis!`
        : `⚠️ <b>Verbo irregular:</b> su pasado (<b>${lc(v.p)}</b>) y participio (<b>${lc(v.pp)}</b>) no siguen la regla de -ed. Hay que memorizarlos: repítelos en voz alta como un trío: «${lc(v.s)} – ${first(v.p)} – ${first(v.pp)}».`}
      </div>`;
  }
  document.getElementById('prevVerb').onclick = ()=>renderVerb(cur-1);
  document.getElementById('nextVerb').onclick = ()=>renderVerb(cur+1);
  document.getElementById('randVerb').onclick = ()=>renderVerb(Math.floor(Math.random()*VERBS.length));

  const sInput = document.getElementById('searchVerb'), sList = document.getElementById('suggList');
  sInput.addEventListener('input', ()=>{
    const q = sInput.value.trim().toLowerCase();
    if(!q){ sList.style.display='none'; return; }
    const hits = VERBS.filter(v => lc(v.s).startsWith(q) || lc(v.m).includes(q)).slice(0,8);
    if(!hits.length){ sList.style.display='none'; return; }
    sList.innerHTML = hits.map(v=>`<button data-n="${v.n}"><b>${lc(v.s)}</b> — ${v.m}</button>`).join('');
    sList.style.display='block';
    sList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      renderVerb(VERBS.findIndex(v=>v.n==b.dataset.n));
      sList.style.display='none'; sInput.value='';
    });
  });
  document.addEventListener('click', e=>{ if(!e.target.closest('.sugg')) sList.style.display='none'; });
  renderVerb(cur);
}

export { initLearn };
