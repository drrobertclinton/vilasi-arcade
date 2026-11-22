/* Rubble Royale: a free-for-all arena battle on six floating isles around a big central island. */
VG.register({
  id:'rubble-royale',name:'Rubble Royale',tagline:'Everyone for themselves on the floating isles. First to the target score wins.',color:0xff8a3c,levels:1,
  howTo:[
    'Everybody is against everybody. Knock out other players with your six tools to score a knockout.',
    'The first player to reach the knockout target wins. If time runs out, whoever leads wins.',
    'Step on a glowing launch pad to fly to the middle island. Climb the keep for the gold shield prize.',
    'Bridges can be blown up, but they are rebuilt every 40 seconds. Do not fall off the isles!'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle,lerp}=VG.util,C=VG.COLORS,W=E.world,B=VG.build,L=E.level,T=THREE;
    const TARGET=[5,6,7,8,10][L-1],NBOTS=[4,5,6,7,8][L-1],LIMIT=300;
    const K=(L-1)/4,SKILL=0.2+0.15*(L-1),AGGR=0.2+0.15*(L-1);
    const p=E.player;
    W.killY=-30;E.cam.dist=11;
    E.setSky(0x3d95ff,0xcfeeff,0xd6efff,130,640);E.setLight(0.64,0.6,0xfff4de);

    /* ------------------------------------------------------------ map */
    const ISL=[
      {id:'NW',name:'Brick Fort',x:-46,z:-48,h:3,hs:13.5,skin:0x58c26b,rocks:[0x9b8fc9,0x7f74b3],plaza:0xf6f0dc,corner:true},
      {id:'NE',name:'Dune Watch',x:46,z:-48,h:5,hs:13.5,skin:0xf0d58c,rocks:[0xb59a8a,0x9a8074],plaza:0xfff3d0,corner:true},
      {id:'SW',name:'Market Meadow',x:-46,z:48,h:1,hs:13.5,skin:0x7bd88a,rocks:[0x8aa0d8,0x7088c4],plaza:0xfff0f5,corner:true},
      {id:'SE',name:'Arch Ruins',x:46,z:48,h:4,hs:13.5,skin:0xaeb6cf,rocks:[0x8d8fb0,0x74779c],plaza:0xe9edf8,corner:true},
      {id:'W',name:'Windmill Hill',x:-54,z:0,h:2,hs:13.5,skin:0x66d17a,rocks:[0x9b8fc9,0x7f74b3],plaza:0xf6f0dc},
      {id:'E',name:'Crate Yard',x:54,z:0,h:6,hs:13.5,skin:0xe8d6a8,rocks:[0xb59a8a,0x9a8074],plaza:0xfff3d0},
      {id:'C',name:'The Keep',x:0,z:0,h:2,hs:20.5,skin:0x4fbf6a,rocks:[0x8f86c2,0x756bab],plaza:0xffffff}
    ];
    const IS={};for(const i of ISL)IS[i.id]=i;
    function islandAt(x,z){for(const i of ISL)if(Math.abs(x-i.x)<i.hs&&Math.abs(z-i.z)<i.hs)return i;return null;}

    function island(i,S){
      const {x:cx,z:cz,h}=i;
      W.addBox(cx,h-0.5,cz,S,1,S,i.skin,{jitter:0});
      let top=h-1;const spec=[[S-1.6,2.2],[S*0.78,3],[S*0.56,3.5],[S*0.36,4],[S*0.18,5]];
      spec.forEach((s,k)=>{W.addBox(cx,top-s[1]/2,cz,s[0],s[1],s[0],i.rocks[k%2],{jitter:0});top-=s[1];});
    }
    for(const i of ISL)island(i,i.id==='C'?40:26);
    /* plazas (one step up, so the islands look stepped) */
    for(const i of ISL){
      if(i.id==='C')continue;
      if(i.id==='W')W.addBox(-46.5,i.h+0.5,0,11,1,12,i.plaza,{jitter:0});
      else if(i.id==='E')W.addBox(46.5,i.h+0.5,0,11,1,12,i.plaza,{jitter:0});
      else W.addBox(i.x,i.h+0.5,i.z,12,1,12,i.plaza,{jitter:0});
    }

    /* bridges: stepped plank decks, remembered so they can be rebuilt */
    const planks=[];
    function plank(x,top,z,sx,sz,col){
      const s={x,y:top-0.3,z,sx,sz,col};
      s.box=W.addBox(x,s.y,z,sx,0.6,sz,col,{breakable:true,tag:'bridge'});planks.push(s);
    }
    function bridge(axis,fixed,a,b,hA,hB){
      const len=Math.abs(b-a),n=Math.max(2,Math.round(len/2)),tl=len/n,dir=Math.sign(b-a),dy=hB-hA;
      for(let k=0;k<n;k++){
        const c=a+dir*(k+0.5)*tl,top=hA+Math.round(dy*(k+0.5)/n);
        for(let lane=0;lane<3;lane++){
          const off=(lane-1)*2,col=lane===1?(k%2?0xe9b870:0xd9a05a):0xc4572a;
          if(axis==='x')plank(c,top,fixed+off,tl,2,col);else plank(fixed+off,top,c,2,tl,col);
        }
      }
    }
    function hub(cx,cz,top){
      for(let i=0;i<5;i++)for(let j=0;j<5;j++)plank(cx-4+i*2,top,cz-4+j*2,2,2,(i+j)%2?0x8fdcff:0xf6f6ff);
    }
    hub(0,-48,4);hub(0,48,3);
    bridge('x',-48,-33,-5,3,4);bridge('x',-48,5,33,4,5);
    bridge('x',48,-33,-5,1,3);bridge('x',48,5,33,3,4);
    bridge('z',0,-43,-20,4,2);bridge('z',0,43,20,3,2);
    bridge('x',0,-20,-41,2,2);bridge('x',0,20,41,2,6);
    bridge('z',-46,-35,-13,3,2);bridge('z',-46,13,35,2,1);
    bridge('z',46,-35,-13,5,6);bridge('z',46,13,35,6,4);
    function repair(){
      let n=0;
      for(const s of planks)if(!s.box.alive){s.box=W.addBox(s.x,s.y,s.z,s.sx,0.6,s.sz,s.col,{breakable:true,tag:'bridge'});n++;}
      if(n>0){E.announce('Bridges repaired!',2.4);E.sfx('build');E.fx.burst(V(0,6,0),[0xffd23e,0xffffff],10,6,0.3,{life:0.8});}
    }
    E.every(40,()=>{if(!E.over)repair();});

    /* small helpers for scenery */
    const brick=(x,y,z,sx,sy,sz,col)=>W.addBox(x,y,z,sx,sy,sz,col,{breakable:true});
    function flag(x,y,z,col){
      W.addBox(x,y+3,z,0.3,6,0.3,0x6b4a2a,{breakable:true,solid:false});
      W.addBox(x+1,y+5.2,z,1.8,1.2,0.15,col,{breakable:true,solid:false,jitter:0});
    }
    function tree(x,z,h){
      W.addBox(x,h+1.5,z,1,3,1,C.wood,{breakable:true});
      W.addBox(x,h+4.2,z,4,2.6,4,0x35b86a,{breakable:true});
      W.addBox(x,h+6.3,z,2.6,1.8,2.6,0x4ccf7f,{breakable:true});
    }

    /* ---- Brick Fort (NW) */
    (function(){
      const h=3,col=0xe5604a,dark=0xc4402c;
      const door=(i,row)=>row<2&&(i===1||i===2);
      B.wall(W,'x',-58,-50,-59.5,h,3,col,{});
      B.wall(W,'x',-58,-50,-52.5,h,3,col,{skip:door});
      B.wall(W,'z',-59,-53,-57.5,h,3,col,{});
      B.wall(W,'z',-59,-53,-50.5,h,3,col,{skip:(i,row)=>row<2&&i===1});
      for(const zz of [-59.5,-52.5])B.wall(W,'x',-58,-50,zz,h+6,1,dark,{skip:i=>i%2===1});
      for(const xx of [-57.5,-50.5])B.wall(W,'z',-59,-53,xx,h+6,1,dark,{skip:i=>i%2===1});
      for(const [x,z] of [[-57,-59],[-51,-59],[-57,-53],[-51,-53]]){
        for(let r=0;r<4;r++)brick(x,h+1+r*2,z,2,2,2,dark);
        W.addBox(x,h+8.5,z,3,1,3,0xffb347,{breakable:true,jitter:0});
      }
      flag(-57,h+9,-59,0xffd23e);flag(-51,h+9,-53,0xffffff);
      brick(-55,h+1,-57,2,2,2,0xd9a05a);
    })();
    /* ---- Dune Watch (NE): two-floor tower */
    (function(){
      const h=5;
      B.tower(W,54,-56,4,2,0xf0c987,0xb07a4a,h,{tag:'tower'});
      const top=h+13+0.5;
      for(const zz of [-59.5,-52.5])B.wall(W,'x',50,58,zz,top,1,0xe0a85a,{skip:i=>i%2===1});
      for(const xx of [50.5,57.5])B.wall(W,'z',-59,-53,xx,top,1,0xe0a85a,{skip:i=>i%2===1});
      flag(51,top+2,-58,0xff4d5e);flag(57,top+2,-54,0x22c9c2);
      for(const [x,z] of [[49,-61],[59,-51]])B.wall(W,'x',x-1,x+1,z,h,2,0xd9a05a,{});
    })();
    /* ---- Market Meadow (SW): a row of market stalls */
    (function(){
      const h=1,cols=[0xff5a5a,0x22c9c2,0xffc93c];
      for(let s=0;s<3;s++){
        const x0=-58+s*5.2;
        brick(x0+2,h+0.7,59,4,1.4,1,C.wood);
        for(const [px,pz] of [[0.2,56.2],[3.8,56.2],[0.2,59.6],[3.8,59.6]])brick(x0+px,h+2.1,pz,0.4,4.2,0.4,0x8a5a32);
        brick(x0+2,h+4.4,57.9,4.6,0.4,4.2,cols[s]);
        brick(x0+1,h+4.65,57.9,0.9,0.2,4.2,0xffffff);brick(x0+3,h+4.65,57.9,0.9,0.2,4.2,0xffffff);
        W.addBox(x0+0.4,h+3.7,56.1,0.4,0.4,0.4,0xfff0a0,{glow:true,solid:false});W.addBox(x0+3.6,h+3.7,56.1,0.4,0.4,0.4,0xfff0a0,{glow:true,solid:false});
        for(let g=0;g<3;g++)brick(x0+0.8+g*1.2,h+1.8,59,0.8,0.8,0.8,pick([0xff6fb5,0xffc93c,0x35d07f,0xff8a3c]));
        brick(x0+2,h+1,60.3,1.6,2,1.2,0xd9a05a);
      }
    })();
    /* ---- Arch Ruins (SE): a broken stone arch */
    (function(){
      const h=4,st=0xbfc4dd,st2=0xa6abc9;
      for(const x of [50,58])for(let r=0;r<5;r++)brick(x,h+1+r*2,56,2,2,2,r%2?st:st2);
      brick(52,h+11,56,2,2,2,st2);brick(56,h+11,56,2,2,2,st2);
      B.wall(W,'x',49,59,56,h+12,2,st,{thick:2,skip:(i,row)=>(row===0&&i===2)||(row===1&&i>=1&&i<=3)});
      for(let k=0;k<9;k++)brick(rand(49,58),h+1,rand(51,60),2,2,2,pick([st,st2]));
      brick(55,h+1,52.5,2,2,2,st);brick(57,h+1,52.5,2,2,2,st2);brick(57,h+3,52.5,2,2,2,st);
      flag(58,h+16.5,56,0xa56bff);
    })();
    /* ---- Windmill Hill (W): tall tower with sails */
    (function(){
      const h=2;
      B.tower(W,-59,0,5,3,0xf6efe0,0xb07a4a,h,{tag:'mill'});
      const topY=h+19.5+0.5;
      for(let k=0;k<5;k++){const s=11-k*2.2;W.addBox(-59,topY+0.5+k,0,s,1,s,k%2?0xe8604a:0xd2483a,{breakable:true});}
      const hy=h+14,sx=-53.3;
      W.addBox(sx,hy,0,0.6,17,1,C.wood,{breakable:true});W.addBox(sx,hy,0,0.6,1,17,C.wood,{breakable:true});
      W.addBox(sx,hy+5,1.7,0.4,6,2.4,0xffffff,{breakable:true});W.addBox(sx,hy-5,-1.7,0.4,6,2.4,0xff6f6f,{breakable:true});
      W.addBox(sx,hy+1.7,5,0.4,2.4,6,0xff6f6f,{breakable:true});W.addBox(sx,hy-1.7,-5,0.4,2.4,6,0xffffff,{breakable:true});
      W.addBox(sx,hy,0,1,1.6,1.6,0x6b4a2a,{breakable:true});
    })();
    /* ---- Crate Yard (E): piles of crates */
    (function(){
      const h=6,cols=[0xff8a3c,0x3d8bff,0xffc93c,0x22c9c2,0xff6fb5];
      for(const gx of [57,61,65])for(const gz of [-9.5,-5,-0.5,4,8.5]){
        if(Math.random()<0.25)continue;
        const n=irand(1,3);
        for(let l=0;l<n;l++)W.addBox(gx+rand(-0.3,0.3),h+1.1+l*2.2,gz+rand(-0.3,0.3),2.2,2.2,2.2,pick(cols),{breakable:true});
      }
      B.wall(W,'z',-12,-6,66.5,h,2,0x3d8bff,{});
    })();
    /* ---- The Keep (centre) */
    (function(){
      const tiers=[[12,3,0xc9d2ee],[10,4,0xb9c4e6],[8,5,0xa9b6de],[6,6,0x9aa8d6]];
      for(const [hf,top,col] of tiers)B.floor(W,-hf,-hf,hf,hf,top-1,col,{thick:1,tag:'keep'});
      const wall=0xf3d9a4,acc=0xff8a3c;
      B.wall(W,'x',-6,6,-5.5,6,3,wall,{skip:(i,row)=>row<2&&(i===2||i===3)});
      B.wall(W,'x',-6,6,5.5,6,3,wall,{skip:(i,row)=>row<2&&(i===2||i===3)});
      B.wall(W,'z',-5,5,-5.5,6,3,wall,{len:1,skip:(i,row)=>row<2&&i>=3&&i<=6});
      B.wall(W,'z',-5,5,5.5,6,3,wall,{len:1,skip:(i,row)=>row<2&&i>=3&&i<=6});
      for(const zz of [-5.5,5.5])B.wall(W,'x',-6,6,zz,12,1,wall,{skip:i=>i%2===1});
      for(const xx of [-5.5,5.5])B.wall(W,'z',-5,5,xx,12,1,wall,{len:1,skip:i=>i%2===1});
      for(const [x,z] of [[-5.5,-5.5],[5.5,-5.5],[-5.5,5.5],[5.5,5.5]]){
        for(let r=0;r<5;r++)W.addBox(x,7+r*2,z,3,2,3,r%2?0xe6c88c:0xf0d8a0,{breakable:true});
        W.addBox(x,17.5,z,3.6,1,3.6,acc,{breakable:true,jitter:0});
        flag(x,18,z,pick([0xff4d5e,0xffd23e,0x22c9c2,0xa56bff]));
      }
      W.addBox(0,6.5,0,4,1,4,0xffd23e,{jitter:0});
      E.slab(0,26,0,1.2,40,1.2,0xffe27a,0.22);
    })();
    for(const [x,z] of [[18.5,-18.5],[-18.5,18.5],[18.5,18.5],[-18.5,-18.5]])tree(x,z,2);

    /* trees, flowers and cover on the outer islands */
    for(const i of ISL){
      if(!i.corner)continue;
      const ox=Math.sign(i.x),oz=Math.sign(i.z);
      tree(i.x+ox*11.5,i.z-oz*11.2,i.h);tree(i.x-ox*11.2,i.z+oz*11.5,i.h);
    }
    for(const i of ISL){
      let n=0,guard=0;const half=i.id==='C'?17:10.5;
      while(n<(i.id==='C'?30:12)&&guard++<200){
        const x=i.x+rand(-half,half),z=i.z+rand(-half,half);
        if(Math.abs(x-i.x)<4.5||Math.abs(z-i.z)<4.5)continue;
        if(i.id==='C'&&(Math.abs(x)<14.5&&Math.abs(z)<14.5))continue;
        const g=W.groundY(x,z,i.h+3);if(g>i.h+0.3||g<i.h-0.5)continue;
        W.addBox(x,i.h+0.25,z,0.5,0.5,0.5,pick([0xff6fb5,0xffffff,0xffd23e,0xff8a3c]),{solid:false,jitter:0});n++;
      }
    }

    /* launch pads: fly to the middle island */
    const pads=[];
    for(const i of ISL){
      if(!i.corner)continue;
      const sx=Math.sign(i.x),sz=Math.sign(i.z),px=i.x-sx*10,pz=i.z-sz*10;
      W.addBox(px,i.h+0.15,pz,5,0.3,5,0xffffff,{jitter:0});
      const pad=W.addBox(px,i.h+0.2,pz,4,0.4,4,0x30f0d0,{glow:true,jitter:0,tag:'pad',data:{tx:sx*14,tz:sz*14}});
      pads.push(pad);i.pad={x:px,z:pz};
      E.slab(px,i.h+7,pz,1.2,14,1.2,0x7dfff0,0.28);
    }

    /* clouds below and far away */
    for(let k=0;k<22;k++){
      const big=k<10;
      E.slab(big?rand(-80,80):rand(-170,170),-18+rand(-3,3),big?rand(-80,80):rand(-170,170),rand(26,60),rand(2,4),rand(26,60),0xffffff,0.5);
    }
    for(let k=0;k<10;k++){
      const a=rand(0,6.283),r=rand(170,260);
      E.slab(Math.cos(a)*r,rand(20,60),Math.sin(a)*r,rand(40,80),rand(6,10),rand(22,40),0xffffff,0.85);
    }
    /* little floating rocks for atmosphere */
    for(let k=0;k<14;k++){
      const a=rand(0,6.283),r=rand(95,150),x=Math.cos(a)*r,z=Math.sin(a)*r,y=rand(-12,22),sz=rand(5,11);
      W.addBox(x,y,z,sz,sz*0.35,sz,0x58c26b,{jitter:0});W.addBox(x,y-sz*0.35-0.5,z,sz*0.7,sz*0.7,sz*0.7,0x8f86c2,{jitter:0});W.addBox(x,y-sz*0.35-sz*0.7-0.4,z,sz*0.35,sz*0.5,sz*0.35,0x756bab,{jitter:0});
    }
    /* island name signs */
    function label(text,x,y,z){
      const cv=document.createElement('canvas');cv.width=512;cv.height=96;const g=cv.getContext('2d');
      g.font='700 54px "Chakra Petch",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=10;g.strokeStyle='rgba(20,30,70,.75)';g.strokeText(text,256,50);g.fillStyle='#ffffff';g.fillText(text,256,50);
      const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false}));s.scale.set(17,3.2,1);s.position.set(x,y,z);E.add(s);
    }
    for(const i of ISL)label(i.name,i.x,i.h+(i.id==='W'?31:i.id==='C'?34:25),i.z);

    /* ------------------------------------------------------------ navigation graph */
    const NODES=[],NI={};
    const node=(id,x,z)=>{NI[id]=NODES.length;NODES.push({id,x,z});};
    node('NW',-46,-48);node('NE',46,-48);node('SW',-46,48);node('SE',46,48);node('W',-46,0);node('E',46,0);
    node('K',0,0);node('Cn',0,-16);node('Cs',0,16);node('Ce',16,0);node('Cw',-16,0);
    node('Cne',15,-15);node('Cse',15,15);node('Csw',-15,15);node('Cnw',-15,-15);
    node('T1',-20,-48);node('PN',0,-48);node('T2',20,-48);node('B1',-20,48);node('PS',0,48);node('B2',20,48);
    node('SN',0,-34);node('SS',0,34);node('MW',-31,0);node('ME',31,0);
    node('NWW',-46,-24);node('WSW',-46,24);node('NEE',46,-24);node('ESE',46,24);
    const N=NODES.length,D=[];
    for(let i=0;i<N;i++){D.push(new Array(N).fill(1e9));D[i][i]=0;}
    const edge=(a,b)=>{const i=NI[a],j=NI[b],d=Math.hypot(NODES[i].x-NODES[j].x,NODES[i].z-NODES[j].z);D[i][j]=D[j][i]=d;};
    [['NW','T1'],['T1','PN'],['PN','T2'],['T2','NE'],['SW','B1'],['B1','PS'],['PS','B2'],['B2','SE'],['PN','SN'],['SN','Cn'],['PS','SS'],['SS','Cs'],
     ['Cn','K'],['Cs','K'],['Ce','K'],['Cw','K'],['Cn','Cne'],['Cne','Ce'],['Ce','Cse'],['Cse','Cs'],['Cs','Csw'],['Csw','Cw'],['Cw','Cnw'],['Cnw','Cn'],
     ['Cw','MW'],['MW','W'],['Ce','ME'],['ME','E'],['NW','NWW'],['NWW','W'],['W','WSW'],['WSW','SW'],['NE','NEE'],['NEE','E'],['E','ESE'],['ESE','SE']].forEach(e=>edge(e[0],e[1]));
    for(let k=0;k<N;k++)for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(D[i][k]+D[k][j]<D[i][j])D[i][j]=D[i][k]+D[k][j];
    function nearestNode(x,z){let b=0,bd=1e9;for(let i=0;i<N;i++){const d=Math.hypot(NODES[i].x-x,NODES[i].z-z);if(d<bd){bd=d;b=i;}}return b;}
    function walkable(a,b){
      const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<2)return true;
      const n=Math.ceil(len/2);let y=a.y;
      for(let i=1;i<=n;i++){const t=i/n,g=W.groundY(a.x+dx*t,a.z+dz*t,y+1.3);if(g===-Infinity||g<y-2.4)return false;y=g;}
      return true;
    }
    function planGoal(c,dest){
      const pp=c.pos;
      if(Math.hypot(dest.x-pp.x,dest.z-pp.z)<30&&walkable(pp,dest))return dest;
      const dn=nearestNode(dest.x,dest.z),cand=[];
      for(let i=0;i<N;i++){const d=Math.hypot(NODES[i].x-pp.x,NODES[i].z-pp.z);if(d<3)continue;cand.push([d+D[i][dn],i]);}
      cand.sort((a,b)=>a[0]-b[0]);
      for(let k=0;k<Math.min(6,cand.length);k++)if(walkable(pp,NODES[cand[k][1]]))return NODES[cand[k][1]];
      return cand.length?NODES[cand[0][1]]:dest;
    }

    /* ------------------------------------------------------------ pickups */
    const pickups=[];
    function addPickup(x,z,y,kind,color,size,respawn,take){
      const pk=E.pickup({pos:V(x,y,z),color,size,respawn,onTake:take});pickups.push({p:pk,kind,x,z});
    }
    const takeHealth=c=>{if(c.hp>=c.maxHp-1)return false;E.heal(c,50);return true;};
    const takeSpeed=c=>{c.speed=16;c.data.speedT=E.time+8;if(c===p)E.announce('Speed boost!',1.2);return true;};
    const takeMega=c=>{c.invuln=Math.max(c.invuln,10);if(c===p)E.announce('Shield for 10 seconds!',2);else E.announce(c.name+' grabbed the gold shield!',1.8);return true;};
    for(const i of ISL){
      if(i.corner){
        const ox=Math.sign(i.x),oz=Math.sign(i.z);
        addPickup(i.x+ox*8,i.z-oz*8,i.h+1.3,'health',0x35d07f,0.75,25,takeHealth);
        addPickup(i.x-ox*8,i.z+oz*8,i.h+1.3,'speed',0x3d8bff,0.7,25,takeSpeed);
      }else if(i.id==='W'||i.id==='E'){
        const sx=Math.sign(i.x);
        addPickup(sx*50,-9,i.h+1.3,'health',0x35d07f,0.75,25,takeHealth);
        addPickup(sx*50,9,i.h+1.3,'speed',0x3d8bff,0.7,25,takeSpeed);
      }
    }
    addPickup(15,-15,3.3,'health',0x35d07f,0.75,25,takeHealth);addPickup(-15,15,3.3,'health',0x35d07f,0.75,25,takeHealth);
    addPickup(15,15,3.3,'speed',0x3d8bff,0.7,25,takeSpeed);addPickup(-15,-15,3.3,'speed',0x3d8bff,0.7,25,takeSpeed);
    addPickup(0,0,8.4,'mega',0xffd23e,1.0,30,takeMega);
    function nearestPickup(c,kind,maxd){
      let best=null,bd=maxd;
      for(const k of pickups){if(!k.p.on)continue;if(kind&&k.kind!==kind)continue;const d=Math.hypot(k.x-c.pos.x,k.z-c.pos.z);if(d<bd){bd=d;best=k;}}
      return best;
    }

    /* ------------------------------------------------------------ spawns */
    const SPOTS=[];
    for(const i of ISL){
      if(i.corner){const ox=Math.sign(i.x),oz=Math.sign(i.z);for(const [a,b] of [[-3.5,-3.5],[-3.5,3.5],[3.5,-3.5]])SPOTS.push({x:i.x+ox*a,z:i.z+oz*b,h:i.h+1});}
      else if(i.id==='C')for(const [a,b] of [[16,-6],[-16,6],[6,16],[-6,-16]])SPOTS.push({x:a,z:b,h:2});
    }
    for(const sx of [-1,1])for(const zz of [-3.5,3.5])SPOTS.push({x:sx*47.5,z:zz,h:IS[sx<0?'W':'E'].h+1});
    function pickSpawn(c){
      let best=null,bs=-1;
      for(let k=0;k<8;k++){
        const s=pick(SPOTS);let m=1e9;
        for(const o of E.chars){if(o===c||!o.alive)continue;m=Math.min(m,Math.hypot(o.pos.x-s.x,o.pos.z-s.z));}
        if(m>bs){bs=m;best=s;}
      }
      const g=W.groundY(best.x,best.z,best.h+1.5);
      return {x:best.x,z:best.z,y:(g>-1e8?g:best.h)+0.15};
    }
    function aimCam(x,z){E.cam.yaw=Math.atan2(-x,-z);E.cam.pitch=0.35;}

    /* ------------------------------------------------------------ characters */
    const botCols=[C.red,C.green,C.yellow,C.purple,C.orange,C.teal,C.pink,C.white];
    const names=shuffle(VG.BOT_NAMES.slice());
    const bots=[];
    for(let k=0;k<NBOTS;k++)bots.push(E.spawn({name:names[k],color:botCols[k%botCols.length],bot:true}));
    const TOOLS=['blade','popper','bouncer','rocket','bomb','wall'];
    function aiInit(c,skill,aggr,speedMul){
      c.setTools(TOOLS);
      const br=c.brain;br.skill=skill;br.fearless=false;br.speedMul=speedMul;
      c.data.ai={next:rand(0,0.8),fireCd:rand(1.2,2.8),skill,aggr,tgt:null,roam:null,mode:'roam',still:0,lx:0,lz:0,seen:null};
    }
    p.setTools(TOOLS);
    for(const c of E.chars){
      const s=pickSpawn(c);c.teleport(s.x,s.y,s.z);
      if(c.isBot)aiInit(c,clamp(SKILL+rand(-0.04,0.04),0.1,0.9),clamp(AGGR+rand(-0.05,0.05),0.1,0.9),lerp(0.8,1,K));
      if(c===p)aimCam(s.x,s.z);
    }

    /* ------------------------------------------------------------ bot brain */
    function think(c,a){
      const br=c.brain,pp=c.pos;
      a.next=rand(lerp(0.8,0.4,K),lerp(1.6,1.2,K));
      /* target: nearest visible enemy within 45, else nearest enemy at all */
      let tgt=br.nearest(o=>o.invuln<=0.3&&br.dist(o)<45&&Math.abs(o.pos.y-pp.y)<25&&br.canSee(o));
      let visible=!!tgt;
      if(!tgt)tgt=br.nearest(o=>o.invuln<=0.3)||br.nearest();
      if(tgt!==a.seen){a.seen=tgt;if(visible)a.fireCd=Math.max(a.fireCd,(1-K)*rand(0.7,1.5));}
      a.tgt=tgt;a.vis=visible;
      /* stuck check */
      const mv=Math.hypot(pp.x-a.lx,pp.z-a.lz);a.lx=pp.x;a.lz=pp.z;
      if(br.goal&&!br.arrived&&mv<0.8&&c.onGround)a.still+=a.dt;else a.still=0;
      if(a.still>2.5){br.side=0.9;br.sideDir=Math.random()<0.5?1:-1;br.jumpCd=0;if(c.onGround)c.vel.y=c.jumpV;a.roam=null;}
      if(a.still>8){const s=pickSpawn(c);c.teleport(s.x,s.y,s.z);a.still=0;}
      /* decide where to go */
      let dest=null,mode='roam',pk=null;
      if(c.hp<35&&(pk=nearestPickup(c,'health',400))){mode='heal';dest=pk;}
      else if(tgt&&Math.random()<0.35+0.65*a.aggr){mode='hunt';dest=tgt.pos;}
      else if((pk=nearestPickup(c,null,70))&&Math.random()<0.5){mode='pick';dest=pk;}
      else{
        if(!a.roam||Math.hypot(a.roam.x-pp.x,a.roam.z-pp.z)<6){const n=NODES[NI[pick(['NW','NE','SW','SE','W','E','Cn','Cs','Ce','Cw','K','Cne','Cse'])]];a.roam=n;}
        dest=a.roam;
      }
      a.mode=mode;
      /* launch pad shortcut to the middle island */
      const here=islandAt(pp.x,pp.z),there=islandAt(dest.x,dest.z);
      if(here&&here.pad&&there&&there.id==='C'&&c.onGround&&Math.random()<0.4+0.4*a.aggr){br.goal=V(here.pad.x,0,here.pad.z);br.arrive=0.4;return;}
      if(mode==='hunt'&&walkable(pp,dest)&&br.dist(dest)<45&&(a.vis||br.dist(dest)<14)){
        br.goal=tgt.pos;const melee=Math.random()<0.35;br.arrive=melee?1.6:lerp(9,4,a.aggr);
        if(a.aggr>0.4&&br.dist(tgt)<20&&c.onGround&&Math.random()<a.aggr*0.4)c.vel.y=c.jumpV*0.85;
        return;
      }
      const g=planGoal(c,dest);br.goal=g;br.arrive=(g===dest&&(mode==='pick'||mode==='heal'))?0.8:2;
    }
    function fire(c,a){
      const t=a.tgt,br=c.brain;
      if(!t||!t.alive||a.fireCd>0||t.invuln>0.3)return;
      const d=br.dist(t),dy=t.pos.y-c.pos.y,d3=Math.hypot(d,dy);
      if(d3>46){a.fireCd=0.2;return;}
      if(!br.canSee(t)){a.fireCd=0.25;return;}
      const o=c.chest(),dir=V(t.pos.x-o.x,t.pos.y+1.3-o.y,t.pos.z-o.z).normalize();
      const spread=(1.1-a.skill)*0.26,lo=lerp(1.5,0.3,K);
      let id=null;
      if(d<5.4)id='blade';
      else if(d<8.5)id=Math.random()<0.5?'bouncer':'popper';
      else if(d<20){
        const r=Math.random();
        if(d<14&&(dy<-1.5||r<a.aggr*0.2))id='bomb';else id=r<0.55?'bouncer':'popper';
      }else id=Math.random()<0.3+0.6*a.aggr?'rocket':(Math.random()<0.5?'bouncer':'popper');
      if(c.hp<40&&L>=3&&d>6&&d<18&&Math.random()<0.2){c.use(V(dir.x,0,dir.z).normalize(),'wall');a.fireCd=rand(0.6,1.2);return;}
      if(id==='rocket'||id==='bomb'){
        if(d<8){id='popper';}
        else{const hit=W.ray(o,dir,Math.min(d3,9));if(hit&&hit.t<7.5)id='popper';}
      }
      if(id==='blade'){br.fireAt(t,'blade',0.05);a.fireCd=rand(0.25,0.6)+(1-K)*0.5;return;}
      br.fireAt(t,id,id==='rocket'?spread*0.7:spread);
      a.fireCd=rand(lo,lo*1.8)*(id==='popper'?0.6:1);
    }
    function botTick(c,dt){
      if(!c.alive||c.data.fly)return;
      const a=c.data.ai;if(!a)return;
      a.dt=dt;a.next-=dt;a.fireCd-=dt;
      if(a.next<=0)think(c,a);
      fire(c,a);
    }

    /* ------------------------------------------------------------ round rules */
    let done=false,lastLeader=null,lastLeadAnn=-99,hudT=0,warned=false;
    function leaderOf(){
      let top=-1,who=null,tie=false;
      for(const c of E.chars){if(c.kos>top){top=c.kos;who=c;tie=false;}else if(c.kos===top)tie=true;}
      return {who:tie?null:who,top,tie};
    }
    function endRound(winner,byTime){
      if(done)return;done=true;
      const humanWin=winner===p;
      if(humanWin){
        let stars=p.outs<=TARGET*0.6?3:p.outs<=TARGET*1.4?2:1;if(byTime)stars=Math.min(stars,2);
        E.finish({win:true,title:'You win Rubble Royale!',stars,lines:[byTime?'You had the most knockouts when time ran out.':'You reached '+TARGET+' knockouts first.','You were knocked out '+p.outs+(p.outs===1?' time.':' times.')]});
      }else if(winner){
        E.finish({win:false,title:winner.name+' wins',lines:[winner.name+(byTime?' had the most knockouts when time ran out with ':' got to ')+winner.kos+' knockouts'+(byTime?'.':' first.'),'You scored '+p.kos+'. Try again!']});
      }else{
        E.finish({win:false,title:'Time is up',lines:['Nobody was alone in front. You scored '+p.kos+' knockouts.','Try again and go for the lead!']});
      }
    }
    function respawnLater(c){
      E.after(3,()=>{
        if(E.over||c.alive||E.chars.indexOf(c)<0)return;
        const s=pickSpawn(c);E.respawn(c,s.x,s.y,s.z,3);
        c.speed=11;c.data.speedT=0;c.data.fly=null;if(c.brain)c.brain.manual=false;
        if(c.data.ai){c.data.ai.next=0.2;c.data.ai.fireCd=rand(1,2);c.data.ai.still=0;}
        if(c===p)aimCam(s.x,s.z);
      });
    }
    function updateHud(){
      E.status('First to '+TARGET+' knockouts   '+E.fmt(LIMIT-E.time));
      const all=E.chars.slice().sort((a,b)=>b.kos-a.kos||a.outs-b.outs);
      const rows=all.slice(0,5).map(c=>({label:c.name,value:c.kos,color:c.color,me:c===p}));
      if(all.indexOf(p)>=5)rows.push({label:p.name,value:p.kos,color:p.color,me:true});
      E.score(rows);
    }

    /* pads and flights */
    function launch(c,pad){
      const d=pad.data;c.data.padT=E.time+1.2;
      const tx=d.tx+rand(-1.5,1.5),tz=d.tz+rand(-1.5,1.5),y0=c.pos.y,yt=2;
      const t=(30+Math.sqrt(Math.max(0,900-84*(yt-y0))))/42,dx=tx-c.pos.x,dz=tz-c.pos.z,dist=Math.hypot(dx,dz)||1,sp=Math.min(40,dist/t);
      c.vel.y=30;c.onGround=false;c.data.fly={t:0,vx:dx/dist*sp,vz:dz/dist*sp};
      if(c.brain)c.brain.manual=true;
      c.yaw=Math.atan2(dx,dz);E.fx.burst(c.pos,0x7dfff0,16,10,0.35,{up:1.4});
      if(c===p){E.sfx('bounce');E.shake(0.15);}else if(Math.hypot(c.pos.x-p.pos.x,c.pos.z-p.pos.z)<40)E.sfx('bounce');
    }

    E.announce('Rubble Royale! First to '+TARGET+' knockouts',3);
    updateHud();

    return {
      update(dt){
        if(done||E.over)return;
        for(const c of E.chars){
          if(!c.alive){if(c.data.fly){c.data.fly=null;if(c.brain)c.brain.manual=false;}continue;}
          const f=c.data.fly;
          if(f){f.t+=dt;c.vel.x=f.vx;c.vel.z=f.vz;if((f.t>0.4&&c.onGround)||f.t>3){c.data.fly=null;if(c.brain)c.brain.manual=false;}}
          else if(c.ground&&c.ground.tag==='pad'&&(c.data.padT||0)<E.time)launch(c,c.ground);
          if(c.data.speedT&&E.time>c.data.speedT){c.speed=11;c.data.speedT=0;}
        }
        for(const b of bots)botTick(b,dt);
        hudT-=dt;
        if(hudT<=0){
          hudT=0.25;updateHud();
          const ld=leaderOf();
          if(ld.who&&ld.top>=1&&ld.who!==lastLeader&&E.time-lastLeadAnn>=5){
            E.announce(ld.who===p?'You take the lead!':ld.who.name+' takes the lead!',2);lastLeadAnn=E.time;
            lastLeader=ld.who;
          }
        }
        if(!warned&&E.time>=LIMIT-30){warned=true;E.announce('30 seconds left!',2);E.sfx('alarm');}
        if(E.time>=LIMIT){
          const ld=leaderOf();endRound(ld.who,true);
        }
      },
      autopilot(dt){
        if(!p.brain){p.brain=new VG.Brain(p,E);aiInit(p,0.55,0.55,1);}
        botTick(p,dt);
      },
      onDeath(c,by){
        if(done)return;
        c.data.fly=null;if(c.brain)c.brain.manual=false;
        if(by&&by!==c){
          if(by.kos>=TARGET){updateHud();endRound(by,false);return;}
          if(by.kos===TARGET-1)E.announce(by===p?'You need 1 more!':by.name+' needs 1 more!',2.2);
        }
        respawnLater(c);
      },
      dispose(){}
    };
  }
});
