// 스크롤 위치에 맞춰 왼쪽 목차에서 지금 보는 섹션을 강조
(()=>{
  const links=[...document.querySelectorAll('.outliner a[href^="#"]:not(.top)')];
  const byId=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const secs=[...byId.keys()].map(id=>document.getElementById(id)).filter(Boolean);
  if(!secs.length||!('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      links.forEach(a=>{a.classList.remove('is-active');a.removeAttribute('aria-current');});
      const a=byId.get(e.target.id); a.classList.add('is-active'); a.setAttribute('aria-current','location');
    });
  },{rootMargin:'-35% 0px -60% 0px'});
  secs.forEach(s=>io.observe(s));
})();
