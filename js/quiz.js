import { VERBS } from '../data/verbs.js';
import { shuffle, pick, lc, first, future } from './utils.js';

/* ================= QUIZ ================= */
let qMode='past', qOk=0, qNo=0, qStreak=0, qCurrent=null;

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

function initQuiz(){
  document.querySelectorAll('#p-quiz .qmodes button').forEach(b=>{
    b.onclick = ()=>{ document.querySelectorAll('#p-quiz .qmodes button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); qMode=b.dataset.m; nextQ(); };
  });
  document.getElementById('qType').onchange = nextQ;
  nextQ();
}

export { initQuiz };
