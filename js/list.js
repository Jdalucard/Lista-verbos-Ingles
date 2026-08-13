import { VERBS } from '../data/verbs.js';
import { lc, future } from './utils.js';

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

function initList(){
  document.getElementById('listSearch').addEventListener('input', renderList);
  document.getElementById('listType').addEventListener('change', renderList);
  renderList();
}

export { initList };
