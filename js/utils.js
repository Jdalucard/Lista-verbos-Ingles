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

export { store, lc, first, shuffle, pick, future, examples };
