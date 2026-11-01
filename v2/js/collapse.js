// FallenEra 구조 안정성 데모: 땅에 닿은 토대(anchor)에서 BFS로 지지 거리를 구하고(비용이 모두 1이라 다익스트라와 같음),
// 끊긴 피스는 붕괴 큐에 넣어 하나씩 무너뜨린다. 원본 게임처럼 도달 못 한 거리는 255로 둔다.
const UNREACHABLE = 255;
function supportDistances(pieces) {
  const key = (c, r) => c + ',' + r, at = new Map(pieces.map(p => [key(p.c, p.r), p]));
  const dist = new Map(pieces.map(p => [p, UNREACHABLE])), q = [];
  for (const p of pieces) if (p.r === 0) { dist.set(p, 0); q.push(p); }
  while (q.length) {
    const p = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = at.get(key(p.c + dc, p.r + dr));
      if (n && dist.get(n) > dist.get(p) + 1) { dist.set(n, dist.get(p) + 1); q.push(n); }
    }
  }
  return dist;
}
if (typeof module !== 'undefined') module.exports = { supportDistances, UNREACHABLE };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('collapse');
  if (!host) return;
  const svg = host.querySelector('svg'), status = host.querySelector('.cd-status'), reset = host.querySelector('.cd-reset');
  const NS = 'http://www.w3.org/2000/svg', CW = 66, X0 = 34, GROUND = 232;
  const ROW_H = [26, 66, 14, 66, 14];                 // 토대, 벽, 천장, 벽, 지붕
  const KIND = ['토대', '벽', '천장', '벽', '지붕'];
  const LAYOUT = [[1,0],[2,0],[5,0],[6,0],[1,1],[6,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[2,3],[5,3],[2,4],[3,4],[4,4],[5,4]];
  const rowY = r => GROUND - ROW_H.slice(0, r + 1).reduce((a, b) => a + b, 0);
  // 받침 있는 글자 뒤에는 '을', 없으면 '를'
  const obj = w => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '을' : '를');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pieces, timer;

  function shape(p) {
    const x = X0 + p.c * CW, y = rowY(p.r), h = ROW_H[p.r];
    if (p.r === 1 || p.r === 3) return { x: x + CW / 2 - 8, y, w: 16, h, tx: x + CW / 2 + 16, ty: y + h / 2 + 4, anchor: 'start' };
    if (p.r === 0) return { x: x + 1, y, w: CW - 2, h, tx: x + CW / 2, ty: y + h / 2 + 4, anchor: 'middle' };
    return { x: x + 1, y, w: CW - 2, h, tx: x + CW / 2, ty: y - 6, anchor: 'middle' };
  }

  function build() {
    clearInterval(timer);
    svg.querySelectorAll('.pc').forEach(n => n.remove());
    pieces = LAYOUT.map(([c, r]) => ({ c, r }));
    for (const p of pieces) {
      const s = shape(p), g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pc'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.innerHTML = `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/><text x="${s.tx}" y="${s.ty}" text-anchor="${s.anchor}"></text>`;
      g.addEventListener('click', () => destroy(p));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); destroy(p); } });
      p.el = g; svg.appendChild(g);
    }
    paint();
    status.textContent = '블록을 눌러 부숴 보세요. 숫자는 땅에서부터의 지지 거리입니다.';
  }

  function paint() {
    const d = supportDistances(pieces);
    for (const p of pieces) {
      const v = d.get(p);
      p.el.querySelector('text').textContent = v;
      p.el.classList.toggle('anchor', v === 0);
      p.el.classList.toggle('lost', v === UNREACHABLE);
      p.el.setAttribute('aria-label', `${KIND[p.r]}, 지지 거리 ${v}. 눌러서 부수기`);
    }
    return pieces.filter(p => d.get(p) === UNREACHABLE);
  }

  function remove(p, cls) {
    pieces = pieces.filter(x => x !== p);
    p.el.classList.add(cls); p.el.removeAttribute('tabindex'); p.el.setAttribute('aria-hidden', 'true');
    setTimeout(() => p.el.remove(), still ? 0 : 600);
  }

  function destroy(p) {
    if (!pieces.includes(p)) return;
    remove(p, 'broken');
    const queue = paint();
    if (!queue.length) { status.textContent = `${obj(KIND[p.r])} 부쉈습니다. 다른 길로 땅과 이어져 있어 아무것도 무너지지 않습니다.`; return; }
    status.textContent = `${obj(KIND[p.r])} 부쉈습니다. 땅과 끊긴 피스 ${queue.length}개가 순서대로 무너집니다.`;
    clearInterval(timer);
    timer = setInterval(() => { const n = queue.shift(); if (n) remove(n, 'fall'); else clearInterval(timer); }, still ? 0 : 120);
  }

  reset.addEventListener('click', build);
  build();
})();
