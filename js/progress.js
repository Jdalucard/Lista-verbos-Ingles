import { VERBS } from '../data/verbs.js';
import { store, lc } from './utils.js';
import { learned, startDeck, persistLearned } from './flashcards.js';
import { LQ, doneLessons, renderLessonNav } from './extras.js';

/* ---------- progreso global ---------- */
function updateGlobalProgress(){
  const n = learned.size, t = VERBS.length, pct = Math.round(100*n/t);
  document.getElementById('gbarFill').style.width = (100*n/t).toFixed(2) + '%';
  document.getElementById('gText').innerHTML = `<b>${n}</b> / ${t} dominados (${pct}%)`;
  const panel = document.getElementById('masteredPanel');
  if(panel.style.display !== 'none') renderMastered();
}
function renderMastered(){
  const panel = document.getElementById('masteredPanel');
  const list = VERBS.filter(v => learned.has(v.n));
  panel.innerHTML = list.length
    ? `<div class="muted" style="margin-bottom:10px">Verbos que ya dominas — toca ✕ para devolver alguno al estudio:</div>
       <div style="display:flex; flex-wrap:wrap; gap:6px">${list.map(v =>
         `<span class="mchip">${lc(v.s)}<button data-n="${v.n}" title="Quitar de dominados">✕</button></span>`).join('')}</div>`
    : '<span class="muted">Aún no has marcado verbos como dominados. Ve a <b>Tarjetas</b> y usa «✓ ¡Ya me la sé!» — aquí irán apareciendo.</span>';
  panel.querySelectorAll('button[data-n]').forEach(b => b.onclick = ()=>{
    learned.delete(+b.dataset.n); persistLearned(); renderMastered();
  });
}

function initProgress(){
  document.addEventListener('learned-changed', updateGlobalProgress);
  document.getElementById('gListBtn').onclick = ()=>{
    const panel = document.getElementById('masteredPanel');
    const show = panel.style.display === 'none';
    panel.style.display = show ? 'block' : 'none';
    document.getElementById('gListBtn').textContent = show ? 'Ocultar lista' : 'Ver lista';
    if(show) renderMastered();
  };
  document.getElementById('resetProgress').onclick = ()=>{
    if(!confirm('¿Seguro? Se borrarán tus verbos dominados y tus lecciones superadas.')) return;
    learned.clear(); doneLessons.clear(); store.clear();
    updateGlobalProgress();
    document.getElementById('masteredPanel').style.display = 'none';
    document.getElementById('gListBtn').textContent = 'Ver lista';
    startDeck();
    if(document.getElementById('lessonNav').innerHTML) renderLessonNav(LQ.lesson);
  };
  updateGlobalProgress();
}

export { initProgress };
