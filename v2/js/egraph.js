// 첫 화면 Event Graph: 노드의 실행 핀 사이를 블루프린트처럼 곡선으로 잇고, 처음 한 번만 실행 펄스를 흘린다.
(() => {
  const canvas = document.getElementById('egraph');
  if (!canvas) return;
  const svg = canvas.querySelector('.bpw-wires');
  const links = canvas.dataset.links.split(' ').map(p => p.split(':'));
  let pulsed = false;
  function center(id, box) {
    const r = document.getElementById(id).getBoundingClientRect();
    return { x: r.left - box.left + r.width / 2 + canvas.scrollLeft, y: r.top - box.top + r.height / 2 };
  }
  function draw() {
    const box = canvas.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${canvas.scrollWidth} ${box.height}`);
    svg.setAttribute('width', canvas.scrollWidth); svg.setAttribute('height', box.height);
    const d = links.map(([a, b]) => {
      const A = center(a, box), B = center(b, box), dx = Math.max(40, (B.x - A.x) * .5);
      return `M${A.x + 5},${A.y} C${A.x + dx},${A.y} ${B.x - dx},${B.y} ${B.x - 5},${B.y}`;
    });
    // 이미 그렸으면 선 모양만 갱신해서 진행 중인 애니메이션을 끊지 않는다
    if (pulsed) { svg.querySelectorAll('path').forEach((el, i) => el.setAttribute('d', d[i % d.length])); return; }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 처음 한 번: 노드가 다 나온 뒤 선을 하나씩 그리고, 이어서 실행 펄스를 흘린다
    svg.innerHTML = d.map((p, i) => still ? `<path d="${p}"/>` : `<path class="wire" pathLength="1" style="animation-delay:${2.05 + i * .3}s" d="${p}"/>`).join('') +
      (still ? '' : d.map((p, i) => `<path class="pulse" style="animation-delay:${3 + i * .45}s" d="${p}"/>`).join(''));
    pulsed = true;
  }
  new ResizeObserver(draw).observe(canvas);
  if (document.fonts) document.fonts.ready.then(draw);
})();
