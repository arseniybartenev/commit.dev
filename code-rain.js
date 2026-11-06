/* Строки кода падают на первое большое фото, ложатся кучей и исчезают.
   Один раз за визит, после первого пролистывания. Без prefers-reduced-motion и без canvas ничего не делает.
   Шрифт тот же, что на сайте (JetBrains Mono), HTML и стили страницы не трогаем. */
(function(){
  'use strict';
  var shot=document.querySelector('.hero .shot');
  if(!shot||!window.requestAnimationFrame)return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  try{if(sessionStorage.getItem('rain-done'))return}catch(e){}

  var LINES=[
    'git commit -m "порядок"',
    'def plan(week): return top3(tasks)',
    'if (chaos) { refactor(); }',
    'const decision = await think();',
    'SELECT * FROM goals WHERE year = 2027;',
    'for day in week: do(main_task)',
    'return ship(it);',
    '// TODO: записать решение',
    'git push origin main',
    'assert focus > 0',
    'while (true) { learn(); }',
    'try { start() } catch { retry() }',
    'fn main() -> Result<()>',
    'import { order } from "./life"',
    'rm -rf хаос/',
    'npm run plan',
    '$ git log --oneline',
    'status: done ✓'
  ];

  var mobile=window.matchMedia('(max-width:600px)').matches;
  var COUNT=mobile?22:40;
  var cv=document.createElement('canvas');
  cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:1;transition:opacity .9s ease';
  shot.appendChild(cv);
  var ctx=cv.getContext('2d');
  if(!ctx){cv.remove();return}

  var W=0,H=0,dpr=1,items=[],heap=[],BUCKET=12,floor=0,fontPx=13;
  var started=false,raf=0,t0=0,fading=false;
  var ink='#1d1d1f',green='#00875a';

  function size(){
    var r=shot.getBoundingClientRect();
    W=Math.max(1,r.width);H=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    fontPx=mobile?11:Math.max(12,Math.min(15,W/90));
    ctx.font='500 '+fontPx+'px "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace';
    floor=H*(mobile?0.93:0.9);
  }

  function build(){
    heap=[];for(var i=0;i<Math.ceil(W/BUCKET)+2;i++)heap.push(0);
    items=[];
    var cx=W/2,spread=mobile?W*0.5:Math.min(W*0.42,560);
    for(var k=0;k<COUNT;k++){
      var s=LINES[Math.floor(Math.random()*LINES.length)];
      var w=ctx.measureText(s).width;
      items.push({
        s:s,w:w,
        x:cx+(Math.random()*2-1)*spread-w/2,
        y:-20-Math.random()*H*0.9,
        vy:0,
        g:0.0009*H*(0.8+Math.random()*0.5),
        rot:(Math.random()*2-1)*0.5,
        vr:(Math.random()*2-1)*0.002,
        delay:k*(mobile?95:70)+Math.random()*120,
        landed:false,
        green:Math.random()<0.28,
        a:0
      });
    }
    items.sort(function(a,b){return a.delay-b.delay});
  }

  function heapAt(x0,x1){
    var m=0,a=Math.max(0,Math.floor(x0/BUCKET)),b=Math.min(heap.length-1,Math.floor(x1/BUCKET));
    for(var i=a;i<=b;i++)if(heap[i]>m)m=heap[i];
    return m;
  }
  function heapAdd(x0,x1,top){
    var a=Math.max(0,Math.floor(x0/BUCKET)),b=Math.min(heap.length-1,Math.floor(x1/BUCKET));
    for(var i=a;i<=b;i++)heap[i]=Math.max(heap[i],top);
  }

  var last=0;
  function frame(now){
    if(!t0){t0=now;last=now}
    var dt=Math.min(40,now-last);last=now;
    var t=now-t0;
    ctx.clearRect(0,0,W,H);
    var done=0;
    for(var i=0;i<items.length;i++){
      var it=items[i];
      if(t<it.delay)continue;
      if(!it.landed){
        it.vy+=it.g*dt;
        it.y+=it.vy*dt*0.06;
        it.rot=it.rot*0.995+it.vr*dt;
        it.a=Math.min(1,it.a+dt/150);
        var x0=it.x,x1=it.x+it.w*0.9;
        var ground=floor-heapAt(x0,x1);
        if(it.y>=ground){
          it.y=ground;it.landed=true;
          it.rot=Math.max(-0.35,Math.min(0.35,it.rot*0.5));
          heapAdd(x0,x1,floor-it.y+fontPx*1.25);
        }
      }else done++;
      ctx.save();
      ctx.globalAlpha=it.a*(it.landed?0.92:0.85);
      ctx.translate(it.x+it.w/2,it.y);
      ctx.rotate(it.rot);
      ctx.fillStyle=it.green?green:ink;
      ctx.fillText(it.s,-it.w/2,0);
      ctx.restore();
    }
    if(done===items.length&&!fading){
      fading=true;
      setTimeout(function(){cv.style.opacity='0'},1800);
      setTimeout(finish,1800+950);
    }
    if(!document.hidden||!fading)raf=requestAnimationFrame(frame);
  }

  function finish(){
    cancelAnimationFrame(raf);
    window.removeEventListener('resize',size);
    cv.remove();
    items=[];
    try{sessionStorage.setItem('rain-done','1')}catch(e){}
  }

  function start(){
    if(started)return;started=true;
    size();build();
    window.addEventListener('resize',size,{passive:true});
    raf=requestAnimationFrame(frame);
  }

  /* старт: после первого пролистывания, когда фото хотя бы на треть в кадре */
  var scrolled=false,visible=false;
  function maybe(){if(scrolled&&visible)start()}
  window.addEventListener('scroll',function(){
    if(window.scrollY>24){scrolled=true;maybe()}
  },{passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){visible=es[0].isIntersecting;maybe()},{threshold:.3}).observe(shot);
  }else{visible=true}
  /* страница открыта уже ниже верха (якорь, восстановление прокрутки) */
  if(window.scrollY>24)scrolled=true;
})();
