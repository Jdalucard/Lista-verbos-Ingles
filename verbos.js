/* ---------- persistencia (localStorage con fallback seguro) ---------- */
const store = {
  get(k){ try { const v = localStorage.getItem('verbos_' + k); return v ? JSON.parse(v) : null; } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem('verbos_' + k, JSON.stringify(v)); } catch(e){} },
  clear(){ try { ['learned','doneLessons'].forEach(k => localStorage.removeItem('verbos_' + k)); } catch(e){} }
};



/* ---------- helpers ---------- */
const lc = s => s.toLowerCase();
// primera variante de formas dobles ("WAS - WERE", "BURNT/BURNED")
const first = s => lc(s.split('/')[0].split(' - ')[0].trim());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];

function future(v){ return 'will ' + first(v.s); }

function examples(v){
  const s=first(v.s), th=first(v.th), p=first(v.p), pp=first(v.pp), g=first(v.g);
  if (s === 'be') return {
    pres:  `I am happy <b>every day</b>. / She is happy.`,
    past:  `<b>Yesterday</b>, I was happy. They were happy.`,
    fut:   `<b>Tomorrow</b>, I will be happy.`,
    cont:  `<b>Right now</b>, I am being careful.`,
    perf:  `I have been happy <b>many times</b>.`
  };
  return {
    pres:  `I ${s} <b>every day</b>. / She ${th} <b>every day</b>.`,
    past:  `<b>Yesterday</b>, I ${p}.`,
    fut:   `<b>Tomorrow</b>, I will ${s}.`,
    cont:  `<b>Right now</b>, I am ${g}.`,
    perf:  `I have ${pp} <b>many times</b>.`
  };
}

/* ---------- navegación ---------- */
document.querySelectorAll('#nav button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    document.getElementById('p-'+b.dataset.p).classList.add('on');
  });
});

/* ================= APRENDER ================= */
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

/* ================= TARJETAS ================= */
let deck=[], deckTotal=0, flipped=false, learned=new Set(store.get('learned')||[]);
const saveLearned = ()=> { store.set('learned', [...learned]); updateGlobalProgress(); };

function startDeck(){
  const type = document.getElementById('fcType').value;
  const size = +document.getElementById('fcSize').value;
  let pool = VERBS.filter(v => (type==='ALL'||v.t===type) && !learned.has(v.n));
  if(pool.length < size) { learned.clear(); saveLearned(); pool = VERBS.filter(v => type==='ALL'||v.t===type); }
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
      <button class="btn primary" onclick="startDeck()">Siguiente bloque</button></div>`;
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
    document.getElementById('fcKnow').onclick = e=>{ e.stopPropagation(); learned.add(v.n); saveLearned(); deck.shift(); flipped=false; renderCard(); };
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
    learned.delete(+b.dataset.n); saveLearned(); renderMastered();
  });
}
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

/* ================= QUIZ ================= */
let qMode='past', qOk=0, qNo=0, qStreak=0, qCurrent=null;
document.querySelectorAll('.qmodes button').forEach(b=>{
  b.onclick = ()=>{ document.querySelectorAll('.qmodes button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); qMode=b.dataset.m; nextQ(); };
});
document.getElementById('qType').onchange = nextQ;

const FRAMES = [
  {marker:'every day', tpl:(v,b)=>`I ${b} every day.`, key:'s', expl:'«every day» = rutina → presente simple'},
  {marker:'every day (she)', tpl:(v,b)=>`She ${b} every day.`, key:'th', expl:'con she/he/it el presente lleva -s → tercera persona'},
  {marker:'yesterday', tpl:(v,b)=>`Yesterday, I ${b}.`, key:'p', expl:'«yesterday» = acción terminada → pasado simple'},
  {marker:'tomorrow', tpl:(v,b)=>`Tomorrow, I ${b}.`, key:'fut', expl:'«tomorrow» = futuro → will + verbo base'},
  {marker:'right now', tpl:(v,b)=>`Right now, I am ${b}.`, key:'g', expl:'«right now» + am/is/are = en progreso → gerundio -ing'},
  {marker:'many times', tpl:(v,b)=>`I have ${b} many times.`, key:'pp', expl:'«have/has» = presente perfecto → participio pasado'},
];
function formOf(v,key){ return key==='fut' ? future(v) : first(v[key]); }

function qPool(){
  const t = document.getElementById('qType').value;
  return VERBS.filter(v => (t==='ALL'||v.t===t) && first(v.s)!=='be');
}
function nextQ(){
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
    html = `<div class="qprompt">¿Cuál es el <b>pasado simple</b> de…?</div>
      <div class="qsentence">${lc(v.s)} <span class="muted" style="font-weight:486; font-size:16px">(${v.m})</span></div>`;
  }
  else if(qMode==='sentence'){
    const fr = pick(FRAMES);
    correct = formOf(v, fr.key);
    const wrongKeys = shuffle(FRAMES.filter(f=>f.key!==fr.key)).slice(0,3).map(f=>formOf(v,f.key));
    options = shuffle([...new Set([correct, ...wrongKeys])]).slice(0,4);
    if(!options.includes(correct)) options[0]=correct, options=shuffle(options);
    qCurrent = {...v, expl: fr.expl};
    html = `<div class="qprompt">Elige la forma correcta del verbo <b>${lc(v.s)}</b> (${v.m}):</div>
      <div class="qsentence">${fr.tpl(v, '<span class="blank">______</span>')}</div>`;
  }
  else { // meaning
    correct = v.m;
    options = shuffle([correct, ...shuffle(pool.filter(x=>x.n!==v.n)).slice(0,3).map(x=>x.m)]);
    html = `<div class="qprompt">¿Qué significa…?</div>
      <div class="qsentence">${lc(v.s)}</div>`;
  }

  html += `<div class="opts">${options.map(o=>`<button data-v="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('')}</div>
    <div class="feedback" id="qFb"></div>
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
        qMode==='past' ? `<br>📌 ${lc(v.s)} → <b>${lc(v.p)}</b> ${v.t==='R'?'(regular: -ed)':'(irregular: ¡memorízalo!)'}` : '';
      if(isOk){ qOk++; qStreak++; fb.className='feedback ok'; fb.innerHTML=`✓ ¡Correcto!${extra}`; }
      else { qNo++; qStreak=0; fb.className='feedback no'; fb.innerHTML=`✗ La respuesta era <b>${correct}</b>.${extra}`; }
      document.getElementById('qOk').textContent=qOk;
      document.getElementById('qNo').textContent=qNo;
      document.getElementById('qStreak').textContent=qStreak;
      setTimeout(nextQ, isOk?1300:2600);
    };
  });
  document.getElementById('qSkip').onclick = nextQ;
}
nextQ();

/* ================= LISTA ================= */
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

/* ================= EXTRAS: lecciones ================= */
const LESSONS = [
{
  id:'just', word:'just', tag:'Palabra todoterreno',
  intro:'Adverbio (y a veces adjetivo) súper común. Según el contexto tiene 4 usos clave:',
  uses:[
    {name:'1. Solo / Solamente', small:'límite o restricción', ex:[
      ["It's <b>just</b> a joke.","Es <i>solo</i> un chiste."],
      ["I'm <b>just</b> asking.","<i>Solo</i> estoy preguntando."],
      ["<b>Just</b> one moment, please.","<i>Solo</i> un momento, por favor."]]},
    {name:'2. Acabar de', small:'acción muy reciente', ex:[
      ["I <b>just</b> arrived home.","<i>Acabo de</i> llegar a casa."],
      ["She <b>just</b> called me.","Ella me <i>acaba de</i> llamar."]]},
    {name:'3. Justo / Exactamente', small:'precisión o coincidencia', ex:[
      ["That's <b>just</b> what I need.","Eso es <i>justo</i> lo que necesito."],
      ["You came at <b>just</b> the right time.","Llegaste <i>justo</i> a tiempo."]]},
    {name:'4. Suavizar o dar énfasis', small:'según el tono', ex:[
      ["Could you <b>just</b> pass me the water?","¿Me pasarías el agua, <i>por favor</i>? (más amable)"],
      ["<b>Just</b> do it!","¡<i>Simplemente</i> hazlo! / ¡Hazlo y ya! (énfasis fuerte)"]]},
    {name:'Bonus: adjetivo', small:'justicia o equidad', ex:[
      ["A <b>just</b> decision.","Una decisión <i>justa</i>."]]}
  ],
  tip:'Si <i>just</i> va antes de un verbo en pasado o perfecto (<i>I just ate</i>), casi siempre es «acabar de». Si va antes de un sustantivo o cantidad (<i>just one</i>), casi siempre es «solo».',
  qTitle:'¿Qué significa <i>just</i> en cada oración?',
  opts:['Solo / Solamente','Acabar de','Justo / Exactamente','Suavizar / Énfasis','Justo (adjetivo de justicia)'],
  quiz:[
    {s:'I <b>just</b> finished my homework.', a:1, tr:'Acabo de terminar mi tarea.'},
    {s:'It costs <b>just</b> five dollars.', a:0, tr:'Cuesta solo cinco dólares.'},
    {s:'This dress is <b>just</b> my size.', a:2, tr:'Este vestido es justo mi talla.'},
    {s:'Could you <b>just</b> wait a second?', a:3, tr:'¿Podrías esperar un segundo, porfa?'},
    {s:'We <b>just</b> got back from Medellín.', a:1, tr:'Acabamos de volver de Medellín.'},
    {s:'She is <b>just</b> a beginner.', a:0, tr:'Ella es solo una principiante.'},
    {s:'The judge made a <b>just</b> ruling.', a:4, tr:'El juez tomó una decisión justa.'},
    {s:'<b>Just</b> tell me the truth!', a:3, tr:'¡Simplemente dime la verdad!'}
  ]
},
{
  id:'get', word:'get', tag:'El verbo más versátil',
  intro:'Probablemente el verbo más usado (y camaleónico) del inglés hablado. Sus 5 usos esenciales:',
  uses:[
    {name:'1. Obtener / Recibir / Conseguir', small:'get + sustantivo', ex:[
      ["I <b>got</b> a new phone.","Conseguí un celular nuevo."],
      ["She <b>got</b> an email from her boss.","Recibió un correo de su jefe."],
      ["Did you <b>get</b> the tickets?","¿Conseguiste las boletas?"]]},
    {name:'2. Llegar', small:'get + lugar', ex:[
      ["What time did you <b>get</b> home?","¿A qué hora llegaste a casa?"],
      ["We <b>got</b> to the airport late.","Llegamos tarde al aeropuerto."]]},
    {name:'3. Volverse / Ponerse', small:'get + adjetivo (cambio de estado)', ex:[
      ["I'm <b>getting</b> tired.","Me estoy cansando."],
      ["It's <b>getting</b> dark.","Está oscureciendo."],
      ["Don't <b>get</b> angry.","No te enojes."]]},
    {name:'4. Entender', small:'informal', ex:[
      ["I don't <b>get</b> it.","No lo entiendo."],
      ["Now I <b>get</b> it!","¡Ya entendí!"]]},
    {name:'5. Phrasals del día a día', small:'get + partícula', ex:[
      ["<b>get up</b> / <b>get dressed</b>","levantarse / vestirse"],
      ["<b>get on</b> / <b>get off</b> the bus","subirse / bajarse del bus"],
      ["We <b>get along</b> very well.","Nos llevamos muy bien."]]}
  ],
  tip:'La fórmula: <b>get + sustantivo</b> = obtener · <b>get + adjetivo</b> = ponerse/volverse · <b>get + lugar</b> = llegar. Recuerda que es irregular: get – got – gotten.',
  qTitle:'¿Qué significa <i>get</i> en cada oración?',
  opts:['Obtener / Recibir','Llegar','Volverse / Ponerse','Entender','Phrasal (acción diaria)'],
  quiz:[
    {s:"It's <b>getting</b> cold in Medellín.", a:2, tr:'Está empezando a hacer frío en Medellín.'},
    {s:'I <b>got</b> your message, thanks.', a:0, tr:'Recibí tu mensaje, gracias.'},
    {s:'We <b>got</b> to the office at 8.', a:1, tr:'Llegamos a la oficina a las 8.'},
    {s:"Sorry, I don't <b>get</b> the joke.", a:3, tr:'Perdón, no entiendo el chiste.'},
    {s:'I <b>get up</b> at 6 every day.', a:4, tr:'Me levanto a las 6 todos los días.'},
    {s:'She <b>got</b> a job at Google.', a:0, tr:'Consiguió trabajo en Google.'},
    {s:'He <b>gets</b> nervous before exams.', a:2, tr:'Se pone nervioso antes de los exámenes.'},
    {s:'<b>Get off</b> at the next station.', a:4, tr:'Bájate en la próxima estación.'}
  ]
},
{
  id:'domake', word:'do vs make', tag:'Los dos «hacer»',
  intro:'En español ambos son «hacer», pero en inglés no son intercambiables. La lógica:',
  uses:[
    {name:'DO → actividades y tareas', small:'el proceso, la obligación', ex:[
      ["<b>do</b> homework / <b>do</b> the dishes","hacer la tarea / lavar los platos"],
      ["<b>do</b> exercise / <b>do</b> your best","hacer ejercicio / dar lo mejor de ti"],
      ["<b>do</b> the shopping / <b>do</b> the laundry","hacer las compras / lavar la ropa"]]},
    {name:'MAKE → crear o producir', small:'nace un resultado', ex:[
      ["<b>make</b> dinner / <b>make</b> a cake","preparar la cena / hacer un pastel"],
      ["<b>make</b> money / <b>make</b> a video","ganar dinero / hacer un video"]]},
    {name:'Expresiones fijas con MAKE', small:'¡memorízalas!', ex:[
      ["<b>make</b> a mistake / <b>make</b> a decision","cometer un error / tomar una decisión"],
      ["<b>make</b> friends / <b>make</b> plans","hacer amigos / hacer planes"],
      ["<b>make</b> noise / <b>make</b> an effort","hacer ruido / hacer un esfuerzo"]]},
    {name:'Expresiones fijas con DO', small:'¡memorízalas!', ex:[
      ["<b>do</b> someone a favor","hacerle un favor a alguien"],
      ["<b>do</b> business / <b>do</b> your hair","hacer negocios / arreglarse el pelo"]]}
  ],
  tip:'<b>DO</b> = el proceso o la actividad («do homework»: la actividad de estudiar). <b>MAKE</b> = el resultado que se crea («make a cake»: al final existe un pastel). Ambos son irregulares: do – did – done · make – made – made.',
  qTitle:'¿<i>Do</i> o <i>make</i>? Completa cada oración:',
  opts:['do','make'],
  quiz:[
    {s:'I need to <span class="blank">___</span> a decision today.', a:1, tr:'Necesito tomar una decisión hoy. (make a decision)'},
    {s:'Can you <span class="blank">___</span> me a favor?', a:0, tr:'¿Me puedes hacer un favor? (do a favor)'},
    {s:"Don't <span class=\"blank\">___</span> noise, the baby is sleeping.", a:1, tr:'No hagas ruido, el bebé duerme. (make noise)'},
    {s:'I <span class="blank">___</span> my homework every night.', a:0, tr:'Hago mi tarea todas las noches. (do homework)'},
    {s:'He wants to <span class="blank">___</span> money online.', a:1, tr:'Quiere ganar dinero en línea. (make money)'},
    {s:'I have to <span class="blank">___</span> the dishes.', a:0, tr:'Tengo que lavar los platos. (do the dishes)'},
    {s:"It's easy to <span class=\"blank\">___</span> mistakes when you're tired.", a:1, tr:'Es fácil cometer errores cuando estás cansado. (make mistakes)'},
    {s:"Let's <span class=\"blank\">___</span> plans for the weekend.", a:1, tr:'Hagamos planes para el fin de semana. (make plans)'}
  ]
},
{
  id:'actually', word:'actually', tag:'⚠️ Falso amigo',
  intro:'Uno de los falsos amigos más traicioneros: <b>actually NO significa «actualmente»</b>.',
  uses:[
    {name:'actually = En realidad / De hecho', small:'para aclarar o sorprender', ex:[
      ["<b>Actually</b>, I'm from Medellín.","De hecho, soy de Medellín."],
      ["It's <b>actually</b> very easy.","En realidad es muy fácil."],
      ["He looks young, but he's <b>actually</b> 45.","Parece joven, pero en realidad tiene 45."]]},
    {name:'Para corregir con cortesía', small:'suaviza la corrección', ex:[
      ["<b>Actually</b>, the meeting is at 3, not at 2.","De hecho, la reunión es a las 3, no a las 2."]]},
    {name:'«Actualmente» se dice…', small:'currently · nowadays · these days', ex:[
      ["I'm <b>currently</b> studying English.","Actualmente estudio inglés."],
      ["<b>Nowadays</b>, everyone works remotely.","Hoy en día, todos trabajan remoto."]]}
  ],
  tip:'Regla de oro: <b>actually = en realidad</b> · <b>actualmente = currently / nowadays</b>. Si quieres decir «actualmente» y dices «actually», estarás diciendo otra cosa sin darte cuenta.',
  qTitle:'¿Cuál va en el espacio: <i>actually</i> o <i>currently/nowadays</i>?',
  opts:['actually','currently / nowadays'],
  quiz:[
    {s:"<span class=\"blank\">___</span>, I've never been to Bogotá.", a:0, tr:'De hecho, nunca he ido a Bogotá.'},
    {s:"I'm <span class=\"blank\">___</span> working on a new project.", a:1, tr:'Actualmente trabajo en un proyecto nuevo.'},
    {s:'The movie was <span class="blank">___</span> pretty good.', a:0, tr:'La película en realidad estuvo bastante buena.'},
    {s:'<span class="blank">___</span>, most people shop online.', a:1, tr:'Hoy en día, la mayoría compra en línea.'},
    {s:"He looks young, but he's <span class=\"blank\">___</span> 45.", a:0, tr:'Parece joven, pero en realidad tiene 45.'},
    {s:'She is <span class="blank">___</span> living in Canada.', a:1, tr:'Ella actualmente vive en Canadá.'}
  ]
},
{
  id:'even', word:'even', tag:'Pequeña pero poderosa',
  intro:'Cuatro significados distintos según su posición en la frase:',
  uses:[
    {name:'1. Incluso / Hasta', small:'algo sorprendente se suma', ex:[
      ["<b>Even</b> my grandma uses TikTok.","Hasta mi abuela usa TikTok."],
      ["He works <b>even</b> on Sundays.","Trabaja incluso los domingos."]]},
    {name:'2. Ni siquiera', small:'not + even', ex:[
      ["He didn't <b>even</b> say goodbye.","Ni siquiera se despidió."],
      ["I can't <b>even</b> imagine it.","No puedo ni imaginarlo."]]},
    {name:'3. Aunque / Incluso si', small:'even though · even if', ex:[
      ["<b>Even though</b> it was raining, we went out.","Aunque llovía, salimos."],
      ["<b>Even if</b> you pay me, I won't do it.","Incluso si me pagas, no lo haré."]]},
    {name:'4. Aún / Todavía', small:'even + comparativo', ex:[
      ["This one is <b>even</b> better.","Este es aún mejor."],
      ["The traffic got <b>even</b> worse.","El tráfico se puso todavía peor."]]}
  ],
  tip:'<b>not + even</b> = «ni siquiera» · <b>even + comparativo</b> (better, worse, more) = «aún» · <b>even though</b> = «aunque» (hecho real) vs <b>even if</b> = «incluso si» (hipótesis).',
  qTitle:'¿Qué significa <i>even</i> en cada oración?',
  opts:['Incluso / Hasta','Ni siquiera','Aunque / Incluso si','Aún + comparativo'],
  quiz:[
    {s:"She didn't <b>even</b> open the gift.", a:1, tr:'Ni siquiera abrió el regalo.'},
    {s:'<b>Even</b> children can understand this.', a:0, tr:'Hasta los niños pueden entender esto.'},
    {s:'<b>Even though</b> I was tired, I finished the report.', a:2, tr:'Aunque estaba cansado, terminé el informe.'},
    {s:'Today is <b>even</b> hotter than yesterday.', a:3, tr:'Hoy hace aún más calor que ayer.'},
    {s:'He <b>even</b> offered to pay for everyone.', a:0, tr:'Incluso se ofreció a pagar por todos.'},
    {s:"<b>Even if</b> it's expensive, I'll buy it.", a:2, tr:'Aunque sea caro, lo compraré.'}
  ]
},
{
  id:'prperf', word:'presente perfecto', tag:'have/has + participio',
  intro:'El tiempo que conecta el pasado con el presente. Se forma con <b>have/has + participio pasado</b> (¡la columna de participios de tu lista por fin cobra sentido!). Sus 4 usos:',
  uses:[
    {name:'1. Experiencias de vida', small:'sin decir cuándo · ever / never', ex:[
      ["I <b>have visited</b> Cartagena three times.","He visitado Cartagena tres veces."],
      ["<b>Have</b> you <b>ever eaten</b> sushi?","¿Alguna vez has comido sushi?"],
      ["She <b>has never traveled</b> abroad.","Ella nunca ha viajado al extranjero."]]},
    {name:'2. Acción reciente con resultado ahora', small:'lo que importa es la consecuencia', ex:[
      ["I <b>have lost</b> my keys.","Perdí mis llaves. (y por eso no puedo entrar <i>ahora</i>)"],
      ["She <b>has just arrived</b>.","Ella acaba de llegar."]]},
    {name:'3. Empezó en el pasado y continúa', small:'for (duración) · since (punto de inicio)', ex:[
      ["I <b>have lived</b> in Medellín <b>for</b> 10 years.","Vivo en Medellín desde hace 10 años. (y sigo)"],
      ["We <b>have known</b> each other <b>since</b> 2015.","Nos conocemos desde 2015."]]},
    {name:'4. Con already y yet', small:'ya · todavía', ex:[
      ["I <b>have already finished</b>.","Ya terminé."],
      ["<b>Have</b> you <b>finished yet</b>?","¿Ya terminaste?"]]}
  ],
  tip:'La clave contra el pasado simple: si dices <b>cuándo</b> (yesterday, in 2020, last week) → pasado simple: «I <b>saw</b> that movie yesterday». Si no dices cuándo o la acción sigue conectada al presente → presente perfecto: «I <b>have seen</b> that movie».',
  qTitle:'¿Pasado simple o presente perfecto? Fíjate en las pistas de tiempo:',
  opts:['pasado simple (saw, went…)','presente perfecto (have/has + participio)'],
  quiz:[
    {s:'I <span class="blank">___</span> Cartagena three times in my life.', a:1, tr:'I have visited Cartagena three times. (experiencia, sin fecha)'},
    {s:"She <span class=\"blank\">___</span> her keys — she can't open the door!", a:1, tr:'She has lost her keys. (resultado presente)'},
    {s:'We <span class="blank">___</span> that movie last Saturday.', a:0, tr:'We saw that movie last Saturday. («last Saturday» = fecha → pasado simple)'},
    {s:'I <span class="blank">___</span> here since 2015.', a:1, tr:'I have lived here since 2015. («since» = continúa → perfecto)'},
    {s:'They <span class="blank">___</span> dinner two hours ago.', a:0, tr:'They had dinner two hours ago. («ago» = fecha → pasado simple)'},
    {s:'<span class="blank">___</span> you ever <span class="blank">___</span> sushi?', a:1, tr:'Have you ever eaten sushi? («ever» = experiencia → perfecto)'},
    {s:'He <span class="blank">___</span> in Bogotá when he was a child.', a:0, tr:'He lived in Bogotá when he was a child. (etapa terminada → pasado simple)'},
    {s:'I <span class="blank">___</span> already <span class="blank">___</span> my homework.', a:1, tr:'I have already done my homework. («already» → perfecto)'}
  ]
},
{
  id:'paperf', word:'pasado perfecto', tag:'had + participio',
  intro:'«El pasado del pasado»: describe una acción que ocurrió <b>antes de otra acción pasada</b>. Se forma con <b>had + participio</b> (igual para todas las personas) y equivale casi directo al español «había + participio».',
  uses:[
    {name:'1. Acción anterior a otra pasada', small:'la más antigua lleva had', ex:[
      ["When I arrived, the movie <b>had</b> already <b>started</b>.","Cuando llegué, la película ya había empezado."],
      ["She <b>had left</b> before I called.","Ella se había ido antes de que yo llamara."]]},
    {name:'2. Explicar la causa de algo pasado', small:'because + had', ex:[
      ["He was tired because he <b>hadn't slept</b>.","Estaba cansado porque no había dormido."],
      ["I didn't laugh because I <b>had heard</b> that joke before.","No me reí porque ya había oído ese chiste."]]},
    {name:'3. Con by the time / after / before', small:'conectores de secuencia', ex:[
      ["<b>By the time</b> you called, I <b>had fallen</b> asleep.","Para cuando llamaste, ya me había dormido."],
      ["<b>After</b> she <b>had finished</b>, she watched TV.","Después de que terminó, vio TV."]]}
  ],
  tip:'Piensa en <b>dos momentos del pasado</b>: el más antiguo → <b>had + participio</b>; el más reciente → pasado simple. «When I got home (2°), my family had eaten (1°)» = cuando llegué, ya habían comido. Si las acciones van en orden y seguidas («abrí la puerta y entré»), usa pasado simple para ambas.',
  qTitle:'¿Pasado simple o pasado perfecto? Piensa qué ocurrió primero:',
  opts:['pasado simple (opened, went…)','pasado perfecto (had + participio)'],
  quiz:[
    {s:'When we got to the station, the train <span class="blank">___</span>.', a:1, tr:'…the train had left. (el tren se fue ANTES de que llegáramos)'},
    {s:'She was sad because she <span class="blank">___</span> the exam.', a:1, tr:'…she had failed the exam. (reprobó antes de estar triste)'},
    {s:'He <span class="blank">___</span> the door and walked in.', a:0, tr:'He opened the door and walked in. (acciones en orden → pasado simple)'},
    {s:'By the time you called, I <span class="blank">___</span> asleep.', a:1, tr:'…I had fallen asleep. («by the time» pide el pasado del pasado)'},
    {s:"I didn't laugh because I <span class=\"blank\">___</span> that joke before.", a:1, tr:'…I had heard that joke before. («before» = anterior)'},
    {s:'We <span class="blank">___</span> to the beach last weekend.', a:0, tr:'We went to the beach last weekend. (un solo momento → pasado simple)'},
    {s:'After she <span class="blank">___</span> her homework, she watched TV.', a:1, tr:'After she had finished her homework… (primero terminó, luego vio TV)'},
    {s:'I <span class="blank">___</span> him yesterday at the mall.', a:0, tr:'I saw him yesterday at the mall. (fecha concreta → pasado simple)'}
  ]
},
{
  id:'markers', word:'already · yet · still', tag:'Las palabras del perfecto',
  intro:'Estas 6 palabritas acompañan casi siempre al presente perfecto, y cada una tiene su posición y su regla. Mira primero cómo <b>already, yet y still</b> cuentan la misma escena desde tres ángulos:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Palabra</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">La escena: esperando el bus 🚌</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Qué transmite</th></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>still</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">I\'m <b>still</b> waiting for the bus.<br><span style="color:var(--ink-soft)">Todavía estoy esperando el bus.</span></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">la acción <b>continúa</b></td></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>yet</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">The bus hasn\'t arrived <b>yet</b>.<br><span style="color:var(--ink-soft)">El bus todavía no ha llegado.</span></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">se espera que pase, <b>aún no</b></td></tr>'
  + '<tr><td style="padding:7px 8px"><b>already</b></td><td style="padding:7px 8px">Oh! The bus has <b>already</b> left!<br><span style="color:var(--ink-soft)">¡Uy! ¡El bus ya se fue!</span></td><td style="padding:7px 8px">pasó, incluso <b>antes de lo esperado</b></td></tr>'
  + '</table>Ahora las 6 en detalle:',
  uses:[
    {name:'already = ya', small:'afirmaciones · va en medio', ex:[
      ["I have <b>already</b> eaten.","Ya comí."],
      ["She has <b>already</b> seen it.","Ella ya lo vio."]]},
    {name:'yet = todavía / ya', small:'negaciones y preguntas · va al FINAL', ex:[
      ["I haven't finished <b>yet</b>.","Todavía no he terminado."],
      ["Have you finished <b>yet</b>?","¿Ya terminaste?"]]},
    {name:'just = acabar de', small:'va en medio', ex:[
      ["She has <b>just</b> left.","Ella acaba de irse."]]},
    {name:'ever = alguna vez', small:'preguntas', ex:[
      ["Have you <b>ever</b> been to Japan?","¿Alguna vez has ido a Japón?"]]},
    {name:'never = nunca', small:'afirmación con sentido negativo', ex:[
      ["I have <b>never</b> tried it.","Nunca lo he probado."]]},
    {name:'still = todavía', small:'algo que continúa (o que aún no pasa)', ex:[
      ["I <b>still</b> live with my parents.","Todavía vivo con mis padres."],
      ["He <b>still</b> hasn't called.","Todavía no ha llamado. (con tono de impaciencia)"]]}
  ],
  tip:'Posiciones: <b>already, just, never, ever</b> van entre have y el participio («I have <b>just</b> eaten»). <b>Yet</b> va siempre al final de la frase. <b>Still</b> va antes del verbo (o antes de haven\'t para sonar impaciente).',
  qTitle:'¿Qué palabra completa cada oración?',
  opts:['already','yet','just','ever','never','still'],
  quiz:[
    {s:'Have you <span class="blank">___</span> been to Europe?', a:3, tr:'¿Alguna vez has ido a Europa? (ever = preguntas de experiencia)'},
    {s:"I haven't seen that movie <span class=\"blank\">___</span>.", a:1, tr:'Todavía no he visto esa película. (yet = negación, al final)'},
    {s:'She has <span class="blank">___</span> arrived — five minutes ago!', a:2, tr:'Acaba de llegar, ¡hace cinco minutos! (just = muy reciente)'},
    {s:"I have <span class=\"blank\">___</span> finished, you don't need to help.", a:0, tr:'Ya terminé, no necesitas ayudar. (already = afirmación)'},
    {s:'I have <span class="blank">___</span> eaten insects. Disgusting!', a:4, tr:'Nunca he comido insectos. (never = nunca)'},
    {s:'He <span class="blank">___</span> works at the same company.', a:5, tr:'Todavía trabaja en la misma empresa. (still = continúa)'},
    {s:'Have you done your homework <span class="blank">___</span>?', a:1, tr:'¿Ya hiciste tu tarea? (yet = pregunta, al final)'},
    {s:'We have <span class="blank">___</span> booked the tickets, relax.', a:0, tr:'Ya compramos las boletas, tranquilo. (already)'},
    {s:'Are you <span class="blank">___</span> working at the same place?', a:5, tr:'¿Todavía trabajas en el mismo lugar? (still = continúa)'},
    {s:"The results haven't been published <span class=\"blank\">___</span>.", a:1, tr:'Los resultados todavía no se han publicado. (yet = se espera, aún no)'}
  ]
},
{
  id:'canmod', word:'can · could', tag:'Modal: habilidad y más',
  intro:'Los modales son verbos «ayudantes» con superpoderes y una regla de oro: <b>nunca cambian</b> (no llevan -s ni -ed ni "to") y siempre van seguidos del <b>verbo en forma base</b>: she can swim ✓ (no ~~she cans to swim~~). Usos de can/could:',
  uses:[
    {name:'1. Habilidad', small:'can = presente · could = pasado', ex:[
      ["I <b>can</b> speak two languages.","Puedo hablar / hablo dos idiomas."],
      ["She <b>can't</b> drive.","Ella no sabe manejar."],
      ["When I was young, I <b>could</b> run very fast.","Cuando era joven, podía correr muy rápido."]]},
    {name:'2. Permiso', small:'informal', ex:[
      ["<b>Can</b> I use your phone?","¿Puedo usar tu teléfono?"],
      ["You <b>can</b> leave early today.","Puedes salir temprano hoy."]]},
    {name:'3. Petición cortés', small:'could = más amable que can', ex:[
      ["<b>Could</b> you help me, please?","¿Podrías ayudarme, por favor?"],
      ["<b>Could</b> you repeat that?","¿Podrías repetir eso?"]]},
    {name:'4. Posibilidad', small:'algo puede pasar', ex:[
      ["It <b>can</b> get very hot in summer.","Puede hacer mucho calor en verano."],
      ["This <b>could</b> be a great opportunity.","Esto podría ser una gran oportunidad."]]},
    {name:'Bonus: be able to', small:'para futuro y perfectos', ex:[
      ["I <b>will be able to</b> help you tomorrow.","Podré ayudarte mañana. (can no tiene futuro: se usa be able to)"],
      ["She <b>hasn't been able to</b> sleep.","No ha podido dormir."]]}
  ],
  tip:'<b>Could</b> tiene doble vida: es el pasado de can («I could swim at age 5») Y la versión cortés para pedir cosas en presente («Could you help me?»). Para futuro, can no existe: usa <b>will be able to</b>.',
  qTitle:'¿Qué expresa can/could en cada oración?',
  opts:['Habilidad','Permiso','Petición cortés','Posibilidad'],
  quiz:[
    {s:'My grandfather <b>could</b> fix anything.', a:0, tr:'Mi abuelo podía arreglar cualquier cosa. (habilidad en el pasado)'},
    {s:'<b>Could</b> you open the window, please?', a:2, tr:'¿Podrías abrir la ventana, por favor? (petición amable)'},
    {s:'<b>Can</b> I go to the bathroom?', a:1, tr:'¿Puedo ir al baño? (pedir permiso)'},
    {s:'Traffic <b>can</b> be terrible at 6 pm.', a:3, tr:'El tráfico puede ser terrible a las 6 pm. (posibilidad general)'},
    {s:'She <b>can</b> play the guitar really well.', a:0, tr:'Ella sabe tocar la guitarra muy bien. (habilidad)'},
    {s:'You <b>can</b> park here after 7 pm.', a:1, tr:'Puedes parquear aquí después de las 7 pm. (permiso)'},
    {s:'<b>Could</b> you send me the report?', a:2, tr:'¿Podrías enviarme el informe? (petición cortés)'},
    {s:'Be careful — that dog <b>could</b> bite.', a:3, tr:'Cuidado: ese perro podría morder. (posibilidad)'}
  ]
},
{
  id:'should', word:'should', tag:'Modal: consejos',
  intro:'El modal de los <b>consejos y recomendaciones</b>. Equivale a «debería». Como todo modal: nunca cambia y va con verbo base.',
  uses:[
    {name:'1. Dar consejos', small:'should = deberías', ex:[
      ["You <b>should</b> see a doctor.","Deberías ver a un médico."],
      ["We <b>should</b> save more money.","Deberíamos ahorrar más dinero."]]},
    {name:'2. Desaconsejar', small:"shouldn't = no deberías", ex:[
      ["You <b>shouldn't</b> eat so much sugar.","No deberías comer tanta azúcar."],
      ["He <b>shouldn't</b> drive so fast.","Él no debería manejar tan rápido."]]},
    {name:'3. Pedir consejo', small:'preguntas con should', ex:[
      ["<b>Should</b> I apply for that job?","¿Debería postularme a ese trabajo?"],
      ["What <b>should</b> we do?","¿Qué deberíamos hacer?"]]},
    {name:'4. Arrepentimiento', small:'should have + participio', ex:[
      ["I <b>should have studied</b> more.","Debí haber estudiado más. (pero no lo hice)"],
      ["You <b>shouldn't have said</b> that.","No debiste haber dicho eso. (pero lo dijiste)"]]},
    {name:'Parientes cercanos', small:'ought to · had better', ex:[
      ["You <b>ought to</b> apologize.","Deberías disculparte. (= should, más formal)"],
      ["You<b>'d better</b> hurry or you'll miss the bus.","Más te vale apurarte o pierdes el bus. (advertencia fuerte)"]]}
  ],
  tip:'<b>Should have + participio</b> es la fórmula del arrepentimiento: habla de algo que era buena idea… pero no pasó. «I should have called you» = debí llamarte (y no llamé). ¡Otro lugar donde brillan tus participios!',
  qTitle:'Completa con la forma correcta:',
  opts:['should','shouldn\'t','should have + participio'],
  quiz:[
    {s:'You <span class="blank">___</span> drink more water every day.', a:0, tr:'Deberías tomar más agua cada día. (consejo)'},
    {s:'I failed the exam. I <span class="blank">___</span> (study) more.', a:2, tr:'I should have studied more. (arrepentimiento: no estudié)'},
    {s:'You <span class="blank">___</span> stay up so late — you look tired.', a:1, tr:'No deberías trasnochar tanto. (desaconsejar)'},
    {s:'<span class="blank">___</span> we invite your boss to the party?', a:0, tr:'¿Deberíamos invitar a tu jefe a la fiesta? (pedir consejo)'},
    {s:"Sorry, I <span class=\"blank\">___</span> (tell) you earlier.", a:2, tr:'I should have told you earlier. (debí decírtelo antes)'},
    {s:'Kids <span class="blank">___</span> spend all day on their phones.', a:1, tr:'Los niños no deberían pasar todo el día en el celular.'}
  ]
},
{
  id:'must', word:'must · have to', tag:'Modal: obligación',
  intro:'Los dos «tener que / deber» del inglés, con una trampa famosa en sus negativos:',
  uses:[
    {name:'1. Obligación', small:'must (interna/reglas) · have to (externa)', ex:[
      ["You <b>must</b> wear a seatbelt.","Debes usar cinturón. (regla/ley)"],
      ["I <b>have to</b> work on Saturday.","Tengo que trabajar el sábado. (me toca)"],
      ["She <b>has to</b> get up early.","Ella tiene que madrugar."]]},
    {name:"2. ⚠️ Prohibición: mustn't", small:'= prohibido', ex:[
      ["You <b>mustn't</b> smoke here.","Está prohibido fumar aquí."],
      ["You <b>mustn't</b> tell anyone.","No debes decírselo a nadie. (¡prohibido!)"]]},
    {name:"3. ⚠️ Sin obligación: don't have to", small:'= no es necesario', ex:[
      ["You <b>don't have to</b> come if you're busy.","No tienes que venir si estás ocupado. (es opcional)"],
      ["He <b>doesn't have to</b> pay — it's free.","Él no tiene que pagar: es gratis."]]},
    {name:'4. Deducción lógica', small:'must = seguramente', ex:[
      ["You worked 12 hours — you <b>must</b> be tired.","Trabajaste 12 horas: debes estar cansadísimo."],
      ["She <b>must</b> be at home; the lights are on.","Debe estar en casa: las luces están encendidas."]]}
  ],
  tip:"La trampa: <b>mustn't</b> y <b>don't have to</b> NO son lo mismo. <b>Mustn't</b> = prohibido («You mustn't park here»). <b>Don't have to</b> = no es necesario, es opcional («You don't have to wear a tie»). Además, must no tiene pasado ni futuro: usa <b>had to</b> y <b>will have to</b>.",
  qTitle:'¿Qué expresa la oración?',
  opts:['Obligación','Prohibición (mustn\'t)','No es necesario (don\'t have to)','Deducción (seguramente)'],
  quiz:[
    {s:'Passengers <b>must</b> turn off their phones.', a:0, tr:'Los pasajeros deben apagar sus teléfonos. (regla)'},
    {s:"You <b>mustn't</b> use your phone while driving.", a:1, tr:'Está prohibido usar el celular manejando.'},
    {s:"It's Sunday — I <b>don't have to</b> work today!", a:2, tr:'Es domingo: ¡no tengo que trabajar hoy! (no es necesario)'},
    {s:"He's yawning a lot. He <b>must</b> be sleepy.", a:3, tr:'Bosteza mucho. Debe tener sueño. (deducción)'},
    {s:'I <b>have to</b> renew my passport this month.', a:0, tr:'Tengo que renovar mi pasaporte este mes.'},
    {s:"You <b>don't have to</b> bring anything to the party.", a:2, tr:'No tienes que traer nada a la fiesta. (opcional)'},
    {s:"Students <b>mustn't</b> cheat on exams.", a:1, tr:'Los estudiantes tienen prohibido hacer trampa.'},
    {s:'The lights are off. They <b>must</b> be asleep.', a:3, tr:'Las luces están apagadas. Deben estar dormidos. (deducción)'}
  ]
},
{
  id:'maymight', word:'may · might', tag:'Modal: quizás',
  intro:'Los modales de la <b>posibilidad</b> («puede que / quizás») y del <b>permiso formal</b>:',
  uses:[
    {name:'1. Posibilidad', small:'may (más probable) · might (menos seguro)', ex:[
      ["It <b>may</b> rain this afternoon.","Puede que llueva esta tarde."],
      ["I <b>might</b> go to the gym later.","Quizás vaya al gimnasio más tarde. (no estoy seguro)"],
      ["She <b>might not</b> come to the meeting.","Puede que ella no venga a la reunión."]]},
    {name:'2. Permiso formal', small:'may = más elegante que can', ex:[
      ["<b>May</b> I come in?","¿Puedo pasar? (formal)"],
      ["You <b>may</b> begin the exam now.","Pueden comenzar el examen ahora."]]},
    {name:'3. Deseos y fórmulas', small:'may + sujeto + verbo', ex:[
      ["<b>May</b> all your dreams come true!","¡Que todos tus sueños se hagan realidad!"],
      ["<b>May</b> the Force be with you.","Que la Fuerza te acompañe. 😄"]]}
  ],
  tip:'Escala de certeza para el futuro: <b>will</b> (seguro, ~100%) → <b>may</b> (probable, ~50%) → <b>might</b> (posible, ~30%). «I will go» = voy fijo · «I may go» = puede que vaya · «I might go» = quizás vaya, quién sabe.',
  qTitle:'¿Qué expresa may/might aquí?',
  opts:['Posibilidad (quizás)','Permiso formal','Deseo / fórmula'],
  quiz:[
    {s:'I <b>might</b> visit my parents this weekend.', a:0, tr:'Quizás visite a mis padres este fin de semana.'},
    {s:'<b>May</b> I ask you a question?', a:1, tr:'¿Puedo hacerle una pregunta? (formal)'},
    {s:'Take an umbrella — it <b>may</b> rain.', a:0, tr:'Lleva paraguas: puede que llueva.'},
    {s:'<b>May</b> you have a wonderful birthday!', a:2, tr:'¡Que tengas un cumpleaños maravilloso!'},
    {s:'Visitors <b>may</b> use the pool until 10 pm.', a:1, tr:'Los visitantes pueden usar la piscina hasta las 10 pm. (permiso)'},
    {s:'She <b>might not</b> like the surprise.', a:0, tr:'Puede que a ella no le guste la sorpresa.'}
  ]
},
{
  id:'would', word:'would', tag:'Modal: cortesía y condicional',
  intro:'El modal más «caballeroso» del inglés: sirve para hipótesis, cortesía y hasta recuerdos. Sus 4 usos:',
  uses:[
    {name:'1. Condicional', small:'lo que harías (si…)', ex:[
      ["I <b>would</b> travel more if I had money.","Viajaría más si tuviera dinero."],
      ["What <b>would</b> you do in my place?","¿Qué harías tú en mi lugar?"]]},
    {name:'2. Peticiones y ofertas corteses', small:'nivel máximo de amabilidad', ex:[
      ["<b>Would</b> you mind closing the door?","¿Te importaría cerrar la puerta?"],
      ["<b>Would</b> you like some coffee?","¿Quisieras / te gustaría un café?"]]},
    {name:'3. would like = querer (formal)', small:'en restaurantes, tiendas…', ex:[
      ["I<b>'d like</b> a table for two, please.","Quisiera una mesa para dos, por favor."],
      ["We<b>'d like</b> to check in.","Quisiéramos hacer el check-in."]]},
    {name:'4. Hábitos del pasado', small:'would = solía (como used to)', ex:[
      ["When I was a kid, we <b>would</b> play outside all day.","De niño, jugábamos afuera todo el día."],
      ["My grandma <b>would</b> always make arepas on Sundays.","Mi abuela siempre hacía arepas los domingos."]]}
  ],
  tip:'La escala de cortesía para pedir cosas: <b>Can you…?</b> (informal) → <b>Could you…?</b> (amable) → <b>Would you mind…?</b> (súper cortés, ¡y va con -ing!: «Would you mind help<b>ing</b> me?»). Y en un restaurante, di «I\'d like…» en vez de «I want…»: suena mucho mejor.',
  qTitle:'¿Qué expresa would en cada oración?',
  opts:['Condicional (haría)','Petición / oferta cortés','would like = quisiera','Hábito del pasado'],
  quiz:[
    {s:'I <b>would</b> buy that car if it were cheaper.', a:0, tr:'Compraría ese carro si fuera más barato.'},
    {s:'<b>Would</b> you like something to drink?', a:1, tr:'¿Te gustaría algo de tomar? (oferta cortés)'},
    {s:"I<b>'d like</b> the chicken, please.", a:2, tr:'Quisiera el pollo, por favor. (pedir en restaurante)'},
    {s:'Every summer, we <b>would</b> visit my uncle\'s farm.', a:3, tr:'Cada verano, visitábamos la finca de mi tío. (hábito pasado)'},
    {s:'<b>Would</b> you mind turning down the music?', a:1, tr:'¿Te importaría bajarle a la música? (petición muy cortés)'},
    {s:'She <b>would</b> help you if you asked her.', a:0, tr:'Ella te ayudaría si le pidieras.'},
    {s:'As kids, we <b>would</b> swim in the river.', a:3, tr:'De niños, nadábamos en el río.'},
    {s:"We<b>'d like</b> to book a room for tonight.", a:2, tr:'Quisiéramos reservar una habitación para esta noche.'}
  ]
},
{
  id:'pronouns', word:'him · his · them · their…', tag:'El mapa de los pronombres',
  intro:'La confusión entre <i>him/his</i>, <i>them/their</i> o <i>her/hers</i> se resuelve con este mapa. Cada persona tiene 4 versiones según su función en la frase:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 6px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Sujeto<br><span style="font-weight:400">hace la acción</span></th><th style="padding:7px 6px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Objeto<br><span style="font-weight:400">recibe la acción</span></th><th style="padding:7px 6px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Posesivo + sustantivo<br><span style="font-weight:400">su carro</span></th><th style="padding:7px 6px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Posesivo solo<br><span style="font-weight:400">es suyo</span></th></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>I</b> (yo)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>me</b></td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>my</b> (mi)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>mine</b> (mío)</td></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>you</b> (tú)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>you</b></td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>your</b> (tu)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>yours</b> (tuyo)</td></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>he</b> (él)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>him</b> (lo/le)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>his</b> (su, de él)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>his</b> (suyo)</td></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>she</b> (ella)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>her</b> (la/le)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>her</b> (su, de ella)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>hers</b> (suyo)</td></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>it</b> (eso)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>it</b></td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>its</b> (su, de cosa)</td><td style="padding:6px; border-bottom:1px solid var(--line)">—</td></tr>'
  + '<tr><td style="padding:6px; border-bottom:1px solid var(--line)"><b>we</b> (nosotros)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>us</b> (nos)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>our</b> (nuestro)</td><td style="padding:6px; border-bottom:1px solid var(--line)"><b>ours</b> (el nuestro)</td></tr>'
  + '<tr><td style="padding:6px"><b>they</b> (ellos)</td><td style="padding:6px"><b>them</b> (los/les)</td><td style="padding:6px"><b>their</b> (su, de ellos)</td><td style="padding:6px"><b>theirs</b> (el suyo)</td></tr>'
  + '</table>Y así se ven en acción:',
  uses:[
    {name:'Sujeto', small:'antes del verbo · hace la acción', ex:[
      ["<b>He</b> works here. / <b>They</b> live in Cali.","Él trabaja aquí. / Ellos viven en Cali."]]},
    {name:'Objeto', small:'después del verbo o de una preposición', ex:[
      ["Call <b>me</b> tonight.","Llámame esta noche."],
      ["I saw <b>them</b> at the mall.","Los vi en el centro comercial."],
      ["Come with <b>us</b>. / This gift is for <b>her</b>.","Ven con nosotros. / Este regalo es para ella."]]},
    {name:'Posesivo + sustantivo', small:'my, his, her, their… + cosa', ex:[
      ["<b>Their</b> house is beautiful.","Su casa (de ellos) es hermosa."],
      ["I like <b>his</b> car. / <b>Her</b> name is Ana.","Me gusta su carro (de él). / Su nombre (de ella) es Ana."]]},
    {name:'Posesivo solo', small:'mine, hers, theirs… sin sustantivo', ex:[
      ["That bag is <b>hers</b>.","Ese bolso es de ella / suyo."],
      ["The blue car is <b>theirs</b>, the red one is <b>mine</b>.","El carro azul es de ellos, el rojo es mío."],
      ["A friend of <b>mine</b> lives there.","Un amigo mío vive allá."]]},
    {name:'⚠️ Las trampas clásicas', small:'no las confundas', ex:[
      ["<b>her</b> = objeto Y posesivo","«I called <b>her</b>» (la llamé) vs «<b>her</b> phone» (su teléfono)"],
      ["<b>their</b> ≠ <b>they're</b> ≠ <b>there</b>","su (de ellos) ≠ ellos son/están (they are) ≠ allí"],
      ["<b>its</b> ≠ <b>it's</b>","su (de una cosa) ≠ eso es/está (it is)"]]}
  ],
  tip:'El truco infalible: mira qué viene <b>después</b>. Si sigue un sustantivo → posesivo: «<b>their</b> car», «<b>his</b> idea». Si está después de un verbo o preposición y NO sigue sustantivo → objeto: «I saw <b>them</b>», «talk to <b>him</b>». Ojo con <b>her</b>, que juega en ambos equipos, y con <b>his</b>, que es igual en las dos columnas de posesivos.',
  qTitle:'¿Qué función cumple el pronombre resaltado?',
  opts:['Sujeto','Objeto','Posesivo + sustantivo','Posesivo solo'],
  quiz:[
    {s:'I saw <b>them</b> at the concert.', a:1, tr:'Los vi en el concierto. (después del verbo, sin sustantivo → objeto)'},
    {s:'<b>Their</b> apartment has a great view.', a:2, tr:'Su apartamento tiene una gran vista. (their + sustantivo → posesivo)'},
    {s:'That umbrella is <b>hers</b>.', a:3, tr:'Ese paraguas es de ella. (sin sustantivo después → posesivo solo)'},
    {s:'<b>He</b> works with my brother.', a:0, tr:'Él trabaja con mi hermano. (hace la acción → sujeto)'},
    {s:'Can you help <b>us</b> with the boxes?', a:1, tr:'¿Nos puedes ayudar con las cajas? (recibe la acción → objeto)'},
    {s:'I called <b>her</b> last night.', a:1, tr:'La llamé anoche. (her sin sustantivo después → objeto)'},
    {s:'<b>Her</b> sister lives in Cali.', a:2, tr:'Su hermana (de ella) vive en Cali. (her + sustantivo → posesivo)'},
    {s:'The blue car is <b>theirs</b>.', a:3, tr:'El carro azul es de ellos. (sin sustantivo → posesivo solo)'},
    {s:'I love <b>his</b> new song.', a:2, tr:'Me encanta su nueva canción (de él). (his + sustantivo → posesivo)'},
    {s:'Please give <b>him</b> the keys.', a:1, tr:'Por favor dale las llaves (a él). (him = a quién se le da → objeto)'}
  ]
},
{
  id:'prperfcont', word:'perfecto continuo', tag:'have/has + been + -ing',
  intro:'El <b>presente perfecto progresivo/continuo</b>: para acciones que empezaron en el pasado y <b>siguen en curso</b> (o acaban de parar), con énfasis en la <b>duración</b>. Sus estructuras:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em; width:20%">Tipo</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Fórmula</th></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b style="color:var(--reg)">(+) Afirmativa</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">Pronombre + <b>has/have</b> + <b>been</b> + <b>verbo-ing</b> (o lugar) + complemento<br><span style="color:var(--ink-soft)">She <b>has been studying</b> all day. / I <b>have been</b> in Medellín since May.</span></td></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b style="color:var(--irr)">(−) Negativa</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">Pronombre + <b>hasn\'t/haven\'t</b> + <b>been</b> + <b>verbo-ing</b> + complemento<br><span style="color:var(--ink-soft)">They <b>haven\'t been sleeping</b> well.</span></td></tr>'
  + '<tr><td style="padding:7px 8px"><b style="color:var(--blue)">(?) Pregunta</b></td><td style="padding:7px 8px"><b>Has/Have</b> + pronombre + <b>been</b> + <b>verbo-ing</b> + complemento?<br><span style="color:var(--ink-soft)"><b>Have</b> you <b>been waiting</b> long?</span></td></tr>'
  + '</table>Recuerda: <b>has</b> con he/she/it · <b>have</b> con I/you/we/they. Y así se usa:',
  uses:[
    {name:'1. Duración hasta ahora', small:'con for / since / how long', ex:[
      ["I <b>have been studying</b> English <b>for</b> two years.","Llevo dos años estudiando inglés. (y sigo)"],
      ["She <b>has been working</b> here <b>since</b> 2023.","Ella trabaja aquí desde 2023."],
      ["<b>How long have</b> you <b>been waiting</b>?","¿Cuánto llevas esperando?"]]},
    {name:'2. Acción reciente con evidencia', small:'se nota el rastro', ex:[
      ["It <b>has been raining</b> — the streets are wet.","Ha estado lloviendo: las calles están mojadas."],
      ["Your eyes are red. <b>Have</b> you <b>been crying</b>?","Tienes los ojos rojos. ¿Has estado llorando?"],
      ["I<b>'ve been running</b>, that's why I'm sweating.","He estado corriendo, por eso estoy sudando."]]},
    {name:'3. been + lugar', small:'perfecto del verbo be', ex:[
      ["He <b>has been in</b> Bogotá since Monday.","Él está en Bogotá desde el lunes."],
      ["<b>Have</b> you ever <b>been to</b> Cartagena?","¿Alguna vez has ido/estado en Cartagena?"]]},
    {name:'4. vs. perfecto simple', small:'duración vs resultado', ex:[
      ["I <b>have been painting</b> the house.","He estado pintando la casa. (énfasis: llevo rato en eso)"],
      ["I <b>have painted</b> the house.","He pintado la casa. (énfasis: ya quedó, resultado)"],
      ["She <b>has written</b> three emails.","Escribió tres correos. (cantidad terminada → simple)"]]}
  ],
  tip:'¿Simple o continuo? Si el foco es la <b>duración o la actividad</b> («llevo horas…») → continuo: <i>have been + -ing</i>. Si el foco es el <b>resultado o la cantidad</b> («ya terminé», «tres veces») → simple: <i>have + participio</i>. ⚠️ Los verbos de estado (<b>know, like, love, want, believe, have</b> de posesión) NO van en continuo: «We <b>have known</b> each other for years» ✓, nunca ~~have been knowing~~.',
  qTitle:'¿Perfecto simple o perfecto continuo? Piensa: ¿resultado o duración?',
  opts:['perfecto simple (have + participio)','perfecto continuo (have been + -ing)'],
  quiz:[
    {s:"I <span class=\"blank\">___</span> (run) for two hours — I'm exhausted!", a:1, tr:'I have been running for two hours. (duración de la actividad)'},
    {s:'She <span class="blank">___</span> (read) three books this year.', a:0, tr:'She has read three books. (cantidad terminada → simple)'},
    {s:'Your hands are dirty. <span class="blank">___</span> you <span class="blank">___</span> (cook)?', a:1, tr:'Have you been cooking? (evidencia reciente → continuo)'},
    {s:'We <span class="blank">___</span> (know) each other since school.', a:0, tr:'We have known each other since school. (know = verbo de estado, ¡nunca en -ing!)'},
    {s:'How long <span class="blank">___</span> you <span class="blank">___</span> (wait) for the bus?', a:1, tr:'How long have you been waiting? (how long = duración)'},
    {s:'I <span class="blank">___</span> (finish) my homework — can I play now?', a:0, tr:'I have finished my homework. (resultado: ya quedó)'},
    {s:'It <span class="blank">___</span> (rain) all day, take your umbrella.', a:1, tr:'It has been raining all day. (actividad continua)'},
    {s:'They <span class="blank">___</span> (visit) Paris twice.', a:0, tr:'They have visited Paris twice. (número de veces → simple)'}
  ]
},
{
  id:'freq', word:'always · never · ever…', tag:'Adverbios de frecuencia',
  intro:'Aprende esto en 4 pasos. <b>Paso 1: elige tu palabra en la escala</b> según qué tan seguido pasa algo, del 100% al 0%:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:6px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Frecuencia</th><th style="padding:6px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Palabra</th><th style="padding:6px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Español</th></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">100%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>always</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">siempre</td></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">~90%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>usually</b> / <b>normally</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">usualmente / normalmente</td></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">~70%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>often</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">a menudo</td></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">~50%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>sometimes</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">a veces</td></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">~10%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>rarely</b> / <b>seldom</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">rara vez</td></tr>'
  + '<tr><td style="padding:6px 8px; border-bottom:1px solid var(--line)">~5%</td><td style="padding:6px 8px; border-bottom:1px solid var(--line)"><b>hardly ever</b></td><td style="padding:6px 8px; border-bottom:1px solid var(--line)">casi nunca</td></tr>'
  + '<tr><td style="padding:6px 8px">0%</td><td style="padding:6px 8px"><b>never</b></td><td style="padding:6px 8px">nunca</td></tr>'
  + '</table>Nota que <b>ever no está en la escala</b>: ever no dice frecuencia, ever <b>pregunta</b> por ella («¿alguna vez?»). Ese es el corazón de la lección. Sigue los pasos:',
  uses:[
    {name:'Paso 2 · Colócala bien', small:'una sola regla de posición', ex:[
      ["🧲 El adverbio se pega ANTES del verbo normal:<br>I <b>always</b> drink coffee. · She <b>never</b> arrives late.","Siempre tomo café. · Ella nunca llega tarde."],
      ["🧲 …pero DESPUÉS del verbo be:<br>He <b>is always</b> late. · They <b>are never</b> home.","Él siempre llega tarde. · Nunca están en casa."],
      ["Memotecnia: el adverbio es tímido con los verbos normales (se adelanta) pero fan de <i>be</i> (lo persigue).",""]]},
    {name:'Paso 3 · El dúo estrella', small:'⭐ EVER pregunta → NEVER responde', ex:[
      ["— Have you <b>ever</b> been to Japan?<br>— No, <b>never</b>. / — <b>Never!</b>","— ¿Alguna vez has ido a Japón?<br>— No, nunca. / — ¡Jamás!"],
      ["— Do you <b>ever</b> cook at home?<br>— <b>Hardly ever</b>, maybe once a month.","— ¿Alguna vez cocinas en casa?<br>— Casi nunca, quizás una vez al mes."],
      ["— Would you forgive him?<br>— <b>Never ever!</b> / That restaurant? <b>Never again!</b>","— ¿Lo perdonarías?<br>— ¡Nunca jamás! / ¿Ese restaurante? ¡Nunca más!"]]},
    {name:'Paso 4 · La gramática secreta de never', small:'significado negativo, oración positiva', ex:[
      ["I <b>never</b> smoke. ✓","Nunca fumo. (never ya es negativo: la oración va SIN don't)"],
      ["~~I don't never smoke~~ ✗","En español doblamos («no fumo nunca»), en inglés JAMÁS se dobla la negación."],
      ["I will <b>never</b> forget that day.","Nunca olvidaré ese día."]]},
    {name:'Bonus · Las otras casas de ever', small:'donde también vive', ex:[
      ["That was the best concert <b>ever</b>!","¡El mejor concierto de la historia! (ever + superlativo)"],
      ["It's the hardest exam I've <b>ever</b> taken.","Es el examen más difícil que he presentado en mi vida."],
      ["<b>Hardly ever</b> = casi nunca","La única vez que ever entra a la escala: pegado a hardly."]]}
  ],
  tip:'Todo cabe en dos frases: (1) <b>«EVER pregunta, NEVER responde»</b> — ever vive en las preguntas (¿alguna vez?), never en las respuestas (nunca/jamás), y never funciona sola: «— Have you ever…? — Never.» (2) <b>El adverbio va antes del verbo normal, pero después de be</b>: «I always work» vs «I am always tired». Y recuerda: never ya es negativo → nunca con don\'t.',
  qTitle:'¿Qué palabra completa cada oración? (Pista: ¿pregunta o responde? ¿qué % de frecuencia?)',
  opts:['always','usually','sometimes','hardly ever','never','ever'],
  quiz:[
    {s:'Do you <span class="blank">___</span> eat arepas for breakfast?', a:5, tr:'Do you EVER eat arepas…? (es pregunta → ever pregunta)'},
    {s:'"Have you ever been to Japan?" — "No, <span class="blank">___</span>."', a:4, tr:'— No, never. (es respuesta → never responde)'},
    {s:'I <span class="blank">___</span> drink coffee — every single morning, no exceptions.', a:0, tr:'Siempre tomo café: sin excepciones. (always = 100%)'},
    {s:'He <span class="blank">___</span> smokes; he hates cigarettes.', a:4, tr:'Él nunca fuma. (never = 0%, y la oración va sin don\'t)'},
    {s:'I <span class="blank">___</span> get up at 6, but on Sundays I sleep in.', a:1, tr:'Usualmente me levanto a las 6. (usually = ~90%, hay excepciones)'},
    {s:'We <span class="blank">___</span> go to the movies — maybe once or twice a month.', a:2, tr:'A veces vamos al cine. (sometimes = ~50%)'},
    {s:'"How often do you eat out?" — "<span class="blank">___</span>, maybe once a year."', a:3, tr:'— Hardly ever. (casi nunca, como respuesta corta)'},
    {s:'That was the best pizza <span class="blank">___</span>!', a:5, tr:'¡La mejor pizza de la historia! (ever + superlativo)'},
    {s:'She <span class="blank">___</span> gets sick — maybe once every five years.', a:3, tr:'Casi nunca se enferma. (hardly ever = ~5%)'},
    {s:'I will <span class="blank">___</span> forget this trip.', a:4, tr:'Nunca olvidaré este viaje. (never, ¡sin doble negación!)'}
  ]
},
{
  id:'dodid', word:'do · does · did', tag:'Preguntas y negaciones',
  intro:'Los «ayudantes invisibles» del inglés: sin ellos no puedes hacer preguntas ni negar en presente y pasado simple. La mecánica:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em; width:22%">Tipo</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Presente</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Pasado</th></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b style="color:var(--reg)">(+)</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">I work / She work<b>s</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">I work<b>ed</b> / saw</td></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b style="color:var(--blue)">(?)</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>Do</b> you work? / <b>Does</b> she work?</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>Did</b> you work? / see?</td></tr>'
  + '<tr><td style="padding:7px 8px"><b style="color:var(--irr)">(−)</b></td><td style="padding:7px 8px">I <b>don\'t</b> work / She <b>doesn\'t</b> work</td><td style="padding:7px 8px">I <b>didn\'t</b> work / see</td></tr>'
  + '</table>Fíjate en el detalle clave: en preguntas y negaciones, <b>el verbo principal siempre vuelve a su forma base</b>.',
  uses:[
    {name:'1. Preguntas en presente', small:'do / does + verbo base', ex:[
      ["<b>Do</b> you like coffee?","¿Te gusta el café?"],
      ["<b>Does</b> she speak English?","¿Ella habla inglés? (¡speaks pierde la -s: se la lleva does!)"],
      ["Where <b>do</b> they live?","¿Dónde viven ellos?"]]},
    {name:'2. Negaciones en presente', small:"don't / doesn't + verbo base", ex:[
      ["I <b>don't</b> understand.","No entiendo."],
      ["He <b>doesn't</b> live here anymore.","Él ya no vive aquí."]]},
    {name:'3. Preguntas y negaciones en pasado', small:'did / didn\'t + verbo base', ex:[
      ["<b>Did</b> you see the game?","¿Viste el partido? (see, no ~~saw~~: did ya carga el pasado)"],
      ["We <b>didn't</b> go to the party.","No fuimos a la fiesta."]]},
    {name:'4. Respuestas cortas', small:'sin repetir el verbo', ex:[
      ["Do you like it? — Yes, I <b>do</b>. / No, I <b>don't</b>.","¿Te gusta? — Sí. / No."],
      ["Did she call? — Yes, she <b>did</b>.","¿Llamó? — Sí, llamó."]]}
  ],
  tip:'La -s de la tercera persona y el pasado <b>se mudan al auxiliar</b>: «She work<b>s</b> → <b>Does</b> she work?» · «I <b>saw</b> → <b>Did</b> you see?». Si dices ~~Does she works?~~ o ~~Did you saw?~~ estás cobrando el tiempo dos veces. Excepción: el verbo <b>be</b> no necesita ayudantes: «Are you tired?», «She isn\'t here».',
  qTitle:'¿Qué auxiliar completa cada oración?',
  opts:['do','does','did','don\'t / doesn\'t / didn\'t'],
  quiz:[
    {s:'<span class="blank">___</span> she like sushi?', a:1, tr:'Does she like sushi? (tercera persona → does, y like sin -s)'},
    {s:'<span class="blank">___</span> you watch the game last night?', a:2, tr:'Did you watch the game? («last night» = pasado → did)'},
    {s:'Where <span class="blank">___</span> they live?', a:0, tr:'Where do they live? (they → do)'},
    {s:"I <span class=\"blank\">___</span> speak French, sorry.", a:3, tr:"I don't speak French. (negación en presente, yo → don't)"},
    {s:'<span class="blank">___</span> your brother work here?', a:1, tr:'Does your brother work here? (your brother = he → does)'},
    {s:'We <span class="blank">___</span> go to the beach yesterday — it rained.', a:3, tr:"We didn't go to the beach. (negación en pasado → didn't + go)"},
    {s:'What time <span class="blank">___</span> the store open?', a:1, tr:'What time does the store open? (the store = it → does)'},
    {s:'<span class="blank">___</span> you sleep well last night?', a:2, tr:'Did you sleep well? (pasado → did + sleep en base)'}
  ]
},
{
  id:'thereis', word:'there is · there are', tag:'El «hay» del inglés',
  intro:'En español «hay» es una sola palabra para todo. En inglés cambia según el <b>número</b> y el <b>tiempo</b>:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Tiempo</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Singular</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">Plural</th></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)">Presente (hay)</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>there is</b> (there\'s)</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>there are</b></td></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)">Pasado (había/hubo)</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>there was</b></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>there were</b></td></tr>'
  + '<tr><td style="padding:7px 8px">Futuro (habrá)</td><td style="padding:7px 8px" colspan="2"><b>there will be</b> (igual para ambos)</td></tr>'
  + '</table>Y así se usa:',
  uses:[
    {name:'1. Afirmar', small:'mira el sustantivo que sigue', ex:[
      ["<b>There is</b> a cat on the roof.","Hay un gato en el techo. (un gato → singular)"],
      ["<b>There are</b> two options.","Hay dos opciones. (dos → plural)"]]},
    {name:'2. Negar', small:"isn't / aren't + any", ex:[
      ["<b>There isn't</b> any milk in the fridge.","No hay leche en la nevera."],
      ["<b>There aren't</b> any tickets left.","No quedan boletas."]]},
    {name:'3. Preguntar', small:'se invierte: is/are primero', ex:[
      ["<b>Is there</b> a pharmacy near here?","¿Hay una farmacia cerca de aquí?"],
      ["<b>Are there</b> any questions?","¿Hay preguntas?"]]},
    {name:'4. Pasado y futuro', small:'was/were · will be', ex:[
      ["<b>There was</b> a party last night.","Hubo una fiesta anoche."],
      ["<b>There were</b> many people at the concert.","Había mucha gente en el concierto."],
      ["<b>There will be</b> a meeting tomorrow.","Habrá una reunión mañana."]]}
  ],
  tip:'El error clásico es usar «have»: ~~In my city have many parks~~ ✗. «Hay» NUNCA se dice con have: «In my city <b>there are</b> many parks» ✓. Y para elegir is/are, mira el sustantivo que viene <b>después</b>: there is a car / there are two cars.',
  qTitle:'¿Cuál forma de «hay» completa la oración?',
  opts:['there is / is there','there are / are there','there was / there were','there will be'],
  quiz:[
    {s:'<span class="blank">___</span> a pharmacy near here?', a:0, tr:'Is there a pharmacy near here? (una farmacia → singular, presente)'},
    {s:'<span class="blank">___</span> many people at the concert last night.', a:2, tr:'There were many people. (pasado + plural → were)'},
    {s:'<span class="blank">___</span> two bathrooms in the apartment.', a:1, tr:'There are two bathrooms. (dos → plural)'},
    {s:'<span class="blank">___</span> a meeting tomorrow at 9.', a:3, tr:'There will be a meeting tomorrow. (mañana → futuro)'},
    {s:'<span class="blank">___</span> a problem with my order.', a:0, tr:'There is a problem. (un problema → singular)'},
    {s:'<span class="blank">___</span> a storm last night?', a:2, tr:'Was there a storm last night? (anoche → pasado)'},
    {s:'<span class="blank">___</span> any questions?', a:1, tr:'Are there any questions? (preguntas → plural)'},
    {s:"Don't worry — <span class=\"blank\">___</span> another opportunity.", a:3, tr:'There will be another opportunity. (habrá → futuro)'}
  ]
},
{
  id:'oneones', word:'one · ones', tag:'El sustituto del sustantivo',
  intro:'En español decimos «el rojo», «la blanca», «este» y ya. En inglés el adjetivo <b>no puede quedar solo</b>: necesita a <b>one</b> (singular) u <b>ones</b> (plural) sosteniendo el lugar del sustantivo para no repetirlo.',
  uses:[
    {name:'1. one = singular', small:'the/a + adjetivo + one', ex:[
      ["The blue car is theirs, the red <b>one</b> is mine.","El carro azul es de ellos, el rojo es mío. (one = car)"],
      ["Which shirt do you want? — The white <b>one</b>.","¿Cuál camisa quieres? — La blanca."],
      ["This phone is old, I need a new <b>one</b>.","Este teléfono está viejo, necesito uno nuevo."]]},
    {name:'2. ones = plural', small:'para varias cosas', ex:[
      ["These shoes are old, I need new <b>ones</b>.","Estos zapatos están viejos, necesito unos nuevos."],
      ["The cheap tickets are sold out, only the expensive <b>ones</b> are left.","Las boletas baratas se agotaron, solo quedan las caras."]]},
    {name:'3. this one / that one', small:'este / ese', ex:[
      ["I don't like this phone, I prefer that <b>one</b>.","No me gusta este teléfono, prefiero ese."],
      ["This <b>one</b> is my favorite.","Este es mi favorito."]]},
    {name:'4. which one(s)?', small:'¿cuál? / ¿cuáles?', ex:[
      ["Which <b>one</b> do you want?","¿Cuál quieres?"],
      ["Which <b>ones</b> are yours?","¿Cuáles son tuyos?"]]}
  ],
  tip:'La fórmula mental: cada vez que en español dirías «el/la + adjetivo» o «este/ese» refiriéndote a algo ya mencionado, en inglés es <b>the/this/that + adjetivo + one</b> (u <b>ones</b> en plural). Decir ~~the red is mine~~ suena tan raro como dejar la frase a medias.',
  qTitle:'¿One u ones?',
  opts:['one','ones'],
  quiz:[
    {s:'Which car is yours? — The blue <span class="blank">___</span>.', a:0, tr:'The blue one. (un solo carro → one)'},
    {s:"I don't like these cups. Do you have bigger <span class=\"blank\">___</span>?", a:1, tr:'Do you have bigger ones? (varias tazas → ones)'},
    {s:'This <span class="blank">___</span> is my favorite song.', a:0, tr:'This one is my favorite song. (una canción → one)'},
    {s:'The old houses were demolished; the new <span class="blank">___</span> are modern.', a:1, tr:'The new ones are modern. (varias casas → ones)'},
    {s:'Which <span class="blank">___</span> do you prefer, tea or coffee?', a:0, tr:'Which one do you prefer? (una opción → one)'},
    {s:'My headphones broke, so I bought new <span class="blank">___</span>.', a:1, tr:'I bought new ones. (headphones = plural → ones)'}
  ]
},
{
  id:'simplecont', word:'simple vs continuo', tag:'I work vs I\'m working',
  intro:'En español «trabajo» puede significar las dos cosas, y por eso confunde. En inglés son dos tiempos distintos: <b>presente simple</b> (rutinas y hechos) vs <b>presente continuo</b> (am/is/are + -ing, lo que pasa ahora mismo).',
  uses:[
    {name:'1. Presente simple: rutinas y hechos', small:'every day · always · usually', ex:[
      ["I <b>work</b> from home.","Trabajo desde casa. (en general, es mi situación)"],
      ["She <b>drinks</b> coffee every morning.","Ella toma café cada mañana. (rutina)"],
      ["The sun <b>rises</b> in the east.","El sol sale por el este. (hecho universal)"]]},
    {name:'2. Presente continuo: ahora mismo', small:'now · right now · at the moment', ex:[
      ["I<b>'m working</b> right now, I'll call you later.","Estoy trabajando ahora mismo, te llamo luego."],
      ["Shh! The baby <b>is sleeping</b>.","¡Shh! El bebé está durmiendo."],
      ["What <b>are</b> you <b>doing</b>?","¿Qué estás haciendo?"]]},
    {name:'3. Continuo para planes ya agendados', small:'futuro cercano', ex:[
      ["I<b>'m flying</b> to Cartagena tomorrow.","Vuelo a Cartagena mañana. (ya está agendado)"],
      ["We<b>'re having</b> dinner with Ana on Friday.","Cenamos con Ana el viernes."]]},
    {name:'4. ⚠️ Verbos de estado: solo simple', small:'know, like, love, want, need, believe', ex:[
      ["I <b>know</b> the answer.","Sé la respuesta. (nunca ~~I'm knowing~~)"],
      ["She <b>wants</b> a new laptop.","Ella quiere un portátil nuevo. (nunca ~~is wanting~~)"]]}
  ],
  tip:'La prueba rápida: si puedes agregar «en este momento» → continuo (<i>I\'m eating</i> = estoy comiendo ahora). Si es «en general / siempre» → simple (<i>I eat</i> = yo como, es mi costumbre). Y los verbos de estado (know, like, love, want, need, believe) van SIEMPRE en simple, pase lo que pase.',
  qTitle:'¿Presente simple o continuo? Busca las pistas:',
  opts:['presente simple (I work)','presente continuo (I am working)'],
  quiz:[
    {s:'I usually <span class="blank">___</span> (drink) coffee at 7 am.', a:0, tr:'I usually drink coffee. («usually» = rutina → simple)'},
    {s:'Shh! The baby <span class="blank">___</span> (sleep).', a:1, tr:'The baby is sleeping. (ahora mismo → continuo)'},
    {s:'Water <span class="blank">___</span> (boil) at 100°C.', a:0, tr:'Water boils at 100°C. (hecho universal → simple)'},
    {s:"I can't talk now — I <span class=\"blank\">___</span> (drive).", a:1, tr:"I'm driving. (en este momento → continuo)"},
    {s:'She <span class="blank">___</span> (visit) her mom every Sunday.', a:0, tr:'She visits her mom every Sunday. (rutina → simple)'},
    {s:'We <span class="blank">___</span> (fly) to Cartagena tomorrow morning.', a:1, tr:"We're flying to Cartagena tomorrow. (plan agendado → continuo)"},
    {s:'I <span class="blank">___</span> (want) a new laptop.', a:0, tr:'I want a new laptop. (want = verbo de estado → siempre simple)'},
    {s:'He <span class="blank">___</span> (take) a shower at the moment.', a:1, tr:"He's taking a shower. («at the moment» → continuo)"}
  ]
},
{
  id:'willgoingto', word:'will vs going to', tag:'Los dos futuros',
  intro:'El inglés tiene dos futuros principales y la diferencia está en <b>cuándo lo decidiste</b> y <b>qué evidencia hay</b>:',
  uses:[
    {name:'1. will: decisión del momento', small:'lo decides mientras hablas', ex:[
      ["The phone is ringing — I<b>'ll</b> answer it!","Está sonando el teléfono: ¡yo contesto! (lo acabas de decidir)"],
      ["I'm thirsty. — Wait, I<b>'ll</b> bring you some water.","Tengo sed. — Espera, te traigo agua."]]},
    {name:'2. will: promesas y predicciones', small:'sin evidencia visible', ex:[
      ["I <b>will</b> always love you. 🎵","Siempre te amaré. (promesa)"],
      ["Don't worry, everything <b>will</b> be okay.","Tranquilo, todo estará bien. (predicción/opinión)"]]},
    {name:'3. going to: planes ya decididos', small:'lo decidiste antes de hablar', ex:[
      ["We<b>'re going to</b> get married next year.","Nos vamos a casar el año entrante. (ya está decidido)"],
      ["She<b>'s going to</b> start her own business.","Ella va a montar su propio negocio."]]},
    {name:'4. going to: predicción con evidencia', small:'lo estás viendo venir', ex:[
      ["Look at those clouds — it<b>'s going to</b> rain.","Mira esas nubes: va a llover. (evidencia a la vista)"],
      ["Careful! You<b>'re going to</b> drop the glass!","¡Cuidado! ¡Vas a botar el vaso!"]]}
  ],
  tip:'Pregúntate: ¿lo decidí <b>ahora mismo</b>? → <b>will</b> («I\'ll help you!»). ¿Ya lo <b>tenía planeado</b> o <b>veo la evidencia</b>? → <b>going to</b> («I\'m going to travel in December»). En conversación, going to suena «gonna»: <i>I\'m gonna call you</i>.',
  qTitle:'¿Will o going to? Piensa: ¿decisión del momento o plan/evidencia?',
  opts:['will (decisión del momento / promesa)','going to (plan decidido / evidencia)'],
  quiz:[
    {s:"The phone is ringing. — I <span class=\"blank\">___</span> answer it!", a:0, tr:"I'll answer it! (decisión tomada en el instante)"},
    {s:"We <span class=\"blank\">___</span> get married next year — we've already set the date.", a:1, tr:"We're going to get married. (plan decidido de antes)"},
    {s:'Look at the sky! It <span class="blank">___</span> rain.', a:1, tr:"It's going to rain. (evidencia: el cielo)"},
    {s:'I promise I <span class="blank">___</span> call you every day.', a:0, tr:"I'll call you every day. (promesa → will)"},
    {s:'She <span class="blank">___</span> start a business; she already quit her job.', a:1, tr:"She's going to start a business. (ya estaba decidido)"},
    {s:"I'm thirsty. — Wait, I <span class=\"blank\">___</span> bring you some water.", a:0, tr:"I'll bring you some water. (ofrecimiento del momento)"},
    {s:'Careful! You <span class="blank">___</span> drop the glass!', a:1, tr:"You're going to drop the glass! (lo ves venir → evidencia)"},
    {s:"Don't worry, everything <span class=\"blank\">___</span> be okay.", a:0, tr:'Everything will be okay. (predicción/ánimo → will)'}
  ]
},
{
  id:'inonat', word:'in · on · at', tag:'Preposiciones clave',
  intro:'Las tres preposiciones que más errores causan. La lógica es una <b>escala de precisión</b>, tanto en tiempo como en lugar:'
  + '<table style="width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; background:var(--card)">'
  + '<tr style="background:var(--ink); color:#fff"><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em"></th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">⏰ Tiempo</th><th style="padding:7px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.06em">📍 Lugar</th></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>at</b><br><span style="color:var(--ink-soft)">punto exacto</span></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">at 7 am · at noon · at night · at Christmas</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">at the door · at the bus stop · at work · at home</td></tr>'
  + '<tr><td style="padding:7px 8px; border-bottom:1px solid var(--line)"><b>on</b><br><span style="color:var(--ink-soft)">día / superficie</span></td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">on Monday · on July 5th · on my birthday · on weekends</td><td style="padding:7px 8px; border-bottom:1px solid var(--line)">on the table · on the wall · on the floor · on the bus</td></tr>'
  + '<tr><td style="padding:7px 8px"><b>in</b><br><span style="color:var(--ink-soft)">período / interior</span></td><td style="padding:7px 8px">in May · in 2026 · in winter · in the morning</td><td style="padding:7px 8px">in the box · in my pocket · in Medellín · in the car</td></tr>'
  + '</table>Y las excepciones que hay que memorizar:',
  uses:[
    {name:'⚠️ Tiempo: las trampas', small:'no siguen la lógica', ex:[
      ["<b>in</b> the morning / afternoon / evening… PERO <b>at</b> night","en la mañana / tarde / noche → in, pero «de noche» → at night"],
      ["<b>on</b> Monday morning","el lunes por la mañana (cuando hay día, gana on)"]]},
    {name:'⚠️ Lugar: las trampas', small:'transporte y sitios comunes', ex:[
      ["<b>on</b> the bus / train / plane… PERO <b>in</b> the car / taxi","en el bus → on, pero en el carro → in"],
      ["<b>at</b> home / <b>at</b> work / <b>at</b> school","en casa / en el trabajo / en el colegio (puntos de actividad → at)"]]},
    {name:'La escala en acción', small:'de lo general a lo exacto', ex:[
      ["I was born <b>in</b> 1998, <b>on</b> March 5th, <b>at</b> 6 am.","Nací en 1998, el 5 de marzo, a las 6 am. (in año → on fecha → at hora)"],
      ["She lives <b>in</b> Medellín, <b>on</b> 70th Street, <b>at</b> number 45.","Vive en Medellín, en la calle 70, en el número 45."]]}
  ],
  tip:'Piensa en un zoom 🔍: <b>in</b> = lo grande (mes, año, ciudad, adentro de algo) → <b>on</b> = lo intermedio (día, fecha, superficie) → <b>at</b> = el punto exacto (hora, lugar específico). Cuando dudes, pregúntate qué tan «grande» es lo que nombras.',
  qTitle:'¿In, on o at?',
  opts:['in','on','at'],
  quiz:[
    {s:'The meeting is <span class="blank">___</span> Monday.', a:1, tr:'on Monday (día → on)'},
    {s:'I wake up <span class="blank">___</span> 6 am.', a:2, tr:'at 6 am (hora exacta → at)'},
    {s:'She was born <span class="blank">___</span> 1998.', a:0, tr:'in 1998 (año → in)'},
    {s:'Your keys are <span class="blank">___</span> the table.', a:1, tr:'on the table (superficie → on)'},
    {s:'He is <span class="blank">___</span> work right now.', a:2, tr:'at work (punto de actividad → at, ¡excepción famosa!)'},
    {s:'The milk is <span class="blank">___</span> the fridge.', a:0, tr:'in the fridge (adentro → in)'},
    {s:"I'll see you <span class=\"blank\">___</span> night.", a:2, tr:'at night (la excepción: in the morning PERO at night)'},
    {s:"There's a picture <span class=\"blank\">___</span> the wall.", a:1, tr:'on the wall (superficie → on)'},
    {s:'We traveled <span class="blank">___</span> the bus together.', a:1, tr:'on the bus (transporte grande → on; en el carro sería in)'},
    {s:'My birthday is <span class="blank">___</span> December.', a:0, tr:'in December (mes → in)'}
  ]
}
];

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
openLesson(LESSON_ORDER[0]);
