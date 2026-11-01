// Fantasy Action EQS 데모(위에서 본 장면). 타겟 중심 원형 12개 지점(반경은 쿼리마다 무작위),
// PathExist(장애물 안이면 탈락), Dot 2D(AI 전방 약 63° 안), Distance(타겟과 480 이상) 세 테스트를 단순화해 옮겼다.
function runQuery(target, ai, obstacles, radius, tests) {
  const fwd = [target.x - ai.x, target.y - ai.y], fl = Math.hypot(fwd[0], fwd[1]);
  return Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI / 6, p = { x: target.x + Math.cos(a) * radius, y: target.y + Math.sin(a) * radius }, fail = [];
    if (tests.path && obstacles.some(o => p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h)) fail.push('PathExist');
    const v = [p.x - ai.x, p.y - ai.y], vl = Math.hypot(v[0], v[1]) || 1;
    if (tests.dot && (fwd[0] * v[0] + fwd[1] * v[1]) / (fl * vl) < 0.45) fail.push('Dot 2D');
    if (tests.dist && Math.hypot(p.x - target.x, p.y - target.y) < 480) fail.push('Distance');
    return { ...p, fail };
  });
}
if (typeof module !== 'undefined') module.exports = { runQuery };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('eqs');
  if (!host) return;
  const svg = host.querySelector('svg'), status = host.querySelector('.cd-status'), g = svg.querySelector('.layer'), K = 0.3;
  const TARGET = { x: 1300, y: 640 }, AI = { x: 820, y: 600 };
  const OBST = [{ x: 1400, y: 40, w: 320, h: 380 }, { x: 620, y: 760, w: 460, h: 280 }];
  let radius = 600;
  const tests = () => ({ path: host.querySelector('[name=path]').checked, dot: host.querySelector('[name=dot]').checked, dist: host.querySelector('[name=dist]').checked });
  function draw() {
    const pts = runQuery(TARGET, AI, OBST, radius, tests());
    let h = OBST.map(o => `<rect class="ob" x="${o.x * K}" y="${o.y * K}" width="${o.w * K}" height="${o.h * K}"/>`).join('');
    h += `<circle class="ring" cx="${TARGET.x * K}" cy="${TARGET.y * K}" r="${radius * K}"/>`;
    for (const p of pts) h += `<rect class="pt ${p.fail.length ? 'bad' : 'ok'}" x="${p.x * K - 5}" y="${p.y * K - 5}" width="10" height="10"><title>${p.fail.length ? '탈락: ' + p.fail.join(', ') : '통과'}</title></rect>`;
    h += `<circle class="tg" cx="${TARGET.x * K}" cy="${TARGET.y * K}" r="9"/><text class="lbl" x="${TARGET.x * K + 14}" y="${TARGET.y * K + 4}">플레이어</text>`;
    h += `<path class="ai" d="M${AI.x * K + 12},${AI.y * K} L${AI.x * K - 8},${AI.y * K - 9} L${AI.x * K - 8},${AI.y * K + 9}Z" transform="rotate(${Math.atan2(TARGET.y - AI.y, TARGET.x - AI.x) * 180 / Math.PI} ${AI.x * K} ${AI.y * K})"/><text class="lbl" x="${AI.x * K - 10}" y="${AI.y * K + 26}">적 AI</text>`;
    g.innerHTML = h;
    const ok = pts.filter(p => !p.fail.length).length, by = k => pts.filter(p => p.fail.includes(k)).length;
    status.textContent = `반경 ${Math.round(radius)}에서 12개 중 ${ok}개 통과. 탈락: 경로 ${by('PathExist')}개, 전방 각도 ${by('Dot 2D')}개, 거리 ${by('Distance')}개.`;
  }
  host.querySelector('.go').addEventListener('click', () => { radius = 420 + Math.random() * 340; draw(); });
  host.querySelectorAll('input[type=checkbox]').forEach(c => c.addEventListener('change', draw));
  draw();
})();
