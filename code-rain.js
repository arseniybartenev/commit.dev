/* Строки кода падают на первое большое фото, ложатся кучей и исчезают.
   На каждой загрузке страницы, после первого пролистывания. Без prefers-reduced-motion и без canvas ничего не делает.
   Шрифт тот же, что на сайте (JetBrains Mono), HTML и стили страницы не трогаем. */
(function(){
  'use strict';
  var shot=document.querySelector('.hero .shot');
  if(!shot||!window.requestAnimationFrame)return;
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;

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
  var COUNT=mobile?34:56;
  var cv=document.createElement('canvas');
  cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:1;transition:opacity 1s ease';
  shot.appendChild(cv);
  var ctx=cv.getContext('2d');
  if(!ctx){cv.remove();return}

  var W=0,H=0,dpr=1,items=[],heap=[],BUCKET=10,floor=0,fontPx=13,row=16;
  var started=false,raf=0,t0=0,fading=false;
  var ink='#1d1d1f',green='#00875a';

  function size(){
    var r=shot.getBoundingClientRect();
    W=Math.max(1,r.width);H=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    fontPx=mobile?10:Math.max(11,Math.min(13,W/105));
    row=fontPx*1.35;
    ctx.font='500 '+fontPx+'px "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace';
    floor=H*(mobile?0.94:0.91);
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

  /* куча считается заранее: строки выбирают самое низкое место по всей ширине и обходят ежедневник */
  function build(){
    heap=[];for(var i=0;i<Math.ceil(W/BUCKET)+3;i++)heap.push(0);
    var imgW=Math.min(W,H*16/9),imgX=(W-imgW)/2;
    var zl=mobile?W*0.24:imgX+imgW*0.35, zr=mobile?W*0.74:imgX+imgW*0.65;
    var cap=row*(mobile?2:1.6);
    var pool=LINES.filter(function(s){return !mobile||s.length<=20});
    items=[];
    for(var k=0;k<COUNT;k++){
      var s=pool[Math.floor(Math.random()*pool.length)];
      var w=ctx.measureText(s).width;
      var best=null;
      for(var c=0;c<12;c++){
        var x=-w*0.15+Math.random()*(W-w*0.7);
        var x1=x+w;
        var h=heapAt(x,x1);
        var inZone=x1>zl&&x<zr;
        var pen=h+(inZone&&h+row>cap?1e6:0);
        if(!best||pen<best.pen)best={x:x,pen:pen,h:h};
      }
      var rot=(Math.random()*2-1)*0.06;
      heapAdd(best.x,best.x+w,best.h+row);
      items.push({
        s:s,w:w,x:best.x,
        y0:-30-Math.random()*H*0.25,
        y1:floor-best.h,
        rot0:(Math.random()*2-1)*0.7,rot:rot,
        delay:k*(mobile?150:85)+Math.random()*200,
        dur:(mobile?3600:4200)+Math.random()*1800,
        green:Math.random()<0.28
      });
    }
  }

  function frame(now){
    if(!t0)t0=now;
    var t=now-t0;
    ctx.clearRect(0,0,W,H);
    var done=0;
    for(var i=0;i<items.length;i++){
      var it=items[i];
      var p=(t-it.delay)/it.dur;
      if(p<=0)continue;
      if(p>1)p=1;
      var e=p*p;               /* разгон вниз, как при падении */
      var y=it.y0+(it.y1-it.y0)*e;
      var rot=it.rot0+(it.rot-it.rot0)*Math.min(1,p*1.6);
      if(p>=1)done++;
      ctx.save();
      ctx.globalAlpha=Math.min(1,p*6)*0.9;
      ctx.translate(it.x+it.w/2,y);
      ctx.rotate(rot);
      ctx.fillStyle=it.green?green:ink;
      ctx.fillText(it.s,-it.w/2,0);
      ctx.restore();
    }
    if(done===items.length&&!fading){
      fading=true;
      setTimeout(function(){cv.style.opacity='0'},2200);
      setTimeout(finish,2200+1050);
    }
    raf=requestAnimationFrame(frame);
  }

  function finish(){
    cancelAnimationFrame(raf);
    window.removeEventListener('resize',finish);
    cv.remove();
    items=[];
  }

  function start(){
    if(started)return;started=true;
    size();build();
    window.addEventListener('resize',finish,{passive:true});
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
  if(window.scrollY>24)scrolled=true;
})();
