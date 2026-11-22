/* Hull Breach: team spaceship battle around a space station. Smash the enemy power cores. */
VG.register({
  id:'hull-breach',name:'Hull Breach',tagline:'Smash the enemy power cores. Last crew flying wins.',color:0xa56bff,levels:1,
  howTo:[
    'Each crew has a spaceship with glowing power cores. Cores are where your crew comes back after being knocked out.',
    'Cross the bridge to an enemy ship and smash its cores with Boom Rockets and Tick Bombs. Keep your own cores safe!',
    'Use the Zap Blade up close, the Popper and Bouncer from far away. Space is floaty, so jumps go a long way.',
    'When a crew has no cores left it cannot come back. The last crew flying wins, or the crew with the most cores when time runs out.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle}=VG.util,W=E.world,L=E.level;
    const mix=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t).getHex();
    const TEAMS=[{name:'Red',color:0xff4d5e},{name:'Blue',color:0x3d8bff},{name:'Green',color:0x35d07f},{name:'Yellow',color:0xffc93c}];
    const ACTIVE=L<=2?[1,0]:L===3?[1,0,2]:[1,0,2,3];
    const SLOT={1:[-62,0,1,0],0:[62,0,-1,0],2:[0,-62,0,1],3:[0,62,0,-1]};
    const TOOLS=['blade','popper','bouncer','rocket','bomb','wall'];
    const SIZE=L===2?4:3, INTRO=3, LIMIT=L===5?300:360;
    W.gravity=-20;W.killY=-40;
    E.setSky(0x03051a,0x1f1347,0x140c35,260,900);E.setLight(0.8,0.72,0xe2e8ff);E.stars(700);
    E.cam.dist=14;E.cam.pitch=0.36;

    /* ------------------------------------------------------------ decor */
    const planet=new THREE.Mesh(new THREE.SphereGeometry(75,32,20),new THREE.MeshLambertMaterial({color:0x7a52e0}));planet.position.set(-240,70,-340);E.add(planet);
    const ring=new THREE.Mesh(new THREE.RingGeometry(98,135,56),new THREE.MeshBasicMaterial({color:0xffc7f0,transparent:true,opacity:0.45,side:THREE.DoubleSide}));ring.position.copy(planet.position);ring.rotation.x=-1.25;ring.rotation.z=0.3;E.add(ring);
    const moon=new THREE.Mesh(new THREE.SphereGeometry(22,20,14),new THREE.MeshLambertMaterial({color:0x9fd6ff}));moon.position.set(300,120,260);E.add(moon);
    for(let i=0;i<22;i++){const a=rand(0,6.283),r=rand(115,190),s=rand(6,18);W.addBox(Math.cos(a)*r,rand(-35,25),Math.sin(a)*r,s,s*rand(0.5,1),s*rand(0.7,1.2),pick([0x6b6580,0x7d7390,0x5a5a78,0x8a7c9c]),{jitter:0.2});}

    /* ------------------------------------------------------------ station */
    const CY=0x6ae9ff;
    W.addBox(0,-1,0,30,2,30,0x4a5280,{jitter:0});
    W.addBox(0,-4,0,24,4,24,0x2e3556,{jitter:0});W.addBox(0,-8,0,14,4,14,0x252b48,{jitter:0});W.addBox(0,-12,0,6,4,6,0x1d223a,{jitter:0});
    for(const sg of [-1,1]){
      W.addBox(0,0.06,sg*13.6,27.2,0.12,0.5,CY,{glow:true,solid:false,jitter:0});W.addBox(sg*13.6,0.06,0,0.5,0.12,27.2,CY,{glow:true,solid:false,jitter:0});
      W.addBox(0,0.08,sg*4.6,9.2,0.12,0.4,0xa56bff,{glow:true,solid:false,jitter:0});W.addBox(sg*4.6,0.08,0,0.4,0.12,9.2,0xa56bff,{glow:true,solid:false,jitter:0});
      for(const sh of [-1,1]){W.addBox(sg*13,3,sh*13,2,6,2,0x353c63,{jitter:0});W.addBox(sg*13,6.35,sh*13,2.4,0.7,2.4,CY,{glow:true,jitter:0});}
    }
    W.addBox(0,0.1,0,3,0.14,3,0xffffff,{glow:true,solid:false,jitter:0});
    for(const t of ACTIVE){const S=SLOT[t],col=TEAMS[t].color;const dx=-S[2],dz=-S[3];/* from the ship side toward the centre */
      const cx=-S[2]*10,cz=-S[3]*10;/* strip centre on the station, 5..15 from the middle */
      W.addBox(S[2]*-10,0.1,S[3]*-10,S[2]?10:1.4,0.14,S[2]?1.4:10,col,{glow:true,solid:false,jitter:0});}
    /* breakable cover blocks */
    [[-7,-8,5,2,2],[7,8,5,2,2],[8,-7,2,2,5],[-8,7,2,2,5],[-11,-11,3,3,3],[11,11,3,3,3],[11,-11,3,2,3],[-11,11,3,2,3]].forEach((b,i)=>{
      W.addBox(b[0],b[3]/2,b[1],b[2],b[3],b[4],i%2?0x8c93a8:0x9a74e8,{breakable:true});});

    /* ------------------------------------------------------------ ships */
    const ships={},coreBeams=new Map();
    /* one ship. (originX,originZ) is the ship centre, (dirX,dirZ) the way the nose points. local coords: a = along (nose positive), s = across, y = up. */
    function buildShip(originX,originZ,dirX,dirZ,team,kinds){
      const col=TEAMS[team].color,dark=mix(col,0x000000,0.45),light=mix(col,0xffffff,0.5);
      const px=-dirZ,pz=dirX;
      const wx=(a,s)=>originX+dirX*a+px*s,wz=(a,s)=>originZ+dirZ*a+pz*s;
      const S={team,ox:originX,oz:originZ,dx:dirX,dz:dirZ,cores:[],P:(a,s,y)=>V(wx(a,s),y||0,wz(a,s))};
      const bx=(a,s,y,la,ls,h,color,o)=>W.addBox(wx(a,s),y,wz(a,s),dirX?la:ls,h,dirX?ls:la,color,o||{});
      const FA=0xb0b8d2,FB=0x9ea7c4,FT=mix(0xb0b8d2,col,0.32),FT2=mix(0x9ea7c4,col,0.32);
      /* lower deck floor, nose floor */
      for(let i=0;i<9;i++)for(let j=0;j<4;j++){const mid=j===1||j===2,c=((i+j)%2)?(mid?FT:FA):(mid?FT2:FB);bx(-16+4*i,-6+4*j,-0.5,4,4,1,c,{breakable:true});}
      for(let j=0;j<3;j++)bx(20,-4+4*j,-0.5,4,4,1,((j)%2)?FT:FT2,{breakable:true});
      for(let j=0;j<2;j++)bx(24,-2+4*j,-0.5,4,4,1,((j)%2)?FT2:FT,{breakable:true});
      /* keel under the floor */
      bx(0,0,-2.5,28,10,3,dark,{jitter:0});bx(0,0,-5.5,18,6,3,mix(dark,0x000000,0.3),{jitter:0});bx(22,0,-2,8,8,2,dark,{jitter:0});
      /* side hull walls, 2 bricks high, with glowing windows */
      for(const sd of [-1,1])for(let i=0;i<18;i++)for(let r=0;r<2;r++){
        const a=-17+2*i,y=1+2*r;
        if(r===1&&i>=2&&i<=15&&i%3===1){bx(a,sd*7.5,y,1.8,0.25,1.4,0xa6ecff,{glow:true,solid:false,jitter:0});continue;}
        bx(a,sd*7.5,y,2,1,2,col,{breakable:true});}
      /* tapered nose walls and shoulders */
      for(const sd of [-1,1])for(let r=0;r<2;r++){
        const y=1+2*r;
        for(let i=0;i<2;i++){bx(19+2*i,sd*6.5,y,2,1,2,col,{breakable:true});bx(23+2*i,sd*4.5,y,2,1,2,col,{breakable:true});}
        bx(18.5,sd*7,y,1,2,2,dark,{breakable:true});bx(22.5,sd*5.5,y,1,3,2,dark,{breakable:true});}
      /* tail wall */
      for(let r=0;r<2;r++)for(let j=0;j<8;j++)bx(-17.5,-7+2*j,1+2*r,1,2,2,col,{breakable:true});
      /* glowing trim along the hull */
      for(const sd of [-1,1]){bx(0,sd*7.5,4.12,36,0.5,0.25,light,{glow:true,solid:false,jitter:0});bx(-9,sd*7.5,7.12,16,0.5,0.25,light,{glow:true,solid:false,jitter:0});}
      /* upper deck over the back half; stairs hole at s 4..8, a -10..-2 */
      for(let i=0;i<4;i++)for(let j=0;j<4;j++){if(i>=2&&j===3)continue;bx(-16+4*i,-6+4*j,4.5,4,4,1,((i+j)%2)?0x8f99b9:0x9ca5c4,{breakable:true});}
      for(const sd of [-1,1])for(let i=0;i<8;i++){const a=-17+2*i;if(i%3===1){bx(a,sd*7.5,6,1.8,0.25,1.4,0xa6ecff,{glow:true,solid:false,jitter:0});continue;}bx(a,sd*7.5,6,2,1,2,light,{breakable:true});}
      for(let j=0;j<8;j++)bx(-17.5,-7+2*j,6,1,2,2,light,{breakable:true});
      for(let j=0;j<6;j++)bx(-2.5,-7+2*j,6,1,2,2,light,{breakable:true});
      /* stairs up to the upper deck, 1 high steps */
      for(let i=0;i<5;i++)bx(-2-(i+0.5)*1.6,6,(i+1)/2,1.6,4,i+1,i%2?0xcdd2e6:0xb8bfd8,{breakable:true});
      /* fin and mast */
      bx(-15,0,8,6,1,2,col,{breakable:true});bx(-16,0,10,4,1,2,col,{breakable:true});bx(-17,0,12,2,1,2,light,{breakable:true});bx(-17,0,13.6,1.2,1.2,1.2,0xffffff,{glow:true,solid:false,jitter:0});
      /* wings */
      for(const sd of [-1,1]){
        for(let i=0;i<4;i++)bx(-8+4*i,sd*10,-0.5,4,4,1,i%2?col:mix(col,0xffffff,0.14),{breakable:true});
        for(let i=0;i<2;i++)bx(-4+4*i,sd*14,-0.5,4,4,1,i%2?mix(col,0xffffff,0.14):col,{breakable:true});
        bx(-2,sd*16.15,0.4,8,0.3,0.8,light,{glow:true,solid:false,jitter:0});bx(-9,sd*10,0.1,0.4,4,0.2,light,{glow:true,solid:false,jitter:0});}
      /* engines: dark housing with a glowing block, not breakable */
      for(const sd of [-1,1]){bx(-20.5,sd*4,2,5,4,4,0x2b3050,{jitter:0});bx(-23.2,sd*4,2,1.4,3,3,light,{glow:true,jitter:0});}
      /* bridge to the station: 6 wide, tiles of 3, nose tip at a=26, station edge at a=47 */
      for(let i=0;i<7;i++)bx(27.5+3*i,0,-0.5,3,6,1,i%2?0x9ea7c4:0xb0b8d2,{breakable:true});
      for(const sd of [-1,1])bx(36.5,sd*3.1,0.3,21,0.3,0.6,light,{glow:true,solid:false,jitter:0});
      /* power cores */
      const defs={nose:[22,0,0.5,18.5,sd=>2.5*sd],low:[6,0,0.5,2,sd=>3*sd],up:[-12,-4,5.5,-8,sd=>-1*sd]};
      for(const kind of kinds){
        const d=defs[kind],sd=Math.random()<0.5?-1:1;
        const b=bx(d[0],d[1],d[2],3,3,1,mix(col,0xffffff,0.35),{glow:true,breakable:true,tag:'core',data:{team,kind,post:S.P(d[3],d[4](sd))},jitter:0});
        bx(d[0],d[1],d[2]-0.5+0.06,5.2,5.2,0.12,col,{glow:true,solid:false,jitter:0});
        coreBeams.set(b,E.slab(b.x,b.y+5,b.z,0.7,10,0.7,mix(col,0xffffff,0.3),0.35));
        S.cores.push(b);
      }
      return S;
    }
    const startCores={};
    for(const t of ACTIVE){const sl=SLOT[t];const kinds=(t===1&&L===5)?['nose','up']:['nose','low','up'];ships[t]=buildShip(sl[0],sl[1],sl[2],sl[3],t,kinds);startCores[t]=kinds.length;}

    /* ------------------------------------------------------------ crews */
    const names=shuffle(VG.BOT_NAMES.slice());let ni=0;const members={};
    for(const t of ACTIVE){members[t]=[];const S=ships[t];
      for(let i=0;i<SIZE;i++){
        let c;if(t===1&&i===0){c=E.player;c.team=1;}else c=E.spawn({name:names[ni++%names.length],color:TEAMS[t].color,team:t,bot:true});
        c.setTools(TOOLS);const sp=[-5,-1.7,1.7,5][i];const p=S.P(11.5,sp,0);c.teleport(p.x,0.1,p.z);
        c.yaw=Math.atan2(S.dx,S.dz);c.frozen=true;c.data.idx=i;
        if(t!==1&&L===5){c.maxHp=c.hp=120;}
        members[t].push(c);}}
    E.cam.yaw=Math.atan2(-ships[1].dx,-ships[1].dz);

    /* ------------------------------------------------------------ helpers */
    const liveCores=t=>ships[t]?ships[t].cores.filter(b=>b.alive):[];
    const flat=(c,v)=>Math.hypot(v.x-c.pos.x,v.z-c.pos.z);
    function where(c){for(const t of ACTIVE){const S=ships[t],rx=c.pos.x-S.ox,rz=c.pos.z-S.oz,a=rx*S.dx+rz*S.dz,s=-rx*S.dz+rz*S.dx;
      if(Math.abs(s)<=18&&a>=-24&&a<=27)return{ship:t,a,s,up:c.pos.y>3};}return{ship:null,up:false};}
    function ownCoreNear(c,r){for(const b of liveCores(c.team)){if(Math.hypot(b.x-c.pos.x,b.y-c.pos.y-1.5,b.z-c.pos.z)<r)return true;}return false;}
    function initBrain(c,role){
      const br=c.brain||(c.brain=new VG.Brain(c,E));
      const ally=c.team===1;
      br.skill=c===E.player?0.6:clamp(0.25+0.125*(L-1)+(ally?0.1:0),0.2,0.85);
      br.speedMul=ally?1:0.85+0.0375*(L-1);br.arrive=2.2;br.fearless=false;
      br.data={role,next:rand(0.1,0.7),path:null,pi:0,core:null,home:null,pathFor:null,chase:false,fireT:rand(0.5,1.2),stuckT:0,stuckN:0,lx:c.pos.x,lz:c.pos.z,shoot:false,clear:false,cd:99,tgt:null,vis:false,idle:0};
    }
    /* roles: about half raiders, half guards. enemies are a little more defensive on level 1 and more aggressive on level 5 */
    for(const t of ACTIVE){
      const frac=t===1?0.5:(L===1?0.34:L===5?0.67:0.5);
      let raiders=Math.max(1,Math.round(SIZE*frac));
      members[t].forEach((c,i)=>{const role=i<raiders?'raider':'guard';if(c===E.player){c.data.role='raider';}else initBrain(c,role);});
    }

    function planRaid(c){
      const d=c.brain.data,here=where(c);
      const tts=ACTIVE.filter(t=>t!==c.team&&liveCores(t).length>0);
      d.path=[];d.pi=0;d.core=null;d.idle=0;d.shoot=false;
      if(!tts.length)return;
      let t=pick(tts);
      if(Math.random()<0.6){let bd=1e9;for(const q of tts){const dd=Math.hypot(ships[q].ox-c.pos.x,ships[q].oz-c.pos.z);if(dd<bd){bd=dd;t=q;}}}
      const S=ships[t],cs=liveCores(t);
      let pool=cs;if(L<=2){const easy=cs.filter(b=>b.data.kind!=='up');if(easy.length&&Math.random()<0.75)pool=easy;}
      const core=pick(pool),kind=core.data.kind;d.core=core;
      const out=[];
      if(here.ship===t){
        if(here.up){if(kind!=='up'){out.push(S.P(-10.5,6),S.P(0,6));}}
      }else{
        if(here.ship!=null){const H=ships[here.ship];if(here.up)out.push(H.P(-10.5,6),H.P(0,6));out.push(H.P(24,0),H.P(36.5,0));}
        const bT=S.P(36.5,0);if(here.ship!=null||Math.hypot(bT.x-c.pos.x,bT.z-c.pos.z)>Math.hypot(c.pos.x,c.pos.z))out.push(V(0,0,0));
        out.push(bT);
      }
      const chain={nose:[[30,0]],low:[[30,0],[24,2.9],[16,2.9]],up:[[30,0],[24,2.9],[16,2.9],[0,6],[-10.5,6]]}[kind];
      const onT=here.ship===t;
      for(const n of chain){if(onT&&!here.up&&n[0]>here.a+1.5&&n[0]>=16)continue;if(onT&&here.up&&n[0]>-9)continue;out.push(S.P(n[0],n[1]));}
      d.path=out;
    }
    function guardPath(c,core){
      const S=ships[c.team],here=where(c),wantUp=core.data.kind==='up',out=[];
      if(here.ship!==c.team){out.push(S.P(36.5,0),S.P(24,2.9),S.P(16,2.9));if(wantUp)out.push(S.P(0,6),S.P(-10.5,6));}
      else if(here.up&&!wantUp)out.push(S.P(-10.5,6),S.P(0,6));
      else if(!here.up&&wantUp)out.push(S.P(0,6),S.P(-10.5,6));
      const p=core.data.post;out.push(V(p.x,p.y,p.z));return out;
    }
    function think(c){
      const br=c.brain,d=br.data,t=c.team;
      d.next=rand(0.4,1.0)*(t===1?0.85:(1.15-0.1*L));
      const live=liveCores(t);
      if(!live.length)d.role='raider';
      /* nearest enemy */
      d.tgt=null;d.vis=false;let ed=1e9;
      const en=br.nearest(o=>o.team!==t);
      if(en){ed=br.dist(en);if(ed<(d.role==='guard'?28:24)&&Math.abs(en.pos.y-c.pos.y)<5){d.tgt=en;d.vis=br.canSee(en);}}
      /* stuck check */
      const mv=Math.hypot(c.pos.x-d.lx,c.pos.z-d.lz);d.lx=c.pos.x;d.lz=c.pos.z;
      if(br.goal&&!br.arrived&&mv<0.8)d.stuckT++;else d.stuckT=0;
      if(d.stuckT>=7){d.stuckT=0;d.stuckN++;d.path=null;d.home=null;br.side=1;if(d.stuckN>=3&&d.role==='raider'&&live.length){d.role='guard';d.demote=E.time+25;}}
      let goal=null;
      if(d.role==='raider'){
        if(!d.path||(d.core&&!d.core.alive)||(d.pi>=d.path.length&&!d.shoot&&++d.idle>7))planRaid(c);
        while(d.pi<d.path.length&&flat(c,d.path[d.pi])<2.8)d.pi++;
        if(d.pi<d.path.length)goal=d.path[d.pi];
        d.shoot=false;
        if(d.core&&d.core.alive){const ch=c.chest(),cp=V(d.core.x,d.core.y,d.core.z),dv=cp.clone().sub(ch),dd=dv.length();d.cd=dd;
          if(dd<16){const h=W.ray(ch,dv.clone().normalize(),dd);d.clear=!h||h.box===d.core||h.t>dd-1.2;d.shoot=d.clear||dd<11.5;if(d.clear&&dd<=15)goal=null;}}
      }else{
        if(!d.home||!d.home.alive){const lv=liveCores(t);d.home=lv.length?lv[(c.data.idx||0)%lv.length]:null;d.path=null;}
        if(d.home){
          const hp=d.home.data.post;
          if(d.tgt&&d.vis&&ed>3.5&&Math.hypot(hp.x-c.pos.x,hp.z-c.pos.z)<34){goal=d.tgt.pos;d.chase=true;}
          else{
            if(d.chase){d.chase=false;d.path=null;}
            if(!d.path||d.pathFor!==d.home){d.path=guardPath(c,d.home);d.pi=0;d.pathFor=d.home;}
            while(d.pi<d.path.length&&flat(c,d.path[d.pi])<2.8)d.pi++;
            if(d.pi<d.path.length)goal=d.path[d.pi];
          }
        }
      }
      if(d.tgt&&d.vis&&ed<7&&d.role==='raider')goal=d.tgt.pos;
      br.goal=goal?V(goal.x,goal.y,goal.z):null;
    }
    function fire(c){
      const br=c.brain,d=br.data,t=d.tgt,tOK=t&&t.alive&&d.vis,ed=tOK?br.dist(t):1e9;
      d.fireT=rand(0.25,0.6)*(1.5-br.skill);
      const core=d.core;
      if(d.role==='raider'&&d.shoot&&core&&core.alive&&(!tOK||ed>8)&&!ownCoreNear(c,10)){
        const dd=Math.hypot(core.x-c.pos.x,core.y-c.pos.y-1.5,core.z-c.pos.z),cp=V(core.x,core.y,core.z);
        if(d.clear&&dd>=8.5&&dd<=16){br.fireAt(cp,'rocket');return;}
        if(!d.clear&&L>=2&&dd>=7.5&&dd<=11.5){br.fireAt(cp,'bomb');return;}
      }
      if(tOK){
        if(ed<5.2)br.fireAt(t,'blade',0.04);
        else if(ed<26){br.fireAt(t,(ed>8&&ed<20&&Math.random()<0.28)?'bouncer':'popper');}
      }
    }
    /* bridges and floors get blasted open: leap over gaps (low gravity makes long jumps easy) */
    function edgeJump(c){
      const br=c.brain;if(!br.goal||!c.onGround||c.vel.y>1)return;
      const dx=br.goal.x-c.pos.x,dz=br.goal.z-c.pos.z,dd=Math.hypot(dx,dz);if(dd<4)return;
      const ux=dx/dd,uz=dz/dd,g1=W.groundY(c.pos.x+ux*1.8,c.pos.z+uz*1.8,c.pos.y+1.2);
      if(g1>=c.pos.y-3.5)return;
      for(const k of [5,8,11,14]){if(k>dd+3)break;const g=W.groundY(c.pos.x+ux*k,c.pos.z+uz*k,c.pos.y+3);
        if(g>=c.pos.y-2&&g<=c.pos.y+2.2){const sp=c.speed*br.speedMul;c.vel.y=c.jumpV;c.vel.x=ux*sp;c.vel.z=uz*sp;c.onGround=false;return;}}
    }
    function act(c,dt){
      if(!c.alive||c.frozen||!c.brain)return;const d=c.brain.data;
      edgeJump(c);
      if(d.demote&&E.time>d.demote){d.demote=0;d.stuckN=0;d.role='raider';d.path=null;}
      d.next-=dt;if(d.next<=0)think(c);
      d.fireT-=dt;if(d.fireT<=0)fire(c);
    }

    /* ------------------------------------------------------------ rules */
    let go=false,done=false,acc=0;const elim={};
    function stats(t){return{cores:liveCores(t).length,up:members[t].filter(c=>c.alive).length};}
    function respawn(c){
      if(E.over||c.alive)return;
      const lv=liveCores(c.team);if(!lv.length)return;
      const core=pick(lv);E.respawn(c,core.x,core.maxy+0.2,core.z,3);
      if(c.brain&&c.brain.data){const d=c.brain.data;d.path=null;d.core=null;d.home=null;d.tgt=null;d.chase=false;d.stuckT=0;d.next=rand(0.2,0.6);}
    }
    function endMatch(win,title,lines,stars){
      if(done)return;done=true;
      const r=win?{win:true,title,stars,lines}:{win:false,title,lines};
      E.after(1.2,()=>E.finish(r));
    }
    function winLines(){const b=stats(1);return['Your crew finished with '+b.cores+' power core'+(b.cores===1?'':'s')+' and '+b.up+' crew mates flying.'];}
    function starsNow(){const n=stats(1).cores;return n>=startCores[1]?3:n===startCores[1]-1?2:1;}
    function rules(){
      const clock=Math.max(0,INTRO+LIMIT-E.time);
      E.status(go?'Smash the enemy power cores   '+E.fmt(clock):'Get ready...');
      const rows=[];
      for(const t of ACTIVE){
        const s=stats(t);
        if(!elim[t]&&s.cores===0&&s.up===0){elim[t]=true;E.announce(TEAMS[t].name+' crew is out of the game!',3);}
        rows.push({label:TEAMS[t].name+' crew',value:elim[t]?'out':s.cores+' core'+(s.cores===1?'':'s')+' / '+s.up+' up',color:TEAMS[t].color,me:t===1});
      }
      E.score(rows);
      if(!go||done)return;
      if(elim[1]){endMatch(false,'Your crew is out',['All of your power cores were smashed. Guard them next time!']);return;}
      const left=ACTIVE.filter(t=>!elim[t]);
      if(left.length===1&&left[0]===1){endMatch(true,'Last crew flying!',winLines(),starsNow());return;}
      if(clock<=0){
        const key=t=>{const s=stats(t);return s.cores*100+s.up;};
        const mine=key(1);let best=-1,tie=false;
        for(const t of left){if(t===1)continue;const k=key(t);if(k>best){best=k;tie=false;}else if(k===best)tie=true;}
        if(mine>best)endMatch(true,'Time is up. Your crew wins!',winLines(),starsNow());
        else if(mine===best)endMatch(false,'Time is up. A tie!',['Another crew finished level with yours. Smash a few more cores next time.']);
        else endMatch(false,'Time is up',['Another crew had more power cores. Smash more enemy cores to catch up.']);
      }
    }
    E.announce('Get ready!',2.6);

    return {
      update(dt){
        if(done&&E.over)return;
        if(!go&&E.time>=INTRO){go=true;for(const c of E.chars)c.frozen=false;E.announce('Go! Smash the enemy power cores!',3);E.sfx('alarm');}
        if(go&&!done){for(const c of E.chars)if(c.isBot&&c.alive)act(c,dt);}
        planet.rotation.y+=dt*0.03;
        acc+=dt;if(acc>=0.2){acc=0;rules();}
      },
      autopilot(dt){
        const p=E.player;if(!p.brain)initBrain(p,'raider');
        if(!go||done||!p.alive)return;act(p,dt);
      },
      onDeath(c,by){
        if(E.over)return;
        E.after(4,()=>respawn(c));
      },
      onBreak(b){
        if(b.tag!=='core')return;
        const t=b.data.team,bm=coreBeams.get(b);if(bm){E.remove(bm);coreBeams.delete(b);}
        const n=liveCores(t).length,nm=TEAMS[t].name;
        E.fx.flash(V(b.x,b.y,b.z),9,mix(TEAMS[t].color,0xffffff,0.4));E.shake(0.45);
        E.announce(nm+' core destroyed! '+n+' left',2.8);
        if(n===0)E.after(1.9,()=>{if(!E.over)E.announce(nm+' crew cannot respawn!',3);});
      },
      dispose(){}
    };
  }
});
