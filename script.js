const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const scenes = [...document.querySelectorAll(".scene")];
const skip = document.getElementById("skip");
const musicBtn = document.getElementById("musicBtn");
const song = document.getElementById("song");

let W,H,dpr;
let stars=[];
let comets=[];
let running=true;
let startTime=performance.now();
let phase=0;

function resize(){
  dpr=Math.min(devicePixelRatio||1,2);
  W=innerWidth; H=innerHeight;
  canvas.width=W*dpr; canvas.height=H*dpr;
  canvas.style.width=W+"px"; canvas.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  stars=Array.from({length:Math.min(180,Math.floor(W*H/6500))},()=>({
    x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.2,a:Math.random()*.8+.15
  }));
  makeComets();
}
function makeComets(){
  comets=[
    {x:-120,y:H*.32,vx:2.8,vy:.65,side:1},
    {x:W+120,y:H*.68,vx:-2.8,vy:-.65,side:-1}
  ];
}
function drawStars(t){
  ctx.fillStyle="#02030a";ctx.fillRect(0,0,W,H);
  for(const s of stars){
    const tw=.55+.45*Math.sin(t*.001+s.x);
    ctx.globalAlpha=s.a*tw;
    ctx.fillStyle="#fff";
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}
function comet(c){
  const ang=Math.atan2(c.vy,c.vx);
  ctx.save();
  ctx.translate(c.x,c.y);
  ctx.rotate(ang);
  const grad=ctx.createLinearGradient(-150,0,20,0);
  grad.addColorStop(0,"rgba(255,150,50,0)");
  grad.addColorStop(.7,"rgba(255,210,110,.35)");
  grad.addColorStop(1,"rgba(255,245,220,.9)");
  ctx.fillStyle=grad;
  ctx.beginPath();ctx.moveTo(-170,0);ctx.quadraticCurveTo(-60,-18,8,-6);ctx.quadraticCurveTo(-60,18,-170,0);ctx.fill();
  const glow=ctx.createRadialGradient(0,0,0,0,0,24);
  glow.addColorStop(0,"#fff");glow.addColorStop(.2,"#ffe5a0");glow.addColorStop(.65,"#ff9e3d");glow.addColorStop(1,"rgba(255,80,20,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function animate(t){
  if(!running)return;
  drawStars(t);
  if(phase===0){
    for(const c of comets){c.x+=c.vx;c.y+=c.vy;comet(c)}
  }
  requestAnimationFrame(animate);
}
resize();addEventListener("resize",resize);requestAnimationFrame(animate);

function show(i){
  scenes.forEach((s,n)=>s.classList.toggle("active",n===i));
}
function flash(){
  const f=document.createElement("div");f.className="flash";document.body.appendChild(f);
  requestAnimationFrame(()=>f.classList.add("go"));
  setTimeout(()=>f.remove(),1000);
}

const timeline=[
  [0,0],
  [5200,1],
  [7300,2],
  [11200,3],
  [16000,4],
  [20500,5]
];

let timer;
function run(){
  startTime=performance.now();
  timeline.forEach(([delay,index])=>{
    setTimeout(()=>{
      if(index===1){
        phase=1;
        flash();
        show(index);
        setTimeout(()=>{ phase=0; makeComets(); },900);
      } else {
        show(index);
      }
    },delay);
  });
}
run();

skip.addEventListener("click",()=>{
  clearTimeout(timer);
  phase=0;
  show(5);
});

musicBtn.addEventListener("click",async()=>{
  try{
    if(song.paused){
      await song.play();
      musicBtn.textContent="❚❚ Пауза";
    }else{
      song.pause();
      musicBtn.textContent="▶ Продолжить песню";
    }
  }catch(e){
    musicBtn.textContent="Добавьте assets/song.mp3";
  }
});
