// OutBreak 개인 탈출구 배정 데모. AOBExpeditionGameMode::SelectPersonalMarkers를 그대로 옮겼다.
// MinSpawnDistance 600m, FarPoolSize 4, MinDirectionAngleDeg 60. 조건을 만족하는 후보가 없으면 하나씩 완화한다.
const CFG = { minDist: 600, farPool: 4, minAngle: 60 };
function selectMarkers(spawn, markers, used, rng = Math.random, cfg = CFG) {
  const log = [], dist = m => Math.hypot(m.x - spawn.x, m.y - spawn.y);
  let cand = markers.filter(m => dist(m) >= cfg.minDist);
  if (!cand.length) { cand = markers.slice(); log.push('far'); }
  cand.sort((a, b) => dist(b) - dist(a));
  const pool = cand.slice(0, Math.max(1, Math.min(cfg.farPool, cand.length)));
  const avail = () => { const a = pool.filter(m => !used.has(m.id)); if (!a.length) { log.push('used'); return pool.slice(); } return a; };
  let a = avail();
  const first = a[Math.floor(rng() * a.length)]; used.add(first.id);
  const d1 = Math.atan2(first.y - spawn.y, first.x - spawn.x), cosT = Math.cos(cfg.minAngle * Math.PI / 180);
  a = avail();
  const dir = m => Math.atan2(m.y - spawn.y, m.x - spawn.x);
  let div = a.filter(m => m !== first && Math.cos(dir(m) - d1) <= cosT);
  if (!div.length) { div = a; log.push('angle'); }
  const sc = div.filter(m => m !== first);
  const second = sc.length ? sc[Math.floor(rng() * sc.length)] : null;
  if (second) used.add(second.id);
  return { pool, first, second, log };
}
if (typeof module !== 'undefined') module.exports = { selectMarkers, CFG };

(() => {
  const host = typeof document !== 'undefined' && document.getElementById('extract');
  if (!host) return;
  const svg = host.querySelector('svg'), status = host.querySelector('.cd-status'), K = 0.4; // 1px = 2.5m
  const MARKERS = [[120, 90], [520, 70], [900, 120], [1380, 80], [1500, 420], [1460, 860], [1050, 930], [620, 900], [180, 880], [90, 480], [760, 520]].map(([x, y], i) => ({ id: i, x, y }));
  const SPAWNS = [{ x: 300, y: 300, name: '북서 스폰' }, { x: 1250, y: 650, name: '남동 스폰' }, { x: 800, y: 260, name: '북쪽 스폰' }];
  let si = 0, used = new Set(), round = 0;
  const g = svg.querySelector('.layer');

  function draw(res) {
    const sp = SPAWNS[si];
    let h = `<circle class="far" cx="${sp.x * K}" cy="${sp.y * K}" r="${CFG.minDist * K}"/>`;
    if (res) for (const m of [res.first, res.second].filter(Boolean)) h += `<line class="route" x1="${sp.x * K}" y1="${sp.y * K}" x2="${m.x * K}" y2="${m.y * K}"/>`;
    for (const m of MARKERS) {
      const cls = ['mk'];
      if (res && res.pool.includes(m)) cls.push('pool');
      if (used.has(m.id) && !(res && (m === res.first || m === res.second))) cls.push('used');
      h += `<rect class="${cls.join(' ')}" x="${m.x * K - 6}" y="${m.y * K - 6}" width="12" height="12"/>`;
    }
    if (res) [res.first, res.second].forEach((m, i) => { if (m) h += `<circle class="pick" cx="${m.x * K}" cy="${m.y * K}" r="11"/><text class="pickn" x="${m.x * K}" y="${m.y * K + 4}" text-anchor="middle">${i + 1}</text>`; });
    h += `<rect class="spawn" x="${sp.x * K - 8}" y="${sp.y * K - 8}" width="16" height="16"/><text class="lbl" x="${sp.x * K + 12}" y="${sp.y * K - 10}">${sp.name}</text>`;
    g.innerHTML = h;
  }
  function assign() {
    const sp = SPAWNS[si], res = selectMarkers(sp, MARKERS, used);
    round++; draw(res);
    const ang = res.second ? Math.round(Math.abs(((Math.atan2(res.second.y - sp.y, res.second.x - sp.x) - Math.atan2(res.first.y - sp.y, res.first.x - sp.x)) * 180 / Math.PI + 540) % 360 - 180)) : 0;
    const why = { far: '600m 밖 후보가 없어 전체로 넓혔습니다.', used: '팀이 쓰지 않은 후보가 없어 다시 허용했습니다.', angle: '60° 이상 벌어진 후보가 없어 방향 조건을 풀었습니다.' };
    status.textContent = `${round}번째 판: 먼 후보 4개(노란 테두리) 중 1번을 고르고, 1번과 ${ang}° 벌어진 2번을 골랐습니다.` + res.log.map(k => ' ' + why[k]).join('');
  }
  host.querySelector('.go').addEventListener('click', assign);
  host.querySelector('.spawn-next').addEventListener('click', () => { si = (si + 1) % SPAWNS.length; draw(); status.textContent = `${SPAWNS[si].name}로 바꿨습니다. 탈출구 배정을 눌러 보세요.`; });
  host.querySelector('.cd-reset').addEventListener('click', () => { used = new Set(); round = 0; draw(); status.textContent = '팀이 쓴 탈출구 기록을 지웠습니다. 큰 원은 스폰에서 600m 범위입니다.'; });
  draw(); status.textContent = '탈출구 배정을 여러 번 눌러 보세요. 이전 판에 쓴 탈출구(회색)는 다음 판 후보에서 빠집니다.';
})();
