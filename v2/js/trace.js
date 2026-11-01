// OutBreak 서버 사격 판정 데모(옆에서 본 장면). PerformServerWeaponTrace의 순서를 2D로 옮겼다:
// 1) 카메라 → 조준점 트레이스  2) 조준점이 총구 뒤면 카메라 전방으로 폴백  3) 몸통→총구가 막히면 시작점을 몸통으로  4) 시작점 → 조준점 사격 트레이스
const RANGE = 900;
function hitSeg(a, b, rects) {
  let best = null;
  for (const r of rects) {
    let t0 = 0, t1 = 1; const d = [b[0] - a[0], b[1] - a[1]];
    for (let i = 0; i < 2; i++) {
      const lo = i ? r.y : r.x, hi = i ? r.y + r.h : r.x + r.w;
      if (Math.abs(d[i]) < 1e-9) { if (a[i] < lo || a[i] > hi) { t0 = 2; break; } continue; }
      let ta = (lo - a[i]) / d[i], tb = (hi - a[i]) / d[i]; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    }
    if (t0 <= t1 && t0 <= 1 && (!best || t0 < best.t)) best = { t: t0, p: [a[0] + d[0] * t0, a[1] + d[1] * t0] };
  }
  return best;
}
function serverTrace(cam, dir, muzzle, body, rects, simple) {
  const len = Math.hypot(dir[0], dir[1]), f = [dir[0] / len, dir[1] / len];
  const camEnd = [cam[0] + f[0] * RANGE, cam[1] + f[1] * RANGE];
  if (simple) { // 비교용: 총구에서 카메라 방향 그대로
    const end = [muzzle[0] + f[0] * RANGE, muzzle[1] + f[1] * RANGE], h = hitSeg(muzzle, end, rects);
    return { aim: (hitSeg(cam, camEnd, rects) || { p: camEnd }).p, start: muzzle, impact: h ? h.p : end, notes: [] };
  }
  const notes = [];
  const ah = hitSeg(cam, camEnd, rects); let aim = ah ? ah.p : camEnd;
  if ((aim[0] - muzzle[0]) * f[0] + (aim[1] - muzzle[1]) * f[1] <= 0) { aim = [muzzle[0] + f[0] * RANGE, muzzle[1] + f[1] * RANGE]; notes.push('camera'); }
  const blocked = hitSeg(body, muzzle, rects), start = blocked ? body : muzzle;
  if (blocked) notes.push('muzzle');
  const d = [aim[0] - start[0], aim[1] - start[1]], dl = Math.hypot(d[0], d[1]) || 1;
  const end = [start[0] + d[0] / dl * RANGE, start[1] + d[1] / dl * RANGE], h = hitSeg(start, end, rects);
  return { aim, start, impact: h ? h.p : end, notes };
}
if (typeof module !== 'undefined') module.exports = { serverTrace, hitSeg };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('trace');
  if (!host) return;
  const svg = host.querySelector('svg'), status = host.querySelector('.cd-status');
  const $ = s => svg.querySelector(s);
  const CAM = [70, 150], BODY = [150, 214], MUZZLE = [196, 196];
  const SCENES = {
    base: { rects: [{ x: 330, y: 214, w: 26, h: 46 }, { x: 560, y: 60, w: 30, h: 200 }], cursor: [420, 220], text: '엄폐물 너머를 조준하면 총구가 조준점보다 낮아 엄폐물에 맞을 수 있습니다. 실제로 탄이 나가는 건 총구라서 이것이 맞는 결과입니다.' },
    wall: { rects: [{ x: 172, y: 188, w: 10, h: 72 }, { x: 560, y: 60, w: 30, h: 200 }], cursor: [420, 190], text: '낮은 벽에 바짝 붙어 총구가 벽 너머로 나간 상황입니다. 몸통에서 총구까지가 막혀 있어 시작점을 몸통으로 당겨, 탄이 벽에 박힙니다.' },
    camera: { rects: [{ x: 92, y: 60, w: 12, h: 200 }, { x: 560, y: 60, w: 30, h: 200 }], cursor: [420, 190], text: '카메라가 벽에 끼어 조준점이 총구 뒤에 잡힌 상황입니다. 조준점을 카메라 전방으로 바꿔 탄이 뒤로 나가지 않게 합니다.' }
  };
  let scene = 'base', simple = false, cursor = SCENES.base.cursor.slice();
  const set = (n, a) => { for (const k in a) n.setAttribute(k, a[k]); };

  function render() {
    const sc = SCENES[scene];
    $('.walls').innerHTML = sc.rects.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join('');
    const dir = [cursor[0] - CAM[0], cursor[1] - CAM[1]];
    const r = serverTrace(CAM, dir, MUZZLE, BODY, sc.rects, simple);
    set($('.camray'), { x1: CAM[0], y1: CAM[1], x2: r.aim[0], y2: r.aim[1] });
    set($('.shot'), { x1: r.start[0], y1: r.start[1], x2: r.impact[0], y2: r.impact[1] });
    set($('.aimpt'), { x: r.aim[0] - 5, y: r.aim[1] - 5 });
    set($('.impact'), { cx: r.impact[0], cy: r.impact[1] });
    set($('.cross'), { transform: `translate(${cursor[0]} ${cursor[1]})` });
    const gap = Math.round(Math.hypot(r.aim[0] - r.impact[0], r.aim[1] - r.impact[1]));
    status.textContent = simple
      ? `총구에서 카메라 방향 그대로 쏘면 조준점(파란 사각형)과 탄착점(빨간 원)이 ${gap}px 어긋납니다.`
      : `${sc.text}${r.notes.length ? '' : gap > 3 ? ` (조준점과 탄착점 차이 ${gap}px)` : ''}`;
  }
  svg.addEventListener('pointermove', e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (p.x > CAM[0] + 20) { cursor = [p.x, p.y]; render(); }
  });
  svg.addEventListener('keydown', e => {
    const m = { ArrowUp: [0, -10], ArrowDown: [0, 10], ArrowLeft: [-10, 0], ArrowRight: [10, 0] }[e.key];
    if (m) { e.preventDefault(); cursor = [Math.max(CAM[0] + 30, Math.min(600, cursor[0] + m[0])), Math.max(20, Math.min(255, cursor[1] + m[1]))]; render(); }
  });
  host.querySelectorAll('[data-scene]').forEach(b => b.addEventListener('click', () => {
    scene = b.dataset.scene; cursor = SCENES[scene].cursor.slice();
    host.querySelectorAll('[data-scene]').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
  }));
  host.querySelector('.mode').addEventListener('change', e => { simple = e.target.checked; render(); });
  render();
})();
