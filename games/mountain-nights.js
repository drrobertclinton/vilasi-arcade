/* Summit Nights: pick a real peak at base camp, then climb it day and night.
   One climb per round. Camps are checkpoints with a campfire, a guide and a fact about the mountain.
   Oxygen and warmth drain, a furry night monster hunts between camps and keeps away from fires. */
(function(){
'use strict';
const rgb=(r,g,b)=>(r<<16)|(g<<8)|b;

/* ---------------------------------------------------------------- the peaks (real facts) */
const PEAKS=[
 {name:'Mount Fuji',country:'Japan',height:3776,base:2300,mods:'SSTT',o2:0.5,cold:0.5,monsters:1,monster:'Storm Spirit',mc:rgb(170,120,255),hello:'Konnichiwa!',guide:'Hut Keeper Aki',
  low:rgb(120,170,90),mid:rgb(150,80,70),high:rgb(120,60,60),sky:rgb(255,190,170),
  facts:['Mount Fuji is 3,776 m tall. It is the highest mountain in Japan and a sleeping volcano.','Climbers stay in mountain huts and leave at night to watch the sunrise from the top. The sunrise is called goraiko.','The official climbing season is only in summer, when most of the snow is gone.']},
 {name:'Kilimanjaro',country:'Tanzania',height:5895,base:2700,mods:'SSTTI',o2:0.7,cold:0.6,monsters:1,monster:'Night Stalker',mc:rgb(255,170,80),hello:'Jambo!',guide:'Guide Baraka',
  low:rgb(110,180,80),mid:rgb(150,125,95),high:rgb(235,240,250),sky:rgb(255,215,150),
  facts:['Kilimanjaro is 5,895 m tall. It is the highest mountain in Africa and the tallest free-standing mountain on Earth.','Guides say pole pole. It means slowly, slowly in Swahili. Going slowly helps your body get used to thin air.','You walk from rainforest to desert to ice on the way up. The top is called Uhuru Peak.']},
 {name:'Mont Blanc',country:'France and Italy',height:4806,base:1800,mods:'SSTWCI',o2:0.7,cold:0.8,monsters:2,monster:'Ice Wraith',mc:rgb(140,220,255),hello:'Bonjour!',guide:'Guide Margaux',
  low:rgb(95,165,95),mid:rgb(140,140,150),high:rgb(240,245,255),sky:rgb(190,220,255),
  facts:['Mont Blanc is about 4,806 m tall. It is the highest mountain in the Alps.','It was first climbed in 1786. Many people say modern mountain climbing started here.','Glaciers have deep cracks called crevasses. Climbers tie themselves together with a rope so a fall can be stopped.']},
 {name:'Aconcagua',country:'Argentina',height:6961,base:2900,mods:'SSTRAI',o2:1.0,cold:1.1,monsters:2,monster:'Wind Phantom',mc:rgb(255,235,190),hello:'Hola!',guide:'Guide Mateo',
  low:rgb(170,145,105),mid:rgb(150,110,90),high:rgb(240,240,248),sky:rgb(255,225,190),
  facts:['Aconcagua is 6,961 m tall. It is the highest mountain outside Asia.','Mule drivers called arrieros carry the heavy loads to base camp.','A fierce storm here is called the viento blanco, the white wind.']},
 {name:'Matterhorn',country:'Switzerland and Italy',height:4478,base:1600,mods:'TTWWRR',o2:0.7,cold:0.9,monsters:2,monster:'Cliff Wraith',mc:rgb(170,190,255),hello:'Gruezi!',guide:'Guide Lukas',
  low:rgb(100,170,95),mid:rgb(125,120,125),high:rgb(225,232,245),sky:rgb(175,210,255),
  facts:['The Matterhorn is 4,478 m tall and shaped like a pyramid.','It was first climbed in 1865. The climb is steep rock almost all the way.','On steep rock, climbers always keep three points of contact: two hands and a foot, or two feet and a hand.']},
 {name:'Mount Everest',country:'Nepal and China',height:8849,base:5364,mods:'CCIWWRAS',o2:1.8,cold:1.9,monsters:4,monster:'Yeti',mc:rgb(250,250,255),hello:'Namaste!',guide:'Sherpa Pemba',
  low:rgb(160,150,140),mid:rgb(130,128,135),high:rgb(245,248,255),sky:rgb(150,185,235),
  facts:['Mount Everest is 8,849 m tall. It is the highest mountain on Earth.','Tenzing Norgay and Edmund Hillary were the first to reach the top, in 1953.','Sherpa climbers hold a puja ceremony at base camp to ask the mountain for safe passage.','Teams climb up and down between camps for weeks so their bodies can get used to the thin air.']},
 {name:'K2',country:'Pakistan and China',height:8611,base:5000,mods:'WWRRACI',o2:1.5,cold:1.8,monsters:3,monster:'Yeti',mc:rgb(235,240,250),hello:'Assalamu alaikum!',guide:'Guide Hassan',
  low:rgb(150,140,135),mid:rgb(120,118,125),high:rgb(240,244,255),sky:rgb(165,190,230),
  facts:['K2 is 8,611 m tall. It is the second highest mountain on Earth.','Climbers call it the Savage Mountain because it is so steep and stormy.','Above 8,000 m is the death zone. There is too little oxygen for a person to stay long.']},
 {name:'Annapurna',country:'Nepal',height:8091,base:4130,mods:'AAACIWS',o2:1.4,cold:1.6,monsters:3,monster:'Yeti',mc:rgb(240,240,250),hello:'Namaste!',guide:'Guide Dawa',
  low:rgb(120,160,110),mid:rgb(130,128,135),high:rgb(245,248,255),sky:rgb(170,200,240),
  facts:['Annapurna is 8,091 m tall. In 1950 it became the first mountain over 8,000 m ever climbed.','The name comes from Sanskrit and means full of food. Annapurna is a goddess of the harvest.','Annapurna is famous for avalanches. Climbers cross the dangerous slopes early, when the snow is frozen hard.']}
];
const TIPS=[
 'Climb high, sleep low. Rest at each camp so your body gets used to the thin air.',
 'If your head hurts and you feel dizzy, go down. Going lower is the cure for altitude sickness.',
 'Eat and drink even when you are not hungry. Your body burns a lot of energy in the cold.',
 'Getting to the top is only half the climb. Most accidents happen on the way down.',
 'Check the weather. A real climber turns around when a storm is coming.',
 'Never climb alone. Stay with your team.',
 'Frostbite starts in fingers, toes and the nose. Keep them covered and warm.',
 'Bright snow can burn your eyes. Wear glacier goggles.'
];
const GEAR={
 crampons:{name:'Crampons',price:15,color:0xffc93c,desc:'Spikes for your boots. Wind cannot push you and you walk faster.'},
 tank:{name:'Oxygen tank',price:25,color:0x58d0ff,desc:'A bigger oxygen bar.'},
 suit:{name:'Down suit',price:25,color:0xff6a6a,desc:'You lose warmth much more slowly.'}
};

/* easy / medium / hard. Each gate offers one peak from the pool. */
const TIERS=[
 {id:'easy',label:'Easy',gate:0x35d07f,pool:['Mount Fuji','Kilimanjaro'],stages:5,per:2,div:7,slopeMul:1.05,allow:'TRCWA',stones:[5,6],gap:3.0,zig:0,ridgeW:5.6,gust:30,crev:15,wall:4,
  mspeed:5.6,mdmg:9,mcap:1,ballSpd:10,ballGap:2.8,ballDmg:10,o2:1.0,cold:1.0,rescues:6,limit:760,dayLen:40,nightLen:24,blizz:[60,95],blizzDur:11},
 {id:'medium',label:'Medium',gate:0xffc93c,pool:['Mont Blanc','Aconcagua','Matterhorn'],stages:6,per:3,div:7,slopeMul:1.05,allow:'TRCWAI',stones:[6,7],gap:3.7,zig:1.3,ridgeW:4.6,gust:44,crev:21,wall:5,
  mspeed:7.2,mdmg:13,mcap:2,ballSpd:13,ballGap:2.1,ballDmg:15,o2:0.75,cold:1.1,rescues:4,limit:1100,dayLen:36,nightLen:26,blizz:[42,72],blizzDur:14},
 {id:'hard',label:'Hard',gate:0xff4d5e,pool:['Mount Everest','K2','Annapurna'],stages:8,per:3,div:6,slopeMul:1.0,allow:'TRCWAI',stones:[7,8],gap:4.2,zig:2.4,ridgeW:3.8,gust:58,crev:27,wall:7,
  mspeed:8.0,mdmg:15,mcap:3,ballSpd:15,ballGap:1.7,ballDmg:16,o2:0.62,cold:1.2,rescues:3,limit:1500,dayLen:32,nightLen:30,blizz:[28,52],blizzDur:16}
];

VG.register({
  id:'mountain-nights',name:'Summit Nights',tagline:'Pick a real peak. Climb it. Survive the night.',color:0x6fb6ff,levels:1,
  howTo:[
    'Walk through a glowing gate to pick your mountain: green is easy, gold is medium, red is hard.',
    'Watch your OXYGEN and WARMTH bars. Oxygen drains faster the higher you climb above your last camp. Warmth drains at night and in blizzards.',
    'Stand by a campfire to fill both bars. Camps are checkpoints, so if you fall you come back to the last camp.',
    'At night a furry monster hunts between camps. It will not come near a campfire.',
    'Collect coins to buy crampons, an oxygen tank or a down suit at camp. Reach the summit flag to win.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,lerp,angLerp,shuffle}=VG.util,W=E.world,T=THREE;
    const hash=n=>{const s=Math.sin(n*12.9898+78.233)*43758.5453;return s-Math.floor(s);};
    const _c1=new T.Color(),_c2=new T.Color();
    const mix=(a,b,t)=>{_c1.set(a);_c2.set(b);_c1.lerp(_c2,clamp(t,0,1));return _c1.getHex();};
    const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
    const comma=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');
    /* a block that hangs down from yTop (so slopes have no holes under them) */
    const blk=(x,z,sx,sz,yTop,depth,c,o)=>W.addBox(x,yTop-depth/2,z,sx,depth,sz,c,o);
    const box=(x,y,z,sx,sy,sz,c,o)=>W.addBox(x,y,z,sx,sy,sz,c,o);
    W.killY=-400;
    E.cam.dist=17;E.cam.pitch=0.22;E.cam.yaw=0;
    const P=E.player;P.speed=8.6;P.name='You';

    /* ---------------------------------------------------------------- state */
    let mode='base',tierIdx=-1,peak=null,tier=null,rise=300,summitY=300,Z0=-34,capY=1e9,pickedIdx=0;
    let secs=[],wps=[],camps=[],gates=[],coinsLeft=0,done=false,tStart=0;
    const S={coins:0,nights:0,falls:0,deaths:0,camp:0,reached:0,o2:100,maxO2:100,warm:100,hurtT:0,lastHurt:-9};
    const has={crampons:false,tank:false,suit:false};
    const gearPick={crampons:[],tank:[],suit:[]};
    let clock=0,cyc=64,fd=0.62,nightW=0,wasNight=false,nightNo=0,blizzard=0,blizzT=40,blizzOn=0,dusk=false;
    const gust={t:3,dur:0,tot:1,dir:1,s:0};
    let inRidge=false,onFire=false,lastNeed=-9,capUntil=0,factQ=[],factI=0;
    const flames=[],windFlags=[],balls=[],mons=[],farBoxes=[],portals=[],guides=[];
    let treeBudget=0;

    /* ---------------------------------------------------------------- sky, light, snow */
    const stars=E.stars(520,0xdfe8ff);stars.material.transparent=true;stars.material.opacity=0;stars.visible=false;
    const fireLight=new T.PointLight(0xff9a40,0.8,36,1.6);fireLight.position.set(0,-50,0);E.add(fireLight);
    let keys=[];
    function buildKeys(){
      const sr=peak?peak.sky:0xffc9a0;
      const A={top:0x6a86c8,bot:sr,fog:mix(sr,0xcfe0ff,0.3),hemi:0.55,sun:0.5,sc:0xffc890};
      const D={top:0x4a9cf5,bot:0xdcefff,fog:0xcfe6ff,hemi:0.74,sun:0.8,sc:0xfff4de};
      const Sn={top:0x7d5ba6,bot:sr,fog:mix(sr,0x8a6aa0,0.3),hemi:0.5,sun:0.46,sc:0xff9a58};
      const N={top:0x060b22,bot:0x1d2c58,fog:0x1b2a4c,hemi:0.5,sun:0.36,sc:0x9fb4ff};
      keys=[[0,A],[0.14,D],[fd-0.14,D],[fd,Sn],[fd+0.08,N],[0.92,N],[1,A]].map(k=>({p:k[0],top:new T.Color(k[1].top),bot:new T.Color(k[1].bot),fog:new T.Color(k[1].fog),hemi:k[1].hemi,sun:k[1].sun,sc:new T.Color(k[1].sc)}));
    }
    const kt=new T.Color(),kb=new T.Color(),kf=new T.Color(),ks=new T.Color(),grey=new T.Color();
    const sunV=V(0,1,0),moonV=V(-0.35,0.75,-0.3).normalize();
    function applySky(ph,dt){
      let i=0;while(i<keys.length-2&&ph>keys[i+1].p)i++;
      const a=keys[i],b=keys[i+1],t=clamp((ph-a.p)/Math.max(1e-4,b.p-a.p),0,1);
      kt.copy(a.top).lerp(b.top,t);kb.copy(a.bot).lerp(b.bot,t);kf.copy(a.fog).lerp(b.fog,t);ks.copy(a.sc).lerp(b.sc,t);
      let hemi=lerp(a.hemi,b.hemi,t),sun=lerp(a.sun,b.sun,t);
      nightW=ph<fd?0:ph<fd+0.08?(ph-fd)/0.08:ph<0.92?1:1-(ph-0.92)/0.08;
      if(blizzard>0.01){const g=blizzard*0.78;grey.setRGB(0.66-0.4*nightW,0.7-0.42*nightW,0.78-0.46*nightW);kt.lerp(grey,g);kb.lerp(grey,g);kf.lerp(grey,g);hemi*=1-0.22*blizzard;sun*=1-0.45*blizzard;}
      const u=E.sky.material.uniforms;u.a.value.copy(kt);u.b.value.copy(kb);u.day.value=nightW<0.5?1:0;
      const ang=0.14*Math.PI+clamp(ph/fd,0,1)*0.72*Math.PI;sunV.set(Math.cos(ang)*0.85,Math.sin(ang),0.4).normalize();
      E.sunDir.copy(sunV).lerp(moonV,nightW).normalize();u.sd.value.copy(E.sunDir);
      const fg=E.scene.fog;fg.color.copy(kf);fg.near=lerp(lerp(120,60,nightW),22,blizzard);fg.far=lerp(lerp(560,300,nightW),120,blizzard);
      E.setLight(hemi,sun,ks.getHex());
      stars.material.opacity=nightW*0.95*(1-blizzard*0.7);stars.visible=nightW>0.03;
    }

    /* snow falling around the player */
    const NS=620,sPos=new Float32Array(NS*3),sSpd=new Float32Array(NS);
    for(let i=0;i<NS;i++){sPos[i*3]=rand(-34,34);sPos[i*3+1]=rand(-8,26);sPos[i*3+2]=rand(-34,34);sSpd[i]=rand(2.2,5.2);}
    const sGeo=new T.BufferGeometry();sGeo.setAttribute('position',new T.BufferAttribute(sPos,3));
    const snow=new T.Points(sGeo,new T.PointsMaterial({color:0xffffff,size:0.3,transparent:true,opacity:0.88,depthWrite:false}));snow.frustumCulled=false;E.add(snow);
    function updateSnow(dt){
      const px=P.pos.x,py=P.pos.y,pz=P.pos.z;
      const act=Math.floor(lerp(mode==='base'?140:230,NS,Math.max(blizzard,Math.min(0.55,rise>0?P.pos.y/rise*0.9:0))));sGeo.setDrawRange(0,act);
      const wx=(gust.s*gust.dir*9+blizzard*7)*(inRidge||blizzard>0.2?1:0.4)+1.2,wz=-blizzard*3;
      const fall=1+blizzard*1.4;
      for(let i=0;i<act;i++){const j=i*3;
        sPos[j]+=wx*dt;sPos[j+2]+=wz*dt;sPos[j+1]-=sSpd[i]*fall*dt;
        if(sPos[j+1]<py-9)sPos[j+1]+=36;
        if(sPos[j]-px>34)sPos[j]-=68;else if(sPos[j]-px<-34)sPos[j]+=68;
        if(sPos[j+2]-pz>34)sPos[j+2]-=68;else if(sPos[j+2]-pz<-34)sPos[j+2]+=68;
        if(sPos[j+1]>py+28)sPos[j+1]-=36;}
      // keep the cloud centred on the player when we jump (respawn)
      sGeo.attributes.position.needsUpdate=true;
    }
    function recenterSnow(){for(let i=0;i<NS;i++){const j=i*3;sPos[j]=P.pos.x+rand(-34,34);sPos[j+1]=P.pos.y+rand(-8,26);sPos[j+2]=P.pos.z+rand(-34,34);}}
    const mist=E.slab(0,-40,0,600,0.4,600,0xffffff,0.26);

    /* ---------------------------------------------------------------- hud (bars, clock, guide captions) */
    if(!document.getElementById('mn-style')){const st=document.createElement('style');st.id='mn-style';st.textContent=
      '.mn-hud{position:absolute;inset:0;pointer-events:none;color:#fff}'+
      '.mn-bars{position:absolute;left:14px;bottom:66px;width:min(290px,60vw);display:grid;gap:6px}'+
      '.mn-bar{display:flex;align-items:center;gap:8px;background:rgba(18,22,48,.8);border-radius:10px;padding:6px 10px;font-weight:700;font-size:12px;letter-spacing:.04em}'+
      '.mn-bar span{width:66px;flex:none}.mn-bar b{width:34px;text-align:right;font-variant-numeric:tabular-nums;flex:none}'+
      '.mn-bar div{flex:1;height:14px;border-radius:7px;background:rgba(255,255,255,.18);overflow:hidden}'+
      '.mn-bar i{display:block;height:100%;width:100%;border-radius:7px;transition:width .2s}'+
      '.mn-o2 i{background:linear-gradient(90deg,#2fa8ff,#7fe3ff)}.mn-wm i{background:linear-gradient(90deg,#ff7a2f,#ffc24a)}'+
      '.mn-bar.low{animation:mnlow .7s infinite alternate}.mn-bar.low i{background:#ff4d5e}'+
      '@keyframes mnlow{from{box-shadow:0 0 0 0 rgba(255,77,94,.0)}to{box-shadow:0 0 0 3px rgba(255,77,94,.85)}}'+
      '.mn-clock{background:rgba(18,22,48,.8);border-radius:10px;padding:6px 10px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700}'+
      '.mn-clock em{font-style:normal;width:66px;flex:none;letter-spacing:.04em}'+
      '.mn-track{position:relative;flex:1;height:12px;border-radius:6px;background:linear-gradient(90deg,#ffb68a 0%,#69b8ff 14%,#69b8ff 50%,#ff9a62 62%,#1b2450 72%,#1b2450 90%,#ffb68a 100%)}'+
      '.mn-track u{position:absolute;top:-3px;width:8px;height:18px;border-radius:4px;background:#fff;box-shadow:0 0 6px #000;margin-left:-4px}'+
      '.mn-cap{position:absolute;left:14px;top:58px;width:min(440px,58vw);background:rgba(18,22,48,.9);border:2px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 14px;opacity:0;transition:opacity .35s}'+
      '.mn-cap.on{opacity:1}.mn-cap b{display:block;color:#ffd84a;font-size:13px;margin-bottom:2px}.mn-cap p{margin:0;font-size:15px;line-height:1.3}'+
      '.mn-fire{position:absolute;left:50%;bottom:196px;transform:translateX(-50%);background:rgba(255,120,40,.88);padding:5px 16px;border-radius:999px;font-weight:700;font-size:14px;opacity:0;transition:opacity .25s}'+
      '.mn-fire.on{opacity:1}';document.head.appendChild(st);}
    const hud=document.createElement('div');hud.className='mn-hud';
    hud.innerHTML='<div class="mn-cap"><b></b><p></p></div><div class="mn-fire">Warming up by the fire</div><div class="mn-bars">'+
      '<div class="mn-bar mn-o2"><span>OXYGEN</span><div><i></i></div><b>100</b></div>'+
      '<div class="mn-bar mn-wm"><span>WARMTH</span><div><i></i></div><b>100</b></div>'+
      '<div class="mn-clock"><em>DAY</em><div class="mn-track"><u></u></div></div></div>';
    E.host.appendChild(hud);
    const q=s=>hud.querySelector(s);
    const H={cap:q('.mn-cap'),capB:q('.mn-cap b'),capP:q('.mn-cap p'),fire:q('.mn-fire'),o2:q('.mn-o2'),o2i:q('.mn-o2 i'),o2b:q('.mn-o2 b'),wm:q('.mn-wm'),wmi:q('.mn-wm i'),wmb:q('.mn-wm b'),em:q('.mn-clock em'),u:q('.mn-track u')};
    function say(who,text,secs){H.capB.textContent=who;H.capP.textContent=text;H.cap.classList.add('on');capUntil=E.time+(secs||9);}
    let hudT=0,lastRows='';
    function hudBars(dt){
      hudT-=dt;if(hudT>0)return;hudT=0.1;
      const o=clamp(S.o2/S.maxO2,0,1),w=clamp(S.warm/100,0,1);
      H.o2i.style.width=(o*100)+'%';H.wmi.style.width=(w*100)+'%';H.o2b.textContent=Math.round(S.o2);H.wmb.textContent=Math.round(S.warm);
      H.o2.classList.toggle('low',o<0.25);H.wm.classList.toggle('low',w<0.25);
      const ph=((clock/cyc)+0.03)%1;H.u.style.left=(ph*100)+'%';H.em.textContent=nightW>0.5?'NIGHT':blizzard>0.4?'BLIZZARD':ph>fd-0.12?'SUNSET':'DAY';
      H.fire.classList.toggle('on',onFire&&mode==='climb'&&(S.o2<99||S.warm<99||P.hp<P.maxHp-1));
      if(capUntil&&E.time>capUntil){H.cap.classList.remove('on');capUntil=0;}
    }

    /* ---------------------------------------------------------------- small art helpers */
    function label(text,color,w,h,px,x,y,z,sub){
      const cv=document.createElement('canvas');cv.width=512;cv.height=sub?160:112;const g=cv.getContext('2d');g.textAlign='center';g.textBaseline='middle';
      g.font='700 '+(px||54)+'px "Chakra Petch",Arial,sans-serif';g.lineWidth=9;g.strokeStyle='rgba(10,12,28,.9)';g.strokeText(text,256,sub?52:56);
      g.fillStyle='#'+new T.Color(color).getHexString();g.fillText(text,256,sub?52:56);
      if(sub){g.font='600 36px "Chakra Petch",Arial,sans-serif';g.lineWidth=7;g.strokeText(sub,256,116);g.fillStyle='#ffffff';g.fillText(sub,256,116);}
      const tex=new T.CanvasTexture(cv),s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(w,sub?w*160/512:w*112/512,1);s.position.set(x,y,z);E.add(s);return s;}
    function pine(x,z,y,sc,snowy){
      sc=sc||1;const trunk=0x6b4a2e,g1=mix(0x2f7d4a,0x1f5c3a,hash(x*0.7+z)),g2=mix(0x3c8f55,0x2a6f46,hash(z*0.3+x));
      box(x,y+1.1*sc,z,0.7*sc,2.2*sc,0.7*sc,trunk,{solid:false,jitter:0});
      const L=[[4.8,1.6,2.0],[3.8,1.5,3.1],[2.8,1.4,4.2],[1.7,1.3,5.2]];
      for(let i=0;i<4;i++){const l=L[i];box(x,y+l[2]*sc,z,l[0]*sc,l[1]*sc,l[0]*sc,i===3&&snowy?0xf2f6ff:(i%2?g2:g1),{solid:false,jitter:0.1});
        if(snowy&&i<3)box(x,y+(l[2]+l[1]*0.5)*sc,z,l[0]*0.7*sc,0.35*sc,l[0]*0.7*sc,0xf2f6ff,{solid:false,jitter:0});}
    }
    function bunting(ax,ay,az,bx,by,bz,n,sag){
      const cols=[0x3d8bff,0xf4f1ea,0xff4d5e,0x35d07f,0xffc93c];
      for(let i=1;i<n;i++){const t=i/n,x=lerp(ax,bx,t),z=lerp(az,bz,t),y=lerp(ay,by,t)-Math.sin(Math.PI*t)*sag;
        const alongX=Math.abs(bx-ax)>=Math.abs(bz-az);
        box(x,y-0.45,z,alongX?0.95:0.1,0.9,alongX?0.1:0.95,cols[i%5],{solid:false,jitter:0});}
    }
    function flagPole(x,z,y,h,color,big){
      const s=big?1.7:1;
      box(x,y+h/2,z,0.32*s,h,0.32*s,0xdad6cc,{jitter:0});
      box(x+1.7*s,y+h-1.3*s,z,3.2*s,2.2*s,0.14,color,{solid:false,jitter:0});
      box(x+1.7*s,y+h-1.3*s,z+0.01,3.2*s,0.5*s,0.16,0xf4f1ea,{solid:false,jitter:0});
      box(x,y+h+0.4,z,0.7*s,0.7*s,0.7*s,0xffe27a,{glow:true,solid:false});
    }
    function tent(x,z,y,c){
      box(x,y+0.15,z,5.8,0.3,7,0x2d3550,{jitter:0});
      const lay=[[5.0,1.1],[3.8,1.1],[2.6,1.1],[1.4,1.0]];let yy=y+0.3;
      lay.forEach((l,i)=>{box(x,yy+l[1]/2,z,l[0],l[1],6.4,i%2?mix(c,0xffffff,0.25):c,{jitter:0});yy+=l[1];});
      box(x,y+1.2,z+3.22,1.7,2.1,0.12,0x151a30,{solid:false,jitter:0});
      box(x,y+4.6,z,0.3,0.3,6.8,0xdad6cc,{jitter:0});
    }
    function lantern(x,z,y){box(x,y+1.6,z,0.3,3.2,0.3,0x6b4a2e,{jitter:0});box(x,y+3.4,z,0.8,0.9,0.8,0xffd36a,{glow:true,solid:false});box(x,y+4.0,z,1.0,0.25,1.0,0x2d3550,{jitter:0});}

    /* ---------------------------------------------------------------- camps */
    const CAMP_COLORS=[0xff8a3c,0x22c9c2,0xff4d5e,0xa56bff,0x3d8bff,0xffc93c,0x35d07f,0xff6fb5];
    function buildCamp(k,cx,zc,y,o){
      o=o||{};const camp={k,cx,zc,y,fx:cx+4.5,fz:zc,s:Z0-zc,guide:null,name:k===0?'Base Camp':'Camp '+k,shop:!!o.shop};
      const fx=camp.fx,fz=camp.fz;
      for(let i=0;i<8;i++){const a=i/8*6.283;box(fx+Math.cos(a)*2.0,y+0.4,fz+Math.sin(a)*2.0,1.0,0.8,1.0,i%2?0x8a90a3:0x6d7487,{jitter:0.12});}
      box(fx,y+0.15,fz,2.6,0.3,2.6,0xff6a1f,{glow:true,solid:false});
      box(fx,y+0.55,fz,2.8,0.35,0.5,0x6b4a2e,{solid:false,jitter:0});box(fx,y+0.55,fz,0.5,0.35,2.8,0x5a3d26,{solid:false,jitter:0});
      const fl=[[0xff7a1a,1.5,1.3,0,0],[0xffb02e,1.0,1.9,0.3,-0.2],[0xffd966,0.6,1.3,-0.3,0.25]].map((f,i)=>{
        const b=box(fx+f[3],y+0.5+f[2]/2,fz+f[4],f[1],f[2],f[1],f[0],{glow:true,solid:false});return {b,x:fx+f[3],z:fz+f[4],y0:y+0.5,h:f[2],w:f[1],ph:i*2.1+k};});
      camp.flames=fl;flames.push(camp);
      tent(cx-8,zc+4,y,o.tentColor||CAMP_COLORS[k%8]);
      flagPole(cx+9,zc-8,y,10,0xff4d5e);
      bunting(cx-8,y+4.7,zc+4,cx+9,y+9.4,zc-8,13,2.2);
      lantern(cx-12,zc+15,y);lantern(cx+12,zc+15,y);lantern(cx-12,zc-15,y);lantern(cx+12,zc-15,y);
      box(cx-2,y+0.6,zc-10,1.8,1.2,1.8,0x8a5f33,{jitter:0.1});box(cx-3.8,y+0.5,zc-10.4,1.4,1.0,1.4,0x9a6c3c,{jitter:0.1});
      label(camp.name+(o.alt?'  '+o.alt:''),0xffe27a,9,0,50,cx+9,y+14,zc-8);
      // guide (an engine robot)
      if(peak||o.guideName){const g=E.spawn({name:o.guideName||peak.guide,color:CAMP_COLORS[(k+3)%8],bot:true,team:9});g.teleport(cx+3.2,y+0.05,zc+3.5);g.yaw=Math.PI;camp.guide=g;guides.push(g);}
      camps.push(camp);return camp;
    }

    /* ---------------------------------------------------------------- base camp, gates */
    const baseBoxes=[];
    function keep(b){baseBoxes.push(b);return b;}
    function farPeak(x,z,baseY,H,half,seed,store){
      const n=7;
      for(let i=0;i<n;i++){const t=(i+1)/n,w=2*half*(1-i/n*0.86)*(0.9+0.2*hash(seed+i)),top=baseY+H*t;
        const c=mix(mix(0x7c869c,peak?peak.mid:0x8a8f9f,0.3),0xf4f7ff,sstep(0.4,0.78,t)*0.96);
        const b=blk(x+(hash(seed*3+i)-0.5)*half*0.3,z+(hash(seed*5+i)-0.5)*half*0.3,w,w,top,H/n*1.25+(i===0?140:0),c,{jitter:0.08});(store||farBoxes).push(b);}
    }
    function buildBase(){
      const grass=0x6fae6a;
      keep(blk(0,28,300,124,-3,60,grass,{jitter:0.07}));
      keep(blk(0,-3,70,62,0,16,0x9c9484,{jitter:0.05}));
      keep(blk(0,-3,76,68,-0.5,16,0x7aa070,{jitter:0.04}));
      for(let i=0;i<30;i++){const x=(hash(i*1.7)<0.5?-1:1)*rand(40,120),z=rand(-30,80);pine(x,z,-3,rand(0.9,1.7),false);}
      for(let i=0;i<8;i++){const x=(i%2?1:-1)*(36+hash(i)*6),z=-28+i*7;pine(x,z,-3,rand(1,1.5),false);}
      for(const p of [[-250,-170,0],[255,-300,1],[-290,-420,2],[240,-520,3]])farPeak(p[0],p[1],-70,rand(240,320),82,p[2]*7+1,baseBoxes);
      // gates
      TIERS.forEach((t,i)=>{
        const name=pick(PEAKS.filter(p=>t.pool.indexOf(p.name)>=0)),gx=-18+i*18,gz=-22;gates.push({x:gx,z:gz,tier:i,peak:name,t});
        const gc=t.gate;
        box(gx-5,4.6,gz,2.2,9.2,2.2,0x4a4f6b,{jitter:0.05});box(gx+5,4.6,gz,2.2,9.2,2.2,0x4a4f6b,{jitter:0.05});
        box(gx,9.9,gz,12.4,1.6,2.6,0x3a3f58,{jitter:0.04});box(gx,10.9,gz,9,0.6,2.0,0x4a4f6b,{jitter:0.04});
        box(gx-5,9.4,gz+1.2,1.4,1.4,0.4,gc,{glow:true,solid:false});box(gx+5,9.4,gz+1.2,1.4,1.4,0.4,gc,{glow:true,solid:false});
        box(gx,9.0,gz+1.3,9.6,0.3,0.3,gc,{glow:true,solid:false});
        const po=E.slab(gx,4.3,gz,8,8.6,0.35,gc,0.34);portals.push(po);gates[i].portal=po;
        gates[i].sign=label(name.name,gc,10.5,0,56,gx,13.6,gz,t.label+'  -  '+comma(name.height)+' m');
      });
      bunting(-12.6,10.6,-22,-5.4,10.6,-22,9,1.1);bunting(5.4,10.6,-22,12.6,10.6,-22,9,1.1);
      buildCamp(0,0,2,0,{guideName:'Camp Guide Rosa',alt:'',tentColor:0xff8a3c});
    }

    /* ---------------------------------------------------------------- the mountain */
    const WIDTH=12;
    const Zc=(s0,s1)=>Z0-(s0+s1)/2;
    function fracOf(y){return clamp(y/Math.max(1,rise),0,1.2);}
    function pathCol(y,j){const f=fracOf(y),base=mix(mix(peak.low,0xb0a590,0.55),mix(peak.mid,0xb8b4ac,0.5),sstep(0,0.3,f));return mix(base,0xf2f6ff,sstep(0.1,0.5,f)*0.92)^0;}
    function rockCol(y,ti,j){const f=fracOf(y);let b=f<0.35?mix(peak.low,peak.mid,f/0.35):mix(peak.mid,peak.high,(f-0.35)/0.65);
      b=mix(b,0x1d2233,0.05*ti+0.06*(1-sstep(0,0.5,f)));return mix(b,0xf4f7ff,clamp(sstep(0.22,0.62,f)*0.88+0.05*ti+j*0.08,0,0.97));}
    const cur={s:0,y:0,cx:0,stage:0,drop:1};
    function addSec(o){o.s0=cur.s;o.y0=cur.y;o.cx=o.cx==null?cur.cx:o.cx;o.stage=cur.stage;o.drop=cur.drop;secs.push(o);return o;}
    function wp(x,s,o){wps.push(Object.assign({x,s,z:Z0-s},o||{}));}
    function coin(x,y,z){const p=E.pickup({pos:V(x,y+1.7,z),color:0xffcf3a,size:0.5,bots:false,onTake(){S.coins++;E.sfx('pickup');}});coinsLeft++;return p;}
    function coinLine(x0,s0,x1,s1,y0,y1,n){for(let i=0;i<n;i++){const t=(i+0.5)/n;coin(lerp(x0,x1,t),lerp(y0,y1,t),Z0-lerp(s0,s1,t));}}

    function bLanding(len,w,cxTo,o){
      o=o||{};const sec=addSec({k:'landing',len,w:Math.abs((cxTo==null?cur.cx:cxTo)-cur.cx)+w});const cx0=cur.cx,cx1=cxTo==null?cur.cx:cxTo;sec.cx=(cx0+cx1)/2;
      blk(sec.cx,Zc(cur.s,cur.s+len),sec.w,len,cur.y,16,pathCol(cur.y),{jitter:0.07});
      if(o.coins!==false&&len>=8)coinLine(cx0,cur.s+2,cx1,cur.s+len-2,cur.y,cur.y,Math.floor(len/5));
      wp(cx0,cur.s+len*0.3);wp(cx1,cur.s+len*0.8);
      cur.s+=len;sec.s1=cur.s;sec.y1=cur.y;cur.cx=cx1;return sec;
    }
    function bSlope(len,dy,w,o){
      o=o||{};w=w||WIDTH;const sec=addSec({k:o.k||'slope',len,w}),n=Math.max(1,Math.max(Math.round(len/(tier.id==='hard'?2.8:2.4)),Math.ceil(dy/0.85))),run=len/n,rs=dy/n,y0=cur.y,cx=cur.cx;
      for(let i=0;i<n;i++){const top=y0+rs*(i+1);blk(cx,Zc(cur.s+i*run,cur.s+(i+1)*run),w,run+0.02,top,top-y0+12,pathCol(top),{jitter:0.05});}
      const sm=Math.max(2,Math.floor(len/16));
      for(let i=0;i<sm;i++){const t=(i+0.5)/sm;wp(cx,cur.s+len*t);}
      if(!o.nocoin){const nc=Math.floor(len/13);for(let i=0;i<nc;i++){const t=(i+0.5)/nc;coin(cx+Math.sin(i*1.3)*2.2,y0+dy*t,Z0-(cur.s+len*t));}}
      cur.s+=len;cur.y=y0+dy;sec.s1=cur.s;sec.y1=cur.y;return sec;
    }
    function bStones(n,gap,dy,zig,w){
      const sec=addSec({k:'stones',w:w+zig*2+1,abyss:2}),sl=5.4,y0=cur.y;let s=cur.s,yPrev=y0;sec.len=0;
      for(let i=0;i<n;i++){
        s+=gap;const base=y0+dy*(i+1)/n,top=i===n-1?base:clamp(base+rand(-0.35,0.5),yPrev-0.4,yPrev+1.1),x=cur.cx+(zig?((i%2)*2-1)*zig*(0.6+0.4*hash(i+s)):0);
        blk(x,Zc(s,s+sl),w,sl,top,12,mix(0x808aa2,peak.mid,0.25),{jitter:0.1});
        if(fracOf(top)>0.2)blk(x,Zc(s,s+sl),w-0.5,sl-0.4,top+0.45,0.45,0xf2f6ff,{solid:false,jitter:0.03});
        wp(x,s+sl*0.5,{stone:true});
        if(i%2===0)coin(x,top,Z0-(s+sl*0.5));
        yPrev=top;s+=sl;
      }
      s+=gap;cur.s=s;cur.y=y0+dy;sec.s1=s;sec.y1=cur.y;sec.len=s-sec.s0;return sec;
    }
    function bRidge(len,w,dy){
      const sec=addSec({k:'ridge',w:w+2,len,abyss:2,ridge:true}),y0=cur.y,seg=5,n=Math.round(len/seg);let s=cur.s;
      for(let i=0;i<n;i++){const x=cur.cx+Math.sin(i*0.9)*0.9*tier.zig/2.4+Math.sin(i*0.35)*0.7,top=y0+dy*(i+1)/n;
        blk(x,Zc(s,s+seg),w,seg+0.02,top,14,mix(0x9aa3b8,peak.mid,0.3),{jitter:0.07});
        box(x,top+0.1,Z0-(s+seg/2),w*0.7,0.24,seg*0.9,0xf2f6ff,{solid:false,jitter:0.04});
        wp(x,s+seg/2,{ridge:true});if(i%3===1)coin(x,top,Z0-(s+seg/2));
        if(i%5===2){for(const sd of [-1,1]){const fx=x+sd*(w/2+0.2),fz=Z0-(s+seg/2),pv=new T.Group();pv.position.set(fx,top,fz);
          const pole=new T.Mesh(new T.BoxGeometry(0.16,3.4,0.16),new T.MeshLambertMaterial({color:0xdad6cc}));pole.position.y=1.7;pv.add(pole);
          const fl=new T.Mesh(new T.BoxGeometry(2.0,0.9,0.05),new T.MeshLambertMaterial({color:[0xff4d5e,0xffc93c,0x3d8bff][(i+sd+1)%3],side:T.DoubleSide}));fl.position.set(1.0,3.0,0);pv.add(fl);E.add(pv);windFlags.push(pv);}}
        s+=seg;}
      cur.s=s;cur.y=y0+dy;sec.s1=s;sec.y1=cur.y;return sec;
    }
    function bCrevasse(gl,bw){
      const sec=addSec({k:'crevasse',w:bw+3,len:gl,abyss:1}),y=cur.y,n=Math.floor(gl/1.0),sp=gl/n,cx=cur.cx;
      for(let i=0;i<n;i++)box(cx,y-0.15,Z0-(cur.s+sp*(i+0.5)),bw,0.3,sp*0.66,i%2?0xc9a572:0xb8925f,{jitter:0.06});
      for(const sd of [-1,1]){box(cx+sd*(bw/2+0.1),y+0.95,Z0-(cur.s+gl/2),0.14,0.14,gl,0x9fd9ff,{glow:true,solid:false});
        for(let i=0;i<=gl/4;i++)box(cx+sd*(bw/2+0.1),y+0.45,Z0-(cur.s+i*4),0.18,1.0,0.18,0xdad6cc,{solid:false,jitter:0});}
      const gz=Zc(cur.s,cur.s+gl);const sl=E.slab(cx,y-26,gz,70,0.5,gl+6,0x7fb8e8,0.28);
      for(let i=0;i<4;i++)box(cx+(i%2?7:-7)+rand(-2,2),y-20,Z0-(cur.s+(i+0.5)*gl/4),3,12,2,0xbfe6ff,{solid:false,jitter:0.05});
      wp(cx,cur.s+1);for(let t=5;t<gl;t+=6)wp(cx,cur.s+t,{bridge:true});wp(cx,cur.s+gl-1);
      for(let i=0;i<Math.floor(gl/6);i++)coin(cx,y,Z0-(cur.s+3+i*6));
      cur.s+=gl;sec.s1=cur.s;sec.y1=y;return sec;
    }
    function bWall(n,w){
      const sec=addSec({k:'wall',w,len:n*4.8,ice:true}),y0=cur.y,rs=1.9,dep=4.8,cx=cur.cx;
      for(let i=0;i<n;i++){const top=y0+rs*(i+1);blk(cx,Zc(cur.s+i*dep,cur.s+(i+1)*dep),w,dep+0.02,top,top-y0+12,i%2?0xb5e3ff:0xd4efff,{jitter:0.06});
        box(cx,top+0.06,Z0-(cur.s+i*dep+dep*0.5),w-0.6,0.12,dep-0.5,0xf4fbff,{solid:false,jitter:0});
        wp(cx,cur.s+i*dep+dep*0.35,{ledge:true});if(i%2===1)coin(cx+(i%4===1?1.8:-1.8),top,Z0-(cur.s+i*dep+dep*0.5));}
      const top=y0+rs*n+3.5;
      for(const sd of [-1,1])blk(cx+sd*(w/2+3.4),Zc(cur.s,cur.s+n*dep),6.8,n*dep,top,top-y0+14,0xa7d9f5,{jitter:0.07});
      cur.s+=n*dep;cur.y=y0+rs*n;sec.s1=cur.s;sec.y1=cur.y;return sec;
    }
    function bAvalanche(len,dy,w){
      const sec=bSlope(len,dy,w,{k:'avalanche',nocoin:true});sec.snow=true;sec.sp=tier.ballGap*rand(0.9,1.1);
      const y0=sec.y0;for(let i=0;i<3;i++){const t=0.2+i*0.3,x=sec.cx+(i%2?1:-1)*(w/2-1.6);box(x,y0+dy*t+1.2,Z0-(sec.s0+len*t),3.4,2.6,3.2,0x8a8fa0,{jitter:0.14});}
      const nc=Math.floor(len/11);for(let i=0;i<nc;i++){const t=(i+0.5)/nc;coin(sec.cx+Math.sin(i*1.9)*5,y0+dy*t,Z0-(sec.s0+len*t));}
      return sec;
    }
    function bMaze(len,w){
      const sec=addSec({k:'maze',w,len,ice:true}),y=cur.y,cx=cur.cx;
      blk(cx,Zc(cur.s,cur.s+len),w,len,y,16,0xdbeefa,{jitter:0.05});
      const gapW=8.5,walls=[0.22,0.5,0.78];
      walls.forEach((t,i)=>{const s=cur.s+len*t,leftOpen=i%2===0,x0=leftOpen?cx-w/2+gapW:cx-w/2,x1=leftOpen?cx+w/2:cx+w/2-gapW;
        blk((x0+x1)/2,Z0-s,x1-x0,2.4,y+5,5,0xa9dcf7,{jitter:0.08});
        const gx=leftOpen?cx-w/2+gapW/2:cx+w/2-gapW/2;wp(gx,s-4.5);wp(gx,s+4.5);
        coin(gx,y,Z0-s);});
      cur.s+=len;sec.s1=cur.s;sec.y1=y;return sec;
    }
    function bCamp(k){
      const len=34,w=26,sec=addSec({k:'camp',len,w,camp:k}),y=cur.y,cx=cur.cx;
      blk(cx,Zc(cur.s,cur.s+len),w,len,y,16,mix(pathCol(y),0xffffff,0.15),{jitter:0.05});
      const zc=Z0-(cur.s+len/2),c=buildCamp(k,cx,zc,y,{shop:true,alt:comma(peak.base+fracOf(y)*(peak.height-peak.base))+' m'});
      wp(cx,cur.s+2);wp(c.fx-3.0,c.s,{rest:k});wp(cx,cur.s+len-2);
      const items=['crampons','tank','suit'];
      items.forEach((id,i)=>{const px=cx+5+i*3.6,pz=zc+11;box(px,y+0.4,pz,2.0,0.8,2.0,0x5b6480,{jitter:0.05});
        const p=E.pickup({pos:V(px,y+2.3,pz),color:GEAR[id].color,size:0.75,bots:false,onTake(){return buy(id);}});gearPick[id].push(p);
        label(GEAR[id].name,GEAR[id].color,4.4,0,40,px,y+4.7,pz,GEAR[id].price+' coins');});
      cur.s+=len;sec.s1=cur.s;sec.y1=y;return sec;
    }
    function bSummit(slopeDy){
      const sl=bSlope(60,slopeDy,WIDTH+4,{k:'summitslope'});
      const len=30,w=30,sec=addSec({k:'summit',len,w}),y=cur.y,cx=cur.cx;
      blk(cx,Zc(cur.s,cur.s+len),w,len,y,16,0xf4f8ff,{jitter:0.04});
      const fz=Z0-(cur.s+len-9);flagPole(cx,fz,y,14,0xff4d5e,true);
      box(cx,y+15.9,fz,1.3,1.3,1.3,0xffe27a,{glow:true,solid:false});
      for(const sd of [-1,1]){box(cx+sd*7,y+0.9,fz+4,2.2,1.8,2.2,0x8a8fa0,{jitter:0.12});box(cx+sd*7,y+2.4,fz+4,1.4,1.2,1.4,0x9aa0b0,{jitter:0.12});}
      bunting(cx-11,y+8,fz,cx,y+14,fz,12,2.5);bunting(cx,y+14,fz,cx+11,y+8,fz,12,2.5);
      box(cx,y+9.4,fz,0.06,0.06,0.06,0xffffff,{solid:false});
      label('SUMMIT  '+comma(peak.height)+' m',0xffe27a,10,0,60,cx,y+19,fz);
      wp(cx,cur.s+3);wp(cx,cur.s+len-11,{summit:true});
      summit={x:cx,z:fz,y};
      cur.s+=len;sec.s1=cur.s;sec.y1=y;return sec;
    }
    let summit=null;

    function makePlan(){
      const al=tier.allow.split(''),bag=[];
      for(const ch of al){bag.push(ch);if(peak.mods.indexOf(ch)>=0)bag.push(ch);}
      const out=[];let last=['',''];
      const pickObs=()=>{let ch,tries=0;do{ch=pick(bag);tries++;}while((ch===last[0]||ch===last[1])&&tries<12);last=[ch,last[0]];return ch;};
      for(let st=0;st<tier.stages;st++){
        const drop=(st%2===0)?1:-1;
        const seq=[];
        for(let i=0;i<tier.per;i++){seq.push({k:'slope',len:Math.round(rand(72,108)*tier.slopeMul),w:WIDTH});seq.push({k:'landing',len:8});seq.push({k:'obs',ch:pickObs()});seq.push({k:'landing',len:8});}
        seq.push({k:'slope',len:Math.round(rand(60,84)*tier.slopeMul),w:WIDTH});
        seq.push(st<tier.stages-1?{k:'camp',n:st+1}:{k:'summit'});
        seq.forEach(x=>{x.stage=st;x.drop=drop;out.push(x);});
      }
      return out;
    }
    function weightOf(x){
      if(x.k==='slope'||x.k==='summit')return 4*(x.len||60)/90;
      if(x.k==='obs'){return {T:0.4,R:0.5,C:0,W:0,A:4.2,I:0.3}[x.ch]||0;}
      return 0;
    }
    function buildMountain(){
      rise=(peak.height-peak.base)/tier.div;summitY=rise;capY=rise-2.0;Z0=-34;
      const plan=makePlan();
      // fixed rises (ice walls) and weights
      let fixed=0,wsum=0;
      for(const x of plan){
        if(x.k==='obs'){const ch=x.ch;if(ch==='W'){x.n=tier.wall+(Math.random()<0.4?1:0);fixed+=x.n*1.9;}
          else if(ch==='A'){x.len=100;}}
        wsum+=weightOf(x);}
      const R=Math.max(40,rise-fixed),unit=R/wsum;
      secs=[];wps=[];camps.length=1;flames.length=1;
      cur.s=0;cur.y=0;cur.cx=0;cur.stage=0;cur.drop=1;
      cur.stage=0;cur.drop=1;
      // trailhead
      bLanding(16,34,0,{coins:false});
      for(const x of plan){
        cur.stage=x.stage;cur.drop=x.drop;
        const dy=weightOf(x)*unit;
        switch(x.k){
          case 'slope':bSlope(x.len,dy,x.w);break;
          case 'landing':{const sh=(x.len>=8&&Math.random()<0.45)?clamp(cur.cx+rand(-9,9),-12,12):cur.cx;bLanding(x.len,WIDTH,sh);break;}
          case 'camp':bCamp(x.n);break;
          case 'summit':bSummit(dy);break;
          case 'obs':
            switch(x.ch){
              case 'T':bStones(irand(tier.stones[0],tier.stones[1]),tier.gap+rand(0,0.5),dy,tier.zig,tier.zig>0?4.6:5.4);break;
              case 'R':bRidge(Math.round(rand(54,76)),tier.ridgeW,dy);break;
              case 'C':bCrevasse(tier.crev+rand(0,3),2.8);break;
              case 'W':bWall(x.n,8);break;
              case 'A':bAvalanche(100,dy,22);break;
              case 'I':bMaze(46,28);break;
            }break;
        }
      }
      // fix the drop side of each section's neighbours (a landing right after an obstacle keeps the obstacle stage)
      const total=cur.s;
      // flanks, trees, far mountains
      treeBudget=tier.id==='hard'?170:tier.id==='medium'?150:130;
      for(const sec of secs){
        const step=sec.abyss?30:(tier.id==='hard'?21:tier.id==='medium'?18:16),n=Math.max(1,Math.round((sec.s1-sec.s0)/step)),len=(sec.s1-sec.s0)/n;
        for(let i=0;i<n;i++)flank(sec,sec.s0+i*len,sec.s0+(i+1)*len);}
      // end of the world behind the summit
      const zE=Z0-total;
      for(let i=0;i<5;i++)farPeak((i-2)*95+(hash(i)-0.5)*40,zE-170-hash(i+9)*70,summitY-95,88+hash(i)*10,62,i*11+5);
      for(let s=120;s<total;s+=230){
        for(const sd of [-1,1]){
          const sc=secAt(s),by=sc?lerp(sc.y0,sc.y1,clamp((s-sc.s0)/Math.max(1,sc.s1-sc.s0),0,1)):0,x=sd*(215+hash(s*sd)*70),base=by-45,Hm=Math.min(rand(150,300),summitY-6-base);
          if(Hm>28)farPeak(x,Z0-s-hash(s)*60,base,Hm,72,Math.floor(s)+sd*3);}
      }
      
    }
    function secAt(s){for(let i=0;i<secs.length;i++)if(s<=secs[i].s1)return secs[i];return secs[secs.length-1];}
    function baseYat(s){const sc=secAt(s);if(!sc)return 0;return lerp(sc.y0,sc.y1,clamp((s-sc.s0)/Math.max(0.01,sc.s1-sc.s0),0,1));}

    function flank(sec,sa,sb){
      const len=sb-sa,zc=Zc(sa,sb),t=(sa+sb)/2,ym=lerp(sec.y0,sec.y1,clamp((t-sec.s0)/Math.max(0.01,sec.s1-sec.s0),0,1)),idx=Math.floor(sa*0.37);
      const half=sec.w/2,eL=sec.cx-half,eR=sec.cx+half,dd=sec.drop,eDrop=dd>0?eR:eL,eWall=dd>0?eL:eR;
      const side=(edge,dir,d0,d1,top,depth,c,o)=>blk(edge+dir*(d0+d1)/2,zc,d1-d0,len+0.04,top,depth,c,o);
      const jt=0.75+0.5*hash(idx*1.31+sec.stage);
      const ab=sec.abyss||0;
      // mountain side
      if(ab===2){for(const [e,dr] of [[eWall,-dd],[eDrop,dd]]){side(e,dr,0,18,ym-26,60,rockCol(ym-20,3,0.2),{jitter:0.1});side(e,dr,18,110,ym-48,60,rockCol(ym-40,3,0.1),{jitter:0.1});}}
      else{
        const rel=[3.7,11,26,48],ds=[0,7,22,55,110];let prev=ym-0.3;
        for(let i=0;i<4;i++){
          let top=Math.min(ym+rel[i]*jt+(hash(idx*3.7+i)-0.5)*2,capY);if(top<ym-0.3)top=ym-0.3;if(i===0&&top<ym+0.2)top=ym-0.3;
          if(i>0&&top<=prev+0.05)continue;
          side(eWall,-dd,ds[i],ds[i+1],top,top-ym+30,rockCol(top,i,hash(idx+i)),{jitter:0.12});
          if(i<2&&fracOf(top)>0.24&&top>ym+0.5)side(eWall,-dd,ds[i]+0.4,ds[i+1]-0.4,top+0.5,0.5,0xf4f8ff,{jitter:0.03,solid:false});
          if(i===2&&idx%(tier.id==='hard'?4:3)===0&&top<capY-9){const sx=eWall-dd*(ds[2]+ds[3])/2+(hash(idx)-0.5)*10,sh=[6,5,5];let yy=top;
            for(let k=0;k<3;k++){blk(sx,zc,10-k*3.2,10-k*3.2,yy+sh[k],sh[k],mix(rockCol(yy+sh[k],2,0.1),0xf4f7ff,k*0.3+(fracOf(yy)>0.3?0.3:0)),{jitter:0.1});yy+=sh[k];}}
          prev=top;}
        if(ab===1){/* crevasse: valley side is empty air */side(eDrop,dd,0,16,ym-26,60,0xaed8f2,{jitter:0.1});side(eDrop,dd,16,110,ym-48,60,rockCol(ym-40,3,0.1),{jitter:0.1});}
        else{
          const shoulder=sec.k==='landing'||sec.k==='camp'||sec.k==='summit'||sec.k==='slope'||sec.k==='avalanche'||sec.k==='maze'||sec.k==='wall'||sec.k==='summitslope';
          const dt=[[0,3.2,-1.0],[3.2,16,-7*jt],[16,50,-20*jt],[50,110,-42]];
          dt.forEach((d,i)=>{if(i===0&&!shoulder)return;const top=Math.min(ym+d[2],capY-0.5);
            side(eDrop,dd,d[0],d[1],top,60,i===0?rockCol(ym,0,0.3):rockCol(top,i,hash(idx+i*2)),{jitter:0.1});});
          // pine trees low on the mountain
          if(fracOf(ym)<0.4&&treeBudget>0){
            const nT=sec.k==='landing'?1:2;
            for(let k=0;k<nT;k++){const h2=hash(idx*7.1+k*3.3+sec.stage),dx=5+h2*10,x=eDrop+dd*dx,z=zc+(hash(idx*5.3+k)-0.5)*len*0.8,ty=Math.min(ym-7*jt,capY);
              pine(x,z,ty,0.9+hash(idx+k)*1.1,fracOf(ym)>0.22);treeBudget-=4;}
          }
        }
      }
    }

    /* ---------------------------------------------------------------- gear shop */
    function buy(id){
      const g=GEAR[id];if(has[id])return false;
      if(S.coins<g.price){if(E.time-lastNeed>3){lastNeed=E.time;say('Camp shop',g.name+' costs '+g.price+' coins. You have '+S.coins+'. '+g.desc,5);}return false;}
      S.coins-=g.price;has[id]=true;
      if(id==='crampons')P.speed=9.9;if(id==='tank'){S.maxO2=170;S.o2=Math.min(S.maxO2,S.o2+60);}
      E.announce(g.name+'!',2);say('Camp shop','You got the '+g.name+'. '+g.desc,6);
      for(const p of gearPick[id]){p.on=false;p.m.visible=false;}
      E.after(0.05,()=>{for(const p of gearPick[id])if(E.pickups.indexOf(p)>=0)E.removePickup(p);});
    }

    /* ---------------------------------------------------------------- yeti-like monster */
    const SPH=new T.SphereGeometry(1,12,9),CONE=new T.ConeGeometry(1,1,5);
    function makeYeti(mc,white){
      const g=new T.Group(),fur=new T.Color(white?0xeef2fb:mix(0xeef2fb,mc,0.4)),furD=fur.clone().multiplyScalar(0.74),furL=fur.clone().lerp(new T.Color(1,1,1),0.5);
      const mF=new T.MeshLambertMaterial({color:fur}),mD=new T.MeshLambertMaterial({color:furD}),mL=new T.MeshLambertMaterial({color:furL});
      const eyeC=white?0xff6a3c:mix(mc,0xffffff,0.25),mFace=new T.MeshLambertMaterial({color:white?0x9fb0d0:mix(0x6a7390,mc,0.4)}),mEye=new T.MeshBasicMaterial({color:eyeC}),mTusk=new T.MeshLambertMaterial({color:0xf6f1e2}),mDark=new T.MeshBasicMaterial({color:0x1b1424});
      const add=(geo,mat,sx,sy,sz,x,y,z,par)=>{const m=new T.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);(par||g).add(m);return m;};
      const body=add(SPH,mF,1.5,1.8,1.2,0,3.0,0);body.castShadow=true;add(SPH,mL,1.0,1.25,0.7,0,2.85,0.55);add(SPH,mD,1.25,0.9,1.05,0,1.65,0);
      add(SPH,mF,0.8,0.8,0.8,-1.5,4.2,0);add(SPH,mF,0.8,0.8,0.8,1.5,4.2,0);
      const head=new T.Group();head.position.set(0,5.0,0.35);g.add(head);
      const hh=add(SPH,mF,0.95,0.9,0.9,0,0,0,head);hh.castShadow=true;add(SPH,mFace,0.68,0.6,0.42,0,-0.05,0.62,head);add(SPH,mD,0.85,0.2,0.3,0,0.32,0.68,head);
      add(SPH,mEye,0.14,0.14,0.1,-0.3,0.14,0.92,head);add(SPH,mEye,0.14,0.14,0.1,0.3,0.14,0.92,head);
      add(SPH,mDark,0.4,0.17,0.12,0,-0.34,0.92,head);
      for(const sd of [-1,1]){const tk=add(CONE,mTusk,0.09,0.4,0.09,sd*0.2,-0.18,0.96,head);tk.rotation.x=0;}
      for(let i=0;i<6;i++){const a=i/6*6.28,tf=add(CONE,i%2?mD:mL,0.26,0.7,0.26,Math.cos(a)*0.6,0.65,Math.sin(a)*0.5-0.1,head);tf.rotation.set(Math.sin(a)*0.5,0,-Math.cos(a)*0.5);}
      const mkArm=sd=>{const a=new T.Group();a.position.set(sd*1.75,4.25,0);g.add(a);
        add(SPH,mF,0.55,1.05,0.55,0,-0.95,0,a);add(SPH,mD,0.58,1.05,0.58,0,-2.2,0.1,a);add(SPH,mF,0.7,0.65,0.7,0,-3.15,0.15,a);
        for(let i=-1;i<=1;i++)add(CONE,mTusk,0.09,0.42,0.09,i*0.25,-3.65,0.35,a).rotation.x=Math.PI;
        return a;};
      const mkLeg=sd=>{const l=new T.Group();l.position.set(sd*0.8,1.6,0);g.add(l);add(SPH,mF,0.6,1.0,0.65,0,-0.7,0,l);add(SPH,mD,0.7,0.4,1.0,0,-1.4,0.3,l);return l;};
      const armL=mkArm(-1),armR=mkArm(1),legL=mkLeg(-1),legR=mkLeg(1);
      for(let i=0;i<30;i++){const th=rand(0,6.283),ph=rand(0.35,2.6),nx=Math.sin(ph)*Math.cos(th),ny=Math.cos(ph),nz=Math.sin(ph)*Math.sin(th);
        const m=add(CONE,i%3?mF:i%2?mD:mL,0.3,0.85,0.3,nx*1.5*0.95,3.0+ny*1.8*0.95,nz*1.2*0.95);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(nx,ny,nz).normalize());}
      g.userData={armL,armR,legL,legR,head,body};return g;
    }
    function spawnMonster(x,z,y){
      const white=peak.mc===rgb(250,250,255)||peak.monster==='Yeti',g=makeYeti(peak.mc,white),sc=0.82*(tier.id==='hard'?1.12:1);g.scale.setScalar(sc);g.position.set(x,y,z);
      const tag=label(peak.monster,mix(peak.mc,0xffffff,0.2),5,0,46,0,6.6/sc*1.0,0);g.add(tag);tag.scale.multiplyScalar(1/sc);
      E.add(g);
      const m={g,x,z,y,ty:y,spd:tier.mspeed*(0.92+Math.random()*0.16),phase:rand(0,6),cd:1.2,die:0,yaw:0,sc};mons.push(m);
      E.fx.burst(V(x,y+1,z),[0xdfe8ff,peak.mc],14,5,0.5,{up:0.6,gravity:0.2});return m;
    }
    function killMon(m){E.fx.burst(V(m.x,m.y+2,m.z),[0xdfe8ff,peak.mc],18,6,0.5,{up:0.7,gravity:0.2});E.remove(m.g);const i=mons.indexOf(m);if(i>=0)mons.splice(i,1);}
    const FIRE_R=14;
    function nearestFire(x,z){let bd=1e9,bc=null;for(const c of camps){const d=Math.hypot(x-c.fx,z-c.fz);if(d<bd){bd=d;bc=c;}}return {d:bd,c:bc};}
    function stepMonster(m,dt){
      const px=P.pos.x,pz=P.pos.z;let dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
      let sp=m.spd,mx=dx,mz=dz;
      if(d>120){killMon(m);return;}
      if(!P.alive)sp=0;
      for(const c of camps){
        const fx=m.x-c.fx,fz=m.z-c.fz,fd=Math.hypot(fx,fz)||1;
        if(fd<FIRE_R+5){const nx=fx/fd,nz=fz/fd,inward=-(mx*nx+mz*nz);
          if(fd<FIRE_R){mx=nx;mz=nz;sp=m.spd*1.15;}
          else if(inward>0){mx+=nx*inward*1.15;mz+=nz*inward*1.15;}}}
      const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;
      if(d<2.4)sp*=0.2;
      const step=sp*dt;let moved=false;
      const tryAt=(nx,nz)=>{const gy=W.groundY(nx,nz,m.y+3.6);
        if(gy>-1e8&&gy>=m.y-6){m.x=nx;m.z=nz;m.ty=gy;return true;}return false;};
      if(step>0){
        moved=tryAt(m.x+mx*step,m.z+mz*step)||tryAt(m.x+mx*step,m.z)||tryAt(m.x,m.z+mz*step);
        if(!moved){// hop a gap if solid ground is just beyond it
          const gy=W.groundY(m.x+mx*5.2,m.z+mz*5.2,m.y+3.0);
          if(gy>-1e8&&gy>=m.y-3){m.x+=mx*step;m.z+=mz*step;m.ty=Math.max(m.ty,gy);moved=true;}}}
      m.y+=(m.ty-m.y)*Math.min(1,12*dt);
      m.phase+=dt*(moved?sp*0.9:0.8);
      const u=m.g.userData,sw=Math.sin(m.phase*1.25),k=moved?1:0.25;
      u.legL.rotation.x=sw*0.7*k;u.legR.rotation.x=-sw*0.7*k;u.armL.rotation.x=-sw*0.6*k-0.12;u.armR.rotation.x=sw*0.6*k-0.12;
      u.head.rotation.z=Math.sin(m.phase*0.6)*0.08;u.body.position.y=3.0+Math.abs(sw)*0.08*k;
      m.yaw=angLerp(m.yaw,Math.atan2(mx||dx,mz||dz),Math.min(1,6*dt));
      m.g.position.set(m.x,m.y+(moved?Math.abs(sw)*0.12:0),m.z);m.g.rotation.y=m.yaw;
      // attack
      m.cd-=dt;
      if(P.alive&&d<3.3&&Math.abs(P.pos.y-m.y)<3&&m.cd<=0){
        m.cd=1.25;u.armR.rotation.x=-1.9;u.armL.rotation.x=-1.6;
        if(E.damage(P,tier.mdmg,null)){P.vel.x+=dx*11;P.vel.z+=dz*11;P.vel.y=Math.max(P.vel.y,6);E.shake(0.4);S.lastHurt=E.time;}}
    }
    let spawnT=2;
    function monsterUpdate(dt,isNight){
      const quota=Math.min(peak.monsters,tier.mcap);
      if(isNight){
        spawnT-=dt;
        if(spawnT<=0&&mons.length<quota&&P.alive){spawnT=1.6;
          const nf=nearestFire(P.pos.x,P.pos.z);
          if(nf.d>FIRE_R+10){
            for(let tries=0;tries<14;tries++){const a=rand(0,6.283),r=rand(34,52),x=P.pos.x+Math.cos(a)*r,z=P.pos.z+Math.sin(a)*r,gy=W.groundY(x,z,P.pos.y+14);
              if(gy>-1e8&&Math.abs(gy-P.pos.y)<10&&nearestFire(x,z).d>FIRE_R+3){spawnMonster(x,z,gy);if(mons.length===1&&nightMsg!==nightNo){nightMsg=nightNo;say(peak.monster,'A '+peak.monster+' is hunting in the dark. Stay near campfires. It will not come close to the fire.',7);E.sfx('alarm');}break;}}}}
      }
      for(let i=mons.length-1;i>=0;i--){const m=mons[i];
        if(!isNight){m.die+=dt;m.g.scale.setScalar(m.sc*Math.max(0.01,1-m.die/1.2));if(m.die>1.2){killMon(m);continue;}}
        stepMonster(m,dt);}
    }
    let nightMsg=-1;

    /* ---------------------------------------------------------------- avalanche snowballs */
    const ballGeo=new T.SphereGeometry(1,12,10),ballMat=new T.MeshLambertMaterial({color:0xf6f9ff});
    function spawnBall(sec){
      const x=Math.random()<0.55?clamp(P.pos.x+rand(-3,3),sec.cx-sec.w/2+2,sec.cx+sec.w/2-2):sec.cx+rand(-sec.w/2+2,sec.w/2-2),r=rand(1.2,1.7),s=sec.s1-3,z=Z0-s;
      const gy=W.groundY(x,z,sec.y1+6);if(gy<-1e8)return;
      const m=new T.Mesh(ballGeo,ballMat);m.scale.setScalar(r);m.castShadow=true;E.add(m);
      balls.push({m,x,z,y:gy+r,r,sec,spd:tier.ballSpd*rand(0.9,1.15)});
      E.shake(0.12);E.fx.burst(V(x,gy+1,z),0xf6f9ff,6,5,0.4,{up:0.5,gravity:0.3});
    }
    function ballsUpdate(dt,sec){
      if(sec&&sec.snow&&P.alive){
        const ps=Z0-P.pos.z;
        if(ps>sec.s0+6&&ps<sec.s1-12){sec.t=(sec.t==null?1.2:sec.t)-dt;if(sec.t<=0){sec.t=sec.sp*rand(0.8,1.2);spawnBall(sec);if(!sec.warned){sec.warned=true;E.announce('Avalanche! Dodge the rolling snow.',2.6);E.sfx('alarm');}}}}
      for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.z+=b.spd*dt;
        const gy=W.groundY(b.x,b.z,b.y+4);if(gy>-1e8)b.y+=(gy+b.r-b.y)*Math.min(1,14*dt);
        b.m.position.set(b.x,b.y,b.z);b.m.rotation.x+=b.spd*dt/b.r;
        if(P.alive&&Math.abs(P.pos.y-(b.y-b.r))<b.r+1.6&&Math.hypot(P.pos.x-b.x,P.pos.z-b.z)<b.r+0.75){
          if(E.damage(P,tier.ballDmg,null)){P.vel.x+=(P.pos.x>=b.x?1:-1)*9;P.vel.y=Math.max(P.vel.y,7);E.shake(0.45);S.lastHurt=E.time;E.fx.burst(V(b.x,b.y,b.z),0xf6f9ff,14,8,0.45);}
          E.remove(b.m);balls.splice(i,1);continue;}
        if(b.z>Z0-b.sec.s0+6){E.fx.burst(V(b.x,b.y,b.z),0xf6f9ff,8,6,0.4,{up:0.5});E.remove(b.m);balls.splice(i,1);}}
    }

    /* ---------------------------------------------------------------- the climb: start, camps, falls */
    function startClimb(g){
      mode='climb';tierIdx=g.tier;tier=TIERS[tierIdx];peak=g.peak;
      for(const b of baseBoxes.filter(b=>false))W.removeBox(b);
      // remove the preview mountains (the real ones are built along the route)
      for(const b of farBoxes)W.removeBox(b);farBoxes.length=0;
      gates.forEach((q,i)=>{if(i!==tierIdx){E.remove(q.portal);}else{q.portal.material.opacity=0.12;}});
      cyc=tier.dayLen+tier.nightLen;fd=tier.dayLen/cyc;buildKeys();
      buildMountain();
      // re-skin existing base guide to the peak guide
      tStart=E.time;clock=0;blizzT=rand(tier.blizz[0],tier.blizz[1])*0.8;
      factQ=peak.facts.slice().concat(shuffle(TIPS.slice()));factI=0;
      S.camp=0;S.reached=0;
      E.announce(peak.name+' - '+tier.label,3);
      say(peak.guide,peak.hello+' Welcome to '+peak.name+' in '+peak.country+'. '+nextFact(),10);
      E.sfx('win');
    }
    function nextFact(){const t=factQ[factI%factQ.length];factI++;return t;}
    function reachCamp(c){
      if(c.k>S.reached){S.reached=c.k;
        E.announce(c.name+' reached!',2.2);E.sfx('pickup');
        const gname=c.guide?c.guide.name:peak.guide;
        say(gname,peak.hello+' '+nextFact(),11);}
      S.camp=c.k;
    }
    function toCamp(msg,hpCost){
      const c=camps[Math.min(S.camp,camps.length-1)];
      P.teleport(c.cx+0.5,c.y+0.2,c.zc+9);P.vel.set(0,0,0);P.invuln=2.5;P.yaw=Math.PI;
      if(P.alive)P.hp=Math.max(8,P.hp-(hpCost||0));
      E.cam.yaw=0;recenterSnow();A.reset=true;
      if(msg)E.announce(msg,2.2);
    }
    function lose(title,text){if(done)return;done=true;E.finish({win:false,title,lines:Array.isArray(text)?text:[text]});}
    function win(){
      if(done)return;done=true;
      const par=tier.id==='easy'?6:tier.id==='medium'?9:13;
      let stars=1;if(S.deaths===0&&S.falls<=4)stars=2;if(S.deaths===0&&S.falls<=1&&nightNo<=par)stars=3;
      E.announce('Summit! '+comma(peak.height)+' m',3);
      E.after(2.2,()=>E.finish({win:true,stars,title:'You reached the top of '+peak.name+'!',
        lines:[peak.name+' is '+comma(peak.height)+' m tall. You climbed it in '+nightNo+' night'+(nightNo===1?'':'s')+' with '+S.falls+' fall'+(S.falls===1?'':'s')+'.',
          'You collected '+S.coins+' coins. '+(stars>=3?'A perfect climb!':'Fewer nights and falls earns more stars.')]}));
    }

    /* ---------------------------------------------------------------- main update */
    let uiRows='',statusT=0,yawPrev=0,yawIdle=0,fireT=0,fellT=0,hurtAcc=0,blizzMsg=false,duskMsg=-1,hpRegenT=0;
    function update(dt){
      if(done)return;
      const t=E.time;
      // flames and light
      let lc=null,ld=1e9;
      for(const c of camps){const d=Math.hypot(P.pos.x-c.fx,P.pos.z-c.fz);if(d<ld){ld=d;lc=c;}}
      if(lc&&ld<80){fireLight.position.set(lc.fx,lc.y+2.4,lc.fz);for(const fl of lc.flames){const k=0.75+0.5*Math.sin(t*9+fl.ph)*Math.sin(t*5.3+fl.ph*2)+0.15*Math.sin(t*17+fl.ph);const h=fl.h*clamp(k,0.5,1.3);W.resizeBox(fl.b,fl.w,h,fl.w);W.moveBox(fl.b,fl.x+Math.sin(t*4+fl.ph)*0.12,fl.y0+h/2,fl.z);}
        fireT-=dt;if(fireT<=0){fireT=0.3;E.fx.burst(V(lc.fx,lc.y+1.6,lc.fz),[0xffb02e,0xff7a1a,0xffd966],2,2.2,0.2,{up:1.3,gravity:0.1,life:1.3});}}
      fireLight.intensity=(0.9+1.9*nightW)*(0.92+0.08*Math.sin(t*13))*(ld<80?1:0);
      for(const gd of guides){if(!gd.alive)continue;const dx=P.pos.x-gd.pos.x,dz=P.pos.z-gd.pos.z;if(dx*dx+dz*dz<900)gd.yaw=angLerp(gd.yaw,Math.atan2(dx,dz),Math.min(1,4*dt));}
      for(const wf of windFlags){wf.rotation.y=angLerp(wf.rotation.y,(gust.dir>0?0:Math.PI)+(gust.s>0.05?0:Math.PI*0.0),0.1);const k=Math.sin(t*7+wf.position.z)*0.15;wf.children[1].rotation.y=k+(gust.s>0.05?k*2:0);wf.children[1].scale.x=0.6+0.4*(gust.s+0.4);}
      mist.position.set(P.pos.x,P.pos.y-36,P.pos.z);
      updateSnow(dt);
      if(!P.alive&&mode==='base')return;
      // camera: ease back behind the climb when not dragging
      if(E.cam.yaw!==yawPrev){yawIdle=0;}else yawIdle+=dt;
      if(yawIdle>2.4&&mode==='climb'){const d=((0-E.cam.yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;E.cam.yaw+=d*Math.min(1,0.9*dt);}
      yawPrev=E.cam.yaw;
      if(mode==='base'){baseUpdate(dt);return;}
      climbUpdate(dt);
    }
    function baseUpdate(dt){
      const t=E.time;
      if(!keys.length){fd=0.62;cyc=64;buildKeys();}
      applySky(0.05,dt);
      gates.forEach((g,i)=>{g.portal.material.opacity=0.28+0.12*Math.sin(t*2.4+i);});
      for(const g of gates){if(Math.abs(P.pos.x-g.x)<4.4&&Math.abs(P.pos.z-g.z)<2.4&&P.pos.y<4){startClimb(g);return;}}
      if(P.pos.y<-9){P.teleport(3,0.2,24);P.invuln=1;}
      statusUpdate(dt,'Choose a mountain: green is easy, gold is medium, red is hard');
    }
    function statusUpdate(dt,text){
      statusT-=dt;
      if(statusT<=0){statusT=0.25;E.status(text);}
    }
    function climbUpdate(dt){
      const t=E.time,tt=t-tStart;
      clock+=dt;const ph=((clock/cyc)+0.03)%1;
      const wasN=nightW;
      // blizzards
      blizzT-=dt;
      if(blizzT<=0&&!blizzOn&&nightW<0.5){blizzOn=tier.blizzDur;blizzT=rand(tier.blizz[0],tier.blizz[1]);E.announce('A blizzard is rolling in! Find shelter by a fire.',2.6);E.sfx('alarm');}
      if(blizzOn>0){blizzOn-=dt;blizzard=Math.min(1,blizzard+dt*0.5);}else blizzard=Math.max(0,blizzard-dt*0.4);
      applySky(ph,dt);
      const isNight=nightW>0.5;
      if(isNight&&!wasNight){wasNight=true;S.nights++;nightNo=S.nights;E.announce('Night '+nightNo+' of 99',2.4);E.sfx('alarm');}
      if(!isNight&&wasNight&&nightW<0.2){wasNight=false;E.announce('Morning! Night '+nightNo+' is over.',2.2);}
      if(!isNight&&ph>fd-0.12&&duskMsg!==nightNo){duskMsg=nightNo;say('Sunset','The sun is going down. Get to a camp and warm up by the fire before dark.',6);}
      // where am I
      const ps=Z0-P.pos.z,sec=secAt(ps);
      inRidge=!!(sec&&sec.ridge&&ps>sec.s0-2&&ps<sec.s1+2);
      // camps and fires
      onFire=false;let atCamp=null;
      for(const c of camps){const d=Math.hypot(P.pos.x-c.fx,P.pos.z-c.fz),dc=Math.hypot(P.pos.x-c.cx,P.pos.z-c.zc);
        if(dc<15&&Math.abs(P.pos.y-c.y)<4){atCamp=c;if(c.k>0||true)reachCamp(c);}
        if(d<5.4&&Math.abs(P.pos.y-c.y)<3.5)onFire=true;}
      // gusts on knife ridges
      if(inRidge){
        gust.t-=dt;
        if(gust.dur<=0&&gust.t<=0){gust.dur=gust.tot=rand(1.3,1.9);gust.dir=Math.random()<0.5?-1:1;gust.t=rand(2.0,3.6);if(!has.crampons)say('Wind','A gust of wind! Lean into it and stay on the ridge. Crampons grip the snow.',3.5);}
        if(gust.dur>0){gust.dur-=dt;gust.s=Math.sin(Math.PI*clamp(1-gust.dur/gust.tot,0,1));
          if(!has.crampons&&P.alive){P.vel.x+=gust.dir*tier.gust*gust.s*dt*(P.onGround?1:0.5);}}
        else gust.s=0;
      }else{gust.s=Math.max(0,gust.s-dt*3);gust.dur=0;}
      // survival
      if(P.alive){
        const f=fracOf(P.pos.y),lastC=camps[Math.min(S.camp,camps.length-1)],h=Math.max(0,P.pos.y-lastC.y),stageRise=rise/tier.stages;
        if(onFire){S.o2=Math.min(S.maxO2,S.o2+32*dt);S.warm=Math.min(100,S.warm+32*dt);if(P.hp<P.maxHp)E.heal(P,9*dt);}
        else{
          const o2d=tier.o2*peak.o2*(0.3+h/(stageRise*0.75));S.o2=Math.max(0,S.o2-o2d*dt);
          let wd=(nightW*1.2+blizzard*1.5)*peak.cold*tier.cold*(S.reached<1?0.6:1);
          let wg=(1-nightW)*(1-blizzard)*Math.max(0,1.0-0.55*peak.cold);
          let dW=wg-wd;if(has.suit&&dW<0)dW*=0.5;S.warm=clamp(S.warm+dW*dt,0,100);
        }
        hurtAcc+=dt;
        if(hurtAcc>=0.5){hurtAcc=0;let dm=0;if(S.o2<=0)dm+=2.4;if(S.warm<=0)dm+=1.8;
          if(dm>0){E.damage(P,dm,null,{quiet:true});S.lastHurt=t;if(S.o2<=0&&t-lastNeed>5){lastNeed=t;E.announce('Out of oxygen! Get to a campfire.',2);}else if(S.warm<=0&&t-lastNeed>5){lastNeed=t;E.announce('You are freezing! Get to a campfire.',2);}}}
        hpRegenT-=dt;if(hpRegenT<=0){hpRegenT=0.5;if(P.alive&&P.hp<P.maxHp&&S.o2>30&&S.warm>30&&t-S.lastHurt>4)E.heal(P,1.2);}
      }
      // falls
      fellT-=dt;
      if(fellT<=0&&P.alive){fellT=0.1;const by=baseYat(ps);
        if(P.pos.y<by-4.6){S.falls++;toCamp('You slipped! Back to '+camps[Math.min(S.camp,camps.length-1)].name+'.',12);E.sfx('out');E.shake(0.3);}}
      // monsters and snowballs
      monsterUpdate(dt,isNight);
      ballsUpdate(dt,sec);
      // summit
      if(summit&&P.alive&&Math.hypot(P.pos.x-summit.x,P.pos.z-summit.z)<4.2&&Math.abs(P.pos.y-summit.y)<4){win();return;}
      // time up
      if(tt>tier.limit&&!done){lose('Out of time','The weather closed in before you reached the top of '+peak.name+'. Try again.');return;}
      if(S.nights>=99&&!done){lose('99 nights are over','You ran out of nights on '+peak.name+'.');return;}
      // hud
      hudBars(dt);
      const nextC=camps.find(c=>c.k>S.camp);
      const timeLeft=Math.max(0,tier.limit-tt);
      statusUpdate(dt,peak.name+' - '+tier.label+'   |   '+(isNight?'NIGHT. Stay near fires':blizzard>0.4?'BLIZZARD':'Day')+'   |   Time left '+E.fmt(timeLeft));
      const alt=peak.base+fracOf(P.pos.y)*(peak.height-peak.base),
        rows=[{label:'Night',value:(isNight?nightNo:nightNo+1)+' of 99',color:isNight?0x7d8cff:0xffc93c,me:true},{label:'Altitude',value:comma(alt)+' m',color:0x22c9c2},{label:'Coins',value:S.coins,color:0xffcf3a},
          {label:nextC?'Next camp':'Summit',value:nextC?Math.max(0,Math.round((nextC.s-ps)))+' m':Math.max(0,Math.round((secs[secs.length-1].s1-ps)))+' m',color:0xff8a3c}];
      const key=JSON.stringify(rows);if(key!==uiRows){uiRows=key;E.score(rows);}
    }
    let hpHud=null;

    /* ---------------------------------------------------------------- autopilot */
    const A={wi:0,stuckT:0,lx:0,lz:0,rest:0,restTime:0,jumpCd:0,side:0,sideT:0,pickup:null};
    function gAt(x,z,y,dx,dz){let b=-Infinity;for(const o of [0,0.45]){const g=W.groundY(x+dx*o,z+dz*o,y);if(g>b)b=g;}return b;}
    function drive(tx,tz,dt,mul,lateral){
      let dx=tx-P.pos.x,dz=tz-P.pos.z;const d=Math.hypot(dx,dz);
      if(d>0.12){dx/=d;dz/=d;}else{dx=dz=0;}
      let vx=dx,vz=dz;if(lateral){vx+=lateral;}
      const a=P.onGround?16:6,k=Math.min(1,a*dt),sp=P.speed*(mul||1)*(!P.onGround&&A.air?A.air:1);
      const vl=Math.hypot(vx,vz)||1,nx=(dx||dz)||lateral?vx/Math.max(1,vl):0,nz=(dx||dz)||lateral?vz/Math.max(1,vl):0;
      P.vel.x+=(nx*sp-P.vel.x)*k;P.vel.z+=(nz*sp-P.vel.z)*k;
      if(dx||dz||lateral)P.yaw=angLerp(P.yaw,Math.atan2(vx,vz),Math.min(1,12*dt));
      A.jumpCd-=dt;
      if(P.onGround&&A.jumpCd<=0&&(dx||dz)){
        const ax=P.pos.x+dx*0.62,az=P.pos.z+dz*0.62,g0=gAt(ax,az,P.pos.y+3.2,dx,dz);let jump=false;
        if(g0===-Infinity){for(const dd of [3,4.5,6]){const g=gAt(P.pos.x+dx*dd,P.pos.z+dz*dd,P.pos.y+2.6,dx,dz);if(g>-1e8&&g>=P.pos.y-3.2){jump=true;break;}}}
        else if(g0-P.pos.y>1.0&&g0-P.pos.y<3.0)jump=true;
        if(jump){P.vel.y=P.jumpV;P.onGround=false;A.jumpCd=0.35;}
      }
    }
    function autopilot(dt){
      if(!P.alive||done)return;
      if(mode==='base'){
        const pk=(window.VG_MN_PICK!=null?window.VG_MN_PICK:0),g=gates[clamp(pk,0,2)];
        if(P.pos.z>-12&&Math.abs(P.pos.x)>1.8&&P.pos.z<20)drive(0,P.pos.z>8?10:-13,dt,1);
        else if(P.pos.z>20)drive(0,14,dt,1);
        else if(P.pos.z>-12)drive(0,-13,dt,1);
        else drive(g.x,g.z-3,dt,1);return;}
      const ps=Z0-P.pos.z,t=E.time;
      // wake up pointer after a respawn or fall
      if(A.reset){A.reset=false;A.rest=0;A.pickup=null;A.wi=0;while(A.wi<wps.length&&wps[A.wi].s<ps-1)A.wi++;}
      while(A.wi<wps.length&&(wps[A.wi].s<ps-1.5&&!wps[A.wi].rest||Math.hypot(wps[A.wi].x-P.pos.x,wps[A.wi].z-P.pos.z)<(wps[A.wi].stone?1.2:2.3)&&!wps[A.wi].rest))A.wi++;
      const w=wps[A.wi];
      if(!w){drive(summit.x,summit.z,dt,1);return;}
      // resting at a fire
      if(w.rest){
        const c=camps.find(q=>q.k===w.rest),needs=()=>S.o2<62||S.warm<62||P.hp<75||(nightW>0.5&&tierIdx>0&&S.warm<92);
        if(A.rest===0&&needs()){A.rest=w.rest;A.restTime=0;}
        if(A.rest===w.rest){A.restTime+=dt;
          drive(c.fx-2.6,c.fz,dt,0.8);
          const ok=S.o2>=S.maxO2-4&&S.warm>=94&&P.hp>=P.maxHp-6&&!(nightW>0.5&&tierIdx>0&&mons.length>0);
          if(ok||A.restTime>60){A.rest=0;A.wi++;}
          return;}
        else{A.wi++;return;}
      }
      // shopping at camps
      if(!A.pickup){
        for(const c of camps){if(c.shop&&Math.hypot(P.pos.x-c.cx,P.pos.z-c.zc)<12){
          for(const id of ['crampons','tank','suit']){if(!has[id]&&S.coins>=GEAR[id].price){const p=gearPick[id].find(q=>q.on&&E.pickups.indexOf(q)>=0&&Math.abs(q.m.position.z-c.zc-11)<2&&Math.abs(q.m.position.x-c.cx)<20);if(p){A.pickup=p;break;}}}}}
      }
      if(A.pickup){const p=A.pickup;if(!p.on||E.pickups.indexOf(p)<0||Math.hypot(P.pos.x-p.m.position.x,P.pos.z-p.m.position.z)>40){A.pickup=null;}
        else{drive(p.m.position.x,p.m.position.z,dt,1);return;}}
      // lane steering and dodging
      let lateral=0;
      if(w.ridge||w.bridge){lateral=clamp((w.x-P.pos.x)*0.55,-1.4,1.4);if(Math.abs(w.x-P.pos.x)<0.15)lateral=0;}
      for(const b of balls){const dz=b.z-P.pos.z;if(dz>-3&&dz<18&&Math.abs(b.x-P.pos.x)<b.r+3.2){lateral+=(P.pos.x>=b.x?1:-1)*2.2;}}
      // stuck handling
      A.stuckT+=dt;
      if(A.stuckT>1.2){const mv=Math.hypot(P.pos.x-A.lx,P.pos.z-A.lz);if(mv<1.0&&!A.rest){A.side=(Math.random()<0.5?-1:1);A.sideT=0.9;P.vel.y=P.onGround?P.jumpV:P.vel.y;}A.lx=P.pos.x;A.lz=P.pos.z;A.stuckT=0;}
      if(A.sideT>0){A.sideT-=dt;lateral+=A.side*1.5;}
      A.air=w.stone?(tier.gap>3.4?0.85:0.5):0;drive(w.x,w.z,dt,w.ridge?0.95:1,lateral);
    }

    /* ---------------------------------------------------------------- death */
    function onDeath(c,by){
      if(c!==P||done)return;
      S.deaths++;
      if(S.deaths>tier.rescues){E.after(1.5,()=>lose('The mountain won today','Your guides pulled you back '+S.deaths+' times. Rest up and try '+peak.name+' again.'));return;}
      E.after(2.3,()=>{if(done||E.over)return;const c0=camps[Math.min(S.camp,camps.length-1)];
        E.respawn(P,c0.cx+0.5,c0.y+0.2,c0.zc+9,3);S.o2=Math.max(S.o2,S.maxO2*0.6);S.warm=Math.max(S.warm,60);E.cam.yaw=0;recenterSnow();A.reset=true;
        for(const m of mons)killMon(m);mons.length=0;
        E.announce('The guide helped you back to '+c0.name+'.',2.6);say(c0.guide?c0.guide.name:peak.guide,'Rest by the fire. '+nextFact(),8);});
    }

    /* ---------------------------------------------------------------- go */
    buildBase();
    P.teleport(3,0.2,24);P.yaw=Math.PI;
    for(const gd of guides)gd.yaw=0;
    keys=[];fd=0.62;cyc=64;buildKeys();applySky(0.05,0);
    say('Camp Guide Rosa','Welcome to base camp. Walk through a glowing gate to pick a mountain. Green is easy, gold is medium and red is hard.',12);
    E.announce('Pick your mountain',3);

    return {
      update,autopilot,onDeath,
      canDamage(target,by){return target===P;},
      dispose(){done=true;if(hud.parentNode)hud.parentNode.removeChild(hud);}
    };
  }
});
})();
