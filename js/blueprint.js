(()=>{
  const graph=document.getElementById('graph'), svg=document.getElementById('wires');
  const links=[['ev-o','dev-i'],['dev-o','seq-i'],['s0','n0'],['s1','n1'],['s2','n2'],['s3','n3']];
  function center(id,g){const r=document.getElementById(id).getBoundingClientRect();return {x:r.left-g.left+r.width/2,y:r.top-g.top+r.height/2};}
  function draw(){
    if(getComputedStyle(svg).display==='none') return;
    const g=graph.getBoundingClientRect();
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    const d=links.map(([a,b])=>{const A=center(a,g),B=center(b,g),dx=Math.max(50,(B.x-A.x)*.5);
      return `M${A.x+5},${A.y} C${A.x+dx},${A.y} ${B.x-dx},${B.y} ${B.x-5},${B.y}`;});
    svg.innerHTML=d.map(p=>`<path d="${p}"/>`).join('')+d.map(p=>`<path class="pulse" d="${p}"/>`).join('');
  }
  new ResizeObserver(draw).observe(graph);
  if(document.fonts) document.fonts.ready.then(draw);
  draw();
})();
