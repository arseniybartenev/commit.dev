/* Если страницу обновили, когда она была в самом верху, держим её наверху,
   пока человек сам не тронул экран. Если была прокручена ниже, всё как обычно:
   браузер возвращает прежнее место. Ссылки с #якорем не трогаем. */
(function(){
  'use strict';
  var KEY='kommit-y',saved=null;
  try{var v=sessionStorage.getItem(KEY);if(v!==null)saved=+v}catch(e){}
  function setRest(m){try{if('scrollRestoration' in history)history.scrollRestoration=m}catch(e){}}
  function save(){
    var y=Math.round(window.pageYOffset||0);
    try{sessionStorage.setItem(KEY,String(y))}catch(e){}
    setRest(y>60?'auto':'manual'); /* настройка живёт в записи истории, поэтому возвращаем её перед уходом */
  }
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save()});

  if(location.hash)return;
  if(saved!==null&&saved>60){setRest('auto');return}
  setRest('manual');

  var user=false,until=Date.now()+6000;
  function top(){
    if(user||Date.now()>until)return;
    if((window.pageYOffset||0)>0)window.scrollTo({top:0,left:0,behavior:'instant'});
  }
  ['touchstart','wheel','keydown','pointerdown','mousedown'].forEach(function(ev){
    window.addEventListener(ev,function(){user=true;setRest('auto')},{passive:true,once:true});
  });
  window.addEventListener('scroll',top,{passive:true});
  document.addEventListener('DOMContentLoaded',top);
  window.addEventListener('load',top);
  window.addEventListener('pageshow',top);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(top);
  top();
})();
