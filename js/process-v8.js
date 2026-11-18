/* v8 process: scroll-progress, restrained pointer depth; no carousel, no hidden copy. */
(function(){
 'use strict';
 var rail=document.querySelector('.process-v8__steps'); if(!rail)return;
 var steps=Array.from(rail.querySelectorAll('[data-process-step]'));
 var reduced=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover:hover) and (pointer:fine)');
 var live=false,raf=0;
 function clamp(v){return Math.max(0,Math.min(1,v));}
 function paint(){
  raf=0; var r=rail.getBoundingClientRect(), vh=innerHeight, mobile=innerWidth<=900;
  var p=clamp((vh*.84-r.top)/Math.max(1,r.height+vh*.25));
  var current=mobile?steps.reduce(function(n,e,i){return e.getBoundingClientRect().top<vh*.61?i:n;},0):Math.min(4,Math.floor(p*5));
  steps.forEach(function(el,i){
   el.classList.toggle('is-current',i===current);el.classList.toggle('is-past',i<current);
   var part=mobile?clamp((vh*.61-el.getBoundingClientRect().top-40)/Math.max(1,el.offsetHeight)):clamp(p*5-i);
   el.style.setProperty('--line-progress',reduced.matches?'1':part.toFixed(3));
  });
  rail.dataset.activeStep=String(current+1);
 }
 function ask(){if(live&&!raf)raf=requestAnimationFrame(paint);}
 if('IntersectionObserver' in window){new IntersectionObserver(function(es){live=es[0].isIntersecting;if(live)ask();},{rootMargin:'10% 0px'}).observe(rail);}else{live=true;}
 addEventListener('scroll',ask,{passive:true});addEventListener('resize',ask);reduced.addEventListener('change',ask);
 steps.forEach(function(el){
  el.addEventListener('pointermove',function(e){if(reduced.matches||!fine.matches||e.pointerType!=='mouse')return;var r=el.getBoundingClientRect();el.style.setProperty('--rx',((.5-clamp((e.clientY-r.top)/r.height))*12).toFixed(2)+'deg');el.style.setProperty('--ry',((clamp((e.clientX-r.left)/r.width)-.5)*18).toFixed(2)+'deg');el.style.setProperty('--rz','0deg');el.style.setProperty('--lift','-7px');});
  el.addEventListener('pointerleave',function(){['--rx','--ry','--rz','--lift'].forEach(function(k){el.style.removeProperty(k);});});
 });
 paint();
})();
