// js/main.js
const elNumber = document.getElementById('number');
const btnSpin = document.getElementById('spin');
const btnQuick = document.getElementById('quick');
const btnReset = document.getElementById('reset');
const btnExport = document.getElementById('exportCsv');
const chkUnique = document.getElementById('unique');
const inputMin = document.getElementById('min');
const inputMax = document.getElementById('max');
const historyEl = document.getElementById('history');

let used = new Set();
let spinning = false;
let history = [];

// === thời gian quay có hiệu ứng: 20s ===
const SPIN_DURATION_MS = 5000;

/* ===== Modal Winner ===== */
const modal = document.getElementById("winnerModal");
const closeModalBtn = document.getElementById("closeModal");
const winnerNumberEl = document.getElementById("winnerNumber");

function showWinner(n){
  winnerNumberEl.textContent = n;
  modal.style.display = "grid";
  modal.setAttribute("aria-hidden","false");
}
function hideWinner(){
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}
closeModalBtn.addEventListener("click", hideWinner);
// đóng khi click ra ngoài
modal.addEventListener("click", (e)=>{
  if(e.target === modal) hideWinner();
});

function clampRange(){
  let min = parseInt(inputMin.value,10);
  let max = parseInt(inputMax.value,10);
  if(Number.isNaN(min)) min = 1;
  if(Number.isNaN(max)) max = 115;
  if(min > max){ const t=min; min=max; max=t; inputMin.value=min; inputMax.value=max; }
  inputMin.value = min; inputMax.value = max;
  return {min, max};
}

function randomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderHistory(){
  historyEl.innerHTML = history.map(n => `<span class="badge hit" title="${n}">${n}</span>`).join('');
}

function pickNumberFast(){
  const {min, max} = clampRange();
  const unique = chkUnique.checked;
  const total = max - min + 1;
  if(unique && used.size >= total){
    elNumber.textContent = 'Hết số';
    return null;
  }
  let n;
  if(unique){
    let attempts = 0;
    do{
      n = randomInt(min, max);
      attempts++;
      if(attempts > 50){
        for(let i=min;i<=max;i++){ if(!used.has(i)){ n=i; break; } }
        break;
      }
    } while(used.has(n));
    used.add(n);
  } else {
    n = randomInt(min, max);
  }
  history.unshift(n);
  renderHistory();
  return n;
}

function spinWithEffect(){
  if(spinning) return;
  const {min, max} = clampRange();
  const duration = SPIN_DURATION_MS;
  const start = performance.now();
  spinning = true;

  // Khóa các nút trong lúc quay
  btnSpin.disabled = true;
  btnQuick.disabled = true;
  btnReset.disabled = true;

  function frame(now){
    const t = Math.min(1, (now - start) / duration);
    const speed = 1 - Math.pow(1 - t, 3); // ease-out
    if(t < 1){
      const temp = randomInt(min, max);
      elNumber.textContent = temp;
      // nhịp cập nhật nhanh -> chậm
      const wait = 8 + 160 * speed;
      setTimeout(()=>requestAnimationFrame(frame), wait);
    } else {
      const n = pickNumberFast();
      if(n !== null){
        elNumber.textContent = n;
        showWinner(n); // bật modal kết quả
      }
      spinning = false;

      // Mở khóa nút sau khi quay xong
      btnSpin.disabled = false;
      btnQuick.disabled = false;
      btnReset.disabled = false;
    }
  }
  requestAnimationFrame(frame);
}

function quickSpin(){
  // Quay nhanh: ra số ngay lập tức
  const n = pickNumberFast();
  if(n !== null){
    elNumber.textContent = n;
    showWinner(n); // cũng hiển thị modal
  }
}

function resetAll(){
  used.clear();
  history = [];
  elNumber.textContent = '—';
  renderHistory();
}

function exportCSV(){
  if(history.length === 0){
    alert('Chưa có lịch sử để xuất.');
    return;
  }
  const rows = [['STT', 'Số']].concat(history.map((n,i)=>[i+1,n]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(["\uFEFF" + csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'lich-su-quay-so.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

btnSpin.addEventListener('click', spinWithEffect);
btnQuick.addEventListener('click', quickSpin);
btnReset.addEventListener('click', resetAll);
btnExport.addEventListener('click', exportCSV);
[inputMin, inputMax].forEach(el => el.addEventListener('change', ()=>{ clampRange(); }));

window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space' || e.code === 'Enter'){
    e.preventDefault();
    spinWithEffect();
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='r'){
    e.preventDefault();
    resetAll();
  }
  // Esc để đóng modal
  if(e.key === 'Escape') hideWinner();
});

clampRange();
renderHistory();
