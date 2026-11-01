// FallenEra 소켓 스냅 데모(위에서 본 토대 배치). 400cm 토대, 가장자리 소켓 4개, SnapRadius 150cm.
// 커서가 소켓 반경 안이면 붙고, 같은 자리에 이미 있으면 "Already placed here". 클릭하면 같은 함수로 한 번 더 검증한다.
const SIZE = 400, SNAP = 150;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const overlaps = (pieces, x, y) => pieces.some(p => Math.abs(p.x - x) < SIZE - 1 && Math.abs(p.y - y) < SIZE - 1);
function validate(pieces, cx, cy) {
  let best = null;
  for (const p of pieces) for (const [dx, dy] of DIRS) {
    const sx = p.x + dx * SIZE / 2, sy = p.y + dy * SIZE / 2, d = Math.hypot(cx - sx, cy - sy);
    if (d <= SNAP && (!best || d < best.d)) best = { d, sx, sy, x: sx + dx * SIZE / 2, y: sy + dy * SIZE / 2 };
  }
  if (best) {
    const dup = pieces.some(p => Math.abs(p.x - best.x) < 5 && Math.abs(p.y - best.y) < 5);
    // 자유 배치 토대는 격자와 어긋날 수 있어, 소켓 위치라도 다른 토대와 일부 겹치는지 따로 본다 (변끼리 맞닿는 건 허용)
    const hit = !dup && overlaps(pieces, best.x, best.y);
    return { snap: true, x: best.x, y: best.y, sx: best.sx, sy: best.sy, ok: !dup && !hit,
      reason: dup ? 'Already placed here' : hit ? '다른 구조물과 겹침' : '소켓에 붙음 (Foundation.Edge)' };
  }
  const hit = overlaps(pieces, cx, cy);
  return { snap: false, x: cx, y: cy, ok: !hit, reason: hit ? '다른 구조물과 겹침' : '자유 배치 (땅 위)' };
}
if (typeof module !== 'undefined') module.exports = { validate };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('snap');
  if (!host) return;
  const svg = host.querySelector('svg'), status = host.querySelector('.cd-status'), reset = host.querySelector('.cd-reset');
  const NS = 'http://www.w3.org/2000/svg', K = 0.15, W = 4000, H = 2000; // 1px ≈ 6.7cm
  const layer = svg.querySelector('.layer'), ghost = svg.querySelector('.ghost'), ring = svg.querySelector('.ring'), label = svg.querySelector('.dstr2');
  let pieces, cur = { x: 2000, y: 1000 }, last;

  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  function draw() {
    layer.textContent = '';
    for (const p of pieces) layer.appendChild(el('rect', { class: 'fd', x: (p.x - SIZE / 2) * K, y: (p.y - SIZE / 2) * K, width: SIZE * K, height: SIZE * K }));
    for (const p of pieces) for (const [dx, dy] of DIRS) {
      const sx = (p.x + dx * SIZE / 2) * K, sy = (p.y + dy * SIZE / 2) * K;
      const used = pieces.some(q => Math.abs(q.x - (p.x + dx * SIZE)) < 5 && Math.abs(q.y - (p.y + dy * SIZE)) < 5);
      layer.appendChild(el('rect', { class: used ? 'sk used' : 'sk', x: sx - 4, y: sy - 4, width: 8, height: 8 }));
    }
    update();
  }
  function update() {
    last = validate(pieces, cur.x, cur.y);
    ghost.setAttribute('x', (last.x - SIZE / 2) * K); ghost.setAttribute('y', (last.y - SIZE / 2) * K);
    ghost.setAttribute('width', SIZE * K); ghost.setAttribute('height', SIZE * K);
    ghost.setAttribute('class', 'ghost ' + (last.ok ? 'ok' : 'bad'));
    ring.style.display = last.snap ? '' : 'none';
    if (last.snap) { ring.setAttribute('cx', last.sx * K); ring.setAttribute('cy', last.sy * K); }
    label.setAttribute('x', (last.x - SIZE / 2) * K); label.setAttribute('y', (last.y - SIZE / 2) * K - 6);
    label.setAttribute('class', 'dstr2 ' + (last.ok ? 'ok' : 'bad'));
    label.textContent = last.reason;
  }
  function move(evt) {
    const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    cur = { x: Math.max(0, Math.min(W, p.x / K)), y: Math.max(0, Math.min(H, p.y / K)) }; update();
  }
  function place() {
    const again = validate(pieces, cur.x, cur.y); // 클릭 순간 다시 검증 (서버 재검증과 같은 함수)
    if (!again.ok) { status.textContent = `배치 거부: ${again.reason}`; return; }
    pieces.push({ x: again.x, y: again.y }); draw();
    status.textContent = `토대 ${pieces.length}개. ${again.snap ? '소켓에 맞춰' : '땅 위에'} 놓았습니다. 서버도 같은 위치로 처음부터 다시 검증합니다.`;
  }
  svg.addEventListener('pointermove', move);
  svg.addEventListener('click', e => { move(e); place(); });
  svg.addEventListener('keydown', e => {
    const step = 100, map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) { e.preventDefault(); cur = { x: Math.max(0, Math.min(W, cur.x + map[e.key][0])), y: Math.max(0, Math.min(H, cur.y + map[e.key][1])) }; update(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(); }
  });
  reset.addEventListener('click', () => { pieces = [{ x: 2000, y: 1000 }]; draw(); status.textContent = '토대 가장자리의 소켓(작은 사각형) 가까이로 커서를 옮겨 보세요. 키보드는 방향키와 Enter.'; });
  reset.click();
})();
