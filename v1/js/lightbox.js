const lb=document.getElementById('lb'),li=document.getElementById('lb-img'),lc=document.getElementById('lb-cap');
document.querySelectorAll('figure button').forEach(b=>b.addEventListener('click',()=>{
  const img=b.querySelector('img'),cap=b.parentElement.querySelector('figcaption');
  li.src=img.src; li.alt=img.alt; lc.textContent=cap?cap.textContent:'';
  if(lb.showModal) lb.showModal();
}));
lb.addEventListener('click',e=>{if(e.target===lb) lb.close();});
