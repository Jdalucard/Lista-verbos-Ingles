import { VERBS } from '../data/verbs.js';
import { store, shuffle, lc, future } from './utils.js';

/* ================= TARJETAS ================= */
let deck=[], deckTotal=0, flipped=false, learned=new Set(store.get('learned')||[]);
const persistLearned = ()=> { store.set('learned', [...learned]); document.dispatchEvent(new CustomEvent('learned-changed')); };

function startDeck(){
  const type = document.getElementById('fcType').value;
  const size = +document.getElementById('fcSize').value;
  let pool = VERBS.filter(v => (type==='ALL'||v.t===type) && !learned.has(v.n));
  if(pool.length < size) { learned.clear(); persistLearned(); pool = VERBS.filter(v => type==='ALL'||v.t===type); }
  deck = shuffle(pool).slice(0,size);
  deckTotal = deck.length; flipped=false;
  renderCard();
}
function renderCard(){
  const area = document.getElementById('fcArea');
  document.getElementById('fcBar').style.width = deckTotal? (100*(deckTotal-deck.length)/deckTotal)+'%' : '0%';
  if(!deck.length){
    area.innerHTML = `<div class="box done-msg">
      <div style="font-size:40px">🎉</div>
      <div class="big">¡Bloque completado!</div>
      <p class="muted" style="margin:8px 0 16px">Llevas <b>${learned.size}</b> de ${VERBS.length} verbos marcados como aprendidos.</p>
      <button class="btn primary" id="fcNextBlock">Siguiente bloque</button></div>`;
    document.getElementById('fcNextBlock').onclick = startDeck;
    return;
  }
  const v = deck[0], dir = document.getElementById('fcDir').value;
  const front = dir==='EN' ? lc(v.s) : v.m;
  const backTitle = dir==='EN' ? v.m : lc(v.s);
  area.innerHTML = `
    <div class="fcard" id="fcard" tabindex="0" role="button" aria-label="Voltear tarjeta">
      <span class="side-label">${flipped?'Respuesta':'Pregunta'} · quedan ${deck.length}</span>
      <div class="big">${flipped? backTitle : front}</div>
      ${flipped? `<div class="answer">
        <div class="row"><span class="lbl">Tipo</span><span class="pill ${v.t}">${v.t==='R'?'Regular':'Irregular'}</span></div>
        <div class="row"><span class="lbl">Presente</span><span class="frm">${lc(v.s)}</span> <span class="muted">(she ${lc(v.th)})</span></div>
        <div class="row"><span class="lbl">Pasado</span><span class="frm">${lc(v.p)}</span></div>
        <div class="row"><span class="lbl">Participio</span><span class="frm">${lc(v.pp)}</span></div>
        <div class="row"><span class="lbl">Futuro</span><span class="frm">${future(v)}</span></div>
      </div>` : `<p class="muted" style="margin-top:14px">¿Recuerdas su ${dir==='EN'?'significado y sus formas':'verbo en inglés'}? Toca para comprobar.</p>`}
    </div>
    <div class="card-btns" ${flipped?'':'style="visibility:hidden"'}>
      <button class="review" id="fcReview">↩ Repasar luego</button>
      <button class="know" id="fcKnow">✓ ¡Ya me la sé!</button>
    </div>`;
  document.getElementById('fcard').onclick = ()=>{ flipped=!flipped; renderCard(); };
  if(flipped){
    document.getElementById('fcKnow').onclick = e=>{ e.stopPropagation(); learned.add(v.n); persistLearned(); deck.shift(); flipped=false; renderCard(); };
    document.getElementById('fcReview').onclick = e=>{ e.stopPropagation(); deck.push(deck.shift()); flipped=false; renderCard(); };
  }
}

function initFlashcards(){
  document.getElementById('fcStart').onclick = startDeck;
  document.getElementById('fcDir').onchange = ()=>{ flipped=false; renderCard(); };
  document.addEventListener('keydown', e=>{
    if(e.code==='Space' && document.getElementById('p-tarjetas').classList.contains('on') && deck.length){
      e.preventDefault(); flipped=!flipped; renderCard();
    }
  });
  startDeck();
}

export { learned, startDeck, persistLearned, initFlashcards };
