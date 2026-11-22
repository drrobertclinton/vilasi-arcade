/* Creator Caper: buy cute creators from the belt, grab other bases' creators, earn the most cash. */
(function(){
let tagFn=null;
VG.TOOLS['steal-a-creator-tag']={name:'Tag Glove',cd:0.6,range:6,use(c,d,E){if(tagFn)tagFn(c,d);}};

VG.register({
  id:'steal-a-creator',name:'Creator Caper',tagline:'Collect cute creators, grab theirs, and earn the most cash.',color:0xff6fb5,levels:1,
  howTo:[
    'Creators ride the belt in the middle with a price. Walk into one to buy it when you have enough cash.',
    'Every creator on your pedestals earns cash each second. Check your income at the top and the list on the right.',
    'Run into another base and touch a creator to grab it. Carry it home to keep it. You move slower while carrying.',
    'If someone grabs yours, chase them and press Use or click to tag them. The creator zooms back home.',
    'Stand on the glowing lock pad in your base to keep thieves out for a little while. Lucky blocks give a free rare creator.',
    'When the clock hits zero, the highest income wins.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle}=VG.util,C=VG.COLORS,W=E.world,T=THREE;
    const ROUND=240,NB=6,RB=54,HB=12,BELT0=10.5,BELT1=15.5,BELTR=13,BELT_SPEED=3.4,BW=BELT_SPEED/BELTR,SPA=Math.PI/2;
    const LOCK_T=14,LOCK_COOL=20,CARRY_SPEED=8.4,CARRY_MAX=28;
    const COLS=[0xff8fb3,0xffb866,0x7aeaae,0x6fe0ee,0x8fb4ff,0xc89cff];
    const DEEP=[0xff3d7f,0xff8a1f,0x2fc779,0x1fb6d4,0x3d73ff,0x9a55ff];
    const RAR=[
      {n:'Common',col:0xb9c6dd,price:100,inc:3,w:50,sc:1.0,pal:[0xffd1dc,0xcfe8ff,0xfff1a8,0xd5f5d0,0xe6d4ff],names:['Blip','Dot','Mochi','Pebble','Puff','Bean']},
      {n:'Uncommon',col:0x4ee38a,price:400,inc:12,w:28,sc:1.05,pal:[0x7aeaae,0x9be86a,0x6fe0ee],names:['Zippy','Bunbun','Sprig','Tumble','Fizzle','Mossy']},
      {n:'Rare',col:0x4aa3ff,price:1500,inc:45,w:13,sc:1.15,pal:[0x5aa9ff,0x4cc5ff,0x6a8cff],names:['Pixel Pete','Beat Bot','Doodle Dan','Vlog Vera','Cam Kit']},
      {n:'Epic',col:0xb36bff,price:6000,inc:170,w:6,sc:1.3,pal:[0xb36bff,0xe070ff,0x8f6bff],names:['Star Streamer','Glitch Queen','Prank Prince','Dance Duo']},
      {n:'Legendary',col:0xffc83a,price:25000,inc:650,w:2,sc:1.5,pal:[0xffc83a,0xffa63a],names:['Mega Maker','Viral Vic','Golden Gamer']}
    ];
    W.killY=-30;E.cam.dist=18;E.cam.pitch=0.55;
    E.setSky(0x5fb4ff,0xe9f8ff,0xdcf1ff,130,430);E.setLight(0.8,0.72,0xfff1da);

    const G={sph:new T.SphereGeometry(1,14,10),cone:new T.ConeGeometry(1,1,10),cyl:new T.CylinderGeometry(1,1,1,12),oct:new T.OctahedronGeometry(1),tor:new T.TorusGeometry(1,0.12,8,22)};
    const M=(geo,mat,sx,sy,sz,x,y,z)=>{const m=new T.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;return m;};
    const light=(c,k)=>new T.Color(c).lerp(new T.Color(1,1,1),k).getHex();
    function fmtN(n){n=Math.floor(n);if(n<1000)return String(n);if(n<10000)return (n/1000).toFixed(1).replace('.0','')+'K';if(n<1e6)return Math.floor(n/1000)+'K';return (n/1e6).toFixed(1).replace('.0','')+'M';}

    /* ---------------------------------------------------------- sprites */
    function mkSprite(w,h,sx,sy){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const tex=new T.CanvasTexture(cv);const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(sx,sy,1);s.userData={cv,tex};return s;}
    function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
    function drawLabel(s,l1,l2,col){const cv=s.userData.cv,x=cv.getContext('2d'),w=cv.width,h=cv.height;x.clearRect(0,0,w,h);
      rr(x,6,6,w-12,h-12,22);x.fillStyle='rgba(18,22,46,0.82)';x.fill();x.lineWidth=6;x.strokeStyle='#'+new T.Color(col).getHexString();x.stroke();
      x.textAlign='center';x.textBaseline='middle';x.font='700 32px "Chakra Petch",Arial,sans-serif';x.fillStyle='#ffffff';x.fillText(l1,w/2,h*0.34);
      x.font='700 40px "Chakra Petch",Arial,sans-serif';x.fillStyle='#'+new T.Color(light(col,0.45)).getHexString();x.fillText(l2,w/2,h*0.71);s.userData.tex.needsUpdate=true;}
    function drawSign(s,text,col){const cv=s.userData.cv,x=cv.getContext('2d'),w=cv.width,h=cv.height;x.clearRect(0,0,w,h);
      rr(x,8,8,w-16,h-16,36);x.fillStyle='rgba(255,255,255,0.93)';x.fill();x.lineWidth=10;x.strokeStyle='#'+new T.Color(col).getHexString();x.stroke();
      x.textAlign='center';x.textBaseline='middle';x.font='800 64px "Chakra Petch",Arial,sans-serif';x.fillStyle='#'+new T.Color(col).getHexString();x.fillText(text,w/2,h/2+4);s.userData.tex.needsUpdate=true;}
    function killSprite(s){if(!s)return;s.material.map.dispose();s.material.dispose();}

    /* ---------------------------------------------------------- creator models */
    function buildModel(t,color){
      const g=new T.Group(),mats=[],spin=[];
      const ph=c=>{const m=new T.MeshPhongMaterial({color:c,shininess:70,specular:0x666666});mats.push(m);return m;};
      const bs=(c,o)=>{const m=new T.MeshBasicMaterial(Object.assign({color:c},o||{}));mats.push(m);return m;};
      const body=ph(color),belly=ph(light(color,0.55)),dark=bs(0x1a1d30),white=bs(0xffffff),cheek=bs(0xff9db8),acc=ph(RAR[t].col);
      const face=(y,z,k)=>{for(const s of[-1,1]){g.add(M(G.sph,white,0.2*k,0.24*k,0.12*k,s*0.27*k,y,z));g.add(M(G.sph,dark,0.1*k,0.14*k,0.08*k,s*0.27*k,y,z+0.07*k));g.add(M(G.sph,cheek,0.1*k,0.07*k,0.05*k,s*0.5*k,y-0.2*k,z-0.06*k));}
        g.add(M(G.sph,dark,0.1*k,0.05*k,0.05*k,0,y-0.22*k,z+0.02*k));};
      let h=2;
      if(t===0){g.add(M(G.sph,body,0.85,0.8,0.8,0,0.85,0));g.add(M(G.sph,belly,0.52,0.48,0.3,0,0.7,0.58));face(1.05,0.68,1);for(const s of[-1,1])g.add(M(G.sph,acc,0.28,0.16,0.36,s*0.36,0.12,0.15));h=1.9;}
      else if(t===1){g.add(M(G.sph,body,0.85,0.8,0.8,0,0.85,0));g.add(M(G.sph,belly,0.52,0.48,0.3,0,0.7,0.58));face(1.05,0.68,1);
        for(const s of[-1,1]){const e=M(G.cone,body,0.25,1.0,0.25,s*0.42,1.95,0);e.rotation.z=-s*0.25;g.add(e);const i=M(G.cone,cheek,0.13,0.7,0.13,s*0.42,1.92,0.1);i.rotation.z=-s*0.25;g.add(i);g.add(M(G.sph,acc,0.28,0.16,0.36,s*0.36,0.12,0.15));}
        g.add(M(G.sph,belly,0.22,0.22,0.22,0,0.55,-0.8));h=2.6;}
      else if(t===2){g.add(M(G.cyl,body,0.62,1.3,0.62,0,1.2,0));g.add(M(G.sph,body,0.62,0.62,0.62,0,1.85,0));g.add(M(G.sph,body,0.62,0.55,0.62,0,0.55,0));face(1.55,0.55,0.95);
        const band=M(G.tor,acc,0.7,0.7,0.7,0,1.75,0);band.rotation.y=Math.PI/2;g.add(band);for(const s of[-1,1])g.add(M(G.sph,acc,0.2,0.3,0.3,s*0.72,1.75,0));
        g.add(M(G.cyl,dark,0.04,0.5,0.04,0,2.6,0));const bulb=M(G.sph,bs(0x9fe8ff),0.15,0.15,0.15,0,2.9,0);g.add(bulb);spin.push({o:bulb,k:'pulse',sp:5,b:0.15});h=3.3;}
      else if(t===3){g.add(M(G.sph,body,0.95,0.9,0.9,0,1.0,0));g.add(M(G.sph,belly,0.6,0.5,0.34,0,0.85,0.7));face(1.2,0.76,1.1);
        const ring=M(G.tor,bs(0xf0c8ff),1.45,1.45,1.45,0,1.0,0);ring.rotation.x=Math.PI/2.4;g.add(ring);spin.push({o:ring,k:'rotz',sp:1.4});
        const star=M(G.oct,bs(0xfff27a),0.38,0.5,0.38,0,2.35,0);g.add(star);spin.push({o:star,k:'roty',sp:2.4});
        for(let i=0;i<2;i++){const o=M(G.sph,bs(0xffffff),0.2,0.2,0.2,0,1.5,0);g.add(o);spin.push({o,k:'orbit',sp:2.2,r:1.5,y:1.6,ph:i*Math.PI});}h=3.1;}
      else{g.add(M(G.sph,body,1.05,1.0,1.0,0,1.1,0));g.add(M(G.sph,belly,0.66,0.55,0.36,0,0.95,0.78));face(1.3,0.85,1.2);
        const crown=ph(0xfff0a0);g.add(M(G.cyl,crown,0.6,0.3,0.6,0,2.2,0));for(let i=0;i<5;i++){const a=i/5*6.283;g.add(M(G.cone,crown,0.17,0.55,0.17,Math.cos(a)*0.5,2.6,Math.sin(a)*0.5));}
        for(let i=0;i<3;i++){const o=M(G.oct,bs(i%2?0xfff27a:0xff9ad0),0.24,0.34,0.24,0,1.5,0);g.add(o);spin.push({o,k:'orbit',sp:1.7,r:1.9,y:1.5,ph:i*2.094});}
        const aura=M(G.sph,bs(0xfff0a0,{transparent:true,opacity:0.16,depthWrite:false}),1.9,1.9,1.9,0,1.2,0);aura.castShadow=false;g.add(aura);spin.push({o:aura,k:'pulse',sp:3,b:1.9,amt:0.08});h=3.7;}
      return {g,mats,spin,h};
    }
    function animModel(m,time,dt){for(const s of m.spin){
      if(s.k==='orbit'){const a=time*s.sp+s.ph;s.o.position.set(Math.cos(a)*s.r,s.y,Math.sin(a)*s.r);s.o.rotation.y=a;}
      else if(s.k==='roty')s.o.rotation.y=time*s.sp;
      else if(s.k==='rotz')s.o.rotation.z=time*s.sp;
      else if(s.k==='pulse'){const k=s.b*(1+Math.sin(time*s.sp)*(s.amt||0.25));s.o.scale.set(k,k,k);}}}

    /* ---------------------------------------------------------- world: ground, hills, plaza */
    for(let i=0;i<18;i++)for(let j=0;j<18;j++)W.addBox(-102+i*12,-1,-102+j*12,12,2,12,(i+j)%2?0x8ae092:0x7ad487,{jitter:0});
    const HC=[0x6fcf8c,0x58bfa0,0x8ad58a,0x62c6b4,0x7fd6a0];
    for(let k=-5;k<=5;k++){const o=k*24;for(const [x,z] of [[o,120],[o,-120],[120,o],[-120,o]]){const hh=irand(9,20);W.addBox(x,hh/2-1,z,24,hh,24,pick(HC),{jitter:0});W.addBox(x+rand(-4,4),hh+irand(2,4),z+rand(-4,4),14,6,14,pick(HC),{jitter:0});}}
    for(let i=-9;i<9;i++)for(let j=-9;j<9;j++){const x=(i+0.5)*3,z=(j+0.5)*3;if(Math.hypot(x,z)>27)continue;W.addBox(x,0,z,3,0.4,3,(i+j)%2?0xfff1dc:0xffe2ee,{jitter:0});}
    /* the belt (flat, only for looks) */
    const polyMat=(c,k)=>new T.MeshBasicMaterial({color:c,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-k,polygonOffsetUnits:-k});
    const flat=(geo,mat,y)=>{const m=new T.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.y=y;return m;};
    E.add(flat(new T.RingGeometry(BELT0,BELT1,96),polyMat(0x39466e,2),0.24));
    E.add(flat(new T.RingGeometry(BELT0-0.55,BELT0,96),polyMat(0x5fe6ff,4),0.27));E.add(flat(new T.RingGeometry(BELT1,BELT1+0.55,96),polyMat(0xff7fd0,4),0.27));
    const stripes=new T.Group();{const n=24,st=Math.PI*2/n,sm=polyMat(0xffd86b,3);for(let i=0;i<n;i++)stripes.add(flat(new T.RingGeometry(BELT0+0.5,BELT1-0.5,4,1,i*st,st*0.3),sm,0.26));}E.add(stripes);
    /* centre statue */
    W.addBox(0,0.55,0,9,0.7,9,0xffe9a8,{jitter:0});W.addBox(0,1.2,0,6.6,0.9,6.6,0xfff6d0,{jitter:0});W.addBox(0,1.68,0,5.6,0.06,5.6,0xffc83a,{glow:true,solid:false});
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])W.addBox(sx*4.2,1.4,sz*4.2,0.8,1.4,0.8,0xff6fb5,{jitter:0});
    const statue=buildModel(4,0xffc83a);statue.g.scale.setScalar(2.5);statue.g.position.set(0,1.7,0);E.add(statue.g);
    const beltSign=mkSprite(512,128,11,2.75);drawSign(beltSign,'CREATOR BELT',0xff3d7f);beltSign.position.set(0,13.5,0);E.add(beltSign);
    /* lamps, flags */
    for(let i=0;i<8;i++){const a=(i+0.5)/8*6.283,x=Math.cos(a)*23.5,z=Math.sin(a)*23.5;W.addBox(x,0.5,z,1.4,1,1.4,0x8a93b8,{jitter:0});W.addBox(x,3,z,0.36,5,0.36,0xf4f1ea,{jitter:0});W.addBox(x,5.7,z,1.2,1.2,1.2,0xfff0a0,{glow:true,solid:false});}
    for(let i=0;i<NB;i++){const a=Math.PI/2+i*Math.PI/3+Math.PI/6,x=Math.cos(a)*20,z=Math.sin(a)*20;W.addBox(x,3.5,z,0.3,7,0.3,0xf4f1ea,{jitter:0});W.addBox(x+1.3,6.1,z,2.6,1.6,0.14,DEEP[i],{jitter:0,solid:false});W.addBox(x+1.3,4.4,z,2.6,1.2,0.14,COLS[i],{jitter:0,solid:false});}
    for(let i=0;i<14;i++){const a=i/14*6.283+0.2,r=17.6;W.addBox(Math.cos(a)*r,0.6,Math.sin(a)*r,1.8,0.8,1.8,0xffc9dd,{jitter:0});for(let k=0;k<3;k++)W.addBox(Math.cos(a)*r+rand(-0.6,0.6),1.2,Math.sin(a)*r+rand(-0.6,0.6),0.45,0.45,0.45,pick([0xff4d6d,0xffe14d,0xffffff,0xb06bff]),{jitter:0,solid:false});}

    /* ---------------------------------------------------------- bases */
    const PS=[];
    const names=shuffle(VG.BOT_NAMES.slice());
    for(let i=0;i<NB;i++){
      const th=Math.PI/2+i*Math.PI/3,cx=Math.round(Math.cos(th)*RB*100)/100,cz=Math.round(Math.sin(th)*RB*100)/100;
      let fx=0,fz=0;if(Math.abs(cx)>Math.abs(cz))fx=-Math.sign(cx);else fz=-Math.sign(cz);
      const P={i,name:i===0?'You':names[i],color:COLS[i],deep:DEEP[i],cx,cz,fx,fz,rx:-fz,rz:fx,pads:[],cash:i===0?260:260,inc:0,carry:null,lockUntil:0,lockNext:0,stealCd:0,
        ai:{next:rand(0.2,1.5),mode:'idle',path:[],target:null,tp:null,tq:null,skill:0.4,speedMul:0.85,stealAt:70+rand(0,40),stealProb:0.3,useLock:Math.random()<0.6,lucky:34}};
      P.w=(u,v)=>({x:cx+P.rx*u+fx*v,z:cz+P.rz*u+fz*v});
      PS.push(P);
      const lbox=(u,v,y,su,sv,sy,color,o)=>{const q=P.w(u,v),ax=fx!==0;return W.addBox(q.x,y,q.z,ax?sv:su,sy,ax?su:sv,color,o||{jitter:0});};
      const pale=light(COLS[i],0.35);
      for(let a=-10;a<=10;a+=4)for(let b=-10;b<=10;b+=4)lbox(a,b,0.3,4,4,0.6,((a+b)/4)%2===0?COLS[i]:pale);
      /* glowing trim and walls */
      for(const s of[-1,1]){lbox(s*11.8,0,0.66,0.4,23.6,0.12,DEEP[i],{glow:true,solid:false});lbox(0,s*11.8,0.66,23.6,0.4,0.12,DEEP[i],{glow:true,solid:false});}
      lbox(-11.5,0,1.1,1,22,1,light(COLS[i],0.25));lbox(11.5,0,1.1,1,22,1,light(COLS[i],0.25));
      lbox(0,-11.5,1.1,22,1,1,light(COLS[i],0.25));
      lbox(-8,11.5,1.1,8,1,1,light(COLS[i],0.25));lbox(8,11.5,1.1,8,1,1,light(COLS[i],0.25));
      for(const su of[-1,1])for(const sv of[-1,1]){lbox(su*12,sv*12,2.9,2,2,4.6,DEEP[i]);lbox(su*12,sv*12,5.5,1.3,1.3,1.3,0xfff6c0,{glow:true,solid:false});}
      lbox(0,-12.9,4.2,16,0.9,7.2,DEEP[i]);lbox(0,-12.4,7.6,17,1.6,0.5,COLS[i],{jitter:0});lbox(0,-12.45,5.4,14,1,0.2,0xffffff,{glow:true,solid:false});
      for(const s of[-1,1]){lbox(s*4.9,11.5,3.1,0.9,0.9,5,DEEP[i]);lbox(s*4.9,11.5,5.9,1.2,1.2,1.2,0xfff6c0,{glow:true,solid:false});}
      const sign=mkSprite(512,128,10,2.5);drawSign(sign,i===0?'YOUR BASE':names[i].toUpperCase()+"'S BASE",DEEP[i]);const sp=P.w(0,-12.4);sign.position.set(sp.x,11.2,sp.z);E.add(sign);
      /* pedestals */
      for(const v of[-8.5,-3.5])for(const u of[-7.5,-2.5,2.5,7.5]){
        const q=P.w(u,v);lbox(u,v,0.63,3.4,3.4,0.06,DEEP[i],{glow:true,solid:false});lbox(u,v,0.85,2.8,2.8,0.5,0x6f7aa3);lbox(u,v,1.2,2.2,2.2,0.4,COLS[i]);
        P.pads.push({x:q.x,z:q.z,y:1.4,cr:null});}
      /* lock pad */
      const lq=P.w(-8,5.5);P.lock={x:lq.x,z:lq.z};P.lockBox=lbox(-8,5.5,0.7,3.4,3.4,0.16,0x6bf0ff,{glow:true,solid:false});
      const ls=mkSprite(256,112,3.2,1.4);drawLabel(ls,'LOCK PAD','Stand here',0x6bf0ff);ls.position.set(lq.x,3.0,lq.z);E.add(ls);P.lockSprite=ls;
      P.dome=E.slab(cx,4.6,cz,25.4,8.4,25.4,DEEP[i],0.16);P.dome.visible=false;
      /* lamps by the gate */
      for(const s of[-1,1]){const q=P.w(s*6.6,14);W.addBox(q.x,2.2,q.z,0.3,4.4,0.3,0xf4f1ea,{jitter:0});W.addBox(q.x,4.8,q.z,1,1,1,0xfff0a0,{glow:true,solid:false});}
      const go=P.w(0,16),gi=P.w(0,7);P.gateOut=V(go.x,0,go.z);P.gateIn=V(gi.x,0.6,gi.z);
      /* stepping stones to the plaza */
      {const sx=go.x,sz=go.z,d=Math.hypot(sx,sz),ux=sx/d,uz=sz/d;for(let r=28.5;r<d-1;r+=5){W.addBox(ux*r,0.07,uz*r,2.8,0.14,2.8,i%2?COLS[i]:pale,{jitter:0,solid:false});}}
      P.padPos=k=>V(P.pads[k].x,0.7,P.pads[k].z);
    }
    /* trees and flowers */
    function nearBase(x,z,m){for(const P of PS)if(Math.abs(x-P.cx)<HB+m&&Math.abs(z-P.cz)<HB+m)return true;return false;}
    const LEAF=[0x4fcf72,0x3fbf9a,0x64d86a,0xff9ac8,0xffc266];
    for(let n=0,tries=0;n<64&&tries<600;tries++){const x=rand(-100,100),z=rand(-100,100);if(Math.hypot(x,z)<31||nearBase(x,z,6))continue;n++;
      const lc=pick(LEAF),s=rand(0.8,1.5);W.addBox(x,1.1*s,z,0.9*s,2.2*s,0.9*s,0xb07a4a,{jitter:0});W.addBox(x,3.4*s,z,3.8*s,2.4*s,3.8*s,lc,{jitter:0});W.addBox(x,5.2*s,z,2.4*s,1.6*s,2.4*s,light(lc,0.18),{jitter:0});}
    for(let n=0,tries=0;n<90&&tries<800;tries++){const x=rand(-100,100),z=rand(-100,100);if(Math.hypot(x,z)<29||nearBase(x,z,3))continue;n++;W.addBox(x,0.3,z,0.5,0.6,0.5,pick([0xff4d6d,0xffe14d,0xffffff,0xb06bff,0xff9a3c]),{jitter:0,solid:false});}

    /* ---------------------------------------------------------- state */
    const belt=[];let spawnT=0.5,lucky=null,luckyT=24,done=false,uiT=0,fxT=0,msgT=0,lastWarn=false;
    const me=PS[0],p=E.player;
    const ringPt=a=>V(Math.cos(a)*BELTR,0.3,Math.sin(a)*BELTR);
    function inBase(P,pos){const dx=pos.x-P.cx,dz=pos.z-P.cz,u=dx*P.rx+dz*P.rz,v=dx*P.fx+dz*P.fz;return Math.abs(u)<HB-1.5&&Math.abs(v)<HB-1.5;}
    function baseAt(pos){for(const P of PS)if(inBase(P,pos))return P;return null;}
    function recompute(P){let s=0;for(const d of P.pads)if(d.cr)s+=d.cr.inc;P.inc=s;}
    function mkCreator(t){const R=RAR[t],col=pick(R.pal),mdl=buildModel(t,col),g=new T.Group();mdl.g.scale.setScalar(R.sc);g.add(mdl.g);
      const lab=mkSprite(256,112,3.1,1.36);lab.position.set(0,mdl.h*R.sc+0.9,0);g.add(lab);
      const cr={t,name:pick(R.names),col,price:R.price,inc:R.inc,g,mdl,lab,state:'belt',ang:0,travel:0,owner:null,victim:null,pad:null,carrier:null,carryT:0,ph:rand(0,6.28),R};
      drawLabel(lab,cr.name,'$'+fmtN(cr.price),R.col);E.add(g);return cr;}
    function killCreator(cr){killSprite(cr.lab);for(const m of cr.mdl.mats)m.dispose();E.remove(cr.g);cr.dead=true;}
    function padFor(P,cr){for(const d of P.pads)if(!d.cr)return d;let low=null;for(const d of P.pads)if(d.cr&&(!low||d.cr.inc<low.cr.inc))low=d;return low&&low.cr.inc<cr.inc?low:null;}
    function sellOff(P,cr){P.cash+=Math.round(cr.price*0.5);killCreator(cr);}
    function place(P,cr,pad){if(pad.cr&&pad.cr!==cr)sellOff(P,pad.cr);pad.cr=cr;cr.pad=pad;cr.owner=P;cr.state='pad';cr.carrier=null;cr.lab.visible=true;
      drawLabel(cr.lab,cr.name,'+'+cr.inc+'/sec',cr.R.col);cr.g.position.set(pad.x,pad.y,pad.z);cr.g.rotation.y=Math.atan2(P.fx,P.fz);recompute(P);}
    function giveCreator(P,cr){const pad=padFor(P,cr);if(pad){place(P,cr,pad);return true;}sellOff(P,cr);return false;}
    function say(P,text,sec){if(P===me)E.announce(text,sec||1.8);}
    function tryBuy(P,cr){if(P.cash<cr.price)return;const pad=padFor(P,cr);if(!pad)return;P.cash-=cr.price;belt.splice(belt.indexOf(cr),1);
      E.fx.burst(V(pad.x,2.4,pad.z),[cr.R.col,0xffffff,0xffd23e],20,9,0.34,{life:1.2});E.fx.flash(V(pad.x,2.2,pad.z),2.2,cr.R.col);if(P===me){E.sfx('pickup');E.shake(0.1);}
      place(P,cr,pad);say(P,'You bought '+cr.name+'!',1.5);}
    function grab(thief,Q,pad){const cr=pad.cr;pad.cr=null;cr.pad=null;cr.state='carried';cr.carrier=thief;cr.victim=Q;cr.carryT=0;cr.lab.visible=false;thief.carry=cr;thief.c.speed=CARRY_SPEED;recompute(Q);thief.stealCd=1.5;
      E.fx.burst(V(pad.x,2.4,pad.z),[0xffffff,0xff4d5e,cr.R.col],22,10,0.36,{life:1.2});E.fx.flash(V(pad.x,2.2,pad.z),2.6,0xffffff);
      if(thief===me){E.sfx('pickup');E.announce('Got '+cr.name+'! Run home!',2);}else if(Q===me){E.sfx('alarm');E.announce(thief.name+' grabbed '+cr.name+'! Chase them and tag!',2.6);}}
    function deposit(P){const cr=P.carry;P.carry=null;P.c.speed=11;const wasMine=cr.victim===P;giveCreator(P,cr);
      if(!cr.dead){E.fx.burst(V(cr.g.position.x,2.4,cr.g.position.z),[0xffd23e,0xffffff,cr.R.col],24,9,0.36,{life:1.3});if(P===me){E.sfx('win');E.announce(wasMine?'Got it back!':cr.name+' is yours now!',2);}}}
    function sendHome(thief,tagger){const cr=thief.carry;if(!cr)return;thief.carry=null;thief.c.speed=11;const Q=cr.victim;
      E.fx.burst(V(thief.c.pos.x,thief.c.pos.y+3,thief.c.pos.z),[0xffffff,0xff4d5e,0xffd23e],20,9,0.34,{life:1});
      thief.c.vel.y=6;
      if(Q){giveCreator(Q,cr);if(!cr.dead)E.fx.burst(V(cr.g.position.x,2.4,cr.g.position.z),[cr.R.col,0xffffff],16,8,0.3,{life:1});}else killCreator(cr);
      if(tagger===me){E.announce('Tagged! '+cr.name+' went home.',1.8);}else if(thief===me){E.announce('You got tagged! '+cr.name+' went back.',2);}}
    tagFn=function(c){const P=c.data.P;if(!P||!c.alive)return;let best=null,bd=6.5;
      for(const Q of PS){if(Q===P||!Q.carry||Q.carry.victim!==P)continue;const d=Math.hypot(Q.c.pos.x-c.pos.x,Q.c.pos.z-c.pos.z);if(d<bd){bd=d;best=Q;}}
      if(best){const q=best.c,dx=q.pos.x-c.pos.x,dz=q.pos.z-c.pos.z,l=Math.hypot(dx,dz)||1;q.vel.x+=dx/l*14;q.vel.z+=dz/l*14;q.frozen=true;E.after(0.9,()=>{q.frozen=false;});best.stealCd=2.5;E.sfx('hit');sendHome(best,P);}
      else E.sfx('shoot');};

    /* ---------------------------------------------------------- players */
    PS.forEach((P,i)=>{let c;if(i===0)c=p;else c=E.spawn({name:P.name,color:P.deep,bot:true});P.c=c;c.data.P=P;c.setTools(['steal-a-creator-tag']);
      const s=P.w(0,6);c.teleport(s.x,0.8,s.z);c.yaw=Math.atan2(P.fx,P.fz);
      if(i>0){const a=P.ai;a.skill=0.25+Math.random()*0.15;a.speedMul=0.72+Math.random()*0.1;a.stealAt=90+Math.random()*50;a.stealProb=0.18;c.brain.speedMul=a.speedMul;}});
    E.cam.yaw=Math.atan2(-me.fx,-me.fz);
    E.announce('Buy creators from the belt. Earn the most cash!',3.2);

    /* ---------------------------------------------------------- belt + lucky block */
    function pickRarity(boost){const w=RAR.map((r,i)=>r.w*(i>=2?boost:1));let s=0;for(const x of w)s+=x;let r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}return 0;}
    function trySpawn(){for(const b of belt){let d=Math.abs(((b.ang-SPA)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);if(d<0.5)return;}
      const cr=mkCreator(pickRarity(1+E.time/160));cr.ang=SPA;belt.push(cr);}
    function spawnLucky(){const a=rand(0,6.283),r=21,pos=V(Math.cos(a)*r,1.8,Math.sin(a)*r);const beam=E.slab(pos.x,8,pos.z,0.6,16,0.6,0xfff27a,0.35);
      const sp=mkSprite(256,112,3.4,1.5);drawLabel(sp,'LUCKY BLOCK','Grab it!',0xffd23e);sp.position.set(0,2.2,0);
      const pk=E.pickup({pos,color:0xffd23e,size:1.15,bots:true,onTake(c){const P=c.data.P;if(!P)return false;const t=pickRarity2(),cr=mkCreator(t);cr.victim=null;
        if(P===me)E.announce('Lucky block! You got '+cr.name+'!',2.4);else E.announce(P.name+' found a lucky block!',1.8);
        const pad=padFor(P,cr);cr.state='pad';belt.includes(cr)&&belt.splice(belt.indexOf(cr),1);if(pad){place(P,cr,pad);E.fx.burst(V(pad.x,2.6,pad.z),[0xffd23e,0xffffff,cr.R.col],26,10,0.38,{life:1.3});}else sellOff(P,cr);
        cleanLucky();}});
      pk.m.add(sp);lucky={pk,beam,sp,pos,done:false};E.announce('A lucky block appeared in the plaza!',2.2);E.sfx('alarm');
      E.after(30,()=>{if(lucky&&lucky.pk===pk&&!lucky.done)cleanLucky(true);});}
    function pickRarity2(){const r=Math.random();return r<0.7?2:r<0.95?3:4;}
    function cleanLucky(expire){if(!lucky)return;const l=lucky;lucky=null;l.done=true;E.remove(l.beam);killSprite(l.sp);if(expire&&E.pickups.indexOf(l.pk)>=0)E.removePickup(l.pk);}

    /* ---------------------------------------------------------- bots */
    function route(f,t){const dx=t.x-f.x,dz=t.z-f.z,l2=dx*dx+dz*dz;if(l2<1)return[];let k=-(f.x*dx+f.z*dz)/l2;k=clamp(k,0,1);const cx=f.x+dx*k,cz=f.z+dz*k,d=Math.hypot(cx,cz);if(d>9)return[];
      let nx,nz;if(d<1){const l=Math.sqrt(l2);nx=-dz/l;nz=dx/l;}else{nx=cx/d;nz=cz/d;}return[V(nx*13.5,0,nz*13.5)];}
    function setPath(P,pts){const a=P.ai;a.path=pts;if(pts.length)P.c.brain.goal=pts[0];}
    function toBase(P,Q,from){const pts=route(from,Q.gateOut);pts.push(Q.gateOut);return pts;}
    function homePath(P){const c=P.c;let pts=[],from=c.pos;const Q=baseAt(c.pos);if(Q&&Q!==P){pts.push(Q.gateIn.clone(),Q.gateOut.clone());from=Q.gateOut;}
      pts=pts.concat(route(from,P.gateOut));pts.push(P.gateOut.clone(),P.gateIn.clone());return pts;}
    function think(P){
      const a=P.ai,c=P.c,br=c.brain,now=E.time;br.speedMul=a.speedMul;
      if(P.carry){a.mode='home';setPath(P,homePath(P));a.next=0.8;return;}
      let thief=null;for(const Q of PS)if(Q!==P&&Q.carry&&Q.carry.victim===P){thief=Q;break;}
      if(thief&&br.dist(thief.c)<50&&Math.random()<0.45+a.skill*0.55){a.mode='chase';a.path=[];br.goal=thief.c.pos;br.arrive=1.2;a.next=0.15;
        if(br.dist(thief.c)<5.6){const d=V(thief.c.pos.x-c.pos.x,0,thief.c.pos.z-c.pos.z).normalize();c.use(d,'steal-a-creator-tag');}return;}
      if(lucky&&!lucky.done&&br.dist(lucky.pos)<a.lucky&&(P===me||Math.random()<0.4)){a.mode='lucky';setPath(P,route(c.pos,lucky.pos).concat([V(lucky.pos.x,0,lucky.pos.z)]));a.next=0.7;return;}
      if(a.useLock&&now>=P.lockNext&&now>=P.lockUntil){for(const Q of PS){if(Q===P)continue;if(Math.hypot(Q.c.pos.x-P.cx,Q.c.pos.z-P.cz)<24&&br.dist(P.lock)<45&&Math.random()<0.8){a.mode='lock';setPath(P,[V(P.lock.x,0.7,P.lock.z)]);a.next=0.6;return;}}}
      let best=null,bs=-1;for(const cr of belt){if(cr.state!=='belt'||P.cash<cr.price||!padFor(P,cr))continue;const s=cr.inc*(1+Math.random()*0.4*(1-a.skill));if(s>bs){bs=s;best=cr;}}
      if(best&&Math.random()>(1-a.skill)*0.2){a.mode='buy';a.target=best;const d=br.dist(ringPt(best.ang)),ang=best.ang+BW*(d/(c.speed*a.speedMul)+0.2),pt=ringPt(ang);setPath(P,route(c.pos,pt).concat([pt]));a.next=0.35;return;}
      if(a.mode==='steal'&&a.tp&&a.tp.cr&&now>=a.tq.lockUntil&&!P.carry){a.next=0.9;return;}
      if(now>=a.stealAt&&Math.random()<a.stealProb){let tp=null,tq=null,ts=-1e9;
        for(const Q of PS){if(Q===P||now<Q.lockUntil)continue;for(const pd of Q.pads){if(!pd.cr)continue;const dd=Math.hypot(pd.x-c.pos.x,pd.z-c.pos.z),s=pd.cr.inc-dd*0.5*(1-a.skill)-(Q===me?0:0);if(s>ts){ts=s;tp=pd;tq=Q;}}}
        if(tp){a.mode='steal';a.tp=tp;a.tq=tq;setPath(P,toBase(P,tq,c.pos).concat([V(tp.x,0.7,tp.z)]));a.next=1.0;return;}}
      a.mode='idle';const pt=ringPt(SPA+0.6+Math.random()*1.2);setPath(P,route(c.pos,pt).concat([pt]));a.next=1.6;}
    function aiTick(P,dt){const a=P.ai,c=P.c,br=c.brain;if(!c.alive)return;
      if(a.path.length){const g=a.path[0],d=Math.hypot(g.x-c.pos.x,g.z-c.pos.z);br.goal=g;br.arrive=a.path.length>1?2.2:1.0;if(d<br.arrive+0.2){a.path.shift();if(a.path.length)br.goal=a.path[0];}}
      a.next-=dt;if(a.next<=0)think(P);}

    /* ---------------------------------------------------------- frame */
    function standings(){return PS.slice().sort((x,y)=>(y.inc-x.inc)||(y.cash-x.cash));}
    function finishRound(){if(done)return;done=true;const st=standings(),top=st[0],best=st.find(q=>q!==me),won=top===me;
      const ratio=best.inc>0?me.inc/best.inc:(me.inc>0?9:1);
      const lines=['Your income: +'+fmtN(me.inc)+' per second, cash $'+fmtN(me.cash)+'.',won?(best.name+' came next with +'+fmtN(best.inc)+' per second.'):(top.name+' earned the most with +'+fmtN(top.inc)+' per second.')];
      if(won)E.finish({win:true,title:'You earned the most!',stars:ratio>=1.5?3:ratio>=1.15?2:1,lines});
      else E.finish({win:false,title:'Not this time',lines});}
    function update(dt){
      if(done)return;const now=E.time;
      for(const P of PS){if(P.i>0)aiTick(P,dt);P.cash+=P.inc*dt;P.stealCd-=dt;}
      /* belt */
      spawnT-=dt;if(spawnT<=0){spawnT=2.6;if(belt.length<10)trySpawn();}
      stripes.rotation.y=-BW*now;statue.g.rotation.y=now*0.6;animModel(statue,now);
      for(let i=belt.length-1;i>=0;i--){const cr=belt[i];cr.ang+=BW*dt;cr.travel+=BW*dt;
        if(cr.travel>6.2){belt.splice(i,1);killCreator(cr);continue;}
        const x=Math.cos(cr.ang)*BELTR,z=Math.sin(cr.ang)*BELTR;cr.g.position.set(x,0.3+0.15+Math.sin(now*3+cr.ph)*0.12,z);cr.g.rotation.y=Math.atan2(-Math.sin(cr.ang),Math.cos(cr.ang));
        const left=6.2-cr.travel,sc=left<0.5?left/0.5:1;cr.mdl.g.scale.setScalar(cr.R.sc*sc);
        animModel(cr.mdl,now);
        if(Math.round(now*2)%2===0){const ok=me.cash>=cr.price;cr.lab.material.color.setHex(ok?0xffffff:0xff9a9a);}}
      /* touch: buy, steal, deposit, lock pad */
      for(const P of PS){const c=P.c;if(!c.alive)continue;const px=c.pos.x,pz=c.pos.z;
        for(let i=belt.length-1;i>=0;i--){const cr=belt[i];if(cr.state!=='belt')continue;const g=cr.g.position;if((g.x-px)*(g.x-px)+(g.z-pz)*(g.z-pz)<5.8){tryBuy(P,cr);}}
        if(P.carry){if(inBase(P,c.pos))deposit(P);else{P.carry.carryT+=dt;if(P.carry.carryT>CARRY_MAX)sendHome(P,null);}}
        else if(P.stealCd<=0){for(const Q of PS){if(Q===P)continue;if(Math.abs(px-Q.cx)>HB+3||Math.abs(pz-Q.cz)>HB+3)continue;
          for(const pd of Q.pads){if(!pd.cr)continue;if((pd.x-px)*(pd.x-px)+(pd.z-pz)*(pd.z-pz)<6.2){if(now<Q.lockUntil){if(P===me&&now-msgT>2.5){msgT=now;E.announce('That base is locked!',1.4);}}else{grab(P,Q,pd);}break;}}
          if(P.carry)break;}}
        if(now>=P.lockNext&&now>=P.lockUntil&&(P.lock.x-px)*(P.lock.x-px)+(P.lock.z-pz)*(P.lock.z-pz)<3.6){P.lockUntil=now+LOCK_T;P.lockNext=now+LOCK_T+LOCK_COOL;P.dome.visible=true;
          E.fx.burst(V(P.cx,2,P.cz),[0x6bf0ff,0xffffff,P.deep],30,12,0.4,{life:1.4});E.fx.flash(V(P.lock.x,1.5,P.lock.z),3,0x6bf0ff);if(P===me){E.sfx('build');E.announce('Your base is locked for '+LOCK_T+' seconds!',2);}}
        if(P.dome.visible&&now>=P.lockUntil)P.dome.visible=false;}
      /* animate creators on pads / carried */
      for(const P of PS){for(const pd of P.pads){const cr=pd.cr;if(!cr)continue;cr.g.position.y=pd.y+0.1+Math.sin(now*2.4+cr.ph)*0.12;cr.g.rotation.y+=dt*0.7;animModel(cr.mdl,now);}
        const cr=P.carry;if(cr){cr.g.position.set(P.c.pos.x,P.c.pos.y+3.3+Math.sin(now*6)*0.1,P.c.pos.z);cr.g.rotation.y+=dt*3;animModel(cr.mdl,now);}}
      /* lucky block */
      if(!lucky){luckyT-=dt;if(luckyT<=0){luckyT=40;spawnLucky();}}
      else if(Math.random()<dt*5)E.fx.burst(V(lucky.pos.x,0.6,lucky.pos.z),[0xffd23e,0xffffff],1,3,0.3,{up:2,gravity:0.2,life:1});
      /* little coin sparkles */
      fxT-=dt;if(fxT<=0){fxT=0.45;for(const P of PS)for(const pd of P.pads)if(pd.cr&&Math.random()<0.18)E.fx.burst(V(pd.x,2.4,pd.z),0xffd23e,1,3,0.28,{up:2,gravity:0.25,life:0.9});}
      /* lock pad colours */
      uiT-=dt;if(uiT<=0){uiT=0.3;
        for(const P of PS){const col=now<P.lockUntil?0xffffff:now>=P.lockNext?0x6bf0ff:0x56607f;if(P.lockBox.color!==col)W.setColor(P.lockBox,col);
          const txt=now<P.lockUntil?'Locked':now>=P.lockNext?'Stand here':Math.ceil(P.lockNext-now)+'s';if(P.lockSprite.userData.t!==txt){P.lockSprite.userData.t=txt;drawLabel(P.lockSprite,'LOCK PAD',txt,col);}}
        E.score(standings().map(P=>({label:P.name,value:'+'+fmtN(P.inc)+'/s  $'+fmtN(P.cash),color:P.deep,me:P===me})));}
      let extra='';if(me.carry)extra='   |   Carrying '+me.carry.name+': run home!';else{for(const Q of PS)if(Q!==me&&Q.carry&&Q.carry.victim===me){extra='   |   '+Q.name+' took '+Q.carry.name+'! Tag them!';break;}}
      E.status('Cash $'+fmtN(me.cash)+'   Income +'+fmtN(me.inc)+'/sec   Time '+E.fmt(ROUND-now)+extra);
      if(!lastWarn&&ROUND-now<=10){lastWarn=true;E.announce('10 seconds left!',2);E.sfx('tick');}
      if(now>=ROUND)finishRound();
    }
    return {
      update,
      autopilot(dt){if(!p.brain){p.brain=new VG.Brain(p,E);const a=me.ai;a.skill=0.95;a.speedMul=1;a.stealAt=30;a.stealProb=0.85;a.useLock=true;a.lucky=60;}aiTick(me,dt);},
      onDeath(c){const P=c.data.P;if(!P)return;if(P.carry)sendHome(P,null);E.after(1.5,()=>{if(!E.over)E.respawn(c,P.gateIn.x,1,P.gateIn.z,2);});},
      dispose(){tagFn=null;}
    };
  }
});
})();
