/* Going Up: ride up through nine challenge floors. Touch the glowing goal on each floor, then be back in the car when the doors close.
   Everything on a floor is built into the world when the elevator starts its ride and removed again before the next ride, so the car
   itself (doors, sign, floor lights) never changes. The car sits at +z, the doors face -z, every room runs away from the doors. */
VG.register({
  id:'last-elevator',name:'Going Up',tagline:'Nine wild floors. Be inside when the doors close.',color:0xffc93c,levels:1,
  howTo:[
    'You start inside the elevator. When the doors slide open, a challenge room is waiting outside.',
    'Touch the glowing star (or grab the coins on the coin floor), then run back inside before the doors close.',
    'Anyone still outside when the doors shut is out of the ride. The car is always safe.',
    'You have three hearts. Hits and falls cost one, and you win one back on every new floor.',
    'Still riding after floor 9? You win. Fewer hits and more coins earn more stars.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle}=VG.util,C=VG.COLORS,W=E.world,T=THREE;
    const TOTAL=9,P=E.player;
    W.killY=-9;E.cam.dist=10;E.cam.pitch=0.58;E.cam.yaw=0;E.cam.minDist=2;

    /* ------------------------------------------------------------ the elevator car (never rebuilt) */
    const car=[];
    function CB(x,y,z,sx,sy,sz,col,o){const b=W.addBox(x,y,z,sx,sy,sz,col,Object.assign({jitter:0},o||{}));car.push(b);return b;}
    const GOLD=0xffc93c,STEEL=0x8d97ad;
    CB(0,-0.5,9.95,11.6,1,12.9,0x59627a);
    CB(0,0.02,9.95,8.6,0.05,10.8,0x2a3248,{solid:false});
    CB(0,0.05,5.8,8.6,0.04,0.16,GOLD,{glow:true,solid:false});CB(0,0.05,14.2,8.6,0.04,0.16,GOLD,{glow:true,solid:false});
    CB(-4.3,0.05,10,0.16,0.04,8.4,GOLD,{glow:true,solid:false});CB(4.3,0.05,10,0.16,0.04,8.4,GOLD,{glow:true,solid:false});
    CB(-5.4,3.5,9.95,0.8,7,12.9,STEEL);CB(5.4,3.5,9.95,0.8,7,12.9,STEEL);CB(0,3.5,16,11.6,7,0.8,STEEL);
    CB(-4.35,3.5,4,2.9,7,1,STEEL);CB(4.35,3.5,4,2.9,7,1,STEEL);CB(0,6,4,5.8,2,1,0x6f7992);
    CB(-2.95,2.5,3.45,0.12,5,0.12,GOLD,{glow:true,solid:false});CB(2.95,2.5,3.45,0.12,5,0.12,GOLD,{glow:true,solid:false});CB(0,4.97,3.45,5.9,0.12,0.12,GOLD,{glow:true,solid:false});
    CB(-4.93,2.9,10,0.1,0.22,12,0x8be9ff,{glow:true,solid:false});CB(4.93,2.9,10,0.1,0.22,12,0x8be9ff,{glow:true,solid:false});
    CB(0,3.3,15.5,8.2,3.6,0.1,0xc4dcef,{solid:false});CB(0,2.5,15.32,8.4,0.18,0.18,0xe3e8f2,{solid:false});
    CB(-4.7,2.5,10,0.18,0.18,10,0xe3e8f2,{solid:false});CB(4.7,2.5,10,0.18,0.18,10,0xe3e8f2,{solid:false});
    const lights=[];for(let i=0;i<TOTAL;i++)lights.push(CB(-4+i,5.7,15.45,0.55,0.55,0.12,0x253049,{glow:true,solid:false}));
    CB(-5.0,6.9,10,0.2,0.25,11.5,0xfff6d8,{glow:true,solid:false});CB(5.0,6.9,10,0.2,0.25,11.5,0xfff6d8,{glow:true,solid:false});
    const doorL=CB(-1.5,2.5,4.75,3.02,5,0.5,0xc3cbdd),doorR=CB(1.5,2.5,4.75,3.02,5,0.5,0xc3cbdd);
    const stL=CB(-0.1,2.5,5.03,0.12,4.6,0.06,GOLD,{glow:true,solid:false}),stR=CB(0.1,2.5,5.03,0.12,4.6,0.06,GOLD,{glow:true,solid:false});
    let doorT=0;
    function setDoors(t){doorT=clamp(t,0,1);const o=doorT*2.95;
      W.moveBox(doorL,-1.5-o,2.5,4.75);W.moveBox(doorR,1.5+o,2.5,4.75);W.moveBox(stL,-0.1-o,2.5,5.03);W.moveBox(stR,0.1+o,2.5,5.03);}
    /* floor sign (outside above the doors, and inside) */
    const cv=document.createElement('canvas');cv.width=512;cv.height=160;const cx=cv.getContext('2d'),tex=new T.CanvasTexture(cv);
    function drawSign(n,name,moving){
      cx.fillStyle='#0d111c';cx.fillRect(0,0,512,160);cx.strokeStyle='#ffc93c';cx.lineWidth=8;cx.strokeRect(6,6,500,148);
      cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=moving?'#ffb020':'#ffe28a';cx.font='700 62px Arial,sans-serif';
      cx.fillText('FLOOR '+n+(moving?' ...':''),256,56);cx.font='700 36px Arial,sans-serif';cx.fillStyle='#8be9ff';cx.fillText(name,256,118);tex.needsUpdate=true;}
    {const m=new T.MeshBasicMaterial({map:tex}),g=new T.PlaneGeometry(5.6,1.75);
      const o=new T.Mesh(g,m);o.position.set(0,6,3.44);o.rotation.y=Math.PI;E.add(o);
      const i=new T.Mesh(g,m);i.position.set(0,5.9,4.56);i.scale.setScalar(0.55);E.add(i);}
    drawSign(1,'Starting up',true);
    let shown=-1;
    function showFloor(i,moving){shown=i;drawSign(i+1,FL[i].name,moving);lights.forEach((b,k)=>W.setColor(b,k===i?0xffd24a:(k<i?0x7a6a2a:0x253049)));}

    /* ------------------------------------------------------------ per-floor building blocks */
    let S=null;
    function B(x,y,z,sx,sy,sz,col,o){const b=W.addBox(x,y,z,sx,sy,sz,col,Object.assign({jitter:0},o||{}));S.boxes.push(b);return b;}
    function SL(x,y,z,sx,sy,sz,col,op){const m=E.slab(x,y,z,sx,sy,sz,col,op);S.objs.push(m);return m;}
    function OBJ(m){E.add(m);S.objs.push(m);return m;}
    function teardown(){
      if(!S)return;
      for(const b of S.boxes)W.removeBox(b);
      for(const o of S.objs){if(o.isGroup){o.traverse(q=>{if(q.geometry)q.geometry.dispose();if(q.material)q.material.dispose();});E.remove(o);}else E.remove(o);}
      for(const p of S.picks)if(E.pickups.indexOf(p)>=0)E.removePickup(p);
      for(const s of S.shots)s.life=0;
      S=null;
    }
    function shell(th,half,back,H){
      H=H||14;const zc=(4+back)/2,len=4-back;
      B(-half-0.5,H/2,zc,1,H,len+1,th.wall);B(half+0.5,H/2,zc,1,H,len+1,th.wall);B(0,H/2,back-0.5,2*half+2,H,1,th.wall);
      const fx=(5.8+half+1)/2,fw=half+1-5.8;B(-fx,H/2,4,fw,H,1,th.wall2);B(fx,H/2,4,fw,H,1,th.wall2);
      for(let z=-5;z>back+2;z-=9){B(-half+0.3,H/2,z,1.6,H,1.6,th.wall2);B(half-0.3,H/2,z,1.6,H,1.6,th.wall2);}
      for(const y of [2.2,Math.min(H-3,11)]){
        B(-half+0.08,y,zc,0.16,0.3,len-1,th.trim,{glow:true,solid:false});B(half-0.08,y,zc,0.16,0.3,len-1,th.trim,{glow:true,solid:false});
        B(0,y,back+0.08,2*half-1,0.3,0.16,th.trim,{glow:true,solid:false});}
    }
    function beacon(x,z,col){
      S.beacon=V(x,0,z);S.bY=0.6;
      B(x,0.3,z,3.4,0.6,3.4,0x2b3148);SL(x,0.64,z,3.8,0.06,3.8,col,0.85);SL(x,12,z,1.5,24,1.5,col,0.2);
      const m=new T.Mesh(new T.OctahedronGeometry(1.15),new T.MeshBasicMaterial({color:0xffe066}));m.position.set(x,2.7,z);OBJ(m);S.star=m;
    }
    function bonus(x,y,z){S.picks.push(E.pickup({pos:V(x,y,z),color:0xffc93c,size:0.5,bots:false,onTake(c){c.data.coins++;}}));}
    function coinLine(a,b,n,y){for(let i=0;i<n;i++){const t=n===1?0.5:i/(n-1);bonus(a.x+(b.x-a.x)*t,y||1.5,a.z+(b.z-a.z)*t);}}
    /* rows of platforms that take turns vanishing (lava floor and the rooftop) */
    function makeRows(defs){return defs.map((d,r)=>({z:d.z,pl:d.pl,st:0,t:rand(2.5,5)+r*0.35,pk:null}));}
    function rowsUpdate(rows,dt,okCol,warnCol){
      for(const row of rows){row.t-=dt;
        if(row.st===0&&row.t<=0){row.st=1;row.t=1.6;row.pk=pick(row.pl);}
        else if(row.st===1){const pl=row.pk;if(pl.box)W.setColor(pl.box,Math.floor(E.time*9)%2?warnCol:okCol);pl.warn=true;
          if(row.t<=0){if(pl.box){E.fx.burst(V(pl.x,0,pl.z),warnCol,10,6,0.4);W.removeBox(pl.box);pl.box=null;}pl.warn=false;row.st=2;row.t=2.4;}}
        else if(row.st===2&&row.t<=0){const pl=row.pk;pl.box=B(pl.x,pl.y,pl.z,pl.sx,pl.sy,pl.sz,okCol);row.st=0;row.t=rand(3,5.5);}}
    }
    function rowAI(rows){return (c,fwd)=>{
      if(c.onGround&&c.ground){for(const row of rows)for(const pl of row.pl)if(pl.warn&&pl.box&&pl.box===c.ground){
        let b2=null,bd=1e9;for(const q of row.pl){if(q===pl||!q.box||q.warn)continue;const d=Math.hypot(q.x-c.pos.x,q.z-c.pos.z);if(d<bd){bd=d;b2=q;}}
        if(b2)return V(b2.x,0,b2.z);}}
      const z=c.pos.z;let r=-1;
      if(fwd){for(let i=0;i<rows.length;i++)if(rows[i].z<z-1.2){r=i;break;}}
      else{for(let i=rows.length-1;i>=0;i--)if(rows[i].z>z+1.2){r=i;break;}}
      if(fwd&&z>rows[0].z+6)return null;
      if(r<0)return fwd&&S.beacon?V(S.beacon.x,0,S.beacon.z):null;
      let best=null,bd=1e9;for(const p of rows[r].pl){if(!p.box||p.warn)continue;const d=Math.abs(p.x-c.pos.x);if(d<bd){bd=d;best=p;}}
      if(!best)best=rows[r].pl[0];return V(best.x,0,best.z);};}
    /* sweeper bars: the player jumps over them */
    function barAI(c,bars,skill){
      if(!c.onGround||(c.data.noJ||0)>E.time)return;
      for(const b of bars){const dz=b.z-c.pos.z;if(Math.abs(dz)>9)continue;if(b.x1!=null&&Math.abs(c.pos.x-b.x1)>b.hw+1)continue;
        const rel=c.vel.z-b.vz;if(Math.abs(rel)<1.5||dz*rel<=0)continue;
        const tc=(Math.abs(dz)-0.9)/Math.abs(rel);
        if(tc>0&&tc<0.3+(1-skill)*0.3*c.data.jit){c.vel.y=c.jumpV;c.data.noJ=E.time+0.8;return;}}
    }
    function fleeGoal(c,ax,az){let dx=c.pos.x-ax,dz=c.pos.z-az;const m=Math.hypot(dx,dz)||1;dx/=m;dz/=m;
      return V(clamp(c.pos.x+dx*7,-21,21),0,Math.min(c.pos.z+dz*7,2.5));}
    /* sidestep a moving hazard while still making progress toward the goal */
    function sideGoal(c,ax,az){const side=(c.pos.x-ax)>=0?1:-1,dz=c.data.n>=FL[fi].need?3:-3;
      return V(clamp(c.pos.x+side*9,-21,21),0,Math.min(c.pos.z+dz,2.5));}
    const inCar=c=>c.pos.z>5.05&&Math.abs(c.pos.x)<5&&c.pos.y>-1.5&&c.pos.y<4;
    const hd=(c,p)=>Math.hypot(c.pos.x-p.x,c.pos.z-p.z);
    function hurt(c,kx,kz,pow){
      if(!c.alive||c.invuln>0||E.over||inCar(c))return false;
      const d=c.data;d.lives--;d.hurts++;c.invuln=1.8;
      const m=Math.hypot(kx,kz)||1;c.vel.x=kx/m*(pow||11);c.vel.z=kz/m*(pow||11);c.vel.y=9;c.onGround=false;
      E.fx.burst(c.chest(),[0xff4d5e,0xffffff,0xffc93c],14,8,0.3);
      if(c===P){E.shake(0.4);E.sfx('hit');E.announce(d.lives>0?'Ouch! Hearts left: '+d.lives:'Out of hearts!',1.4);syncHp();}
      if(d.lives<=0){d.final=true;E.kill(c,null);}
      return true;}
    function syncHp(){P.hp=Math.max(1,P.data.lives/P.data.max*100);}

    /* ------------------------------------------------------------ the nine floors */
    const FL=[
    /* 1 ---------------------------------------------------------------- Coin Rush */
    {name:'Coin Rush',goal:'Grab 4 coins, then hop back in the elevator.',time:26,need:4,
     th:{sky:[0x2b1b6b,0xff8fd0,0x9a5ac0,70,300],light:[0.8,0.6,0xfff0f6],wall:0x7a58c8,wall2:0x5a3da8,trim:0xffd24a},
     build(th){
       shell(th,24,-52,14);
       for(let i=0;i<8;i++)for(let j=0;j<8;j++)B(-21+i*6,-0.5,0.5-j*7,6,1,7,(i+j)%2?0xff7ac8:0xffe3f3);
       const stand=(px,pz,s)=>{B(px,3,pz,8,6,8,0xffd24a);
         for(let h=1;h<=5;h++)B(px+s*(4+(5-h)*1.6+0.8),h/2,pz,1.6,h,3,0xffe08a);
         for(const dx of [-2,0,2])bonus(px+dx,7.4,pz);};
       stand(-19,-34,1);stand(19,-16,-1);
       S.coins=[];
       for(const gx of [-20,-12,-4,4,12,20])for(const gz of [-6,-14,-22,-30,-38,-46]){
         const x=gx+rand(-1.5,1.5),z=gz+rand(-1.5,1.5);
         if((x<-6&&z<-27&&z>-42)||(x>6&&z>-22&&z<-10))continue;
         const p=E.pickup({pos:V(x,1.5,z),color:0xffc93c,size:0.6,respawn:6,onTake(c){return take(c);}});S.picks.push(p);S.coins.push(p);}
       function take(c){const d=c.data;d.n++;d.coins++;if(d.n===FL[0].need&&c===P)E.announce('Enough coins! Back to the elevator!',2.2);}
       S.target=c=>{const d=c.data;if(d.ct&&d.ct.on&&d.cte>E.time)return d.ct.m.position;
         let best=null,bd=1e9;for(const p of S.coins){if(!p.on)continue;const q=Math.hypot(p.m.position.x-c.pos.x,p.m.position.z-c.pos.z)+rand(0,3);if(q<bd){bd=q;best=p;}}
         d.ct=best;d.cte=E.time+1.2;return best?best.m.position:V(0,0,-20);};
       S.upd=dt=>{};
     }},
    /* 2 ---------------------------------------------------------------- Lava Hop */
    {name:'Lava Hop',goal:'Hop the stones to the star. Flashing stones are about to vanish!',time:40,need:1,
     th:{sky:[0x1a0505,0xff5a1a,0x6a1c08,45,190],light:[0.5,0.4,0xffb070],wall:0x4a2a22,wall2:0x2e1a15,trim:0xff6a1a,kill:-7},
     build(th){
       shell(th,24,-66,14);
       S.lava=SL(0,-1.7,-31,48,0.4,74,0xff5a14,1);
       S.crust=[];for(let i=0;i<12;i++)S.crust.push({m:SL(rand(-20,20),-1.47,rand(-62,-4),rand(5,11),0.05,rand(4,9),0xb8300c,0.9),x:rand(-20,20),sp:rand(0.3,0.8)*(Math.random()<0.5?-1:1),ph:rand(0,6)});
       B(0,-0.5,1,18,1,6,0x6a7390);
       const defs=[];
       for(let r=0;r<6;r++){const z=-6-8*r,pl=[];for(const x of [-8,0,8]){const q={x,y:-0.5,z,sx:5.6,sy:1,sz:5.6,warn:false};q.box=B(x,-0.5,z,5.6,1,5.6,0x5b6a8a);pl.push(q);}defs.push({z,pl});}
       S.rows=makeRows(defs);S.rowAI=rowAI(S.rows);
       B(0,-0.5,-57.5,18,1,13,0x7a88aa);beacon(0,-57.5,0xffe066);
       S.pts=[];S.hop=true;S.sm=0.75;
       for(const r of S.rows)if(Math.random()<0.5)bonus(pick(r.pl).x,1.5,r.z);
       let em=0;
       S.upd=dt=>{rowsUpdate(S.rows,dt,0x5b6a8a,0xff5a4a);
         S.lava.material.color.setHex(Math.floor(E.time*3)%2?0xff5a14:0xff7a22);
         for(const k of S.crust)k.m.position.x=clamp(k.x+Math.sin(E.time*k.sp+k.ph)*6,-21,21);
         em-=dt;if(em<=0){em=0.18;E.fx.burst(V(rand(-20,20),-1.2,rand(-58,-8)),[0xffb040,0xff6a1a],2,5,0.3,{gravity:0.5,life:1.1});}};
       S.ai=null;
     }},
    /* 3 ---------------------------------------------------------------- Laser Grid */
    {name:'Laser Grid',goal:'Jump over the red laser bars, then touch the star.',time:36,need:1,
     th:{sky:[0x07040f,0x3a1060,0x160a2c,30,150],light:[0.85,0.4,0xd8c0ff],wall:0x2a2352,wall2:0x2d2557,trim:0xff2d95},
     build(th){
       shell(th,13,-62,12);
       B(0,-0.5,-29,26,1,66,0x2a2350);
       for(let z=0;z>-62;z-=4)B(0,0.03,z,26,0.04,0.12,0x6a55d0,{glow:true,solid:false});
       for(const x of [-8,0,8])B(x,0.03,-29,0.12,0.04,66,0x6a55d0,{glow:true,solid:false});
       const bars=S.bars=[];
       [[-12,3,2.8,0],[-24,3,3.2,1.7],[-36,3,2.6,3.1],[-48,3,3.0,0.6]].forEach(a=>{
         const zc=a[0],amp=a[1];
         const b=B(0,0.55,zc,24.8,0.5,0.45,0xff2d55,{glow:true,solid:false}),halo=SL(0,0.55,zc,24.8,1.1,1.0,0xff5a7a,0.28);
         const e1=B(-12.4,0.8,zc,0.9,1.7,1.4,0x3a2d5c,{solid:false}),e2=B(12.4,0.8,zc,0.9,1.7,1.4,0x3a2d5c,{solid:false});
         B(-12.3,0.03,zc,0.15,0.05,2*amp+1.4,0xff5a7a,{glow:true,solid:false});B(12.3,0.03,zc,0.15,0.05,2*amp+1.4,0xff5a7a,{glow:true,solid:false});
         bars.push({b,halo,e1,e2,zc,amp,per:a[2],ph:a[3],z:zc,vz:0});});
       beacon(0,-57,0xffe066);S.pts=[V(0,0,-8)];
       for(const z of [-18,-30,-42])bonus(0,1.5,z);
       S.upd=dt=>{
         for(const b of bars){const w=6.2832/b.per;b.z=b.zc+b.amp*Math.sin(E.time*w+b.ph);b.vz=b.amp*w*Math.cos(E.time*w+b.ph);
           W.moveBox(b.b,0,0.55,b.z);b.halo.position.z=b.z;W.moveBox(b.e1,-12.4,0.8,b.z);W.moveBox(b.e2,12.4,0.8,b.z);
           for(const c of E.chars){if(!c.alive||inCar(c))continue;if(Math.abs(c.pos.z-b.z)<0.85&&c.pos.y<0.95)hurt(c,0,c.pos.z>b.z?1:-1,12);}}};
       S.ai=(c,skill)=>{barAI(c,bars,skill);return null;};
     }},
    /* 4 ---------------------------------------------------------------- Crash Floor */
    {name:'Crash Floor',goal:'Ceiling tiles fall where the red marks are. Dodge them and touch the star.',time:30,need:1,
     th:{sky:[0x14161c,0x6a5f3a,0x3a3626,40,190],light:[0.7,0.45,0xffe0a0],wall:0x5d6370,wall2:0x40454f,trim:0xffc93c},
     build(th){
       shell(th,24,-54,14);
       B(0,-0.5,-25,48,1,58,0x4a505c);
       for(let i=0;i<12;i++){B(-23.2,0.03,3-i*4.5,0.7,0.04,2.2,i%2?0xffc93c:0x20232b,{solid:false});B(23.2,0.03,3-i*4.5,0.7,0.04,2.2,i%2?0xffc93c:0x20232b,{solid:false});}
       for(const x of [-12,12])B(x,0.03,-25,0.2,0.04,56,0x5d6370,{solid:false});
       beacon(0,-45,0xffe066);S.pts=[V(0,0,-14),V(0,0,-28)];
       coinLine(V(-10,0,-12),V(10,0,-36),6);
       S.marks=[];S.fall=[];S.acc=0;
       S.upd=dt=>{
         S.acc+=dt;const rate=0.6;
         if(S.acc>=rate){S.acc-=rate;
           const live=E.living(c=>!inCar(c));let x,z;
           if(live.length&&Math.random()<0.6){const t=pick(live);x=t.pos.x+t.vel.x*0.5+rand(-3,3);z=t.pos.z+t.vel.z*0.5+rand(-3,3);}else{x=rand(-21,21);z=rand(-48,-3);}
           x=clamp(x,-21.5,21.5);z=clamp(z,-50,-2);
           S.marks.push({x,z,t:1.3,m:SL(x,0.07,z,4.6,0.1,4.6,0xff4b3a,0.5)});}
         for(let i=S.marks.length-1;i>=0;i--){const m=S.marks[i];m.t-=dt;m.m.material.opacity=0.35+0.3*Math.abs(Math.sin(E.time*14));
           if(m.t<=0){E.remove(m.m);const k=S.objs.indexOf(m.m);if(k>=0)S.objs.splice(k,1);S.marks.splice(i,1);
             S.fall.push({x:m.x,z:m.z,y:16,b:B(m.x,16,m.z,4.2,1,4.2,0xf0a020,{solid:false}),land:0});}}
         for(let i=S.fall.length-1;i>=0;i--){const f=S.fall[i];
           if(f.land===0){f.y-=70*dt;if(f.y<=0.5){f.y=0.5;f.land=0.6;
               for(const c of E.chars){if(!c.alive||inCar(c))continue;if(Math.abs(c.pos.x-f.x)<2.3&&Math.abs(c.pos.z-f.z)<2.3&&c.pos.y<1.6)hurt(c,c.pos.x-f.x,c.pos.z-f.z,10);}
               E.fx.burst(V(f.x,0.6,f.z),[0xb9b2a0,0xf0a020],12,8,0.4,{life:0.9});if(hd(P,{x:f.x,z:f.z})<14)E.shake(0.18);}
             W.moveBox(f.b,f.x,f.y,f.z);}
           else{f.land-=dt;if(f.land<=0){W.removeBox(f.b);S.fall.splice(i,1);}}}};
       S.ai=(c,skill)=>{const d=c.data;
         for(const m of S.marks){const age=1.3-m.t;if(age<(1-skill)*0.5+0.1)continue;
           if(Math.abs(c.pos.x-m.x)<3.4&&Math.abs(c.pos.z-m.z)<3.4)return fleeGoal(c,m.x,m.z);}
         return null;};
     }},
    /* 5 ---------------------------------------------------------------- Ice Rink */
    {name:'Ice Rink',goal:'The floor is slippery! Slide around the holes and touch the star.',time:32,need:1,
     th:{sky:[0x6fbfff,0xe6f7ff,0xcdeeff,70,260],light:[0.9,0.7,0xffffff],wall:0xcfe8ff,wall2:0xa9d0f2,trim:0x7ad8ff,kill:-9},
     build(th){
       shell(th,20,-54,12);
       const holes=['..........','..........','..XX......','..XX......','......XX..','......XX..','...XX.....','...XX.....','.......XX.','.......XX.','X....X...X','X....X...X','..........','..........'];
       for(let r=0;r<14;r++)for(let i=0;i<10;i++){if(holes[r][i]==='X')continue;
         B(-18+i*4,-0.6,2-r*4,4,1.2,4,(i+r)%2?0xbfe9ff:0xd8f4ff,{tag:'ice'});}
       SL(0,-4,-26,40,0.3,60,0x0b2a55,1);
       for(let r=0;r<14;r++)for(let i=0;i<10;i++)if(holes[r][i]==='X'&&Math.random()<0.5)B(-18+i*4,-1.5,2-r*4,3.6,0.1,3.6,0x1d5aa8,{glow:true,solid:false});
       beacon(0,-50,0xffe066);S.pts=[V(2,0,-6),V(2,0,-20),V(2,0,-36)];
       coinLine(V(2,0,-10),V(2,0,-42),7);
       S.upd=dt=>{const f=Math.min(1,dt*7.5);
         for(const c of E.chars){if(!c.alive)continue;const d=c.data;
           if(c.onGround&&c.ground&&c.ground.tag==='ice'){if(d.vx!=null){c.vel.x=d.vx+(c.vel.x-d.vx)*f;c.vel.z=d.vz+(c.vel.z-d.vz)*f;}d.vx=c.vel.x;d.vz=c.vel.z;}else d.vx=null;}};
       S.ai=null;
     }},
    /* 6 ---------------------------------------------------------------- Lights Out */
    {name:'Lights Out',goal:'It is dark! Follow the green glow to the star and stay out of the spotlight.',time:38,need:1,
     th:{sky:[0x03040a,0x0b0e22,0x04050c,16,80],light:[0.32,0.08,0xaab4ff],wall:0x1b2138,wall2:0x242b48,trim:0x35ff8a},
     build(th){
       shell(th,24,-54,14);
       B(0,-0.5,-25,48,1,58,0x1c2238);
       for(let z=-2;z>-48;z-=4)B(0,0.04,z,0.7,0.06,0.7,0x35ff8a,{glow:true,solid:false});
       const pil=[[-12,-14],[11,-12],[-16,-26],[15,-24],[-9,-36],[10,-38],[-18,-44],[17,-46],[6,-30],[-6,-20]];
       for(const q of pil){B(q[0],5,q[1],3,10,3,0x2a3150);B(q[0],10.2,q[1],3.4,0.4,3.4,0x35ff8a,{glow:true,solid:false});}
       beacon(0,-50,0x6dff9a);S.pts=[V(0,0,-10),V(0,0,-26),V(0,0,-40)];
       coinLine(V(0,0,-14),V(0,0,-40),6);
       const g=new T.Group();
       const disk=new T.Mesh(new T.CylinderGeometry(5.5,5.5,0.14,32),new T.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.4,depthWrite:false}));disk.position.y=0.12;
       const cone=new T.Mesh(new T.CylinderGeometry(1.0,5.5,22,32,1,true),new T.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0.12,side:T.DoubleSide,depthWrite:false}));cone.position.y=11;
       g.add(disk,cone);OBJ(g);const sp=S.spot={x:0,z:-30};g.position.set(sp.x,0,sp.z);
       S.upd=dt=>{
         let best=null,bd=17;for(const c of E.chars){if(!c.alive||inCar(c)||c.pos.z>-14||c.data.n>=1)continue;const q=Math.hypot(c.pos.x-sp.x,c.pos.z-sp.z);if(q<bd){bd=q;best=c;}}
         const tx=best?best.pos.x:16*Math.sin(E.time*0.45),tz=best?best.pos.z:-28+14*Math.sin(E.time*0.33+1),dd=Math.hypot(tx-sp.x,tz-sp.z);
         if(dd>0.3){const k=Math.min(dd,4.6*dt)/dd;sp.x+=(tx-sp.x)*k;sp.z+=(tz-sp.z)*k;}
         sp.z=clamp(sp.z,-40,-10);g.position.set(sp.x,0,sp.z);disk.material.opacity=0.34+0.1*Math.sin(E.time*5);
         for(const c of E.chars){if(!c.alive||inCar(c))continue;if(Math.hypot(c.pos.x-sp.x,c.pos.z-sp.z)<5.0&&c.pos.y<2.5)hurt(c,c.pos.x-sp.x,c.pos.z-sp.z,12);}};
       S.ai=(c,skill)=>{if(Math.hypot(c.pos.x-sp.x,c.pos.z-sp.z)<8.6&&Math.random()<0.5+0.5*skill)return sideGoal(c,sp.x,sp.z);return null;};
     }},
    /* 7 ---------------------------------------------------------------- Ball Storm */
    {name:'Ball Storm',goal:'Giant bouncy balls are falling! Dodge them and touch the star.',time:28,need:1,
     th:{sky:[0x5a2a9a,0xff9ad5,0xb06ad0,70,260],light:[0.85,0.55,0xffffff],wall:0x7a3fbf,wall2:0x5a2a99,trim:0x7affea},
     build(th){
       shell(th,22,-58,32);
       for(let i=0;i<6;i++)for(let j=0;j<8;j++)B(-18.3+i*7.33,-0.5,0.5-j*7.4,7.33,1,7.4,(i+j)%2?0xfff0fa:0xffb3e0);
       beacon(0,-52,0xffe066);S.pts=[V(0,0,-14),V(0,0,-30)];
       coinLine(V(-8,0,-10),V(8,0,-44),6);
       S.balls=[];S.acc=0;const cols=[0xff6fb5,0x22c9c2,0xffc93c,0xa56bff,0xff8a3c,0x35d07f];
       S.upd=dt=>{
         S.acc+=dt;S.balls=S.balls.filter(s=>s.life>0);
         if(S.acc>=0.8&&S.balls.length<12){S.acc=0;
           const s=E.drop(V(rand(-19,19),30,rand(-52,-4)),V(rand(-6,6),-4,rand(-6,6)),{r:1.6,dmg:0,life:9,grav:1,bounce:0.86,color:pick(cols),
             onHit(c,sh){if(!inCar(c))hurt(c,sh.vel.x,sh.vel.z,13);}});
           S.balls.push(s);S.shots.push(s);}};
       S.ai=(c,skill)=>{let best=null,bd=6.4;
         for(const s of S.balls){if(s.life<=0||s.pos.y>8)continue;const q=Math.hypot(s.pos.x-c.pos.x,s.pos.z-c.pos.z);if(q<bd){bd=q;best=s;}}
         if(best&&Math.random()<0.5+0.5*skill)return fleeGoal(c,best.pos.x,best.pos.z);return null;};
     }},
    /* 8 ---------------------------------------------------------------- Conveyor Chaos */
    {name:'Conveyor Chaos',goal:'The belts push you sideways. Cross them and touch the star!',time:32,need:1,
     th:{sky:[0x182030,0x56627f,0x2a3350,50,230],light:[0.65,0.5,0xfff0d0],wall:0x39465e,wall2:0x2a3448,trim:0xffb020,kill:-9},
     build(th){
       shell(th,24,-56,14);
       B(0,-0.5,1.5,24,1,5,0x7a8196);
       SL(0,-6,-27,48,0.3,64,0x10131f,1);
       B(-12.3,-0.3,-26,0.3,0.4,60,0xff3b3b,{glow:true,solid:false});B(12.3,-0.3,-26,0.3,0.4,60,0xff3b3b,{glow:true,solid:false});
       const defs=[[-1,-9,1],[-12,-20,-1],[-23,-31,1],[-34,-42,-1]];S.belts=[];S.stripes=[];
       defs.forEach(d=>{const zc=(d[0]+d[1])/2,dir=d[2];
         const b=B(0,-0.5,zc,24,1,8,0x2f3440,{tag:'belt',data:{dir}});S.belts.push(b);
         for(let k=0;k<6;k++){const s=B(0,0.03,zc,1.1,0.05,6.4,0xffb020,{glow:true,solid:false});S.stripes.push({b:s,dir,zc,k});}});
       for(const z of [-10.5,-21.5,-32.5]){B(0,-0.5,z,24,1,3,0x9aa1b5);B(0,0.03,z,24,0.04,0.3,0xffc93c,{glow:true,solid:false});}
       B(0,-0.5,-48,24,1,12,0x7a8196);beacon(0,-48.5,0xffe066);
       S.pts=[V(0,0,-10.5),V(0,0,-21.5),V(0,0,-32.5),V(0,0,-44)];
       coinLine(V(0,0,-10.5),V(0,0,-44),6);
       const SPD=8.5;
       S.upd=dt=>{
         for(const c of E.chars){if(!c.alive||!c.onGround||!c.ground||c.ground.tag!=='belt')continue;c.pos.x+=c.ground.data.dir*SPD*dt;}
         for(const s of S.stripes){const off=((s.k*4+E.time*SPD*s.dir)%24+24)%24-12;W.moveBox(s.b,off,0.03,s.zc);}};
       S.ai=null;
     }},
    /* 9 ---------------------------------------------------------------- Rooftop Dash */
    {name:'Rooftop Dash',goal:'The last dash! Cross the roofs, jump the laser bar and touch the star.',time:40,need:1,
     th:{sky:[0x2f4fb8,0xffa860,0xffc890,140,520],light:[0.8,0.8,0xffe2b0],kill:-14},
     build(th){
       const rf=(x,z,sx,sz,col)=>{const b=B(x,-0.6,z,sx,1.2,sz,col||0xe9e2d6);for(const q of [-1,1]){B(x+q*(sx/2-0.2),0.03,z,0.3,0.05,sz,0xffc93c,{glow:true,solid:false});B(x,0.03,z+q*(sz/2-0.2),sx,0.05,0.3,0xffc93c,{glow:true,solid:false});}return b;};
       rf(0,0.5,18,7);rf(0,-10.5,9,8);
       B(0,-0.6,-24,3.2,1.2,12,0xffd24a);B(-1.5,0.05,-24,0.14,0.05,12,0xffffff,{glow:true,solid:false});B(1.5,0.05,-24,0.14,0.05,12,0xffffff,{glow:true,solid:false});
       rf(0,-38.5,12,10);
       const bar={z:-38.5,vz:0,zc:-38.5,amp:3,per:3.2,hw:6};
       bar.b=B(0,0.55,-38.5,11.4,0.5,0.45,0xff2d55,{glow:true,solid:false});bar.halo=SL(0,0.55,-38.5,11.4,1.1,1.0,0xff5a7a,0.28);bar.x1=0;S.bars=[bar];
       const defs=[];for(const z of [-49,-56.5]){const pl=[];for(const x of [-3.2,3.2]){const q={x,y:-0.6,z,sx:5.6,sy:1.2,sz:5.2,warn:false};q.box=B(x,-0.6,z,5.6,1.2,5.2,0xe9e2d6);pl.push(q);}defs.push({z,pl});}
       S.rows=makeRows(defs);S.rowAI=rowAI(S.rows);
       rf(0,-68,16,12,0xfff0c0);beacon(0,-68,0xffe066);
       S.pts=[V(0,0,-10.5),V(0,0,-13.6),V(0,0,-19),V(0,0,-29),V(0,0,-37.5)];S.hop=true;S.sm=0.75;
       coinLine(V(0,0,-20),V(0,0,-29),4);bonus(0,1.5,-10.5);bonus(0,1.5,-38.5);
       /* the city far below (all tops sit under the kill height so nobody lands on them) */
       for(let i=0;i<60;i++){const x=rand(-100,100),z=rand(-170,40);if(Math.abs(x)<16&&z>-86)continue;
         const w=rand(7,15),dd=rand(7,15),top=-rand(22,50),col=pick([0x2a3a66,0x33447a,0x3b2f5c,0x4a3b6e]);
         B(x,top-30,z,w,60,dd,col);if(Math.random()<0.7)B(x,top-1.5,z+dd/2+0.06,w*0.7,1,0.12,0xffd27a,{glow:true,solid:false});}
       S.upd=dt=>{
         const w=6.2832/bar.per;bar.z=bar.zc+bar.amp*Math.sin(E.time*w);bar.vz=bar.amp*w*Math.cos(E.time*w);
         W.moveBox(bar.b,0,0.55,bar.z);bar.halo.position.z=bar.z;
         for(const c of E.chars){if(!c.alive||inCar(c))continue;if(Math.abs(c.pos.x)<6.2&&Math.abs(c.pos.z-bar.z)<0.85&&c.pos.y<0.95&&c.pos.z<-33)hurt(c,0,c.pos.z>bar.z?1:-1,12);}
         rowsUpdate(S.rows,dt,0xe9e2d6,0xff5a4a);};
       S.ai=(c,skill)=>{barAI(c,S.bars,skill);return null;};
     }}
    ];

    /* ------------------------------------------------------------ riders */
    const SPOTS=[[0,7.6],[-2.6,9],[2.6,9],[-1.3,10.6],[1.3,10.6],[-3,12],[3,12]];
    const bots=E.bots(6),riders=[P].concat(bots);
    riders.forEach((c,i)=>{
      const mx=3;
      Object.assign(c.data,{lane:c===P?0:rand(-1.1,1.1),base:1,hopT:0,max:mx,lives:mx,n:0,wi:0,coins:0,hurts:0,out:false,final:false,pending:false,skill:c===P?1:rand(0.7,0.97),jit:rand(-1,1),spot:V(SPOTS[i][0],0,SPOTS[i][1]),ar:1.2,fT:0,fg:null});
      c.teleport(SPOTS[i][0],0.05,SPOTS[i][1]);c.yaw=Math.PI;
      c.data.base=c===P?1:rand(0.9,1);if(c!==P)c.brain.arrive=1;
    });
    syncHp();

    /* ------------------------------------------------------------ flow */
    let fi=0,fl=FL[0],ph='ride',pt=3.0,tl=0,elapsed=0,ct=0,aboard=0,warned=0,evald=false,over=false,lostWhy='',ticker=-1;
    function ding(){const s=VG.sfx;if(!s||!s.on||!s.ctx){return;}
      try{const c=s.ctx,t=c.currentTime;[[988,0],[740,0.2]].forEach(a=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=a[0];
        g.gain.setValueAtTime(0.0001,t+a[1]);g.gain.exponentialRampToValueAtTime(0.09,t+a[1]+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+a[1]+0.7);
        o.connect(g);g.connect(c.destination);o.start(t+a[1]);o.stop(t+a[1]+0.75);});}catch(e){}}
    function startFloor(i){
      teardown();fi=i;fl=FL[i];S={boxes:[],objs:[],picks:[],shots:[],pts:[],upd:null,ai:null,target:null,rowAI:null,beacon:null};
      const th=fl.th;E.setSky.apply(E,th.sky);E.setLight(th.light[0],th.light[1],th.light[2]);W.killY=th.kill||-9;
      fl.build(th);
      for(const c of riders){const d=c.data;if(d.out)continue;d.n=0;d.wi=0;d.ct=null;d.fT=0;d.vx=null;d.noJ=0;if(i>0)d.lives=Math.min(d.max,d.lives+1);}
      syncHp();ph='ride';pt=3.0;ct=0;
    }
    function allAboard(){let k=0;for(const c of riders){const d=c.data;if(d.out)continue;if(!c.alive||d.pending||!inCar(c)||d.n<fl.need)return false;k++;}return k>0;}
    function closeDoors(){ph='closing';ct=0;evald=false;E.sfx('alarm');E.announce('Doors closing!',1.4);}
    function markOut(c){const d=c.data;if(d.out)return;d.out=true;if(c===P){if(!lostWhy)lostWhy='hearts';scheduleLose();}}
    let loseSet=false;
    function scheduleLose(){if(loseSet)return;loseSet=true;E.after(1.7,()=>{if(E.over)return;over=true;
      E.finish({win:false,title:lostWhy==='doors'?'Left behind':lostWhy==='task'?'Floor not finished':'Out of hearts',lines:[lostWhy==='doors'?'The doors closed before you got back inside.':lostWhy==='task'?'You stayed in the elevator, but the floor goal was not finished. Go out and touch the star or grab the coins!':'You ran out of hearts on floor '+(fi+1)+'.',
        'You rode through '+fi+' of '+TOTAL+' floors. Give it another go!']});});}
    function evaluate(){
      let left=0;
      for(const c of riders){const d=c.data;if(d.out)continue;
        const ok=c.alive&&inCar(c)&&d.n>=fl.need;
        if(!ok){left++;d.final=true;if(c===P&&!lostWhy)lostWhy=(c.alive&&inCar(c))?'task':'doors';if(c.alive)E.kill(c,null);else markOut(c);}}
      if(P.data.out)return;
      E.announce(left>0?left+' rider'+(left>1?'s':'')+' left behind':'Everyone made it!',2);
    }
    function win(){
      if(over)return;over=true;const d=P.data,h=d.hurts,coins=d.coins;
      let stars=h<=1?3:h<=4?2:1;if(coins>=14&&stars<3)stars++;
      E.finish({win:true,title:'You reached the top!',stars,lines:['You rode all '+TOTAL+' floors and were inside every time the doors closed.','Hearts lost: '+h+'. Coins grabbed: '+coins+'.']});}

    /* stepping stones: jump exactly at the edge, or wait if no stone is in reach */
    function hopAI(c){
      const br=c.brain,g=br&&br.goal;if(!g||!c.onGround||c.pos.y<-0.5||(c.data.hopT||0)>E.time)return false;
      let dx=g.x-c.pos.x,dz=g.z-c.pos.z;const m=Math.hypot(dx,dz);if(m<1.2)return false;dx/=m;dz/=m;
      if(W.groundY(c.pos.x+dx*0.8,c.pos.z+dz*0.8,c.pos.y+1.2)>-1e8)return false;
      const sp=c.speed*br.speedMul,L=sp*0.72;
      for(const k of [L*0.5,L*0.7,L*0.9,L*1.1]){if(W.groundY(c.pos.x+dx*k,c.pos.z+dz*k,c.pos.y+2.5)>-1e8){c.vel.y=c.jumpV;c.vel.x=dx*sp;c.vel.z=dz*sp;c.data.hopT=E.time+0.5;return false;}}
      c.vel.x=0;c.vel.z=0;return true;}
    /* riders' brains: the computer riders use skill below 1, the autopilot uses 1 */
    function lane(p,d){return S.hop?p:V(p.x+d.lane,p.y,p.z);}
    function drive(c,skill,dt){
      const d=c.data,br=c.brain;if(!br||!c.alive||d.out)return;
      let goal=null;const inc=inCar(c),AR=S.hop?1.1:2.2;
      const rideLike=ph==='ride'||(ph==='opening'&&doorT<0.75)||over;
      if(rideLike){goal=d.spot;d.ar=0.6;}
      else{
        const got=d.n>=fl.need;
        if(got||ph==='closing'){
          if(inc){goal=d.spot;d.ar=0.6;}
          else{
            let g=null;if(S.rowAI)g=S.rowAI(c,false);
            if(g){goal=g;d.ar=0.9;}
            else{const P2=S.pts;while(d.wi>0&&hd(c,P2[d.wi-1])<AR)d.wi--;
              if(d.wi>0){goal=lane(P2[d.wi-1],d);d.ar=1.4;}
              else if(c.pos.z<4.4&&hd(c,{x:0,z:3})>1.6){goal=V(0,0,3);d.ar=1.0;}
              else{goal=d.spot;d.ar=0.6;}}
          }
        }else{
          if(c.pos.z>3.9){goal=V(0,0,2);d.ar=1.0;}
          else if(S.target){goal=S.target(c);d.ar=1.2;}
          else{let g=null;if(S.rowAI)g=S.rowAI(c,true);
            if(g){goal=g;d.ar=0.9;}
            else{const P2=S.pts;while(d.wi<P2.length&&hd(c,P2[d.wi])<AR)d.wi++;
              if(d.wi<P2.length){goal=lane(P2[d.wi],d);d.ar=1.4;}else{goal=S.beacon;d.ar=0.8;}}}
        }
        if(S.ai&&!inc&&ph==='play'){const o=S.ai(c,skill,dt);if(o){d.fg=o;d.fT=0.4;}}
        if(d.fT>0){d.fT-=dt;if(!inc&&ph==='play')goal=d.fg;}
        br.speedMul=d.base*(S.sm||1)*((ph==='closing'||(tl<6&&got))?1.12:1);br.fearless=!!S.hop;
        if(S.hop&&!inc&&ph==='play'&&hopAI(c))goal=null;
      }
      br.goal=goal;br.arrive=d.ar||1.2;
    }

    /* ------------------------------------------------------------ the loop */
    function update(dt){
      if(E.over)return;
      /* phases */
      pt-=dt;
      if(ph==='ride'){
        E.shake(0.05);
        if(shown!==fi&&pt<1.5){showFloor(fi,true);E.sfx('tick');}
        if(shown<0){showFloor(0,true);}
        if(pt<=0){showFloor(fi,false);ph='opening';pt=1.1;ding();E.announce('Floor '+(fi+1)+': '+fl.name,2.6);E.sfx('pickup');}
      }else if(ph==='opening'){
        setDoors(doorT+dt/1.1);
        if(doorT>=1&&pt<=0){ph='play';tl=fl.time;elapsed=0;warned=0;aboard=0;ticker=-1;E.announce(fl.goal,3.4);}
      }else if(ph==='play'){
        tl-=dt;elapsed+=dt;
        if(tl<=5.5&&!warned){warned=1;E.announce('Doors closing soon!',1.5);E.sfx('alarm');}
        const sec=Math.ceil(tl);if(tl<=4&&sec!==ticker){ticker=sec;E.sfx('tick');}
        if(elapsed>4&&allAboard()){aboard+=dt;if(aboard>0.9){E.announce('All aboard!',1.2);closeDoors();}}else aboard=0;
        if(tl<=0)closeDoors();
      }else if(ph==='closing'){
        ct+=dt;setDoors(doorT-dt/1.3);
        if(!evald&&ct>=1.0){evald=true;evaluate();}
        if(doorT<=0&&evald){
          if(P.data.out){ph='end';}
          else if(fi>=TOTAL-1){ph='end';E.after(1.0,win);}
          else startFloor(fi+1);
        }
      }
      /* hazards and goals */
      if(S){
        if(S.star){S.star.rotation.y+=dt*2.2;S.star.position.y=2.7+Math.sin(E.time*3)*0.25;}
        if((ph==='play'||ph==='closing')&&S.upd)S.upd(dt);
        if(ph==='play'&&S.beacon){
          for(const c of riders){const d=c.data;if(!c.alive||d.out||d.n>=1||inCar(c))continue;
            if(hd(c,S.beacon)<1.9&&Math.abs(c.pos.y-S.bY)<2.8){d.n=1;E.fx.burst(V(S.beacon.x,2.6,S.beacon.z),[0xffe066,0xffffff],16,8,0.35);
              if(c===P){E.sfx('pickup');E.announce('Got it! Run back to the elevator!',2.2);}}}}
      }
      /* computer riders */
      for(const c of bots)if(c.alive&&!c.data.out)drive(c,c.data.skill,dt);
      /* hud */
      let alive=0;for(const c of riders)if(!c.data.out)alive++;
      const d=P.data,got=d.n>=fl.need;
      let line;
      if(ph==='play')line='Floor '+(fi+1)+' of '+TOTAL+': '+fl.name+'   Time '+E.fmt(tl)+'   '+(fl.need>1?('Coins '+Math.min(d.n,fl.need)+' of '+fl.need+(got?'. Back to the elevator!':'')):(got?'Star found. Back to the elevator!':'Touch the star'));
      else if(ph==='ride')line='Going up to floor '+(fi+1)+' ...';
      else line='Floor '+(fi+1)+' of '+TOTAL+': '+fl.name;
      E.status(line);
      E.score([{label:'Floor',value:(fi+1)+' of '+TOTAL,color:0xffc93c},{label:'Riders left',value:alive,color:0x35d07f},{label:'Hearts',value:d.lives+' of '+d.max,color:0xff4d5e,me:true},{label:'Coins',value:d.coins,color:0xffd24a}]);
    }

    startFloor(0);pt=2.5;
    return {
      update,
      autopilot(dt){if(!P.brain){P.brain=new VG.Brain(P,E);P.brain.arrive=1;}drive(P,1,dt);},
      canDamage(){return false;},
      onDeath(c,by){
        const d=c.data;if(!d)return;
        if(d.final||d.out){markOut(c);return;}
        d.lives--;d.hurts++;if(c===P){syncHp();E.announce(d.lives>0?'You fell! Hearts left: '+d.lives:'Out of hearts!',1.6);}
        if(d.lives<=0){markOut(c);return;}
        d.pending=true;
        E.after(1.3,()=>{d.pending=false;if(E.over||d.out)return;
          if(ph==='play'&&S){const q=S.ent?S.ent():V(rand(-2,2),0.3,rand(0,2));E.respawn(c,q.x,q.y,q.z,2.2);d.vx=null;}else{d.final=true;markOut(c);}});
      },
      dispose(){teardown();}
    };
  }
});
