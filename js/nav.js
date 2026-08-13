/* ---------- navegación ---------- */
function initNav(){
  document.querySelectorAll('#nav button').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('on'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      document.getElementById('p-'+b.dataset.p).classList.add('on');
    });
  });
}

export { initNav };
