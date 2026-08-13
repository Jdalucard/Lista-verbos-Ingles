import { LESSONS } from '../data/lessons.js';
import { store, shuffle } from './utils.js';

/* ================= EXTRAS: lecciones ================= */
let LQ = {idx:0, ok:0, order:[], lesson:null};
const lessonById = id => LESSONS.find(l=>l.id===id);

const MODULES = [
  {name:'Módulo 1 · Fundamentos', ids:['pronouns','oneones','dodid','thereis','freq','domake']},
  {name:'Módulo 2 · Palabras trampa', ids:['just','get','actually','even','inonat']},
  {name:'Módulo 3 · Tiempos básicos', ids:['simplecont','willgoingto']},
  {name:'Módulo 4 · Verbos modales', ids:['canmod','should','must','maymight','would']},
  {name:'Módulo 5 · Tiempos perfectos', ids:['prperf','markers','prperfcont','paperf']}
];
const LESSON_ORDER = MODULES.flatMap(m=>m.ids);
const doneLessons = new Set(store.get('doneLessons')||[]);
const saveDone = ()=> store.set('doneLessons', [...doneLessons]);
const nextLessonId = id => LESSON_ORDER[LESSON_ORDER.indexOf(id)+1] || null;

function renderLessonNav(activeId){
  document.getElementById('lessonNav').innerHTML = MODULES.map(m=>
    `<div style="width:100%; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-soft); margin:10px 0 2px">${m.name}</div>`
    + m.ids.map(id=>{
        const l = lessonById(id); if(!l) return '';
        const num = LESSON_ORDER.indexOf(id)+1;
        return `<button data-l="${l.id}" class="${l.id===activeId?'on':''}">${doneLessons.has(l.id)?'✓ ':''}${num}. ${l.word}</button>`;
      }).join('')
  ).join('');
  document.querySelectorAll('#lessonNav button').forEach(b=> b.onclick = ()=> openLesson(b.dataset.l));
}

function openLesson(id){
  const L = lessonById(id);
  renderLessonNav(id);
  LQ = {idx:0, ok:0, order:shuffle(L.quiz.map((_,i)=>i)), lesson:L.id};
  document.getElementById('lessonBody').innerHTML = `
    <div class="box">
      <div class="verb-head">
        <span class="verb-word">${L.word}</span>
        <span class="pill I" style="background:var(--hl-soft); color:#8a6d00">${L.tag}</span>
      </div>
      <div class="verb-mean">${L.intro}</div>
      <table class="tenses">
        <tr><th>Uso</th><th>Ejemplos</th></tr>
        ${L.uses.map(u=>`<tr><td class="tname">${u.name}<small>${u.small}</small></td>
          <td>${u.ex.map(e=>`<div class="ex">${e[0]} → ${e[1]}</div>`).join('')}</td></tr>`).join('')}
      </table>
      <div class="note">💡 <b>Truco:</b> ${L.tip}</div>
    </div>
    <div class="box" style="margin-top:14px">
      <h2 style="font-family:var(--serif); font-size:20px; margin-bottom:4px">Ponte a prueba</h2>
      <p class="muted" style="margin-bottom:14px">${L.qTitle}</p>
      <div class="score-row"><span>Aciertos: <b id="lOk">0</b> de <b>${L.quiz.length}</b></span></div>
      <div id="lArea"></div>
    </div>`;
  renderLQ(L);
}

function renderLQ(L){
  const area = document.getElementById('lArea');
  if(LQ.idx >= LQ.order.length){
    const good = LQ.ok >= Math.ceil(LQ.order.length*0.75);
    if(good){ doneLessons.add(L.id); saveDone(); renderLessonNav(L.id); }
    const nxt = nextLessonId(L.id);
    const nxtL = nxt ? lessonById(nxt) : null;
    area.innerHTML = `<div class="done-msg"><div style="font-size:34px">${good?'🏆':'📚'}</div>
      <div class="big">${LQ.ok} de ${LQ.order.length}</div>
      <p class="muted" style="margin:8px 0 14px">${good
        ? (nxtL ? `¡Excelente! Ya dominas «${L.word}».` : '¡Excelente! 🎓 Completaste la última lección de la ruta.')
        : 'Repasa la tabla de arriba y vuelve a intentarlo. Necesitas 75% para marcarla como superada.'}</p>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
        <button class="btn ${good?'':'primary'}" id="lAgain">↻ Intentar de nuevo</button>
        ${good && nxtL ? `<button class="btn primary" id="lNext">Siguiente: ${nxtL.word} →</button>` : ''}
      </div></div>`;
    document.getElementById('lAgain').onclick = ()=> openLesson(L.id);
    const nb = document.getElementById('lNext');
    if(nb) nb.onclick = ()=> { openLesson(nxt); const p=document.getElementById('p-extras'); if(p.scrollIntoView) p.scrollIntoView({behavior:'smooth'}); };
    return;
  }
  const q = L.quiz[LQ.order[LQ.idx]];
  if(!q) return;
  area.innerHTML = `
    <div class="qprompt">Oración ${LQ.idx+1} de ${LQ.order.length}:</div>
    <div class="qsentence">${q.s}</div>
    <div class="opts" style="grid-template-columns:1fr 1fr">${L.opts.map((o,i)=>
      `<button data-i="${i}" style="font-family:var(--sans); font-size:14px">${o}</button>`).join('')}</div>
    <div class="feedback" id="lFb"></div>`;
  area.querySelectorAll('.opts button').forEach(b=>{
    b.onclick = ()=>{
      const ok = +b.dataset.i === q.a;
      area.querySelectorAll('.opts button').forEach(x=>{
        x.disabled = true;
        if(+x.dataset.i===q.a) x.classList.add('correct');
        else if(x===b) x.classList.add('wrong');
      });
      const fb = document.getElementById('lFb');
      if(ok){ LQ.ok++; fb.className='feedback ok'; fb.innerHTML=`✓ ¡Correcto! → «${q.tr}»`; }
      else { fb.className='feedback no'; fb.innerHTML=`✗ La respuesta era <b>${L.opts[q.a]}</b> → «${q.tr}»`; }
      document.getElementById('lOk').textContent = LQ.ok;
      LQ.idx++;
      setTimeout(()=>{ if(LQ.lesson===L.id) renderLQ(L); }, ok?1400:2800);
    };
  });
}

function initExtras(){
  openLesson(LESSON_ORDER[0]);
}

export { LQ, doneLessons, renderLessonNav, initExtras };
