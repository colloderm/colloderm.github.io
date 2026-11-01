// Magic School 인벤토리 데모. 줍기는 같은 아이템 칸에 스택을 더하고 없으면 첫 빈 칸에,
// 버리기는 스택 1 감소(0이면 빈 칸), 옮기기는 같은 아이템이면 합치고 아니면 자리를 바꾼다.
const SLOTS = 6;
function addItem(inv, item) {
  const same = inv.findIndex(s => s && s.item === item);
  if (same >= 0) { inv[same].n++; return same; }
  const empty = inv.findIndex(s => !s);
  if (empty < 0) return -1;
  inv[empty] = { item, n: 1 }; return empty;
}
function dropItem(inv, i) { if (!inv[i]) return false; if (--inv[i].n === 0) inv[i] = null; return true; }
function moveItem(inv, from, to) {
  if (from === to || !inv[from]) return 'none';
  if (inv[to] && inv[to].item === inv[from].item) { inv[to].n += inv[from].n; inv[from] = null; return 'merge'; }
  [inv[from], inv[to]] = [inv[to], inv[from]]; return inv[from] ? 'swap' : 'move';
}
if (typeof module !== 'undefined') module.exports = { addItem, dropItem, moveItem, SLOTS };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('inventory');
  if (!host) return;
  const grid = host.querySelector('.slots'), status = host.querySelector('.cd-status'), dropBtn = host.querySelector('.drop');
  let inv = Array(SLOTS).fill(null), sel = -1, floor = 0;
  function render() {
    grid.innerHTML = inv.map((s, i) => `<button type="button" class="slot${i === sel ? ' sel' : ''}" aria-pressed="${i === sel}" data-i="${i}" aria-label="${i + 1}번 칸, ${s ? s.item + ' ' + s.n + '개' : '비어 있음'}">${s ? `<b>${s.item}</b><span>${s.n}</span>` : ''}</button>`).join('');
    dropBtn.disabled = sel < 0 || !inv[sel];
    host.querySelector('.floor').textContent = `바닥에 버린 아이템 ${floor}개`;
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b) return;
    const i = +b.dataset.i;
    if (sel < 0) { if (inv[i]) { sel = i; status.textContent = `${i + 1}번 칸을 골랐습니다. 다른 칸을 누르면 옮기고, 버리기를 누르면 하나 버립니다.`; } }
    else if (sel === i) { sel = -1; status.textContent = '선택을 풀었습니다.'; }
    else { const r = moveItem(inv, sel, i); status.textContent = { merge: '같은 아이템이라 스택을 합쳤습니다.', swap: '다른 아이템이라 자리를 바꿨습니다.', move: '빈 칸으로 옮겼습니다.' }[r] || ''; sel = -1; }
    render();
  });
  host.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', () => {
    const i = addItem(inv, b.dataset.item);
    status.textContent = i < 0 ? '빈 칸이 없어 주울 수 없습니다.' : `${b.dataset.item}을(를) ${i + 1}번 칸에 넣었습니다 (${inv[i].n}개).`;
    render();
  }));
  dropBtn.addEventListener('click', () => {
    const name = inv[sel] && inv[sel].item;
    if (dropItem(inv, sel)) { floor++; status.textContent = `${name} 하나를 캐릭터 앞에 떨어뜨렸습니다.${inv[sel] ? '' : ' 칸이 비었습니다.'}`; if (!inv[sel]) sel = -1; }
    render();
  });
  render(); status.textContent = '아이템을 주워 보세요. 같은 아이템은 한 칸에 쌓입니다.';
})();
