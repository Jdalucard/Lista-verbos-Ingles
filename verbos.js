const lc = s => s.toLowerCase();
const first = s => lc(s.split('/')[0].split(' - ')[0].trim());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];

const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

function future(v){ return 'will ' + first(v.s); }

function examples(v){
  const s=first(v.s), th=first(v.th), p=first(v.p), pp=first(v.pp), g=first(v.g);
  if (s === 'be') return {
    pres:  `I am happy <strong>every day</strong>. / She is happy.`,
    past:  `<strong>Yesterday</strong>, I was happy. They were happy.`,
    fut:   `<strong>Tomorrow</strong>, I will be happy.`,
    cont:  `<strong>Right now</strong>, I am being careful.`,
    perf:  `I have been happy <strong>many times</strong>.`
  };
  return {
    pres:  `I ${s} <strong>every day</strong>. / She ${th} <strong>every day</strong>.`,
    past:  `<strong>Yesterday</strong>, I ${p}.`,
    fut:   `<strong>Tomorrow</strong>, I will ${s}.`,
    cont:  `<strong>Right now</strong>, I am ${g}.`,
    perf:  `I have ${pp} <strong>many times</strong>.`
  };
}

document.querySelectorAll('#nav button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#nav button').forEach(x=>{
      x.classList.remove('on');
      x.setAttribute('aria-selected','false');
    });
    document.querySelectorAll('.panel').forEach(x=>{
      x.classList.remove('on');
      x.setAttribute('aria-hidden','true');
    });
    b.classList.add('on');
    b.setAttribute('aria-selected','true');
    const panel = document.getElementById('p-'+b.dataset.p);
    panel.classList.add('on');
    panel.setAttribute('aria-hidden','false');
  });
});

let progPanelOpen = false, progTab = 'aprendidos', progFilter = '';

function renderProgress(){
  const cnt = learned.size;
  const pct = Math.round(100 * cnt / VERBS.length);
  const el = document.getElementById('prog');
  el.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-bar-outer" role="progressbar" aria-valuenow="${cnt}" aria-valuemin="0" aria-valuemax="${VERBS.length}" aria-label="Verbos dominados">
        <div class="prog-bar-inner" style="width:${pct}%"></div>
      </div>
      <span class="prog-label">${cnt} / ${VERBS.length} dominados (${pct}%)</span>
      <button class="btn prog-toggle" onclick="toggleProgPanel()">${progPanelOpen ? 'Cerrar ✕' : 'Ver lista'}</button>
      ${cnt > 0 ? `<button class="prog-reset" onclick="resetProgress()">Reiniciar</button>` : ''}
    </div>
    ${progPanelOpen ? progPanelHTML() : ''}`;
}

function toggleProgPanel(){
  progPanelOpen = !progPanelOpen;
  progFilter = '';
  renderProgress();
}

function setProgTab(tab){
  progTab = tab;
  progFilter = '';
  renderProgress();
}

function progPanelHTML(){
  return `<div class="prog-panel">
    <div class="prog-tabs">
      <button class="${progTab==='aprendidos'?'on':''}" onclick="setProgTab('aprendidos')">✓ Aprendidos (${learned.size})</button>
      <button class="${progTab==='por-aprender'?'on':''}" onclick="setProgTab('por-aprender')">○ Por aprender (${VERBS.length - learned.size})</button>
    </div>
    <input type="search" class="prog-filter" placeholder="Filtrar por verbo o significado…"
      value="${progFilter.replace(/"/g,'&quot;')}"
      oninput="progFilter=this.value; document.getElementById('prog-list').innerHTML=progListHTML();">
    <div id="prog-list">${progListHTML()}</div>
  </div>`;
}

function progListHTML(){
  const q = progFilter.toLowerCase();
  const isLearned = progTab === 'aprendidos';
  const rows = VERBS.filter(v =>
    (isLearned ? learned.has(v.n) : !learned.has(v.n)) &&
    (!q || lc(v.s).includes(q) || lc(v.m).includes(q))
  );
  if(!rows.length) return `<p class="muted" style="padding:14px 16px">No hay verbos que coincidan.</p>`;
  return rows.map(v => `
    <div class="prog-item">
      <span class="prog-verb">${lc(v.s)}</span>
      <span class="prog-mean">${v.m}</span>
      <span class="pill ${v.t}">${v.t}</span>
      <button class="prog-item-btn ${isLearned?'unlearn':'learn'}"
        onclick="toggleLearnedVerb(${v.n})"
        title="${isLearned?'Quitar de aprendidos':'Marcar como aprendido'}">
        ${isLearned ? '✕ Quitar' : '✓ Aprendido'}
      </button>
    </div>`).join('');
}

function toggleLearnedVerb(vn){
  if(learned.has(vn)) learned.delete(vn); else learned.add(vn);
  LS.set('verbos_learned', [...learned]);
  const list = document.getElementById('prog-list');
  if(list) list.innerHTML = progListHTML();
  const cnt = learned.size;
  const pct = Math.round(100 * cnt / VERBS.length);
  const bar = document.querySelector('.prog-bar-inner');
  if(bar) bar.style.width = pct + '%';
  const label = document.querySelector('.prog-label');
  if(label) label.textContent = `${cnt} / ${VERBS.length} dominados (${pct}%)`;
  document.querySelectorAll('.prog-tabs button').forEach((b, i) => {
    b.textContent = i === 0 ? `✓ Aprendidos (${learned.size})` : `○ Por aprender (${VERBS.length - learned.size})`;
  });
}

function resetProgress(){
  if(!confirm('¿Reiniciar todo el progreso? Se borrarán los verbos aprendidos y las estadísticas del quiz.')) return;
  learned.clear();
  LS.set('verbos_learned', []);
  qOk = 0; qNo = 0; qStreak = 0;
  LS.set('verbos_quiz', {ok: 0, no: 0});
  document.getElementById('qOk').textContent = 0;
  document.getElementById('qNo').textContent = 0;
  document.getElementById('qStreak').textContent = 0;
  renderProgress();
}

let cur = LS.get('verbos_cur') ?? VERBS.findIndex(v=>first(v.s)==='eat');
if(cur < 0 || cur >= VERBS.length) cur = 0;

function renderVerb(i){
  cur = (i + VERBS.length) % VERBS.length;
  LS.set('verbos_cur', cur);
  const v = VERBS[cur], ex = examples(v);
  const isReg = v.t === 'R';
  document.getElementById('verbDetail').innerHTML = `
    <div class="verb-head">
      <span class="verb-word">${lc(v.s)}</span>
      <span class="pill ${v.t}">${isReg?'Regular':'Irregular'}</span>
      <span class="muted">#${v.n} de 486</span>
    </div>
    <p class="verb-mean">${v.m}</p>
    <table class="tenses">
      <thead><tr><th scope="col">Tiempo</th><th scope="col">Forma</th></tr></thead>
      <tbody>
        <tr><td class="tname">Presente simple<small>hábitos y rutinas</small></td>
            <td><span class="form-word">${lc(v.s)}</span> <span class="muted">· she/he/it → <strong>${lc(v.th)}</strong></span><div class="ex">${ex.pres}</div></td></tr>
        <tr><td class="tname">Pasado simple<small>acciones terminadas</small></td>
            <td><span class="form-word">${lc(v.p)}</span><div class="ex">${ex.past}</div></td></tr>
        <tr><td class="tname">Futuro<small>planes y predicciones</small></td>
            <td><span class="form-word">${future(v)}</span><div class="ex">${ex.fut}</div></td></tr>
        <tr><td class="tname">Gerundio (-ing)<small>acción en progreso</small></td>
            <td><span class="form-word">${lc(v.g)}</span><div class="ex">${ex.cont}</div></td></tr>
        <tr><td class="tname">Participio pasado<small>tiempos perfectos</small></td>
            <td><span class="form-word">${lc(v.pp)}</span><div class="ex">${ex.perf}</div></td></tr>
      </tbody>
    </table>
    <div class="note">${isReg
      ? `💡 <strong>Verbo regular:</strong> su pasado y participio se forman agregando <strong>-ed</strong> (${lc(v.s)} → ${lc(v.p)}). Si memorizas la regla, ¡ya conoces dos formas gratis!`
      : `⚠️ <strong>Verbo irregular:</strong> su pasado (<strong>${lc(v.p)}</strong>) y participio (<strong>${lc(v.pp)}</strong>) no siguen la regla de -ed. Hay que memorizarlos: repítelos en voz alta como un trío: «${lc(v.s)} – ${first(v.p)} – ${first(v.pp)}».`}
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
  sList.innerHTML = hits.map(v=>`<button data-n="${v.n}"><strong>${lc(v.s)}</strong> — ${v.m}</button>`).join('');
  sList.style.display='block';
  sList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    renderVerb(VERBS.findIndex(v=>v.n==b.dataset.n));
    sList.style.display='none'; sInput.value='';
  });
});
document.addEventListener('click', e=>{ if(!e.target.closest('.sugg')) sList.style.display='none'; });
renderVerb(cur);

let deck=[], deckTotal=0, flipped=false;
let learned = new Set(LS.get('verbos_learned') || []);

function startDeck(){
  const type = document.getElementById('fcType').value;
  const size = +document.getElementById('fcSize').value;
  let pool = VERBS.filter(v => (type==='ALL'||v.t===type) && !learned.has(v.n));
  if(pool.length < size) { learned.clear(); LS.set('verbos_learned', []); pool = VERBS.filter(v => type==='ALL'||v.t===type); }
  deck = shuffle(pool).slice(0,size);
  deckTotal = deck.length; flipped=false;
  renderCard();
}
function renderCard(){
  const area = document.getElementById('fcArea');
  document.getElementById('fcBar').style.width = deckTotal? (100*(deckTotal-deck.length)/deckTotal)+'%' : '0%';
  if(!deck.length){
    area.innerHTML = `<div class="box done-msg">
      <div style="font-size:40px" aria-hidden="true">🎉</div>
      <p class="big">¡Bloque completado!</p>
      <p class="muted" style="margin:8px 0 16px">Llevas <strong>${learned.size}</strong> de 486 verbos dominados (${Math.round(100*learned.size/VERBS.length)}%). ¡Sigue así!</p>
      <button class="btn primary" onclick="startDeck()">Siguiente bloque</button></div>`;
    renderProgress();
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
    document.getElementById('fcKnow').onclick = e=>{
      e.stopPropagation();
      learned.add(v.n);
      LS.set('verbos_learned', [...learned]);
      deck.shift(); flipped=false; renderCard();
    };
    document.getElementById('fcReview').onclick = e=>{ e.stopPropagation(); deck.push(deck.shift()); flipped=false; renderCard(); };
  }
}
document.getElementById('fcStart').onclick = startDeck;
document.getElementById('fcDir').onchange = ()=>{ flipped=false; renderCard(); };
document.addEventListener('keydown', e=>{
  if(e.code==='Space' && document.getElementById('p-tarjetas').classList.contains('on') && deck.length){
    e.preventDefault(); flipped=!flipped; renderCard();
  }
});
startDeck();

const qSaved = LS.get('verbos_quiz') || {};
let qMode='past', qOk=qSaved.ok||0, qNo=qSaved.no||0, qStreak=0, qCurrent=null, qTimer=null;
document.getElementById('qOk').textContent = qOk;
document.getElementById('qNo').textContent = qNo;

document.querySelectorAll('.qmodes button').forEach(b=>{
  b.onclick = ()=>{ document.querySelectorAll('.qmodes button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); qMode=b.dataset.m; nextQ(); };
});
document.getElementById('qType').onchange = nextQ;

const FRAMES = [
  {marker:'every day',      tpl:(_,b)=>`I ${b} every day.`,         key:'s',   expl:'«every day» = rutina → presente simple'},
  {marker:'every day (she)',tpl:(_,b)=>`She ${b} every day.`,        key:'th',  expl:'con she/he/it el presente lleva -s → tercera persona'},
  {marker:'yesterday',      tpl:(_,b)=>`Yesterday, I ${b}.`,         key:'p',   expl:'«yesterday» = acción terminada → pasado simple'},
  {marker:'tomorrow',       tpl:(_,b)=>`Tomorrow, I ${b}.`,          key:'fut', expl:'«tomorrow» = futuro → will + verbo base'},
  {marker:'right now',      tpl:(_,b)=>`Right now, I am ${b}.`,      key:'g',   expl:'«right now» + am/is/are = en progreso → gerundio -ing'},
  {marker:'many times',     tpl:(_,b)=>`I have ${b} many times.`,    key:'pp',  expl:'«have/has» = presente perfecto → participio pasado'},
];
function formOf(v,key){ return key==='fut' ? future(v) : first(v[key]); }

function qPool(){
  const t = document.getElementById('qType').value;
  return VERBS.filter(v => (t==='ALL'||v.t===t) && first(v.s)!=='be');
}

function nextQ(){
  if(qTimer){ clearTimeout(qTimer); qTimer=null; }
  const pool = qPool();
  const v = pick(pool); qCurrent = v;
  const area = document.getElementById('qArea');
  let html='', correct, options;

  if(qMode==='past'){
    correct = first(v.p);
    const distract = shuffle(pool.filter(x=>x.n!==v.n)).slice(0,8).map(x=>first(x.p));
    const fake = first(v.s).replace(/e$/,'')+'ed';
    options = shuffle([...new Set([correct, ...(v.t==='I'&&fake!==correct?[fake]:[]), ...distract])].slice(0,4).includes(correct)
      ? [...new Set([correct, ...(v.t==='I'&&fake!==correct?[fake]:[]), ...distract])].slice(0,4)
      : [correct, ...distract.slice(0,3)]);
    html = `<p class="qprompt">¿Cuál es el <strong>pasado simple</strong> de…?</p>
      <p class="qsentence">${lc(v.s)} <span class="muted" style="font-weight:400; font-size:16px">(${v.m})</span></p>`;
  }
  else if(qMode==='sentence'){
    const fr = pick(FRAMES);
    correct = formOf(v, fr.key);
    const wrongKeys = shuffle(FRAMES.filter(f=>f.key!==fr.key)).slice(0,3).map(f=>formOf(v,f.key));
    options = shuffle([...new Set([correct, ...wrongKeys])]).slice(0,4);
    if(!options.includes(correct)) options[0]=correct, options=shuffle(options);
    qCurrent = {...v, expl: fr.expl};
    html = `<p class="qprompt">Elige la forma correcta del verbo <strong>${lc(v.s)}</strong> (${v.m}):</p>
      <p class="qsentence">${fr.tpl(v, '<span class="blank">______</span>')}</p>`;
  }
  else {
    correct = v.m;
    options = shuffle([correct, ...shuffle(pool.filter(x=>x.n!==v.n)).slice(0,3).map(x=>x.m)]);
    html = `<p class="qprompt">¿Qué significa…?</p>
      <p class="qsentence">${lc(v.s)}</p>`;
  }

  html += `<div class="opts" role="group" aria-label="Opciones de respuesta">${options.map(o=>`<button data-v="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('')}</div>
    <div class="feedback" id="qFb" role="status" aria-live="polite"></div>
    <div style="margin-top:14px; text-align:right"><button class="btn" id="qSkip">Saltar →</button></div>`;
  area.innerHTML = html;

  area.querySelectorAll('.opts button').forEach(b=>{
    b.onclick = ()=>{
      const isOk = b.dataset.v === correct;
      area.querySelectorAll('.opts button').forEach(x=>{
        x.disabled = true;
        if(x.dataset.v===correct) x.classList.add('correct');
        else if(x===b) x.classList.add('wrong');
      });
      const fb = document.getElementById('qFb');
      const extra = qMode==='sentence' ? `<br>📌 ${qCurrent.expl}` :
        qMode==='past' ? `<br>📌 ${lc(v.s)} → <strong>${lc(v.p)}</strong> ${v.t==='R'?'(regular: -ed)':'(irregular: ¡memorízalo!)'}` : '';
      if(isOk){
        qOk++; qStreak++;
        fb.className='feedback ok';
        fb.innerHTML=`✓ ¡Correcto!${extra}`;
        qTimer = setTimeout(nextQ, 1300);
      } else {
        qNo++; qStreak=0;
        fb.className='feedback no';
        fb.innerHTML=`✗ La respuesta era <strong>${correct}</strong>.${extra}`;
        const skipBtn = document.getElementById('qSkip');
        skipBtn.textContent = 'Entendido →';
        skipBtn.style.fontWeight = '700';
      }
      document.getElementById('qOk').textContent=qOk;
      document.getElementById('qNo').textContent=qNo;
      document.getElementById('qStreak').textContent=qStreak;
      LS.set('verbos_quiz', {ok: qOk, no: qNo});
    };
  });
  document.getElementById('qSkip').onclick = nextQ;
}
nextQ();

function renderList(){
  const q = document.getElementById('listSearch').value.trim().toLowerCase();
  const t = document.getElementById('listType').value;
  const rows = VERBS.filter(v => (t==='ALL'||v.t===t) && (!q || lc(v.s).includes(q) || lc(v.m).includes(q)));
  document.getElementById('listCount').textContent = `${rows.length} verbo${rows.length!==1?'s':''}`;
  document.getElementById('listBody').innerHTML = rows.map(v=>`
    <tr><td>${v.n}</td><td><span class="pill ${v.t}">${v.t}</span></td>
    <td class="v">${lc(v.s)}</td><td>${lc(v.th)}</td><td>${lc(v.p)}</td><td>${lc(v.pp)}</td><td>${lc(v.g)}</td>
    <td>${future(v)}</td><td>${v.m}</td></tr>`).join('');
}
document.getElementById('listSearch').addEventListener('input', renderList);
document.getElementById('listType').addEventListener('change', renderList);
renderList();

renderProgress();
