const canvas=document.getElementById("space"),ctx=canvas.getContext("2d");
const scenes=[...document.querySelectorAll(".scene")];
const startBtn=document.getElementById("startBtn"),skip=document.getElementById("skip");
const progress=document.querySelector("#progress i"),musicBtn=document.getElementById("musicBtn");
const song=document.getElementById("song");

let W,H,dpr,stars=[],comets=[],phase=0,current=0,started=false,startAt=0;
let audioCtx=null,master=null,melodyGain=null,melodyTimer=null;

function resize(){
 dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
 canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+"px"; canvas.style.height=H+"px";
 ctx.setTransform(dpr,0,0,dpr,0,0);
 stars=Array.from({length:Math.min(190,Math.floor(W*H/6200))},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.2,a:Math.random()*.8+.15}));
 makeComets();
}
function makeComets(){comets=[{x:-150,y:H*.32,vx:3.1,vy:.7},{x:W+150,y:H*.68,vx:-3.1,vy:-.7}]}
function drawStars(t){
 ctx.fillStyle="#02030a";ctx.fillRect(0,0,W,H);
 for(const s of stars){ctx.globalAlpha=s.a*(.55+.45*Math.sin(t*.001+s.x));ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1;
}
function comet(c){
 const a=Math.atan2(c.vy,c.vx);ctx.save();ctx.translate(c.x,c.y);ctx.rotate(a);
 const g=ctx.createLinearGradient(-200,0,25,0);g.addColorStop(0,"rgba(255,150,50,0)");g.addColorStop(.72,"rgba(255,210,110,.35)");g.addColorStop(1,"rgba(255,245,220,.95)");
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-200,0);ctx.quadraticCurveTo(-65,-21,8,-6);ctx.quadraticCurveTo(-65,21,-200,0);ctx.fill();
 const glow=ctx.createRadialGradient(0,0,0,0,0,28);glow.addColorStop(0,"#fff");glow.addColorStop(.22,"#ffe5a0");glow.addColorStop(.65,"#ff9e3d");glow.addColorStop(1,"rgba(255,80,20,0)");
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();ctx.restore();
}
function animate(t){
 drawStars(t);
 if(started&&phase===0){for(const c of comets){c.x+=c.vx;c.y+=c.vy;comet(c)}}
 requestAnimationFrame(animate);
}
resize();addEventListener("resize",resize);requestAnimationFrame(animate);

function show(i){
 current=i; scenes.forEach((s,n)=>s.classList.toggle("active",n===i));
 if(i===5) fadeMelody();
}
function flash(){
 const f=document.createElement("div");f.className="flash";document.body.appendChild(f);
 requestAnimationFrame(()=>f.classList.add("go"));setTimeout(()=>f.remove(),1000);
}

/*
  Сценарий синхронизирован с песней:
  0:00–0:16 интро / кометы начинают движение
  0:16–0:34 сближение / столкновение
  0:34–1:18 первое фото
  1:18–2:05 история
  2:05–3:08 второе фото
  3:08–3:52 поздравление
  3:52–конец финальный экран
*/
const timeline=[
 [0,0],
 [16000,1],
 [34000,2],
 [78000,3],
 [125000,4],
 [188000,5]
];
let timers=[];
function runTimeline(){
 timers.forEach(clearTimeout);timers=[];
 timeline.forEach(([ms,index])=>{
   timers.push(setTimeout(()=>{
     if(index===1){phase=1;flash();show(1);setTimeout(()=>{phase=0;makeComets()},1000)}
     else show(index);
   },ms));
 });
 const tick=setInterval(()=>{
   if(!started||current===5){clearInterval(tick);return}
   const elapsed=performance.now()-startAt;
   progress.style.width=Math.min(100,elapsed/188000*100)+"%";
 },100);
 timers.push(tick);
}

async function startExperience(e){
 if(e) e.preventDefault();
 if(started)return;
 started=true; startAt=performance.now();
 initAudio();
 try{
   if(audioCtx.state === "suspended") await audioCtx.resume();
 }catch(_){}
 startMelody();
 try{
   await song.play();
   musicBtn.textContent="❚❚ Пауза";
 }catch(e){
   musicBtn.textContent="▶ Включить вашу песню";
 }
 runTimeline();
}
startBtn.addEventListener("click",startExperience);
startBtn.addEventListener("touchend",startExperience,{passive:false});

function skipExperience(e){
 if(e) e.preventDefault();
 timers.forEach(clearTimeout);
 phase=0;
 show(5);
}
skip.addEventListener("click",skipExperience);
skip.addEventListener("touchend",skipExperience,{passive:false});

function initAudio(){
 if(audioCtx)return;
 audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 master=audioCtx.createGain();master.gain.value=.10;master.connect(audioCtx.destination);
 melodyGain=audioCtx.createGain();melodyGain.gain.value=.0001;melodyGain.connect(master);
}
function note(freq,time,dur,type="triangle",vol=.05){
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,time);
 g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(vol,time+.025);g.gain.exponentialRampToValueAtTime(.0001,time+dur);
 o.connect(g);g.connect(melodyGain);o.start(time);o.stop(time+dur+.03);
}
function startMelody(){
 if(!audioCtx)return;
 const beat=60/126, pattern=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
 let t=audioCtx.currentTime+.08;
 pattern.forEach((f,i)=>note(f,t+i*beat/2,beat*.42,"triangle",.025));
 note(130.81,t,beat*.75,"sine",.03);
 melodyTimer=setInterval(()=>{
   if(current>=5){clearInterval(melodyTimer);return}
   const now=audioCtx.currentTime+.05;
   pattern.forEach((f,i)=>note(f,now+i*beat/2,beat*.42,"triangle",.025));
   note(130.81,now,beat*.75,"sine",.03);
 },beat*4);
}
function fadeMelody(){
 if(!melodyGain||!audioCtx)return;
 melodyGain.gain.cancelScheduledValues(audioCtx.currentTime);
 melodyGain.gain.setTargetAtTime(.0001,audioCtx.currentTime,.55);
}
async function toggleMusic(e){
 if(e) e.preventDefault();
 try{
   if(audioCtx && audioCtx.state === "suspended") await audioCtx.resume();
   if(song.paused){
     await song.play();
     musicBtn.textContent="❚❚ Пауза";
     fadeMelody();
   }else{
     song.pause();
     musicBtn.textContent="▶ Продолжить песню";
   }
 }catch(e){
   musicBtn.textContent="▶ Нажмите ещё раз";
 }
}
musicBtn.addEventListener("click",toggleMusic);
musicBtn.addEventListener("touchend",toggleMusic,{passive:false});
song.addEventListener("ended",()=>musicBtn.textContent="▶ Послушать ещё раз");
