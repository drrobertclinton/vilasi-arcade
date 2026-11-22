/* Tiny Titan: feed a baby kaiju, fight in the volcano, and be the biggest on the island. */
VG.register({
  id:'grow-a-kaiju',name:'Tiny Titan',tagline:'Feed your baby kaiju until it is the biggest monster on the island.',color:0x35d07f,levels:1,
  howTo:[
    'Run over fruit, fish and glowing crystals to feed your kaiju. It grows from Baby to Teen to Giant to Titan.',
    'Golden eggs give a growth boost, a speed boost or double food for a while.',
    'Every so often the volcano opens. Climb to the top and your kaiju can fight. The bigger kaiju usually wins, and the loser shrinks a little.',
    'Dodge the red circles: lava bombs are coming. Stay off the beach at high tide.',
    'Be the first to reach Titan, or be the biggest kaiju when time runs out.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle,lerp,angLerp}=VG.util,C=VG.COLORS,W=E.world,T=THREE,L=E.level,p=E.player;
    const HALF=72,ROUND=240-(L-1)*15,STAGES=[0,100,260,500],SNAMES=['Baby','Teen','Giant','Titan'],SC=[0.8,1.5,2.3,3.3];
    const TIDE_MAX=17;
    const owned=[];                                  /* things to dispose at the end */
    W.killY=-20;
    E.setSky(0x3f9eff,0xe2f6ff,0xcdeeff,130,560);E.setLight(0.72,0.7,0xfff0d0);
    E.cam.dist=17;E.cam.pitch=0.52;E.cam.yaw=0;
    const hpEl=E.hud.$.hp;if(hpEl)hpEl.style.display='none';

    /* ------------------------------------------------------------ island, water, volcano */
    const GR=[0x6bd877,0x54c262];
    for(let i=0;i<12;i++)for(let j=0;j<12;j++){
      const edge=i===0||j===0||i===11||j===11;
      W.addBox(-HALF+6+i*12,-1.5,-HALF+6+j*12,12,3,12,edge?(((i+j)&1)?0xf0dca0:0xe9d395):GR[(i+j)&1],{jitter:0});
    }
    W.addBox(0,-4.5,0,HALF*2-3,3,HALF*2-3,0xb89a72,{jitter:0});
    W.addBox(0,-7,0,HALF*2-14,2,HALF*2-14,0x8d7658,{jitter:0});
    E.slab(0,-2.4,0,900,1,900,0x2a9fe6,0.86);
    E.slab(0,-1.75,0,HALF*2+10,0.3,HALF*2+10,0x74dcff,0.5);
    for(const s of [-1,1]){
      W.addBox(0,-1.6,s*(HALF+1),HALF*2+4,0.25,2.2,0xffffff,{jitter:0,solid:false});
      W.addBox(s*(HALF+1),-1.6,0,2.2,0.25,HALF*2+4,0xffffff,{jitter:0,solid:false});
    }

    /* volcano: seven wide steps (each one block high, so everyone can walk up) */
    const VCOL=[0x5a4650,0x54424c,0x4e3d48,0x483843,0x42343f,0x3d303b,0x382c37];
    for(let i=0;i<7;i++)W.addBox(0,0.5+i,0,44-i*4.2,1,44-i*4.2,VCOL[i],{jitter:0});
    const TOP=7,AH=9.4;                              /* arena top surface and its half size */
    W.addBox(0,TOP+0.06,0,AH*2-0.8,0.12,AH*2-0.8,0x2e2430,{jitter:0});
    const trim=[],veins=[];
    for(let i=-4;i<=4;i++){
      const o=i*2.1;
      trim.push(W.addBox(o,TOP+0.2,-AH+0.3,1.8,0.4,0.6,0xff8a3c,{glow:true,solid:false}),W.addBox(o,TOP+0.2,AH-0.3,1.8,0.4,0.6,0xff8a3c,{glow:true,solid:false}),
        W.addBox(-AH+0.3,TOP+0.2,o,0.6,0.4,1.8,0xff8a3c,{glow:true,solid:false}),W.addBox(AH-0.3,TOP+0.2,o,0.6,0.4,1.8,0xff8a3c,{glow:true,solid:false}));
    }
    W.addBox(0,0.04,0,56,0.08,56,0xeedca0,{jitter:0});
    const lava=W.addBox(0,TOP+0.24,0,6.6,0.2,6.6,0xff6a1a,{glow:true,solid:false});
    for(const sg of [-1,1]){W.addBox(sg*3.75,TOP+0.3,0,0.9,0.5,8.4,0x2a2230,{jitter:0,solid:false});W.addBox(0,TOP+0.3,sg*3.75,8.4,0.5,0.9,0x2a2230,{jitter:0,solid:false});
      trim.push(W.addBox(sg*6.2,TOP+0.14,0,0.5,0.1,12.9,0xff7a22,{glow:true,solid:false}),W.addBox(0,TOP+0.14,sg*6.2,12.9,0.1,0.5,0xff7a22,{glow:true,solid:false}));}
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const x=sx*(AH-1.6),z=sz*(AH-1.6);
      W.addBox(x,TOP+1.8,z,2.2,3.6,2.2,0x34293a,{jitter:0});W.addBox(x,TOP+3.8,z,1.4,0.9,1.4,0xffc93c,{glow:true,solid:false});
    }
    /* lava rivers down the sides */
    for(let i=0;i<7;i++){
      const w=44-i*4.2,f=w/2+0.1;
      for(const off of [0,-w*0.28,w*0.3]){
        if(off!==0&&i>4)continue;
        veins.push(W.addBox(off,0.5+i,-f,1.5,1.02,0.35,0xff7a22,{glow:true,solid:false}),W.addBox(off,0.5+i,f,1.5,1.02,0.35,0xff7a22,{glow:true,solid:false}),
          W.addBox(-f,0.5+i,off,0.35,1.02,1.5,0xff7a22,{glow:true,solid:false}),W.addBox(f,0.5+i,off,0.35,1.02,1.5,0xff7a22,{glow:true,solid:false}));
      }
    }
    const crater=new T.PointLight(0xff7a2a,1.5,70);crater.position.set(0,TOP+5,0);E.add(crater);

    /* ------------------------------------------------------------ pens (home yards) */
    const COLS=[0x22c9c2,0xff8a3c,0xa56bff,0xff6fb5,0xffc93c,0xff4d5e];
    const PH=7,PR=46;
    const pens=[];
    for(let i=0;i<6;i++){
      const a=Math.PI/2+i*Math.PI/3,cx=Math.round(Math.cos(a)*PR*10)/10,cz=Math.round(Math.sin(a)*PR*10)/10;
      const gateX=Math.abs(cx)>Math.abs(cz)+1;
      pens.push({x:cx,z:cz,h:PH,col:COLS[i],i,yard:0,gateX,gs:gateX?-Math.sign(cx):-Math.sign(cz)});
    }
    function texSprite(text,color,w,h,fs){
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');
      x.font='700 '+fs+'px "Chakra Petch",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=9;x.strokeStyle='rgba(10,14,30,.9)';x.strokeText(text,w/2,h/2+2);
      x.fillStyle='#'+new T.Color(color).lerp(new T.Color(1,1,1),0.5).getHexString();x.fillText(text,w/2,h/2+2);
      const tex=new T.CanvasTexture(cv);owned.push(tex);const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true}));s.renderOrder=4;return s;
    }
    function buildPen(pn,name){
      const cx=pn.x,cz=pn.z,h=PH;
      const gateX=pn.gateX,gs=pn.gs;                            /* the gate faces the volcano */
      W.addBox(cx,0.15,cz,h*2,0.3,h*2,0xf1e2b0,{jitter:0});
      W.addBox(cx,0.17,cz-h+0.6,h*2,0.34,1.2,pn.col,{jitter:0});W.addBox(cx,0.17,cz+h-0.6,h*2,0.34,1.2,pn.col,{jitter:0});
      W.addBox(cx-h+0.6,0.17,cz,1.2,0.34,h*2-2.4,pn.col,{jitter:0});W.addBox(cx+h-0.6,0.17,cz,1.2,0.34,h*2-2.4,pn.col,{jitter:0});
      for(let side=0;side<4;side++){
        const ax=side<2,sg=side%2?1:-1,isGate=(ax===gateX)&&sg===gs;
        for(let k=0;k<=7;k++){
          const off=-h+k*2*h/7;if(isGate&&Math.abs(off)<2.5)continue;
          const x=ax?cx+sg*h:cx+off,z=ax?cz+off:cz+sg*h;
          W.addBox(x,0.9,z,0.7,1.8,0.7,0xb98a58,{jitter:0});W.addBox(x,1.9,z,0.9,0.3,0.9,pn.col,{jitter:0,solid:false});
          if(k<7){const off2=off+h/7;if(isGate&&Math.abs(off2)<2.5)continue;
            const x2=ax?cx+sg*h:cx+off2,z2=ax?cz+off2:cz+sg*h;
            for(const yy of [0.7,1.35])W.addBox(x2,yy,z2,ax?0.3:2*h/7,0.3,ax?2*h/7:0.3,0xd9aa6e,{jitter:0});}
        }
      }
      /* nest bed at the back, banner pole, flowers */
      const bx=gateX?cx-gs*(h-2.6):cx,bz=gateX?cz:cz-gs*(h-2.6);
      W.addBox(bx,0.55,bz,gateX?3:5.5,0.5,gateX?5.5:3,0xe8c46a,{jitter:0,solid:false});W.addBox(bx,0.85,bz,gateX?2.2:4.2,0.25,gateX?4.2:2.2,pn.col,{jitter:0,solid:false});
      const px=cx+(gateX?-gs*(h-0.5):h-0.5),pz=cz+(gateX?-h+0.5:-gs*(h-0.5));
      W.addBox(px,3.6,pz,0.35,6.6,0.35,0xf4f1ea,{jitter:0});W.addBox(px+(gateX?0:1.3),6.3,pz+(gateX?1.3:0),gateX?0.14:2.6,1.5,gateX?2.6:0.14,pn.col,{jitter:0,solid:false});
      const sp=texSprite(name+"'s yard",pn.col,512,96,52);sp.scale.set(8,1.5,1);sp.position.set(cx,5.6,cz);E.add(sp);
    }

    /* ------------------------------------------------------------ scenery */
    const rocks=[];
    function farFromPens(x,z,m){for(const pn of pens)if(Math.abs(x-pn.x)<pn.h+m&&Math.abs(z-pn.z)<pn.h+m)return false;return true;}
    function onFlat(x,z){const g=W.groundY(x,z,12);return g>-0.5&&g<0.5;}
    /* gentle hills */
    for(const hl of [[-32,0,15],[32,0,15],[-17,38,13],[17,-38,13]]){
      for(let k=0;k<3;k++)W.addBox(hl[0],0.5+k,hl[1],hl[2]-k*4.2,1,hl[2]-k*4.2,k===2?0x8ae27c:k===1?0x77d96b:0x6ad060,{jitter:0});
    }
    function palm(x,z){
      const lx=rand(-0.2,0.2),lz=rand(-0.2,0.2),hh=irand(0,1);
      for(let i=0;i<5;i++)W.addBox(x+lx*i,0.75+i*1.5,z+lz*i,0.95-i*0.07,1.5,0.95-i*0.07,i%2?0xa8774a:0x9a6a40,{jitter:0,solid:i===0});
      const tx=x+lx*5,tz=z+lz*5,ty=8;
      W.addBox(tx,ty,tz,8,0.5,2,0x35b85a,{jitter:0,solid:false});W.addBox(tx,ty,tz,2,0.5,8,0x35b85a,{jitter:0,solid:false});
      W.addBox(tx,ty+0.6,tz,5,0.5,5,0x49cd6a,{jitter:0,solid:false});
      for(const s of [-1,1]){W.addBox(tx+s*4,ty-0.7,tz,1.8,0.4,2,0x2da64e,{jitter:0,solid:false});W.addBox(tx,ty-0.7,tz+s*4,2,0.4,1.8,0x2da64e,{jitter:0,solid:false});}
      W.addBox(tx+0.7,ty-0.7,tz+0.5,0.8,0.8,0.8,0x6b4a2c,{jitter:0,solid:false});W.addBox(tx-0.6,ty-0.8,tz-0.5,0.8,0.8,0.8,0x6b4a2c,{jitter:0,solid:false});
    }
    let np=0,tries=0;
    while(np<34&&tries++<600){
      const edge=np<18,x=edge?pick([-1,1])*rand(63,69):rand(-58,58),z=edge?rand(-69,69):rand(-58,58);
      const xx=Math.random()<0.5?x:z,zz=xx===x?z:x;
      const px=edge?xx:x,pz=edge?zz:z;
      if(Math.abs(px)<26&&Math.abs(pz)<26)continue;if(!farFromPens(px,pz,2.5))continue;if(!onFlat(px,pz))continue;
      if(rocks.some(r=>Math.hypot(r.x-px,r.z-pz)<5))continue;rocks.push({x:px,z:pz,r:2});palm(px,pz);np++;
    }
    /* rocks and boulders */
    let nr=0;tries=0;
    while(nr<14&&tries++<400){
      const x=rand(-62,62),z=rand(-62,62);if(Math.abs(x)<27&&Math.abs(z)<27)continue;if(!farFromPens(x,z,3))continue;if(!onFlat(x,z))continue;if(rocks.some(r=>Math.hypot(r.x-x,r.z-z)<6))continue;
      const s=rand(1.8,3.2);W.addBox(x,s*0.3,z,s,s*0.6,s*0.85,0x9aa3b8,{jitter:0.12});W.addBox(x+s*0.2,s*0.6+0.35,z,s*0.55,0.7,s*0.5,0xaab2c5,{jitter:0.12});rocks.push({x,z,r:s});nr++;
    }
    /* bushes and flowers (walk-through) */
    for(let i=0;i<34;i++){
      const x=rand(-64,64),z=rand(-64,64);if(Math.abs(x)<26&&Math.abs(z)<26)continue;if(!farFromPens(x,z,1))continue;if(!onFlat(x,z))continue;
      const cc=pick([0x3fbf5c,0x4cd06b,0x2fae52]);W.addBox(x,0.5,z,2.2,1,1.8,cc,{jitter:0,solid:false});W.addBox(x+0.2,1.1,z,1.4,0.7,1.2,cc,{jitter:0,solid:false});
    }
    for(let i=0;i<70;i++){
      const x=rand(-64,64),z=rand(-64,64);if(Math.abs(x)<25&&Math.abs(z)<25)continue;if(!farFromPens(x,z,1))continue;if(!onFlat(x,z))continue;
      W.addBox(x,0.35,z,0.16,0.7,0.16,0x2f9a4a,{jitter:0,solid:false});W.addBox(x,0.8,z,0.5,0.34,0.5,pick([0xff6fb5,0xffd23c,0xffffff,0xff8a3c,0xa56bff]),{jitter:0,solid:false});
    }

    /* ------------------------------------------------------------ kaijus */
    const SPH=new T.SphereGeometry(1,18,14),CONE=new T.ConeGeometry(1,1,8),OCT=new T.OctahedronGeometry(1),TOR=new T.TorusGeometry(1,0.2,6,14,Math.PI),CYL=new T.CylinderGeometry(1,1,1,16);
    const white=new T.MeshPhongMaterial({color:0xffffff,shininess:80}),black=new T.MeshBasicMaterial({color:0x151826}),glint=new T.MeshBasicMaterial({color:0xffffff}),
      cheekM=new T.MeshBasicMaterial({color:0xff9fb8}),mouthM=new T.MeshBasicMaterial({color:0x3a1c24});
    function mesh(geo,mat,sx,sy,sz,x,y,z,par){const m=new T.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;if(par)par.add(m);return m;}
    function makeKaiju(col){
      const c=new T.Color(col),bodyM=new T.MeshPhongMaterial({color:c,shininess:60,specular:0x444444}),
        bellyM=new T.MeshPhongMaterial({color:c.clone().lerp(new T.Color(0xfff3cf),0.65),shininess:30}),
        darkM=new T.MeshPhongMaterial({color:c.clone().multiplyScalar(0.62),shininess:30}),
        spkM=new T.MeshPhongMaterial({color:col===0xffc93c?0xff6fb5:0xffd23c,shininess:70,specular:0x666666}),
        glowM=new T.MeshBasicMaterial({color:c.clone().lerp(new T.Color(0xffffff),0.35)}),
        auraM=new T.MeshBasicMaterial({color:c,transparent:true,opacity:0.16,depthWrite:false});
      owned.push(bodyM,bellyM,darkM,spkM,glowM,auraM);
      const root=new T.Group(),rig=new T.Group(),feet=[];root.add(rig);
      mesh(SPH,bodyM,1.05,0.95,1.15,0,1.15,0,rig);mesh(SPH,bellyM,0.82,0.78,0.55,0,1.0,0.72,rig);
      const head=mesh(SPH,bodyM,0.9,0.82,0.85,0,2.25,0.38,rig);
      for(const s of [-1,1]){
        mesh(SPH,white,0.3,0.34,0.3,s*0.42,2.4,1.0,rig);mesh(SPH,black,0.17,0.2,0.14,s*0.43,2.4,1.25,rig);mesh(SPH,glint,0.06,0.06,0.05,s*0.38,2.5,1.38,rig);
        mesh(SPH,cheekM,0.14,0.1,0.06,s*0.68,2.02,1.0,rig);
        mesh(SPH,darkM,0.22,0.32,0.22,s*1.0,1.3,0.55,rig);                    /* arms */
        feet.push(mesh(SPH,darkM,0.42,0.28,0.6,s*0.6,0.28,0.55,rig));        /* feet */
      }
      const mouth=mesh(TOR,mouthM,0.24,0.2,0.2,0,2.08,1.12,rig);mouth.rotation.z=Math.PI;
      /* spikes */
      const spikes=new T.Group();rig.add(spikes);
      const SP=[[0,3.0,0.15,0.3,0.7,-0.1],[0,2.4,-0.45,0.36,0.85,-0.5],[0,1.95,-0.95,0.38,0.9,-0.8],[0,1.4,-1.35,0.3,0.7,-1.0],[0,1.0,-1.8,0.24,0.55,-1.2]];
      for(const s of SP){const m=mesh(CONE,spkM,s[3],s[4],s[3],s[0],s[1],s[2],spikes);m.rotation.x=s[5];}
      /* tail with three segments that wag */
      const t0=new T.Group();t0.position.set(0,0.95,-0.95);rig.add(t0);mesh(SPH,bodyM,0.62,0.55,0.8,0,0,-0.45,t0);
      const t1=new T.Group();t1.position.set(0,0.06,-0.85);t0.add(t1);mesh(SPH,bodyM,0.46,0.4,0.62,0,0,-0.3,t1);
      const t2=new T.Group();t2.position.set(0,0.06,-0.6);t1.add(t2);mesh(SPH,bodyM,0.32,0.28,0.45,0,0,-0.2,t2);
      const tip=mesh(CONE,spkM,0.26,0.7,0.26,0,0,-0.65,t2);tip.rotation.x=-Math.PI/2;
      /* horns (Giant) and crown + aura (Titan) */
      const horns=new T.Group();rig.add(horns);
      for(const s of [-1,1]){const m=mesh(CONE,glowM,0.2,0.75,0.2,s*0.55,3.0,0.3,horns);m.rotation.z=-s*0.35;}
      const crown=new T.Group();rig.add(crown);
      for(const s of [-1,0,1]){const m=mesh(CONE,glowM,0.17,0.9,0.17,s*0.28,3.05+(s===0?0.25:0),0.55,crown);m.rotation.x=0.25;m.rotation.z=-s*0.25;}
      for(const s of [-1,1]){const m=mesh(CONE,glowM,0.25,0.9,0.25,s*1.05,1.9,-0.2,crown);m.rotation.z=-s*1.0;}
      const aura=mesh(SPH,auraM,2.6,2.3,2.8,0,1.5,0,rig);aura.castShadow=false;
      return {root,rig,tails:[t0,t1,t2],feet,spikes,horns,crown,aura,head};
    }

    const ks=[];                                     /* one record per competitor */
    function makeK(c,pen,isMe){
      const k={c,pen,isMe,name:c.name,color:COLS[pen.i],xp:0,stage:0,curS:SC[0],tgtS:SC[0],pop:0,munch:0,ky:0,kx:0,kz:0,yaw:0,walk:0,ph:rand(0,6),
        boostS:0,boostD:0,mult:1,fightCd:0,bombCd:0,wins:0,losses:0,eaten:0,think:rand(0.1,0.6),target:null,fighter:false,m:null,tail:0};
      k.m=makeKaiju(k.color);E.scene.add(k.m.root);
      k.kx=c.pos.x+2;k.kz=c.pos.z-2;k.ky=c.pos.y;
      lookFor(k);ks.push(k);return k;
    }
    const stageOf=xp=>xp>=STAGES[3]?3:xp>=STAGES[2]?2:xp>=STAGES[1]?1:0;
    function scaleOf(xp){const s=stageOf(xp);if(s===3)return SC[3]+Math.min(1,(xp-STAGES[3])/400)*0.4;
      return SC[s]+(SC[s+1]-SC[s])*0.4*(xp-STAGES[s])/(STAGES[s+1]-STAGES[s]);}
    const heightM=xp=>2+xp*0.06;
    const mTxt=xp=>Math.round(heightM(xp))+' m';
    function lookFor(k){const m=k.m,s=k.stage;m.spikes.scale.setScalar([0.7,1,1.25,1.5][s]);m.horns.visible=s>=2;m.crown.visible=s>=3;m.aura.visible=s>=3;}
    let noteText='',noteUntil=0;
    function note(t,sec){noteText=t;noteUntil=E.time+(sec||3.5);}
    function addXp(k,amt){
      k.xp=Math.max(0,k.xp+amt);const ns=stageOf(k.xp);k.tgtS=scaleOf(k.xp);
      if(ns>k.stage){k.stage=ns;k.pop=0.7;lookFor(k);
        const pos=V(k.kx,k.ky+k.curS*1.6,k.kz);E.fx.burst(pos,[k.color,0xffffff,0xffd23c],44,13,0.5,{life:1.4});E.fx.flash(pos,k.curS*3+2,0xfff3b0);
        if(k.isMe){E.announce('Your kaiju grew into a '+SNAMES[ns].toUpperCase()+'!',3);E.sfx('win');E.shake(0.3);}
        else{note(k.name+"'s kaiju is now a "+SNAMES[ns]+'!');}
      }else if(ns<k.stage){k.stage=ns;lookFor(k);}
    }
    function stageTxt(k){return SNAMES[k.stage];}

    /* the player, then the computer players */
    const kp=makeK(p,pens[0],true);
    p.name=p.name||'You';
    {const u=p.group.userData.mats,cc=new T.Color(COLS[0]);u[0].color.copy(cc);u[1].color.copy(cc).multiplyScalar(0.6);u[5].color.copy(cc).lerp(new T.Color(1,1,1),0.35);}
    const bots=E.bots(5);
    bots.forEach((b,i)=>{
      const pn=pens[i+1];b.team=null;b.color=COLS[i+1];
      const u=b.group.userData.mats,cc=new T.Color(COLS[i+1]);u[0].color.copy(cc);u[1].color.copy(cc).multiplyScalar(0.6);u[5].color.copy(cc).lerp(new T.Color(1,1,1),0.35);
      b.teleport(pn.x+(pn.gateX?pn.gs*2:0),0.4,pn.z+(pn.gateX?0:pn.gs*2));b.yaw=pn.gateX?(pn.gs>0?Math.PI/2:-Math.PI/2):(pn.gs>0?0:Math.PI);
      const k=makeK(b,pn,false);k.mult=0.62+0.06*L+rand(-0.05,0.05);b.brain.skill=0.5;b.brain.arrive=1.2;b.brain.speedMul=0.88+0.04*L;
    });
    pens.forEach((pn,i)=>buildPen(pn,ks[i].name));
    p.teleport(pens[0].x,0.4,pens[0].z+2);p.yaw=Math.PI;
    for(const k of ks){k.kx=k.c.pos.x+2.5;k.kz=k.c.pos.z-1.5;}

    /* ------------------------------------------------------------ food and eggs */
    const FOOD={berry:{xp:3,w:50},melon:{xp:5,w:22},fish:{xp:9,w:20},crystal:{xp:25,w:6}};
    const fm={berry:new T.MeshPhongMaterial({color:0xff4f86,shininess:90}),leaf:new T.MeshPhongMaterial({color:0x3fcf5f}),melon:new T.MeshPhongMaterial({color:0xa7e84e,shininess:60}),
      melonS:new T.MeshPhongMaterial({color:0x5cb83a}),fish:new T.MeshPhongMaterial({color:0xff9a3c,shininess:90}),fishB:new T.MeshPhongMaterial({color:0xffe0a8}),
      crystal:new T.MeshBasicMaterial({color:0x6ff2ff}),crystalI:new T.MeshBasicMaterial({color:0xffffff}),halo:new T.MeshBasicMaterial({color:0x9ff8ff,transparent:true,opacity:0.28,depthWrite:false}),
      egg:new T.MeshPhongMaterial({color:0xfff1c8,shininess:100}),spot:new T.MeshPhongMaterial({color:0xff9a3c}),spot2:new T.MeshPhongMaterial({color:0x7fd0ff}),
      ring:new T.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.5,depthWrite:false})};
    for(const k in fm)owned.push(fm[k]);
    function foodMesh(type){
      const g=new T.Group();
      if(type==='berry'){mesh(SPH,fm.berry,0.45,0.42,0.45,0,0,0,g);mesh(SPH,fm.leaf,0.16,0.08,0.16,0,0.4,0,g);mesh(SPH,fm.leaf,0.12,0.06,0.2,0.1,0.42,0.1,g);}
      else if(type==='melon'){mesh(SPH,fm.melon,0.62,0.52,0.52,0,0,0,g);mesh(SPH,fm.melonS,0.64,0.12,0.54,0,0.18,0,g);mesh(SPH,fm.melonS,0.64,0.12,0.54,0,-0.18,0,g);}
      else if(type==='fish'){mesh(SPH,fm.fish,0.8,0.4,0.3,0,0,0,g);mesh(SPH,fm.fishB,0.5,0.25,0.26,0.1,-0.12,0,g);const t=mesh(CONE,fm.fish,0.36,0.6,0.1,-0.95,0,0,g);t.rotation.z=Math.PI/2;
        mesh(SPH,white,0.12,0.12,0.12,0.52,0.1,0.22,g);mesh(SPH,black,0.06,0.06,0.06,0.57,0.1,0.3,g);}
      else{const o=mesh(OCT,fm.crystal,0.55,0.95,0.55,0,0,0,g);mesh(OCT,fm.crystalI,0.25,0.45,0.25,0,0,0,g);const h=mesh(SPH,fm.halo,1.0,1.0,1.0,0,0,0,g);h.castShadow=false;o.castShadow=false;}
      return g;
    }
    const foods=[],eggs=[];
    function spotOk(x,z,allowPen,allowVolc){
      if(!allowVolc&&Math.abs(x)<25&&Math.abs(z)<25)return false;
      if(!allowPen&&!farFromPens(x,z,0.8))return false;
      for(const r of rocks)if(Math.hypot(r.x-x,r.z-z)<r.r+1.4)return false;return true;
    }
    function randSpot(range){
      for(let n=0;n<30;n++){const x=rand(-range,range),z=rand(-range,range);if(!spotOk(x,z,false,false))continue;
        const y=W.groundY(x,z,12);if(!isFinite(y)||y>3.5)continue;return V(x,y,z);}
      return null;
    }
    function pickType(){let t=Math.random()*100;for(const k of ['berry','melon','fish','crystal']){t-=FOOD[k].w;if(t<=0)return k;}return 'berry';}
    function spawnFood(type,x,z,y,pen){
      if(foods.length>=96)return null;
      const g=foodMesh(type),f={type,xp:FOOD[type].xp,g,x,z,y:(y==null?W.groundY(x,z,12):y),ph:rand(0,6),pen:pen==null?-1:pen,alive:true,s:0.01};
      g.position.set(x,f.y+0.6,z);g.scale.setScalar(0.01);E.add(g);foods.push(f);return f;
    }
    function removeFood(f,i){f.alive=false;E.remove(f.g);if(i==null)i=foods.indexOf(f);if(i>=0){foods[i]=foods[foods.length-1];foods.pop();}}
    function spawnEgg(x,z,y){
      const g=new T.Group();mesh(SPH,fm.egg,0.6,0.8,0.6,0,0.2,0,g);
      for(const s of [[0.4,0.2,0.35,0.2],[-0.35,0.5,0.35,0.17],[0.1,-0.05,0.5,0.17],[-0.3,0.1,-0.45,0.18],[0.35,0.55,-0.3,0.15]])mesh(SPH,Math.random()<0.5?fm.spot:fm.spot2,s[3],s[3],s[3]*0.5,s[0],s[1],s[2],g);
      const r=mesh(CYL,fm.ring,1.05,0.04,1.05,0,-0.55,0,g);r.castShadow=false;
      g.position.set(x,y+1.0,z);E.add(g);const e={g,x,z,y,ph:rand(0,6),alive:true};eggs.push(e);
      E.fx.burst(V(x,y+1,z),[0xffe27a,0xffffff],14,6,0.3);return e;
    }
    for(let i=0;i<58;i++){const s=randSpot(54);if(s)spawnFood(pickType(),s.x,s.z,s.y);}
    for(const pn of pens)for(let i=0;i<2;i++)spawnYard(pn);
    function spawnYard(pn){const x=pn.x+rand(-4.8,4.8),z=pn.z+rand(-4.8,4.8);if(spawnFood(Math.random()<0.7?'berry':'melon',x,z,0.3,pn.i))pn.yard++;}
    for(let i=0;i<2;i++){const s=randSpot(50);if(s)spawnEgg(s.x,s.z,s.y);}

    /* ------------------------------------------------------------ rising tide */
    let tideE=6,tideHigh=false,tideNext=40,tideEnd=0;
    const tideM=new T.MeshBasicMaterial({color:0x5cc8ff,transparent:true,opacity:0.6,depthWrite:false}),foamM=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.75,depthWrite:false});owned.push(tideM,foamM);
    const BOXG=new T.BoxGeometry(1,1,1);
    const tideMesh=[],foamMesh=[];
    for(let i=0;i<4;i++){const m=new T.Mesh(BOXG,tideM);E.add(m);tideMesh.push(m);const f=new T.Mesh(BOXG,foamM);E.add(f);foamMesh.push(f);}
    function placeTide(e){
      const w=HALF*2+16,out=8,inn=HALF-e;      /* inner edge distance from centre */
      const len=out+e,mid=HALF+out/2-len/2;    /* strip centre offset from island centre */
      const spec=[[0,-mid,w,len,true],[0,mid,w,len,true],[-mid,0,len,2*inn,false],[mid,0,len,2*inn,false]];
      spec.forEach((s,i)=>{const m=tideMesh[i];m.position.set(s[0],0.14,s[1]);m.scale.set(s[4]?s[2]:s[2],0.3,s[4]?s[3]:s[3]);
        const f=foamMesh[i];
        if(s[4]){f.position.set(0,0.3,(i===0?-1:1)*(inn-0.2));f.scale.set(w,0.15,0.9);}else{f.position.set((i===2?-1:1)*(inn-0.2),0.3,0);f.scale.set(0.9,0.15,2*inn);}});
    }
    placeTide(6);
    function inWater(x,z){const i=HALF-tideE;return Math.abs(x)>i||Math.abs(z)>i;}

    /* ------------------------------------------------------------ lava bombs */
    const warns=[],flying=[];let bombNext=14;
    function aimBomb(){
      let x,z;
      const tgt=Math.random()<0.55?pick(ks.filter(k=>k.c.alive)):null;
      for(let n=0;n<12;n++){
        if(tgt){x=tgt.c.pos.x+rand(-7,7)+tgt.c.vel.x*0.8;z=tgt.c.pos.z+rand(-7,7)+tgt.c.vel.z*0.8;}else{x=rand(-56,56);z=rand(-56,56);}
        if(Math.abs(x)<HALF-TIDE_MAX-2&&Math.abs(z)<HALF-TIDE_MAX-2&&farFromPens(x,z,0.5)&&!(Math.abs(x)<24&&Math.abs(z)<24&&n<8))break;
      }
      return V(clamp(x,-52,52),0,clamp(z,-52,52));
    }
    function launchBomb(){
      const t=aimBomb();let gy=W.groundY(t.x,t.z,TOP+2);if(!isFinite(gy))gy=0;t.y=gy;
      const ring=E.slab(t.x,gy+0.12,t.z,8,0.12,8,0xff3b2e,0.5);
      const m=new T.Mesh(SPH,new T.MeshBasicMaterial({color:0xffa030}));m.scale.setScalar(1.0);E.add(m);
      const start=V(rand(-1.5,1.5),TOP+2,rand(-1.5,1.5));m.position.copy(start);
      const dur=1.9+Math.min(1,Math.hypot(t.x,t.z)/60)*0.5,w={pos:t,ring,age:0,dur,landed:false};warns.push(w);
      flying.push({m,start,end:t,age:0,dur,w,fxT:0});
      E.fx.burst(start,[0xffc93c,0xff8a3c,0xff4d5e],18,10,0.5,{life:1,up:1.2,gravity:0.5});E.sfx('boom');
    }
    function impact(f){
      const t=f.end;f.w.landed=true;
      E.fx.burst(V(t.x,t.y+0.5,t.z),[0xffc93c,0xff8a3c,0xff4d5e,0xffffff],34,15,0.6,{life:1.3});E.fx.flash(V(t.x,t.y+0.6,t.z),5,0xffd27a);E.sfx('boom');
      const pd=Math.hypot(p.pos.x-t.x,p.pos.z-t.z);if(pd<30)E.shake(clamp(0.7-pd/50,0.08,0.5));
      const scorch=E.slab(t.x,t.y+0.06,t.z,5,0.05,5,0x2a1c1c,0.55);E.after(3.5,()=>E.remove(scorch));
      for(const k of ks){const c=k.c;if(!c.alive)continue;const dx=c.pos.x-t.x,dz=c.pos.z-t.z,d=Math.hypot(dx,dz);
        if(d<5.2&&Math.abs(c.pos.y-t.y)<5&&k.bombCd<=0){
          k.bombCd=3;const n=d||1;c.vel.x+=dx/n*19;c.vel.z+=dz/n*19;c.vel.y=Math.max(c.vel.y,11);c.onGround=false;
          const loss=Math.max(3,Math.round(k.xp*0.05));addXp(k,-loss);
          for(let q=0;q<2;q++)spawnFood('berry',clamp(c.pos.x+rand(-3,3),-54,54),clamp(c.pos.z+rand(-3,3),-54,54),null);
          if(k.isMe){E.announce('Ouch! A lava bomb. Watch for red circles.',2);E.shake(0.3);}
        }}
    }

    /* ------------------------------------------------------------ battle phases */
    const bt={phase:'closed',next:50,until:0};
    const trimCols=[0xff8a3c,0xff6a1a,0xffb03c];
    function inArena(c){return Math.abs(c.pos.x)<AH-0.4&&Math.abs(c.pos.z)<AH-0.4&&c.pos.y>TOP-1;}
    function maxXp(){let m=0;for(const k of ks)m=Math.max(m,k.xp);return m;}
    function decideFighters(){
      const mx=Math.max(1,maxXp());
      for(const k of ks){if(k.isMe){k.fighter=k.xp>=mx*0.7;continue;}k.fighter=Math.random()<clamp(0.3+0.6*k.xp/mx,0.2,0.9);}
    }
    function openVolcano(){
      bt.phase='open';bt.until=E.time+22;
      E.announce('The volcano is open! Climb up and fight!',3.2);E.sfx('alarm');E.shake(0.5);
      for(const q of [[-5.5,-5.5],[5.5,-5.5],[-5.5,5.5],[5.5,5.5],[0,-6.5]])spawnFood('crystal',q[0],q[1],TOP+0.15);
      E.fx.burst(V(0,TOP+3,0),[0xffc93c,0xff8a3c,0xff4d5e],50,18,0.7,{life:1.6,up:1.6,gravity:0.5});
    }
    function battleTick(dt){
      const t=E.time;
      if(bt.phase==='closed'&&t>=bt.next-8){bt.phase='warn';decideFighters();E.announce('The volcano is waking up! Get ready to fight.',3);E.sfx('alarm');}
      else if(bt.phase==='warn'&&t>=bt.next)openVolcano();
      else if(bt.phase==='open'){
        if(t>=bt.until){bt.phase='closed';bt.next=t+55;E.announce('The volcano went quiet. Back to eating!',2.5);for(const k of ks)k.fighter=false;}
        else{
          const inA=ks.filter(k=>k.c.alive&&inArena(k.c));
          for(let i=0;i<inA.length;i++)for(let j=i+1;j<inA.length;j++){
            const a=inA[i],b=inA[j];if(a.fightCd>0||b.fightCd>0)continue;
            if(Math.hypot(a.c.pos.x-b.c.pos.x,a.c.pos.z-b.c.pos.z)<3.6+(a.curS+b.curS)*0.9)fight(a,b);
          }
        }
      }
    }
    function fight(a,b){
      const pa=heightM(a.xp)*rand(0.88,1.12),pb=heightM(b.xp)*rand(0.88,1.12),w=pa>=pb?a:b,l=w===a?b:a;
      const loss=Math.max(6,Math.round(l.xp*0.1)),gain=Math.round(loss*0.45)+3;
      const before=l.xp;addXp(l,-loss);addXp(w,gain);w.wins++;l.losses++;a.fightCd=b.fightCd=5;
      let dx=l.c.pos.x-w.c.pos.x,dz=l.c.pos.z-w.c.pos.z;const n=Math.hypot(dx,dz)||1;dx/=n;dz/=n;
      l.c.vel.x+=dx*24;l.c.vel.z+=dz*24;l.c.vel.y=9;l.c.onGround=false;w.c.vel.x-=dx*5;w.c.vel.z-=dz*5;
      const mid=V((a.kx+b.kx)/2,Math.max(a.ky,b.ky)+Math.max(a.curS,b.curS)*1.4,(a.kz+b.kz)/2);
      E.fx.burst(mid,[0xffc93c,0xffffff,0xff8a3c,w.color],30,13,0.45,{life:1.1});E.fx.flash(mid,Math.max(a.curS,b.curS)*2.2,0xfff1b0);E.sfx('hit');
      l.m.rig.rotation.x=0;l.munch=-0.4;
      if(w.isMe){E.announce('You beat '+l.name+'! +'+gain+' growth',2.4);E.shake(0.3);}
      else if(l.isMe){E.announce(w.name+"'s kaiju was bigger. You shrank a little.",2.6);E.shake(0.3);}
      else note(w.name+' beat '+l.name+' in the volcano!');
    }

    /* ------------------------------------------------------------ eggs and food pickup */
    function eggPerk(k){
      const kind=pick(['growth','speed','double']);
      if(kind==='growth'){addXp(k,25);if(k.isMe)E.announce('Growth egg! Your kaiju shot up.',2.2);}
      else if(kind==='speed'){k.boostS=14;if(k.isMe)E.announce('Speed egg! Run fast for a while.',2.2);}
      else{k.boostD=22;if(k.isMe)E.announce('Double food egg! Food counts twice.',2.2);}
      const pos=V(k.c.pos.x,k.c.pos.y+2,k.c.pos.z);E.fx.burst(pos,[0xffe27a,0xffffff,k.color],26,10,0.4,{life:1.2});E.fx.flash(pos,3,0xfff0a0);
      if(k.isMe)E.sfx('pickup');else if(Math.hypot(k.c.pos.x-p.pos.x,k.c.pos.z-p.pos.z)<25)note(k.name+' found a '+kind+' egg.');
    }
    function collect(dt){
      for(const k of ks){
        const c=k.c;if(!c.alive)continue;const r=2.5+k.curS*0.45,r2=r*r;
        for(let i=foods.length-1;i>=0;i--){const f=foods[i];if(f.s<0.5)continue;const dx=f.x-c.pos.x,dz=f.z-c.pos.z;
          if(dx*dx+dz*dz<r2&&Math.abs(f.y-c.pos.y)<3.2){
            const amt=Math.max(1,Math.round(f.xp*k.mult*(k.boostD>0?2:1)));
            E.fx.burst(V(f.x,f.y+0.8,f.z),f.type==='crystal'?[0x6ff2ff,0xffffff]:[0xffffff,k.color,0xffd23c],f.type==='crystal'?16:8,6,0.25,{life:0.8});
            if(f.pen>=0)pens[f.pen].yard--;
            removeFood(f,i);addXp(k,amt);k.eaten++;k.munch=0.25;if(k.isMe)E.sfx('pickup');
          }}
        for(let i=eggs.length-1;i>=0;i--){const e=eggs[i];const dx=e.x-c.pos.x,dz=e.z-c.pos.z;
          if(dx*dx+dz*dz<r2&&Math.abs(e.y-c.pos.y)<3.2){E.remove(e.g);eggs[i]=eggs[eggs.length-1];eggs.pop();eggPerk(k);}}
      }
    }

    /* ------------------------------------------------------------ computer players */
    function nearestOpponent(k){let best=null,bd=1e9;for(const o of ks){if(o===k||!o.c.alive||!inArena(o.c))continue;const d=Math.hypot(o.c.pos.x-k.c.pos.x,o.c.pos.z-k.c.pos.z);if(d<bd){bd=d;best=o;}}return best;}
    function bestFood(k){
      const c=k.c;let best=null,bv=0;const dbl=k.boostD>0?2:1;
      for(const f of foods){if(f.s<0.5)continue;if(f.pen>=0&&f.pen!==k.pen.i)continue;if(inWater(f.x,f.z)||(Math.abs(f.x)>HALF-TIDE_MAX-4&&tideHigh))continue;
        if(f.y>TOP-1&&bt.phase==='closed'&&Math.abs(f.x)<AH&&Math.abs(f.z)<AH){}
        let bad=false;for(const w of warns)if(Math.hypot(f.x-w.pos.x,f.z-w.pos.z)<7){bad=true;break;}if(bad)continue;
        const d=Math.hypot(f.x-c.pos.x,f.z-c.pos.z),v=f.xp*dbl/(d+7)*rand(0.75,1.25);if(v>bv){bv=v;best=f;}}
      for(const e of eggs){const d=Math.hypot(e.x-c.pos.x,e.z-c.pos.z),v=42/(d+7)*rand(0.8,1.2);if(v>bv){bv=v;best=e;}}
      return best;
    }
    function think(k,dt){
      k.think-=dt;if(k.think>0)return;k.think=rand(0.35,0.7);
      const c=k.c,br=c.brain;if(!br||!c.alive)return;
      /* get away from red circles */
      for(const w of warns){const dx=c.pos.x-w.pos.x,dz=c.pos.z-w.pos.z,d=Math.hypot(dx,dz);
        if(d<7.5){const n=d||1;br.goal=V(c.pos.x+dx/n*12,0,c.pos.z+dz/n*12);br.arrive=1;k.target=null;k.think=0.3;return;}}
      /* away from the water */
      if(inWater(c.pos.x,c.pos.z)||tideHigh&&Math.abs(c.pos.x)>HALF-TIDE_MAX-1||tideHigh&&Math.abs(c.pos.z)>HALF-TIDE_MAX-1){
        br.goal=V(c.pos.x*0.6,0,c.pos.z*0.6);br.arrive=2;k.target=null;return;}
      /* the fight */
      if(k.fighter&&(bt.phase==='warn'||bt.phase==='open')){
        if(bt.phase==='open'&&inArena(c)){const o=nearestOpponent(k);br.goal=o?V(o.c.pos.x,0,o.c.pos.z):V(rand(-4,4),0,rand(-4,4));br.arrive=1.5;}
        else{br.goal=V(rand(-3,3),0,rand(-3,3));br.arrive=2;}
        return;
      }
      /* eat */
      if(k.target&&k.target.alive&&Math.random()<0.8){br.goal=V(k.target.x,0,k.target.z);br.arrive=0.9;return;}
      k.target=bestFood(k);
      if(k.target){br.goal=V(k.target.x,0,k.target.z);br.arrive=0.9;}
      else{br.goal=V(rand(-45,45),0,rand(-45,45));br.arrive=2;}
    }

    /* ------------------------------------------------------------ HUD */
    const hud=document.createElement('div');
    hud.style.cssText='position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:min(400px,58vw);pointer-events:none;color:#fff;font:700 15px/1.25 "Chakra Petch","Trebuchet MS",sans-serif;text-align:center;text-shadow:0 2px 0 rgba(0,0,0,.5)';
    hud.innerHTML='<div class="gk-a" style="font-size:19px;margin-bottom:4px"></div><div style="height:17px;background:rgba(18,22,48,.8);border:2px solid rgba(255,255,255,.22);border-radius:99px;overflow:hidden"><i class="gk-b" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd23c,#ff8a3c);border-radius:99px"></i></div><div class="gk-c" style="margin-top:4px;font-size:14px"></div>';
    E.host.appendChild(hud);
    const hA=hud.querySelector('.gk-a'),hB=hud.querySelector('.gk-b'),hC=hud.querySelector('.gk-c');
    let hudT=0,scoreT=0;
    function setT(el,t){if(el.textContent!==t)el.textContent=t;}
    function updateHud(dt){
      hudT-=dt;if(hudT>0)return;hudT=0.12;
      const k=kp,nxt=k.stage<3?STAGES[k.stage+1]:null;
      setT(hA,stageTxt(k)+' kaiju  -  '+mTxt(k.xp));
      const frac=nxt?(k.xp-STAGES[k.stage])/(nxt-STAGES[k.stage]):1;hB.style.width=Math.round(clamp(frac,0,1)*100)+'%';
      const perks=[];if(k.boostS>0)perks.push('Speed '+Math.ceil(k.boostS)+'s');if(k.boostD>0)perks.push('Double food '+Math.ceil(k.boostD)+'s');
      setT(hC,nxt?('Next: '+SNAMES[k.stage+1]+' at '+mTxt(nxt)+(perks.length?'   |   '+perks.join('  ')  :'')):('Titan reached!'+(perks.length?'   |   '+perks.join('  '):'')));
      let vol=bt.phase==='open'?'Volcano OPEN '+E.fmt(bt.until-E.time):bt.phase==='warn'?'Volcano wakes in '+E.fmt(bt.next-E.time):'Volcano in '+E.fmt(bt.next-E.time);
      if(tideHigh)vol='High tide!  '+vol;
      let s='Time '+E.fmt(ROUND-E.time)+'  |  '+vol;if(E.time<noteUntil)s=noteText+'  |  '+E.fmt(ROUND-E.time);
      E.status(s);
      scoreT-=0.12;if(scoreT<=0){scoreT=0.3;
        const rows=ks.slice().sort((a,b)=>b.xp-a.xp).map(q=>({label:(q.isMe?'You':q.name)+' - '+stageTxt(q),value:mTxt(q.xp),color:q.color,me:q.isMe}));E.score(rows);}
    }

    /* ------------------------------------------------------------ per-frame kaiju drawing */
    function drawKaiju(k,dt){
      const c=k.c,m=k.m;
      if(k.pop>0)k.pop-=dt;if(k.munch>0)k.munch-=dt;else if(k.munch<0)k.munch+=dt;
      k.curS+=(k.tgtS-k.curS)*Math.min(1,4*dt);
      const s=k.curS,side=1.8+s*1.15,back=0.8+s*0.8;
      const tx=c.pos.x+Math.cos(c.yaw)*side-Math.sin(c.yaw)*back,tz=c.pos.z-Math.sin(c.yaw)*side-Math.cos(c.yaw)*back;
      const ox=k.kx,oz=k.kz;let dx=tx-k.kx,dz=tz-k.kz;const dd=Math.hypot(dx,dz);
      if(dd>40){k.kx=tx;k.kz=tz;}else{const f=Math.min(1,(3.2+s*0.2)*dt);k.kx+=dx*f;k.kz+=dz*f;}
      k.ky+=(c.pos.y-k.ky)*Math.min(1,7*dt);
      const mv=Math.hypot(k.kx-ox,k.kz-oz)/Math.max(dt,0.001);
      if(mv>0.6){k.yaw=angLerp(k.yaw,Math.atan2(k.kx-ox,k.kz-oz),Math.min(1,7*dt));}
      else k.yaw=angLerp(k.yaw,c.yaw,Math.min(1,3*dt));
      const mk=clamp(mv/6,0,1);k.walk+=mv*dt*0.9/Math.sqrt(s);
      const t=E.time*4+k.ph;
      m.root.position.set(k.kx,k.ky,k.kz);m.root.rotation.y=k.yaw;
      const popK=k.pop>0?1+0.28*Math.sin(clamp(k.pop/0.7,0,1)*Math.PI):1,mun=k.munch>0?1+0.14*Math.sin(clamp(k.munch/0.25,0,1)*Math.PI):1;
      m.rig.scale.set(s*popK*(2-mun),s*popK*mun,s*popK*(2-mun));
      m.rig.position.y=Math.abs(Math.sin(k.walk))*0.16*s*mk;m.rig.rotation.z=Math.sin(k.walk)*0.07*mk;
      m.feet[0].position.y=0.28+Math.max(0,Math.sin(k.walk))*0.3*mk;m.feet[1].position.y=0.28+Math.max(0,-Math.sin(k.walk))*0.3*mk;
      const wag=0.28+0.3*mk;m.tails[0].rotation.y=Math.sin(t)*wag;m.tails[1].rotation.y=Math.sin(t-0.9)*wag*1.1;m.tails[2].rotation.y=Math.sin(t-1.8)*wag*1.2;
      if(k.stage>=3)m.aura.material.opacity=0.12+0.06*Math.sin(E.time*3+k.ph);
    }

    /* ------------------------------------------------------------ main loop */
    let acc=0,ending=false,tideChk=0,smokeT=0,foodT=0,eggT=4,yardT=5,trimT=0,msgBomb=0;
    function finishRound(titanBy){
      if(ending)return;ending=true;
      const order=ks.slice().sort((a,b)=>b.xp-a.xp),top=order[0],second=order[1],me=kp;
      const win=top===me;
      const delay=titanBy?2.2:0.2;
      if(titanBy)E.announce(titanBy.isMe?'Your kaiju is a TITAN!':titanBy.name+"'s kaiju is a TITAN!",2.2);
      E.after(delay,()=>{
        if(win){
          const lead=(me.xp-second.xp)/Math.max(1,second.xp),stars=(titanBy===me||lead>=0.2)?3:lead>=0.07?2:1;
          E.finish({win:true,stars,title:titanBy===me?'You grew a Titan!':'Biggest kaiju on the island!',lines:['Your kaiju grew to '+mTxt(me.xp)+' tall, a '+stageTxt(me)+'.','You ate '+me.eaten+' snacks and won '+me.wins+' volcano '+(me.wins===1?'fight':'fights')+'.']});
        }else{
          const place=order.indexOf(me)+1;
          E.finish({win:false,title:titanBy?top.name+' grew a Titan first':'Not the biggest this time',lines:[top.name+"'s kaiju reached "+mTxt(top.xp)+'. Yours was '+mTxt(me.xp)+' (place '+place+' of '+order.length+').','Grab more food and try the volcano fights next time.']});
        }
      });
    }
    return {
      autopilot(dt){
        if(!p.brain){p.brain=new VG.Brain(p,E);p.brain.skill=0.8;}
        think(kp,dt);
      },
      update(dt){
        if(ending){for(const k of ks)drawKaiju(k,dt);return;}
        const t=E.time;
        /* bots */
        for(const k of ks){if(!k.isMe)think(k,dt);k.fightCd-=dt;k.bombCd-=dt;if(k.boostS>0)k.boostS-=dt;if(k.boostD>0)k.boostD-=dt;}
        /* tide */
        if(!tideHigh&&t>=tideNext){tideHigh=true;tideEnd=t+16;E.announce('High tide! Stay off the beach.',2.8);E.sfx('alarm');}
        else if(tideHigh&&t>=tideEnd){tideHigh=false;tideNext=t+70;}
        const wave=Math.sin(t*0.9)*0.9,tgt=(tideHigh?TIDE_MAX:6)+wave;tideE+=(tgt-tideE)*Math.min(1,0.7*dt);placeTide(tideE);
        tideChk-=dt;if(tideChk<=0){tideChk=0.4;
          for(let i=foods.length-1;i>=0;i--){const f=foods[i];if(inWater(f.x,f.z)&&f.s>0.5){E.fx.burst(V(f.x,0.6,f.z),[0x9be4ff,0xffffff],6,5,0.25,{life:0.7});if(f.pen>=0)pens[f.pen].yard--;removeFood(f,i);}}}
        /* characters: keep on the island, slow in water, speed perks */
        for(const k of ks){
          const c=k.c;if(!c.alive)continue;
          const lim=HALF-1.2;if(c.pos.x>lim){c.pos.x=lim;c.vel.x=Math.min(0,c.vel.x);}if(c.pos.x<-lim){c.pos.x=-lim;c.vel.x=Math.max(0,c.vel.x);}
          if(c.pos.z>lim){c.pos.z=lim;c.vel.z=Math.min(0,c.vel.z);}if(c.pos.z<-lim){c.pos.z=-lim;c.vel.z=Math.max(0,c.vel.z);}
          const wet=inWater(c.pos.x,c.pos.z);
          c.speed=(k.boostS>0?16:11)*(wet?0.5:1)*(k.isMe?1:1);
          if(wet&&c.onGround){const i=HALF-tideE;if(Math.abs(c.pos.x)>i)c.vel.x-=Math.sign(c.pos.x)*18*dt;if(Math.abs(c.pos.z)>i)c.vel.z-=Math.sign(c.pos.z)*18*dt;
            if(Math.random()<dt*6)E.fx.burst(V(c.pos.x,0.4,c.pos.z),[0x9be4ff,0xffffff],2,3,0.18,{life:0.5});}
        }
        /* battles */
        battleTick(dt);
        /* bombs */
        if(t>=bombNext){launchBomb();bombNext=t+(bt.phase==='open'?2.4:3.4)/(1+0.12*(L-1));}
        for(let i=flying.length-1;i>=0;i--){const f=flying[i];f.age+=dt;const u=Math.min(1,f.age/f.dur);
          f.m.position.set(lerp(f.start.x,f.end.x,u),lerp(f.start.y,f.end.y,u)+22*4*u*(1-u),lerp(f.start.z,f.end.z,u));
          f.fxT-=dt;if(f.fxT<=0){f.fxT=0.05;E.fx.burst(f.m.position,[0xffc93c,0xff8a3c],1,1.5,0.5,{gravity:0.1,life:0.6,up:0});}
          const ring=f.w.ring;ring.material.opacity=0.3+0.3*Math.sin(t*14);const sc=8*(1-u*0.15);ring.scale.x=sc;ring.scale.z=sc;
          if(u>=1){impact(f);E.remove(f.m);E.remove(ring);const wi=warns.indexOf(f.w);if(wi>=0)warns.splice(wi,1);flying.splice(i,1);}}
        /* volcano show */
        smokeT-=dt;if(smokeT<=0){smokeT=0.35;E.fx.burst(V(rand(-3,3),TOP+1,rand(-3,3)),[0x7a6a70,0x9c8e94,0xb8aab0],2,2.5,0.9,{up:1.4,gravity:0.1,life:1.6});
          E.fx.burst(V(rand(-3,3),TOP+1,rand(-3,3)),[0xffc93c,0xff8a3c],2,5,0.3,{up:2.2,gravity:0.5,life:1.2});}
        crater.intensity=1.3+0.5*Math.sin(t*3)+(bt.phase==='open'?1.2:0);
        trimT-=dt;if(trimT<=0){trimT=bt.phase==='closed'?0.22:0.1;const ph=Math.floor(t*(bt.phase==='closed'?3:8));
          trim.forEach((b,i)=>W.setColor(b,bt.phase==='open'?((ph+i)%2?0xffe55a:0xff3b2e):bt.phase==='warn'?((ph+i)%2?0xffb03c:0xff4a2a):trimCols[(ph+i)%3]));
          W.setColor(lava,(ph%2)?0xffa02a:0xff5a14);
          for(let i=0;i<veins.length;i+=3)W.setColor(veins[i],((ph+i)%2)?0xffa22a:0xff6a1a);}
        /* food and eggs */
        foodT-=dt;if(foodT<=0){foodT=0.42/(1+0.0*L);if(foods.length<72){const s=randSpot(54);if(s)spawnFood(pickType(),s.x,s.z,s.y);}}
        yardT-=dt;if(yardT<=0){yardT=4;for(const pn of pens)if(pn.yard<2)spawnYard(pn);}
        eggT-=dt;if(eggT<=0){eggT=16;if(eggs.length<3){const s=randSpot(52);if(s)spawnEgg(s.x,s.z,s.y);}}
        for(const f of foods){if(f.s<1){f.s=Math.min(1,f.s+dt*3);f.g.scale.setScalar(f.s);}
          f.g.position.y=f.y+0.65+Math.sin(t*2.6+f.ph)*0.2;f.g.rotation.y+=dt*1.6;if(f.type==='crystal')f.g.rotation.z=Math.sin(t*2+f.ph)*0.2;}
        for(const e of eggs){e.g.position.y=e.y+1.0+Math.sin(t*2.2+e.ph)*0.25;e.g.rotation.y+=dt*1.2;e.g.rotation.z=Math.sin(t*3+e.ph)*0.12;}
        collect(dt);
        for(const k of ks)drawKaiju(k,dt);
        E.cam.dist+=((13+kp.curS*3.4)-E.cam.dist)*Math.min(1,1.5*dt);
        updateHud(dt);
        /* the end */
        for(const k of ks)if(k.xp>=STAGES[3]){hudT=0;updateHud(0);finishRound(k);return;}
        if(t>=ROUND){hudT=0;updateHud(0);finishRound(null);}
      },
      onDeath(c){
        const k=ks.find(q=>q.c===c);if(!k)return;
        E.after(1.2,()=>{if(!E.over)E.respawn(c,k.pen.x,0.5,k.pen.z,2);});
      },
      dispose(){
        if(hud.parentNode)hud.parentNode.removeChild(hud);
        for(const o of owned){if(o.dispose)try{o.dispose();}catch(e){}}
        for(const k of ks){try{E.scene.remove(k.m.root);}catch(e){}}
      }
    };
  }
});
