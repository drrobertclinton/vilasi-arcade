/* Nine Rooms: a hidden-role mystery in a manor. One guest is the Phantom, one is the Detective. */
VG.register({
  id:'nine-rooms', partyKeepBots:true, /* the Phantom and the other guests are computer players the game cannot run without */name:'Nine Rooms',tagline:'One guest is the Phantom. Find out who before the lights go out.',color:0x7a5cff,levels:1,
  howTo:[
    'Everyone in the manor looks the same, and one guest is secretly the Phantom. Your role is shown at the top.',
    'Guests: collect coins, stay near other guests and watch for anyone sneaky. The Phantom can only zap someone who is close.',
    'Detective: you have one Catcher beam. Only fire when you are sure! Catching an innocent guest zaps YOU out.',
    'Phantom: zap guests when nobody else can see you, then slip away to another room.',
    'The guests win if the Phantom is caught or the clock runs out. The Phantom wins by zapping everyone else.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle}=VG.util,W=E.world,L=E.level,T=THREE;
    E.cam.dist=9;E.cam.pitch=0.7;
    E.setSky(0x0a0720,0x2b1a55,0x1b1238,70,260);E.setLight(0.5,0.3);E.stars(260,0xd8dcff);
    E.slab(0,-0.7,0,500,1,500,0x120d26,1);

    /* ------------------------------------------------ level settings */
    const N=[6,7,8,8,9][L-1],TOTAL=[180,165,150,135,120][L-1];
    const ZAP_CD=[14,10,7,5,3.5][L-1],MISS=[0.6,0.4,0.2,0.1,0][L-1],DET_SPREAD=[0.06,0.045,0.032,0.022,0.012][L-1],BOT_SPEED=[0.85,0.9,0.95,1.0,1.05][L-1];
    const STALK=[0.15,0.28,0.45,0.6,0.85][L-1],HUNT=[0.1,0.2,0.4,0.55,0.7][L-1];

    /* ------------------------------------------------ the manor */
    const ROOMS=[['Library','Kitchen','Bedroom'],['Dining Room','Great Hall','Music Room'],['Game Room','Greenhouse','Cellar']]; // [row=z][col=x]
    const FLOOR=[[0x9a6b46,0xe3dcc6,0xc3a0e6],[0xbf5a52,0x5f74be,0x3fb7aa],[0xe8a23c,0x5cb96e,0x80849a]];
    const RUG=[[0x6b2c2c,0xd9a441,0x7d52b8],[0x7a1f2b,0xf0d98a,0x1f6f73],[0x2d5fa8,0x2f7a45,0x4a4f63]];
    const cx=i=>-22+22*i, cz=j=>-22+22*j;
    const cen=(i,j)=>V(cx(i),0,cz(j));
    const roomOf=(x,z)=>[clamp(Math.floor((x+33)/22),0,2),clamp(Math.floor((z+33)/22),0,2)];
    const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
    const mid=(a,b)=>V((cx(a[0])+cx(b[0]))/2,0,(cz(a[1])+cz(b[1]))/2);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++){
      W.addBox(cx(i),-0.25,cz(j),22,0.5,22,FLOOR[j][i],{jitter:0});
      W.addBox(cx(i),0.04,cz(j),9,0.08,9,RUG[j][i],{solid:false,jitter:0});
      W.addBox(cx(i),0.06,cz(j),6.4,0.12,6.4,new T.Color(RUG[j][i]).lerp(new T.Color(0xffffff),0.28).getHex(),{solid:false,jitter:0});
    }
    function seg(ax,fixed,a,b){const len=b-a,m=(a+b)/2;
      const put=(y,h,th,col)=>{if(ax==='x')W.addBox(m,y,fixed,len,h,th,col,{jitter:0});else W.addBox(fixed,y,m,th,h,len,col,{jitter:0});};
      put(1.1,2.2,1.25,0x3a3170);put(4.1,3.8,1,0x6b60b3);put(6.15,0.3,1.4,0xe0c070);}
    for(const f of [-11,11])for(let k=0;k<3;k++){const c=-22+22*k;seg('z',f,c-11,c-2);seg('z',f,c+2,c+11);seg('x',f,c-11,c-2);seg('x',f,c+2,c+11);
      for(const s of [-2.35,2.35]){W.addBox(f,3.15,c+s,1.5,6.3,0.7,0xe0c070,{jitter:0});W.addBox(c+s,3.15,f,0.7,6.3,1.5,0xe0c070,{jitter:0});}}
    seg('x',-33.5,-34,34);seg('x',33.5,-34,34);seg('z',-33.5,-34,34);seg('z',33.5,-34,34);
    function furn(i,j,list){for(const f of list){const x=cx(i)+f[0],z=cz(j)+f[1];
      W.addBox(x,f[4]/2,z,f[2],f[4],f[3],f[5],{jitter:0});
      if(f[6]!=null)W.addBox(x,f[4]+0.15,z,f[2]*0.86,0.3,f[3]*0.86,f[6],{jitter:0});}}
    function lamp(i,j,ox,oz){const x=cx(i)+ox,z=cz(j)+oz;
      W.addBox(x,1.4,z,0.6,2.8,0.6,0x2a2540,{jitter:0});W.addBox(x,3.5,z,1.5,1.2,1.5,0xfff0b8,{glow:true,solid:false,jitter:0});
      E.slab(x,0.16,z,7,0.04,7,0xffe7a0,0.2);}
    /* furniture: [offsetX,offsetZ,sizeX,sizeZ,height,color,topColor]. Everything stays 3+ units from the room's two centre lines, so the doorways and the centre stay clear. */
    furn(0,0,[[-9.6,-6.5,1.6,7,4.6,0x5a3a24],[-9.6,6.5,1.6,7,4.6,0x5a3a24],[6.5,-9.6,7,1.6,4.6,0x6a4528],[6.5,6.5,4.5,3,1.7,0xd9a15b,0xf3d08f]]);lamp(0,0,9.4,9.4);
    furn(1,0,[[-6.5,-9.4,7,1.8,2.1,0xdde3ea,0x8fb7d9],[9.4,-6.5,1.8,7,2.1,0xdde3ea,0x8fb7d9],[-6,6,5,3,1.8,0xf2c14e,0xfff0b0],[7,7,2.4,2.4,4.2,0xbfd9e6]]);lamp(1,0,-9.6,9.6);
    furn(2,0,[[-7,-7,4.6,6.5,1.7,0xff8fb1,0xfff3f7],[8.8,-6,2.4,6,4.2,0x6c4a8e],[-8.8,7,2.4,5,2.6,0x8f6bb8],[6,6,3,3,1.7,0xe6c9ff]]);lamp(2,0,9.4,9.4);
    furn(0,1,[[6.5,6.5,6,4.5,1.8,0x9c5a3c,0xe8c58d],[-6.5,-6.5,6,4.5,1.8,0x9c5a3c,0xe8c58d],[-9.6,6.5,1.6,6,2.8,0x7a4b32],[6.5,-9.6,6,1.6,3.6,0x7a4b32]]);lamp(0,1,9.6,-9.4);
    furn(1,1,[[-7,-7,2.4,2.4,6,0xeadfc8],[7,7,2.4,2.4,6,0xeadfc8],[-9.2,6.5,2,5,1.7,0xb34a5a,0xd9707f],[9.2,-6.5,2,5,1.7,0xb34a5a,0xd9707f]]);lamp(1,1,-7,7);
    furn(2,1,[[-7,-6.5,5,3.5,2.2,0x15151f,0x44445a],[7,-7,3,3,3,0xe0c35a],[9.4,6.5,1.8,4,3,0x2a2a3a],[-7,6.5,4.5,4.5,1.8,0xc7324a,0xff7a8f]]);lamp(2,1,4.6,9.4);
    furn(0,2,[[-7,-6.5,6,3.5,1.8,0x2e8b57,0x58d08a],[9.3,-6.5,1.8,6,3.2,0x2a2f6e],[-7,7,4,4,1.8,0xff5d8f],[7,7,3.5,3.5,2.4,0xc99557]]);lamp(0,2,5.2,-9.4);
    furn(1,2,[[-7,-7,5,3,2.6,0x2f8f46,0x6fd68a],[7,7,5,3,2.6,0x2f8f46,0x6fd68a],[-9,7,2.4,4,2,0xc2703d],[8.8,-6.5,2.4,5,3.8,0x4ea35b]]);lamp(1,2,-5,9.4);
    furn(2,2,[[-8,-7,3,3,2.4,0x6b4a2f,0x9c7249],[8.8,-6,1.8,7,3.6,0x4a3326],[6.5,7,4,3,2.2,0x9c7a4c],[-7,6.5,3,3,3.4,0x8a6a3f]]);lamp(2,2,-4.4,-9.4);

    /* ------------------------------------------------ helpers */
    const CNAMES=[['red',0xff4d5e],['blue',0x3d8bff],['green',0x35d07f],['yellow',0xffd23e],['purple',0xa56bff],['orange',0xff8a3c],['teal',0x22d3c8],['pink',0xff6fb5],['lime',0xb6f23a],['cyan',0x4be3ff],['magenta',0xff3df0],['mint',0x7dffb0]];
    function recolor(c,col){const m=c.group.userData.mats;m[0].color.set(col);m[1].color.set(col).multiplyScalar(0.6);m[5].color.set(col).lerp(new T.Color(1,1,1),0.35);c.color=col;}
    const dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
    function los(a,b){const o=a.chest(),p=V(b.pos.x,b.pos.y+1.3,b.pos.z),d=p.sub(o),len=d.length();if(len<0.5)return true;d.divideScalar(len);return !W.ray(o,d,len-0.3);}
    function clear(a,b){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<0.5)return true;const ux=dx/len,uz=dz/len;
      for(const s of [0,-0.6,0.6]){const o=V(a.x-uz*s,1,a.z+ux*s);if(W.ray(o,V(ux,0,uz),len))return false;}return true;}
    function seenByThird(a,b){for(const o of E.chars){if(!o.alive||o===a||o===b)continue;if(dist2(o.pos,a.pos)<22&&dist2(o.pos,b.pos)<22&&los(o,a)&&los(o,b))return true;}return false;}

    /* ------------------------------------------------ players and roles */
    const p=E.player,names=shuffle(VG.BOT_NAMES.slice()),cols=shuffle(CNAMES.slice());
    const bots=[];for(let k=0;k<N-1;k++)bots.push(E.spawn({name:names[k],color:cols[k+1][1],team:null,bot:true}));
    const all=[p].concat(bots);
    all.forEach((c,k)=>{c.team=null;recolor(c,cols[k===0?0:k][1]);if(k===0)c.data.cname=cols[0][0];else c.data.cname=cols[k][0];c.showTag(false);});
    bots.forEach((c,k)=>{c.data.cname=cols[k+1][0];});
    const pRole=L===1?'guest':L===2?'detective':L===3?'phantom':pick(['guest','detective','phantom']);
    const startRole=pRole;let phantom=null,det=null;
    function giveRole(c,role){c.data.role=role;
      if(role==='phantom')c.setTools(['zapper']);else if(role==='detective')c.setTools(['catcher']);else c.setTools([]);
      c.group.userData.hold.visible=false;}
    {const pool=shuffle(bots.slice());
      if(pRole==='phantom'){phantom=p;det=pool.pop();}else if(pRole==='detective'){det=p;phantom=pool.pop();}else{phantom=pool.pop();det=pool.pop();}
      for(const c of all){const d=c.data;d.route=[];d.idle=true;d.wait=rand(0.6,2.4);d.think=rand(0,0.3);d.knows=false;d.stuck=0;d.ct=0;d.lx=0;d.lz=0;d.chase=null;d.hold=false;d.nextZap=rand(5,9);d.nextWait=0;d.hurry=0;d.prev=null;d.coiny=false;
        giveRole(c,c===phantom?'phantom':c===det?'detective':'guest');}}
    const order=shuffle([0,1,2,3,4,5,6,7,8]);
    all.forEach((c,k)=>{const r=order[k],i=r%3,j=Math.floor(r/3);c.teleport(cx(i)+rand(-2,2),0,cz(j)+rand(-2,2));c.yaw=rand(0,6.28);if(c.brain){c.brain.skill=0.5;c.brain.arrive=1;}});
    E.announce('You are '+(pRole==='guest'?'a Guest':pRole==='detective'?'the Detective':'the Phantom'),3.6);

    /* ------------------------------------------------ coins */
    let coins=0;const coinList=[];
    {const rr=shuffle([0,1,2,3,4,5,6,7,8]).concat(shuffle([0,1,2,3,4,5,6,7,8]).slice(0,3)),arms=[[6.5,0],[-6.5,0],[0,6.5],[0,-6.5]],used={};
      for(const r of rr){const i=r%3,j=Math.floor(r/3);let a;do{a=pick(arms);}while(used[r+':'+a]&&Object.keys(used).length<40);used[r+':'+a]=1;
        const x=cx(i)+a[0]+(a[0]?rand(-1,1):rand(-1.3,1.3)),z=cz(j)+a[1]+(a[1]?rand(-1,1):rand(-1.3,1.3));
        const co={pos:V(x,0,z)};co.pk=E.pickup({pos:V(x,1.3,z),color:0xffd23e,size:0.5,bots:false,onTake(c){if(c!==p)return false;coins++;co.gone=true;return true;}});coinList.push(co);}}

    /* ------------------------------------------------ routes and movement */
    function roomPath(a,b){const out=[];let i=a[0],j=a[1];const xfirst=Math.random()<0.5;
      const stepX=()=>{while(i!==b[0]){i+=Math.sign(b[0]-i);out.push([i,j]);}},stepZ=()=>{while(j!==b[1]){j+=Math.sign(b[1]-j);out.push([i,j]);}};
      if(xfirst){stepX();stepZ();}else{stepZ();stepX();}return out;}
    function routeTo(c,room,final){const d=c.data,here=roomOf(c.pos.x,c.pos.z),pts=[],path=roomPath(here,room);
      const first=path.length?mid(here,path[0]):(final||cen(room[0],room[1]));
      if(dist2(c.pos,cen(here[0],here[1]))>3&&!clear(c.pos,first))pts.push(cen(here[0],here[1]));
      let cur=here;for(const r of path){pts.push(mid(cur,r));pts.push(cen(r[0],r[1]));cur=r;}
      if(final)pts.push(final.clone());else if(!path.length)pts.push(cen(room[0],room[1]));
      d.route=pts;d.idle=false;d.prev=here;d.chase=null;d.hold=false;}
    let badge=null,badgePos=null,badgeBeam=null;
    function livingOthersIn(room,self){let n=0;for(const o of E.chars)if(o.alive&&o!==self&&same(roomOf(o.pos.x,o.pos.z),room))n++;return n;}
    function chooseDest(c){
      const d=c.data,here=roomOf(c.pos.x,c.pos.z);
      if(badge&&d.role==='guest'&&Math.random()<0.5){routeTo(c,roomOf(badgePos.x,badgePos.z),badgePos);return;}
      if(d.coiny){let best=null,bd=1e9;for(const co of coinList){if(co.gone)continue;const q=dist2(co.pos,c.pos);if(q<bd){bd=q;best=co;}}
        if(best){routeTo(c,roomOf(best.pos.x,best.pos.z),best.pos);return;}}
      if(d.role==='phantom'&&Math.random()<HUNT){const cand=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)if(!same([i,j],here)&&livingOthersIn([i,j],c)===1)cand.push([i,j]);
        if(cand.length){routeTo(c,pick(cand));return;}}
      const nb=[];for(const q of [[1,0],[-1,0],[0,1],[0,-1]]){const r=[here[0]+q[0],here[1]+q[1]];if(r[0]<0||r[0]>2||r[1]<0||r[1]>2)continue;nb.push(r);}
      let opts=nb.filter(r=>!d.prev||!same(r,d.prev));if(!opts.length)opts=nb;
      if(L>=4&&d.role!=='phantom'&&Math.random()<0.45){const occ=opts.filter(r=>livingOthersIn(r,c)>0);if(occ.length)opts=occ;}
      routeTo(c,pick(opts));
    }
    function moveStep(c,dt){
      const d=c.data,br=c.brain;
      br.speedMul=BOT_SPEED*(fast?1.25:1)*(E.time<d.hurry?1.2:1);
      if(d.chase&&d.chase.alive){br.goal=d.chase.pos;br.arrive=2.3;}
      else if(d.route.length){const g=d.route[0];br.goal=g;br.arrive=0.9;
        if(dist2(g,c.pos)<(d.route.length>1?1.7:1.2)){d.route.shift();if(!d.route.length){d.idle=true;d.wait=d.nextWait||rand(1,4);d.nextWait=0;}}}
      else{br.goal=null;if(d.hold)return;d.wait-=dt;if(d.wait<=0)chooseDest(c);}
      d.ct+=dt;
      if(d.ct>=0.5){const moved=Math.hypot(c.pos.x-d.lx,c.pos.z-d.lz);d.lx=c.pos.x;d.lz=c.pos.z;d.ct=0;
        if(br.goal&&!br.arrived&&moved<0.25)d.stuck+=0.5;else d.stuck=Math.max(0,d.stuck-1);
        if(d.stuck>=7){const r=roomOf(c.pos.x,c.pos.z);c.teleport(cx(r[0])+rand(-1,1),0,cz(r[1])+rand(-1,1));d.route=[];d.chase=null;d.stuck=0;d.idle=true;d.wait=1;}
        else if(d.stuck>=3){const r=roomOf(c.pos.x,c.pos.z);d.chase=null;d.route=[cen(r[0],r[1])];d.stuck=1.5;}}
    }

    /* ------------------------------------------------ role brains */
    function zap(c,t){const d=c.data;if(!c.brain.fireAt(t,'zapper',0.02))return;
      if(t.alive){d.nextZap=E.time+1;return;}
      d.nextZap=E.time+ZAP_CD*(fast?0.5:1)*rand(0.9,1.25);d.chase=null;
      const here=roomOf(c.pos.x,c.pos.z),far=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)if(Math.abs(i-here[0])+Math.abs(j-here[1])>=2)far.push([i,j]);
      routeTo(c,pick(far));d.hurry=E.time+4;d.nextWait=rand(2,4);}
    function gate(d,t){if(d.tgtRoll!==t||E.time>d.tgtT){d.tgtRoll=t;d.tgtT=E.time+8;d.tgtSkip=Math.random()<MISS;}return !d.tgtSkip;}
    function phantomThink(c){
      const d=c.data,br=c.brain,others=E.living(o=>o!==c);if(!others.length)return;
      const ready=E.time>=d.nextZap;
      if(others.length===1){const t=others[0];d.chase=t;d.route=[];if(ready&&br.dist(t)<3.6&&Math.abs(t.pos.y-c.pos.y)<2&&los(c,t))zap(c,t);return;}
      const near5=others.filter(o=>br.dist(o)<5&&Math.abs(o.pos.y-c.pos.y)<3);
      if(ready&&near5.length===1){const t=near5[0];
        if(gate(d,t)&&!seenByThird(c,t)){if(br.dist(t)<3.6&&los(c,t)){zap(c,t);return;}d.chase=t;d.route=[];return;}}
      if(ready&&near5.length<2){let best=null,bd=1e9;
        for(const o of others){const q=br.dist(o);if(q<16&&q<bd&&gate(d,o)&&los(c,o)&&!seenByThird(c,o)){bd=q;best=o;}}
        if(best&&(d.chase===best||Math.random()<STALK)){d.chase=best;d.route=[];return;}}
      if(d.chase){d.chase=null;d.idle=true;d.wait=0.3;}
    }
    function detFire(c,t){const o=c.chest(),dir=V(t.pos.x,t.pos.y+1.3,t.pos.z).sub(o),len=dir.length(),s=DET_SPREAD;dir.normalize();
      dir.x+=rand(-s,s);dir.y+=rand(-s,s)*0.6;dir.z+=rand(-s,s);dir.normalize();
      for(const g of E.chars){if(g===c||g===t||!g.alive)continue;if(E.rayChar(o,dir,g,len)!=null)return false;}
      if(c.tool!=='catcher')c.equip('catcher');return c.use(dir,'catcher');}
    function detThink(c){
      const d=c.data,br=c.brain;d.hold=false;
      if(!d.knows||!phantom.alive){return;}
      const dd=br.dist(phantom),see=los(c,phantom)&&Math.abs(phantom.pos.y-c.pos.y)<3;
      if(see){if(dd<30)detFire(c,phantom);
        if(dd>12){d.chase=phantom;d.route=[];}else{d.chase=null;d.route=[];d.hold=true;}return;}
      d.chase=null;const pr=roomOf(phantom.pos.x,phantom.pos.z);
      if(!d.route.length||!d.huntRoom||!same(d.huntRoom,pr)){d.huntRoom=pr;routeTo(c,pr,V(phantom.pos.x,0,phantom.pos.z));}
    }
    function botThink(c,dt){const d=c.data;d.think-=dt;
      if(d.think<=0){d.think=rand(0.25,0.4);if(d.role==='phantom')phantomThink(c);else if(d.role==='detective')detThink(c);}
      moveStep(c,dt);}

    /* ------------------------------------------------ events */
    let ended=false,fast=false,outAt=-1,caughtBy=null,caughtAt=0,zapsDone=0;
    function witnessZap(victim){
      for(const o of E.chars){if(!o.alive||o===victim||o===phantom)continue;if(o===p&&!p.brain)continue;
        const seenV=dist2(o.pos,victim.pos)<22&&los(o,victim),seenP=dist2(o.pos,phantom.pos)<22&&los(o,phantom);
        if(!seenV&&!seenP)continue;const d=o.data;d.knows=true;
        if(d.role==='guest'){let best=null,bd=-1;for(let j=0;j<3;j++)for(let i=0;i<3;i++){const q=dist2(cen(i,j),phantom.pos);if(q>bd){bd=q;best=[i,j];}}
          routeTo(o,best);d.hurry=E.time+4;d.nextWait=rand(3,5);}}}
    function dropBadge(c){
      badgePos=V(c.pos.x,0,c.pos.z);
      badge=E.pickup({pos:V(c.pos.x,1.6,c.pos.z),color:0x55ffd9,size:1.1,bots:true,onTake(t){
        if(ended||t===phantom||!badge)return false;
        giveRole(t,'detective');det=t;E.remove(badgeBeam);badgeBeam=null;badge=null;
        if(t===p){E.announce('You picked up the Detective badge! You are the Detective now.',3.6);}else E.announce('A guest picked up the Detective\'s badge!',2.8);
        return true;}});
      badgeBeam=E.slab(c.pos.x,3.5,c.pos.z,0.9,7,0.9,0x55ffd9,0.28);
      E.announce('The Detective is out! Their badge dropped.',2.8);}
    function guestsLeft(){let n=0;for(const c of E.chars)if(c.alive&&c!==phantom)n++;return n;}
    function endRound(crewWon,reason,delay){
      if(ended)return;ended=true;
      E.after(delay==null?0.9:delay,()=>{
        const crewSide=startRole!=='phantom',win=crewWon===crewSide,lines=[];
        const phName=phantom===p?'You were the Phantom.':'The Phantom was '+phantom.name+', the '+phantom.data.cname+' guest.';
        let title,stars=0;
        if(reason==='wrong'){title='Wrong guest!';lines.push('The Detective caught an innocent guest and was zapped out too.');}
        else if(reason==='caught'){title=win?'Phantom caught!':'The Phantom was caught';
          lines.push(caughtBy===p?'You caught the Phantom with the Catcher!':(startRole==='phantom'?'The Detective found you and caught you.':'The Detective caught the Phantom.'));}
        else if(reason==='time'){title=win?'The lights stay on!':'Time ran out';
          lines.push(win?'The clock ran out and the guests are still safe, so the guests win.':'The clock ran out before you zapped every guest.');}
        else if(reason==='allout'){title=win?'Phantom wins!':'The Phantom got everyone';lines.push(win?'You zapped out every guest without getting caught.':'Every other guest was zapped out.');}
        else{title=win?'The guests were ahead':'The Phantom was ahead';
          lines.push('The round was settled by who was ahead: '+(crewWon?'the guests':'the Phantom')+'.');}
        if(startRole!=='phantom'&&!p.alive&&win)lines.push('You were zapped out, but your side won, so you win too.');
        lines.push(phName);
        if(win){
          if(startRole==='guest')stars=(p.outs===0&&coins>=8)?3:p.outs===0?2:1;
          else if(startRole==='detective')stars=caughtBy===p?(caughtAt<=TOTAL/2?3:2):1;
          else stars=(E.time<=TOTAL*2/3)?3:2;
          if(startRole==='guest')lines.push('You collected '+coins+' of '+coinList.length+' coins.');
        }
        E.finish({win,title,stars:win?stars:undefined,lines});
      });
    }
    function resolveAhead(){
      const total=N-1,left=guestsLeft();
      const crewAhead=left>total/2||(det&&det.alive&&det.data.knows);
      endRound(crewAhead,'ahead',0.3);}

    /* ------------------------------------------------ frame */
    const GOAL={guest:'Collect coins and stay near other guests. Spot the Phantom!',detective:'Watch for a zap, then catch the Phantom. Do not catch a guest!',phantom:'Zap guests when nobody can see you.'};
    const ROLE={guest:'a Guest',detective:'the Detective',phantom:'the Phantom'};
    function hud(){
      const left=Math.max(0,TOTAL-E.time),r=roomOf(p.pos.x,p.pos.z),rn=ROOMS[r[1]][r[0]];
      if(p.alive)E.status('You are '+ROLE[p.data.role]+'  |  '+rn+'  |  '+E.fmt(left)+'  |  '+GOAL[p.data.role]);
      else E.status('You were zapped out  |  '+E.fmt(left)+'  |  The round ends soon'+(outAt>=0?' ('+Math.max(0,Math.ceil(outAt+20-E.time))+'s)':''));
      E.score([{label:'Coins',value:coins,color:0xffd23e,me:true},{label:'Guests left',value:guestsLeft(),color:0x35d07f}]);}
    return {
      update(dt){
        if(ended){return;}
        for(const c of E.chars)if(c.alive&&c.brain)botThink(c,dt);
        if(!phantom.alive){caughtAt=E.time;endRound(false,'caught');}
        else if(guestsLeft()===0)endRound(false,'allout');
        else if(E.time>=TOTAL)endRound(true,'time');
        else if(outAt>=0&&E.time>=outAt+20)resolveAhead();
        hud();
      },
      autopilot(dt){if(!p.brain){p.brain=new VG.Brain(p,E);p.brain.skill=0.5;p.brain.arrive=1;}p.data.coiny=(p.data.role==='guest');},
      canDamage(target,by){return !!by&&(by===phantom||by===det);},
      onDeath(c,by){
        if(ended)return;
        if(c===phantom){caughtBy=by;return;}
        if(by===phantom&&phantom&&phantom.alive){zapsDone++;witnessZap(c);E.announce('Someone was zapped out!',1.8);}
        if(c===det){det=null;if(phantom.alive)dropBadge(c);}
        if(c===p){outAt=E.time;fast=true;E.announce('You were zapped out!',3);}
      },
      onCatch(shooter,hit){
        if(ended||!hit||hit===phantom||shooter.data.role!=='detective')return;
        if(shooter===p){endRound(false,'wrong',0.5);E.kill(shooter,null);}else E.kill(shooter,null);
        E.announce('The Detective caught the wrong guest!',3);
      },
      dispose(){}
    };
  }
});
