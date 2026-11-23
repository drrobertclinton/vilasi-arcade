/* Vilasi Arcade engine: one small 3D engine shared by every game.
   Needs three.js r128 (global THREE). See API.md for how games use it. */
(function(){
'use strict';
const T=THREE;
const VG=window.VG={games:[],byId:{},current:null,register(d){this.games.push(d);this.byId[d.id]=d;}};
const V=(x,y,z)=>new T.Vector3(x||0,y||0,z||0);
const rand=(a,b)=>a+Math.random()*(b-a);
const irand=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[(Math.random()*a.length)|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function angLerp(a,b,t){const d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
VG.util={V,rand,irand,pick,clamp,lerp,angLerp,shuffle};
VG.COLORS={red:0xff4d5e,blue:0x3d8bff,green:0x35d07f,yellow:0xffc93c,purple:0xa56bff,orange:0xff8a3c,teal:0x22c9c2,pink:0xff6fb5,white:0xf4f1ea,ink:0x161a2b,stone:0x8c93a8,sand:0xe8d6a8,grass:0x58c26b,wood:0xb07a4a,metal:0x5b6480};
VG.BOT_NAMES=['Nova','Pixel','Turbo','Comet','Mango','Jinx','Echo','Gizmo','Sprout','Waffle','Ziggy','Pogo','Fizz','Orbit','Taco','Noodle','Scout','Pepper','Rumble','Dizzy','Quill','Moxie','Bongo','Kiwi'];

/* ---------------------------------------------------------------- world of boxes */
class World{
  constructor(scene,cap){
    this.scene=scene;this.cap=cap||12000;this.boxes=new Set();this.grid=new Map();this.cs=8;
    this.gravity=-42;this.killY=-45;this.stamp=0;this._near=[];this._m=new T.Matrix4();this._c=new T.Color();
    const geo=new T.BoxGeometry(1,1,1);
    const litMat=new T.MeshLambertMaterial({color:0xffffff});
    litMat.onBeforeCompile=sh=>{
      sh.vertexShader='varying vec3 vgL;varying vec3 vgS;varying vec3 vgW;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvgL=position;\n#ifdef USE_INSTANCING\nvgW=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;\nvgS=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#else\nvgS=vec3(1.0);vgW=position;\n#endif');
      sh.fragmentShader='varying vec3 vgL;varying vec3 vgS;varying vec3 vgW;\nfloat vgH(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{vec3 d=(0.5-abs(vgL))*vgS;float lo=min(d.x,d.y);float hi=max(d.x,d.y);float e=max(lo,min(hi,d.z));float w=clamp(min(vgS.x,min(vgS.y,vgS.z))*0.18,0.05,0.16);float k=smoothstep(0.0,w,e);float rim=smoothstep(w,w*2.2,e);gl_FragColor.rgb*=mix(0.74,1.0,k);gl_FragColor.rgb+=vec3(0.035)*(1.0-rim)*k;gl_FragColor.rgb*=0.9+0.1*clamp(vgL.y+0.5,0.0,1.0);gl_FragColor.rgb*=0.965+0.07*vgH(vgW*2.0+0.01)*0.5+0.035*vgH(vgW*0.5+0.01);}');
    };
    this.lit=this._mk(geo,litMat);this.lit.castShadow=true;this.lit.receiveShadow=true;
    this.glow=this._mk(geo,new T.MeshBasicMaterial({color:0xffffff}));
    this.onBreak=null;this.onMoved=null;
  }
  _mk(geo,mat){const m=new T.InstancedMesh(geo,mat,this.cap);m.setColorAt(0,new T.Color(1,1,1));m.count=0;m.frustumCulled=false;m.userData={free:[],n:0};this.scene.add(m);return m;}
  /* x,y,z = centre of the box; sx,sy,sz = full size. opts: breakable, solid(false = walk through), glow, tag, data, jitter(0 = exact color; breakable boxes get a slight random shade so bricks read as bricks) */
  addBox(x,y,z,sx,sy,sz,color,o){
    o=o||{};
    const b={x,y,z,sx,sy,sz,color,shade:(o.jitter===0||(!o.breakable&&!o.jitter))?1:1+(Math.random()-0.5)*(o.jitter||0.16),breakable:!!o.breakable,solid:o.solid!==false,glow:!!o.glow,tag:o.tag||null,data:o.data||null,alive:true,st:0,cells:[]};
    this._bounds(b);
    const m=b.glow?this.glow:this.lit,u=m.userData;b.mesh=m;
    if(u.free.length)b.idx=u.free.pop();else if(u.n<this.cap)b.idx=u.n++;else b.idx=-1;
    if(u.n>m.count)m.count=u.n;
    this._write(b);this.boxes.add(b);this._ins(b);return b;
  }
  _bounds(b){b.minx=b.x-b.sx/2;b.maxx=b.x+b.sx/2;b.miny=b.y-b.sy/2;b.maxy=b.y+b.sy/2;b.minz=b.z-b.sz/2;b.maxz=b.z+b.sz/2;}
  _write(b,hide){
    if(b.idx<0)return;const m=b.mesh;
    if(hide)this._m.makeScale(0,0,0);else{this._m.makeScale(b.sx,b.sy,b.sz);this._m.setPosition(b.x,b.y,b.z);}
    m.setMatrixAt(b.idx,this._m);m.instanceMatrix.needsUpdate=true;
    if(!hide){this._c.set(b.color);if(b.shade!==1)this._c.multiplyScalar(b.shade);m.setColorAt(b.idx,this._c);m.instanceColor.needsUpdate=true;}
  }
  _ins(b){
    const cs=this.cs,x0=Math.floor(b.minx/cs),x1=Math.floor(b.maxx/cs),z0=Math.floor(b.minz/cs),z1=Math.floor(b.maxz/cs);
    b.cells.length=0;
    for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const k=(ix+2048)*4096+(iz+2048);let a=this.grid.get(k);if(!a){a=[];this.grid.set(k,a);}a.push(b);b.cells.push(k);}
  }
  _out(b){for(const k of b.cells){const a=this.grid.get(k);if(a){const i=a.indexOf(b);if(i>=0){a[i]=a[a.length-1];a.pop();}}}b.cells.length=0;}
  removeBox(b){if(!b||!b.alive)return;b.alive=false;this.boxes.delete(b);this._out(b);this._write(b,true);if(b.idx>=0)b.mesh.userData.free.push(b.idx);}
  setColor(b,color){b.color=color;if(b.alive)this._write(b);}
  /* move a box (moving platforms). Characters standing on it are carried. */
  moveBox(b,x,y,z){if(!b.alive)return;const dx=x-b.x,dy=y-b.y,dz=z-b.z;this._out(b);b.x=x;b.y=y;b.z=z;this._bounds(b);this._ins(b);this._write(b);if(this.onMoved)this.onMoved(b,dx,dy,dz);}
  resizeBox(b,sx,sy,sz){if(!b.alive)return;this._out(b);b.sx=sx;b.sy=sy;b.sz=sz;this._bounds(b);this._ins(b);this._write(b);}
  near(minx,minz,maxx,maxz,out){
    const cs=this.cs,x0=Math.floor(minx/cs),x1=Math.floor(maxx/cs),z0=Math.floor(minz/cs),z1=Math.floor(maxz/cs),st=++this.stamp;
    for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const a=this.grid.get((ix+2048)*4096+(iz+2048));if(!a)continue;for(let i=0;i<a.length;i++){const b=a[i];if(b.st!==st){b.st=st;out.push(b);}}}
    return out;
  }
  /* physics step for one body: e = {pos,vel,radius,height,stepH,onGround,ground,blocked,gravScale} ; pos is at the feet */
  move(e,dt){
    const r=e.radius,h=e.height,p=e.pos,v=e.vel;
    v.y+=this.gravity*(e.gravScale==null?1:e.gravScale)*dt;if(v.y<-70)v.y=-70;
    const was=e.onGround;e.blocked=false;
    const reach=(Math.abs(v.x)+Math.abs(v.z))*dt+r+2,near=this._near;near.length=0;
    this.near(p.x-reach,p.z-reach,p.x+reach,p.z+reach,near);
    p.x+=v.x*dt;this._axis(e,near,0,was);
    p.z+=v.z*dt;this._axis(e,near,2,was);
    const py=p.y;p.y+=v.y*dt;e.onGround=false;e.ground=null;
    for(let i=0;i<near.length;i++){const b=near[i];if(!b.alive||!b.solid)continue;
      if(p.x+r>b.minx&&p.x-r<b.maxx&&p.z+r>b.minz&&p.z-r<b.maxz&&p.y<b.maxy&&p.y+h>b.miny){
        if(v.y<=0&&py>=b.maxy-0.75){p.y=b.maxy;v.y=0;e.onGround=true;e.ground=b;}
        else if(v.y>0&&py+h<=b.miny+0.75){p.y=b.miny-h;v.y=0;}
        else if(v.y<=0){p.y=b.maxy;v.y=0;e.onGround=true;e.ground=b;}
      }}
  }
  _axis(e,near,ax,was){
    const r=e.radius,h=e.height,p=e.pos,v=e.vel;
    for(let i=0;i<near.length;i++){const b=near[i];if(!b.alive||!b.solid)continue;
      if(p.x+r>b.minx&&p.x-r<b.maxx&&p.z+r>b.minz&&p.z-r<b.maxz&&p.y+0.02<b.maxy&&p.y+h>b.miny+0.02){
        if(b.maxy-p.y<=(e.stepH||0)&&was&&v.y<=0.5){p.y=b.maxy+0.001;continue;}
        if(ax===0){if(v.x>0||(v.x===0&&p.x<b.x))p.x=b.minx-r-0.001;else p.x=b.maxx+r+0.001;v.x=0;}
        else{if(v.z>0||(v.z===0&&p.z<b.z))p.z=b.minz-r-0.001;else p.z=b.maxz+r+0.001;v.z=0;}
        e.blocked=true;
      }}
  }
  /* height of the highest solid top at (x,z) that is at or below fromY; -Infinity if nothing */
  groundY(x,z,fromY){const near=this._near;near.length=0;this.near(x,z,x,z,near);let best=-Infinity;
    for(let i=0;i<near.length;i++){const b=near[i];if(b.alive&&b.solid&&x>=b.minx&&x<=b.maxx&&z>=b.minz&&z<=b.maxz&&b.maxy<=fromY+0.01&&b.maxy>best)best=b.maxy;}return best;}
  /* ray against solid boxes. o=origin, d=unit direction. returns null or {box,t,point,normal} */
  ray(o,d,len){
    const ex=o.x+d.x*len,ez=o.z+d.z*len,near=[];this.near(Math.min(o.x,ex)-0.1,Math.min(o.z,ez)-0.1,Math.max(o.x,ex)+0.1,Math.max(o.z,ez)+0.1,near);
    let bt=len,bb=null,bax=0,bsg=0;const O=[o.x,o.y,o.z],D=[d.x,d.y,d.z];
    for(let i=0;i<near.length;i++){const b=near[i];if(!b.alive||!b.solid)continue;
      const mn=[b.minx,b.miny,b.minz],mx=[b.maxx,b.maxy,b.maxz];let t0=0,t1=bt,ax=-1,sg=0,ok=true;
      for(let a=0;a<3;a++){
        if(Math.abs(D[a])<1e-9){if(O[a]<mn[a]||O[a]>mx[a]){ok=false;break;}}
        else{let ta=(mn[a]-O[a])/D[a],tb=(mx[a]-O[a])/D[a],s=-1;if(ta>tb){const q=ta;ta=tb;tb=q;s=1;}
          if(ta>t0){t0=ta;ax=a;sg=s;}if(tb<t1)t1=tb;if(t0>t1){ok=false;break;}}
      }
      if(ok&&ax>=0&&t0<bt){bt=t0;bb=b;bax=ax;bsg=sg;}
    }
    if(!bb)return null;const n=V();if(bax===0)n.x=bsg;else if(bax===1)n.y=bsg;else n.z=bsg;
    return{box:bb,t:bt,point:V(o.x+d.x*bt,o.y+d.y*bt,o.z+d.z*bt),normal:n};
  }
  /* break every breakable box near a point. returns how many broke */
  blast(pos,radius,max){
    const near=[];this.near(pos.x-radius,pos.z-radius,pos.x+radius,pos.z+radius,near);let n=0;
    for(const b of near){if(!b.alive||!b.breakable)continue;
      const dx=Math.max(b.minx-pos.x,0,pos.x-b.maxx),dy=Math.max(b.miny-pos.y,0,pos.y-b.maxy),dz=Math.max(b.minz-pos.z,0,pos.z-b.maxz);
      if(dx*dx+dy*dy+dz*dz<radius*radius){this.breakBox(b,pos);if(++n>=(max||400))break;}}
    return n;
  }
  breakBox(b,from){if(!b.alive)return;this.removeBox(b);if(this.onBreak)this.onBreak(b,from);}
}
VG.World=World;

/* building helpers (all bricks breakable unless told otherwise) */
VG.build={
  /* a run of bricks along x or z. skip(i,row,n) -> true leaves a hole (doors, windows) */
  wall(w,axis,from,to,fixed,baseY,rows,color,o){o=o||{};const L=o.len||2,H=o.h||2,Th=o.thick||1,n=Math.round((to-from)/L);
    for(let row=0;row<rows;row++)for(let i=0;i<n;i++){if(o.skip&&o.skip(i,row,n))continue;const c=from+(i+0.5)*L,y=baseY+(row+0.5)*H;
      if(axis==='x')w.addBox(c,y,fixed,L,H,Th,color,{breakable:o.breakable!==false,tag:o.tag});else w.addBox(fixed,y,c,Th,H,L,color,{breakable:o.breakable!==false,tag:o.tag});}},
  /* a flat floor made of tiles. hole(i,j) -> true leaves a gap */
  floor(w,x0,z0,x1,z1,y,color,o){o=o||{};const s=o.tile||2,th=o.thick||0.5,nx=Math.round((x1-x0)/s),nz=Math.round((z1-z0)/s);
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(o.hole&&o.hole(i,j,nx,nz))continue;w.addBox(x0+(i+0.5)*s,y+th/2,z0+(j+0.5)*s,s,th,s,color,{breakable:o.breakable!==false,tag:o.tag});}},
  /* steps going up along +x/-x/+z/-z from (x,y,z) */
  stairs(w,x,y,z,dir,steps,width,color,o){o=o||{};const rise=o.rise||1,run=o.run||1.5;const d={'+x':[1,0],'-x':[-1,0],'+z':[0,1],'-z':[0,-1]}[dir];
    for(let i=0;i<steps;i++){const h=(i+1)*rise,cx=x+d[0]*(i+0.5)*run,cz=z+d[1]*(i+0.5)*run;
      w.addBox(cx,y+h/2,cz,d[0]?run:width,h,d[1]?run:width,color,{breakable:!!o.breakable});}},
  /* hollow building: floors, brick walls with doors and windows, stairs inside. returns the y of each floor top */
  tower(w,cx,cz,half,floors,color,floorColor,baseY,o){o=o||{};baseY=baseY||0;const tops=[],FH=6.5,B=VG.build,mid=(i,n)=>Math.abs(i-(n-1)/2)<1.1;
    for(let f=0;f<=floors;f++){const y=baseY+f*FH;
      B.floor(w,cx-half,cz-half,cx+half,cz+half,y,floorColor,{hole:f>0?(i,j,nx)=>i>=nx-2&&j<6:null,tag:o.tag});tops.push(y+0.5);
      if(f<floors){const skip=(i,row,n)=>f===0?(mid(i,n)&&row<2):(mid(i,n)&&row===1);
        B.wall(w,'x',cx-half,cx+half,cz-half+0.5,y+0.5,3,color,{skip,tag:o.tag});B.wall(w,'x',cx-half,cx+half,cz+half-0.5,y+0.5,3,color,{skip,tag:o.tag});
        B.wall(w,'z',cz-half+1,cz+half-1,cx-half+0.5,y+0.5,3,color,{skip,tag:o.tag});B.wall(w,'z',cz-half+1,cz+half-1,cx+half-0.5,y+0.5,3,color,{skip,tag:o.tag});
        B.stairs(w,cx+half-3,y+0.5,cz-half+1.2,'+z',6,2,floorColor,{rise:1,run:1.6,breakable:true});}}
    return tops;}
};

/* ---------------------------------------------------------------- particles */
class FX{
  constructor(scene,n){this.n=n||500;this.p=[];this.m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xffffff}),this.n);this.m.setColorAt(0,new T.Color(1,1,1));this.m.frustumCulled=false;scene.add(this.m);
    this._m=new T.Matrix4();this._c=new T.Color();this.next=0;const z=new T.Matrix4().makeScale(0,0,0);
    for(let i=0;i<this.n;i++){this.p.push({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,s:0.3,g:1,max:1});this.m.setMatrixAt(i,z);this.m.setColorAt(i,this._c.set(0xffffff));}
    this.flashes=[];this.scene=scene;}
  burst(pos,color,count,speed,size,o){o=o||{};count=count||10;speed=speed||8;
    for(let k=0;k<count;k++){const i=this.next;this.next=(this.next+1)%this.n;const q=this.p[i];
      q.x=pos.x+rand(-0.3,0.3);q.y=pos.y+rand(-0.3,0.3);q.z=pos.z+rand(-0.3,0.3);
      const a=rand(0,6.283),u=rand(-0.2,1);q.vx=Math.cos(a)*speed*rand(0.3,1);q.vz=Math.sin(a)*speed*rand(0.3,1);q.vy=u*speed*(o.up==null?1:o.up);
      q.s=(size||0.3)*rand(0.6,1.3);q.g=o.gravity==null?1:o.gravity;q.life=q.max=rand(0.5,1.1)*(o.life||1);
      this.m.setColorAt(i,this._c.set(Array.isArray(color)?pick(color):color));}
    this.m.instanceColor.needsUpdate=true;}
  flash(pos,radius,color){const m=new T.Mesh(new T.SphereGeometry(1,14,10),new T.MeshBasicMaterial({color:color||0xfff1b0,transparent:true,opacity:0.85}));m.position.copy(pos);this.scene.add(m);this.flashes.push({m,r:radius,t:0});}
  update(dt){const m=this._m;
    for(let i=0;i<this.n;i++){const q=this.p[i];if(q.life<=0)continue;q.life-=dt;
      if(q.life<=0){m.makeScale(0,0,0);this.m.setMatrixAt(i,m);continue;}
      q.vy-=30*q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;const s=q.s*Math.min(1,q.life/q.max*2);m.makeScale(s,s,s);m.setPosition(q.x,q.y,q.z);this.m.setMatrixAt(i,m);}
    this.m.instanceMatrix.needsUpdate=true;
    for(let i=this.flashes.length-1;i>=0;i--){const f=this.flashes[i];f.t+=dt;const k=f.t/0.35;if(k>=1){this.scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose();this.flashes.splice(i,1);continue;}
      const s=f.r*(0.3+0.7*k);f.m.scale.set(s,s,s);f.m.material.opacity=0.85*(1-k);}}
}

/* ---------------------------------------------------------------- sound */
const SFX={ctx:null,on:true,
  init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.ctx=null;}},
  play(name){if(!this.on||!this.ctx)return;const c=this.ctx,t=c.currentTime;
    const S={jump:[420,640,0.09,'square',0.05],hit:[220,90,0.12,'sawtooth',0.07],shoot:[700,300,0.08,'square',0.04],boom:[120,30,0.5,'sawtooth',0.16],pickup:[660,1320,0.14,'triangle',0.07],
      win:[523,1046,0.6,'triangle',0.09],lose:[330,110,0.7,'sawtooth',0.07],out:[300,60,0.35,'square',0.07],tick:[900,900,0.04,'square',0.04],bounce:[260,420,0.07,'triangle',0.05],build:[180,360,0.12,'square',0.05],alarm:[520,780,0.4,'square',0.06]}[name];
    if(!S)return;try{const o=c.createOscillator(),g=c.createGain();o.type=S[3];o.frequency.setValueAtTime(S[0],t);o.frequency.exponentialRampToValueAtTime(Math.max(20,S[1]),t+S[2]);
      g.gain.setValueAtTime(S[4],t);g.gain.exponentialRampToValueAtTime(0.0001,t+S[2]);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+S[2]+0.02);}catch(e){}}
};
VG.sfx=SFX;
VG.glowTex=function(){if(VG._gt)return VG._gt;const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.35,'rgba(255,255,255,0.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return VG._gt=new T.CanvasTexture(cv);};

/* ---------------------------------------------------------------- characters */
const SPH=new T.SphereGeometry(1,16,12),CYL=new T.CylinderGeometry(1,1,1,8),BOX=new T.BoxGeometry(1,1,1);
function part(geo,mat,sx,sy,sz,x,y,z){const m=new T.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);return m;}
function makeAvatar(color){
  const g=new T.Group(),c=new T.Color(color);
  const mb=new T.MeshPhongMaterial({color:c,shininess:70,specular:0x555555}),md=new T.MeshPhongMaterial({color:c.clone().multiplyScalar(0.6),shininess:40,specular:0x333333}),mw=new T.MeshPhongMaterial({color:0xf4f1ea,shininess:90,specular:0x666666}),
    mv=new T.MeshBasicMaterial({color:0x10131c}),me=new T.MeshBasicMaterial({color:0x8dfcff}),mt=new T.MeshBasicMaterial({color:c.clone().lerp(new T.Color(1,1,1),0.35)});
  const body=part(SPH,mb,0.62,0.78,0.58,0,1.0,0),head=part(SPH,mw,0.52,0.48,0.5,0,1.98,0);
  const visor=part(SPH,mv,0.4,0.2,0.26,0,1.99,0.3),e1=part(SPH,me,0.07,0.09,0.05,-0.15,2.0,0.53),e2=part(SPH,me,0.07,0.09,0.05,0.15,2.0,0.53);
  const stalk=part(CYL,md,0.035,0.42,0.035,0,2.62,0),tip=part(SPH,mt,0.12,0.12,0.12,0,2.88,0);
  const hl=part(SPH,md,0.2,0.2,0.2,-0.84,1.05,0.1),hr=part(SPH,md,0.2,0.2,0.2,0.84,1.05,0.1);
  const fl=part(SPH,md,0.24,0.16,0.32,-0.28,0.16,0.05),fr=part(SPH,md,0.24,0.16,0.32,0.28,0.16,0.05);
  const hold=new T.Group();hold.position.set(0.84,1.05,0.35);
  const belt=part(CYL,md,0.6,0.1,0.56,0,0.86,0),chest=part(SPH,mt,0.13,0.13,0.06,0,1.22,0.54),neck=part(CYL,md,0.2,0.16,0.2,0,1.62,0);
  g.add(body,head,visor,e1,e2,stalk,tip,hl,hr,fl,fr,hold,belt,chest,neck);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
  g.userData={body,head,hl,hr,fl,fr,hold,tip,mats:[mb,md,mw,mv,me,mt]};return g;
}
function makeTag(text,color){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;const x=cv.getContext('2d');
  x.font='700 30px "Chakra Petch",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=7;x.strokeStyle='rgba(10,12,24,.85)';x.strokeText(text,128,34);
  x.fillStyle='#'+new T.Color(color).lerp(new T.Color(1,1,1),0.55).getHexString();x.fillText(text,128,34);
  const tex=new T.CanvasTexture(cv);const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true}));s.scale.set(3.4,0.85,1);s.position.set(0,3.5,0);s.renderOrder=5;return s;
}
const TOOL_LOOK={blade:[0.12,0.12,1.7,0x9dfcff,0,0,0.9],popper:[0.3,0.5,0.3,0xffc93c,0,0,0.2],bouncer:[0.5,0.5,0.5,0xff6fb5,0,0,0.3],rocket:[0.34,0.34,1.3,0xff5a3c,0,0,0.5],bomb:[0.55,0.55,0.55,0x22263a,0,0,0.3],wall:[0.6,0.45,0.25,0xb07a4a,0,0,0.3],zapper:[0.1,0.1,1.2,0xc76bff,0,0,0.7],catcher:[0.3,0.36,0.9,0x35d07f,0,0,0.5]};

class Char{
  constructor(E,o){
    this.E=E;this.name=o.name||'Player';this.color=o.color||VG.COLORS.blue;this.team=o.team==null?null:o.team;this.isBot=!!o.bot;
    this.pos=V();this.vel=V();this.radius=0.55;this.height=2.4;this.stepH=1.05;this.onGround=false;this.ground=null;this.blocked=false;this.gravScale=1;
    this.hp=100;this.maxHp=100;this.alive=true;this.yaw=0;this.speed=11;this.jumpV=16;this.invuln=0;this.frozen=false;
    this.tools=[];this.tool=null;this.cd={};this.swing=0;this.walk=0;this.kos=0;this.outs=0;this.data={};this.brain=null;this.lastHitBy=null;this.lastHitT=-99;
    this.group=makeAvatar(this.color);this.tag=makeTag(this.name,this.color);this.group.add(this.tag);E.scene.add(this.group);
  }
  setTools(list){this.tools=list.slice();this.equip(list[0]||null);}
  equip(id){this.tool=id;const h=this.group.userData.hold;while(h.children.length)h.remove(h.children[0]);
    if(id&&TOOL_LOOK[id]){const L=TOOL_LOOK[id];h.add(part(id==='bouncer'||id==='bomb'?SPH:BOX,new T.MeshBasicMaterial({color:L[3]}),L[0]/(id==='bouncer'||id==='bomb'?2:1),L[1]/(id==='bouncer'||id==='bomb'?2:1),L[2]/(id==='bouncer'||id==='bomb'?2:1),L[4],L[5],L[6]));}
    if(this===this.E.player)this.E.hud.tools();}
  /* use the held tool (or a named one) toward a unit direction. returns true if it fired */
  use(dir,id){id=id||this.tool;const t=VG.TOOLS[id],E=this.E;if(!t)return false;
    /* a character that another player's device controls only acts when that device says so */
    if(this.puppet){if(!this._netUse)return false;}else{if(!this.alive||this.frozen)return false;if((this.cd[id]||0)>E.time)return false;}
    this.cd[id]=E.time+t.cd;this.swing=0.25;this.yaw=Math.atan2(dir.x,dir.z);E._inUse=(E._inUse||0)+1;try{t.use(this,dir,E);}finally{E._inUse--;}
    if(E.net&&!this.puppet)E.net.onUse(this,id,dir);return true;}
  chest(){return V(this.pos.x,this.pos.y+1.5,this.pos.z);}
  teleport(x,y,z){this.pos.set(x,y,z);this.vel.set(0,0,0);}
  showTag(v){this.tag.visible=v;}
  animate(dt){
    const u=this.group.userData,sp=Math.hypot(this.vel.x,this.vel.z);this.walk+=sp*dt*0.9;const w=this.walk,k=Math.min(1,sp/6);
    this.group.position.copy(this.pos);this.group.rotation.y=this.yaw;
    u.fl.position.y=0.16+Math.max(0,Math.sin(w))*0.28*k;u.fr.position.y=0.16+Math.max(0,-Math.sin(w))*0.28*k;u.fl.position.z=0.05+Math.cos(w)*0.3*k;u.fr.position.z=0.05-Math.cos(w)*0.3*k;
    u.body.position.y=1.0+Math.abs(Math.sin(w))*0.06*k;u.head.rotation.z=Math.sin(w*0.5)*0.04*k;
    const air=this.onGround?0:0.45;u.hl.position.set(-0.84,1.05+air+Math.sin(w)*0.12*k,0.1-Math.sin(w)*0.3*k);
    if(this.swing>0){this.swing-=dt;const s=Math.sin((1-this.swing/0.25)*Math.PI);u.hr.position.set(0.7,1.25+s*0.5,0.3+s*0.6);u.hold.position.set(0.7,1.25+s*0.5,0.55+s*0.6);u.hold.rotation.x=-s*1.2;}
    else{u.hr.position.set(0.84,1.05+air-Math.sin(w)*0.12*k,0.1+Math.sin(w)*0.3*k);u.hold.position.set(0.84,1.05+air,0.35);u.hold.rotation.x=0;}
    u.tip.scale.setScalar(0.12+Math.sin(this.E.time*6+this.walk)*0.015);
    if(this.invuln>0){this.invuln-=dt;this.group.visible=this.alive&&(Math.floor(this.E.time*12)%2===0||this.invuln<=0);}
  }
  dispose(){this.E.scene.remove(this.group);for(const m of this.group.userData.mats)m.dispose();this.tag.material.map.dispose();this.tag.material.dispose();}
}
VG.Char=Char;

/* ---------------------------------------------------------------- tools */
function melee(c,dir,E,range,dmg){let hit=false;for(const o of E.targets()){if(o===c||!o.alive)continue;const dx=o.pos.x-c.pos.x,dz=o.pos.z-c.pos.z,dy=o.pos.y-c.pos.y,d=Math.hypot(dx,dz);
  if(d<range&&Math.abs(dy)<3&&(d<1.4||(dx*dir.x+dz*dir.z)/d>0.25)){if(E.damage(o,dmg,c)){hit=true;o.vel.x+=dir.x*9;o.vel.z+=dir.z*9;o.vel.y+=5;}}}
  E.sfx(hit?'hit':'shoot');return hit;}
VG.TOOLS={
  blade:{name:'Zap Blade',cd:0.45,range:4.4,use(c,d,E){melee(c,d,E,4.4,34);}},
  popper:{name:'Popper',cd:0.3,range:45,use(c,d,E){E.shoot(c,d,{speed:75,r:0.25,dmg:14,life:2.2,grav:0.25,color:0xffd23e});E.sfx('shoot');}},
  bouncer:{name:'Bouncer',cd:1.2,range:30,use(c,d,E){E.shoot(c,d,{speed:44,r:0.6,dmg:30,life:6,grav:1,bounce:0.85,color:pick([0xff6fb5,0x22c9c2,0xffc93c,0xa56bff,0x35d07f])});E.sfx('shoot');}},
  rocket:{name:'Boom Rocket',cd:2.6,range:55,use(c,d,E){E.shoot(c,d,{speed:42,r:0.38,dmg:0,life:5,grav:0,color:0xff5a3c,trail:0xffc93c,explode:{r:7,dmg:85}});E.sfx('shoot');}},
  bomb:{name:'Tick Bomb',cd:3.5,range:12,use(c,d,E){const v=V(d.x,0,d.z);if(v.lengthSq()<0.01)v.set(Math.sin(c.yaw),0,Math.cos(c.yaw));v.normalize();v.y=0.55;v.normalize();
    E.shoot(c,v,{speed:15,r:0.6,dmg:0,life:2.2,grav:1,bounce:0.35,fuse:true,color:0x22263a,blink:0xff4d5e,explode:{r:9.5,dmg:105}});E.sfx('tick');}},
  wall:{name:'Wall Maker',cd:3.5,range:14,use(c,d,E){const f=V(d.x,0,d.z);if(f.lengthSq()<0.01)f.set(Math.sin(c.yaw),0,Math.cos(c.yaw));f.normalize();
    const px=c.pos.x+f.x*5,pz=c.pos.z+f.z*5,gy=E.world.groundY(px,pz,c.pos.y+3),y0=gy>-1e8?gy:c.pos.y,alongX=Math.abs(f.z)>Math.abs(f.x),made=[];
    for(let row=0;row<3;row++)for(let i=-1.5;i<=1.5;i++){made.push(E.world.addBox(px+(alongX?i*2:0),y0+0.75+row*1.5,pz+(alongX?0:i*2),alongX?2:1,1.5,alongX?1:2,c.color,{breakable:true,tag:'built'}));}
    E.after(22,()=>{for(const b of made)E.world.removeBox(b);});E.sfx('build');}},
  zapper:{name:'Phantom Zap',cd:0.9,range:4,use(c,d,E){melee(c,d,E,4,999);}},
  catcher:{name:'Catcher Beam',cd:2.2,range:70,use(c,d,E){const o=c.chest(),hit=E.world.ray(o,d,70);let len=hit?hit.t:70,got=null;
    for(const t of E.targets()){if(t===c||!t.alive)continue;const k=E.rayChar(o,d,t,len);if(k!=null){len=k;got=t;}}
    E.beam(o,V(o.x+d.x*len,o.y+d.y*len,o.z+d.z*len),0x7dffb0);E.sfx('shoot');if(got)E.damage(got,999,c);if(E.game&&E.game.onCatch)E.game.onCatch(c,got);}}
};

/* ---------------------------------------------------------------- bot helper */
class Brain{
  constructor(c,E){this.c=c;this.E=E;this.goal=null;this.arrive=1.5;this.arrived=false;this.side=0;this.sideDir=1;this.jumpCd=0;this.stuck=0;this.speedMul=1;this.skill=0.5;this.fearless=false;this.maxDrop=3.5;this.gapJump=true;this.think=rand(0,0.5);this.data={};}
  /* walk toward this.goal (a Vector3 or null to stand still). call once per frame */
  step(dt){
    const c=this.c,E=this.E;if(!c.alive||c.frozen){c.vel.x*=0.8;c.vel.z*=0.8;return;}
    let dx=0,dz=0;this.jumpCd-=dt;
    if(this.goal){dx=this.goal.x-c.pos.x;dz=this.goal.z-c.pos.z;const d=Math.hypot(dx,dz);if(d<this.arrive){dx=dz=0;this.arrived=true;}else{dx/=d;dz/=d;this.arrived=false;}}
    if(this.side>0&&(dx||dz)){this.side-=dt;const sx=-dz*this.sideDir,sz=dx*this.sideDir;dx=dx*0.25+sx;dz=dz*0.25+sz;const n=Math.hypot(dx,dz)||1;dx/=n;dz/=n;}
    if((dx||dz)&&c.onGround&&!this.fearless){const gy=E.world.groundY(c.pos.x+dx*1.8,c.pos.z+dz*1.8,c.pos.y+1.2);
      if(gy<c.pos.y-this.maxDrop){const g2=E.world.groundY(c.pos.x+dx*6,c.pos.z+dz*6,c.pos.y+2.5);
        if(this.gapJump&&g2>=c.pos.y-3){c.vel.y=c.jumpV;}else{this.side=0.6;this.sideDir=Math.random()<0.5?1:-1;dx=dz=0;}}}
    const sp=c.speed*this.speedMul,a=c.onGround?14:5,k=Math.min(1,a*dt);c.vel.x+=(dx*sp-c.vel.x)*k;c.vel.z+=(dz*sp-c.vel.z)*k;
    if(c.blocked&&c.onGround&&this.jumpCd<=0&&(dx||dz)){c.vel.y=c.jumpV;this.jumpCd=0.45;if(++this.stuck>2){this.side=0.8;this.sideDir=Math.random()<0.5?1:-1;this.stuck=0;}}
    else if(!c.blocked&&this.stuck>0&&Math.random()<dt)this.stuck--;
    if(dx||dz)c.yaw=angLerp(c.yaw,Math.atan2(dx,dz),Math.min(1,10*dt));
  }
  /* aim at a character or point with some wobble and use a tool */
  fireAt(target,id,spread){const c=this.c,p=target.pos?V(target.pos.x,target.pos.y+1.3,target.pos.z):target,o=c.chest(),d=p.clone().sub(o);
    const tool=VG.TOOLS[id||c.tool];if(tool&&id!=='rocket'&&id!=='popper'&&id!=='catcher'&&tool.range>10)d.y+=d.length()*0.12;
    const s=spread==null?(1-this.skill)*0.22:spread;d.normalize();d.x+=rand(-s,s);d.y+=rand(-s,s)*0.6;d.z+=rand(-s,s);d.normalize();
    if(id&&c.tool!==id)c.equip(id);return c.use(d,id);}
  dist(t){const p=t.pos||t;return Math.hypot(p.x-this.c.pos.x,p.z-this.c.pos.z);}
  /* nearest living character that passes the filter */
  nearest(filter){let best=null,bd=1e9;for(const o of this.E.targets()){if(o===this.c||!o.alive)continue;if(filter){let ok=false;try{ok=filter(o);}catch(e){}if(!ok)continue;}const d=this.dist(o);if(d<bd){bd=d;best=o;}}return best;}
  canSee(t){const o=this.c.chest(),p=V(t.pos.x,t.pos.y+1.3,t.pos.z),d=p.sub(o),len=d.length();d.normalize();return !this.E.world.ray(o,d,len-0.3);}
}
VG.Brain=Brain;

/* ---------------------------------------------------------------- engine */
class Engine{
  constructor(host,def,opts){
    this.host=host;this.def=def;this.opts=opts||{};this.level=1;this.time=0;this.over=false;this.paused=false;this.frozen=false;this.dead=false;
    this.chars=[];this.remotes=[];this._botN=0;this.shots=[];this.timers=[];this.pickups=[];this.extra=[];this.beams=[];this.shakeAmt=0;
    const R=this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    R.domElement.className='vg-canvas';host.appendChild(R.domElement);
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(62,1,0.2,900);
    this.hemi=new T.HemisphereLight(0xffffff,0x6d7aa6,0.66);this.sun=new T.DirectionalLight(0xfff4de,0.62);this.sun.position.set(40,80,25);this.scene.add(this.hemi,this.sun,this.sun.target);
    this.sunDir=V(40,80,25).normalize();this.shadows=true;this._slow=0;
    R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;
    {const sm=this.sun.shadow,small=(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches);this.sun.castShadow=true;sm.mapSize.set(small?1024:2048,small?1024:2048);
      sm.camera.left=-70;sm.camera.right=70;sm.camera.top=70;sm.camera.bottom=-70;sm.camera.near=1;sm.camera.far=320;sm.bias=-0.0006;sm.normalBias=0.05;}
    R.domElement.style.filter='saturate(1.1) contrast(1.04)';
    this.sky=null;this.setSky(0x6fb6ff,0xdff3ff,0xcfe8ff,90,420);
    this.world=new World(this.scene);this.fx=new FX(this.scene);
    this.world.onBreak=(b,from)=>{this.fx.burst(V(b.x,b.y,b.z),b.color,Math.min(7,3+Math.round(b.sx*b.sy*b.sz/3)),9,0.42,{life:1.3});if(this.game&&this.game.onBreak)this.game.onBreak(b,from);};
    this.world.onMoved=(b,dx,dy,dz)=>{for(const c of this.chars)if(c.alive&&c.ground===b){c.pos.x+=dx;c.pos.y+=dy;c.pos.z+=dz;}};
    this.cam={yaw:0,pitch:0.35,dist:10,minDist:3,look:V(),shoulder:0.9};
    this.input={keys:new Set(),mx:0,mz:0,jump:false,fire:false,fireHeld:false,locked:false,touch:false,joy:null,look:null};
    this.hud=new Hud(this);this._bind();
    this.player=this.spawn({name:this.opts.name||'You',color:this.opts.color||VG.COLORS.blue,bot:false});
    /* playing with friends: every device builds the same map from the same seed */
    this.net=(VG.net&&VG.net.begin)?VG.net.begin(this):null;
    {const rr=Math.random;if(this.net)Math.random=this.net.rng;try{this.game=def.create(this)||{};}finally{Math.random=rr;}}
    if(this.net)this.net.created(this);
    this.hud.tools();this._resize();this._last=performance.now();this._raf=requestAnimationFrame(t=>this._loop(t));
  }
  /* ---- setup helpers for games */
  setSky(top,bottom,fog,near,far){
    if(this.sky){this.scene.remove(this.sky);this.sky.geometry.dispose();this.sky.material.dispose();}
    const ct=new T.Color(top),lum=ct.r*0.3+ct.g*0.59+ct.b*0.11;
    const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{a:{value:ct},b:{value:new T.Color(bottom)},sd:{value:(this.sunDir||V(0.4,0.8,0.25)).clone().normalize()},day:{value:lum>0.42?1:0},tm:{value:0}},
      vertexShader:'varying vec3 dir;void main(){dir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:[
        'uniform vec3 a;uniform vec3 b;uniform vec3 sd;uniform float day;uniform float tm;varying vec3 dir;',
        'float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}',
        'float fbm(vec2 p){float v=0.0,m=0.5;for(int i=0;i<4;i++){v+=m*ns(p);p*=2.03;m*=0.5;}return v;}',
        'void main(){vec3 d=normalize(dir);float k=smoothstep(-0.15,0.75,d.y);vec3 c=mix(b,a,k);',
        ' float s=max(dot(d,sd),0.0);c+=vec3(1.0,0.93,0.78)*(pow(s,420.0)*1.6+pow(s,14.0)*0.22)*mix(0.35,1.0,day);',
        ' if(day>0.5&&d.y>0.02){vec2 uv=d.xz/(d.y+0.12)*1.25+vec2(tm*0.006,tm*0.002);float cl=smoothstep(0.52,0.78,fbm(uv));cl*=smoothstep(0.02,0.22,d.y);c=mix(c,vec3(1.0),cl*0.72);}',
        ' c=mix(c,b,pow(1.0-clamp(d.y,0.0,1.0),6.0)*0.35);gl_FragColor=vec4(c,1.0);}'].join('\n')});
    this.sky=new T.Mesh(new T.SphereGeometry(700,32,20),mat);this.sky.frustumCulled=false;this.scene.add(this.sky);
    this.scene.fog=new T.Fog(fog==null?bottom:fog,near||90,far||420);
  }
  setLight(hemi,sun,sunColor){this.hemi.intensity=hemi;this.sun.intensity=sun;if(sunColor!=null)this.sun.color.set(sunColor);}
  stars(n,color){const g=new T.BufferGeometry(),a=new Float32Array((n||500)*3);for(let i=0;i<a.length;i+=3){const v=V(rand(-1,1),rand(-0.2,1),rand(-1,1)).normalize().multiplyScalar(600);a[i]=v.x;a[i+1]=v.y;a[i+2]=v.z;}
    g.setAttribute('position',new T.BufferAttribute(a,3));const p=new T.Points(g,new T.PointsMaterial({color:color||0xffffff,size:2.2,sizeAttenuation:false,fog:false}));p.frustumCulled=false;this.add(p);return p;}
  add(obj){this.scene.add(obj);this.extra.push(obj);return obj;}
  remove(obj){this.scene.remove(obj);const i=this.extra.indexOf(obj);if(i>=0)this.extra.splice(i,1);if(obj.geometry)obj.geometry.dispose();if(obj.material&&obj.material.dispose)obj.material.dispose();}
  /* a see-through or glowing slab that is only for looks (water, lava, zones). returns the mesh */
  slab(x,y,z,sx,sy,sz,color,opacity){
    let mat;
    if(opacity<1&&sx>=150&&sz>=150&&sy<=4){ /* a big flat see-through slab is water: ripples and sun glints */
      mat=new T.MeshPhongMaterial({color,transparent:true,opacity:Math.min(0.92,opacity+0.12),shininess:140,specular:0xbfe6ff,depthWrite:false});
      const u=this._waterT||(this._waterT={value:0});
      mat.onBeforeCompile=sh=>{sh.uniforms.vgT=u;
        sh.vertexShader='varying vec3 vgP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvgP=(modelMatrix*vec4(position,1.0)).xyz;');
        sh.fragmentShader='uniform float vgT;varying vec3 vgP;\nfloat wH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat wN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wH(i),wH(i+vec2(1.,0.)),f.x),mix(wH(i+vec2(0.,1.)),wH(i+vec2(1.,1.)),f.x),f.y);}\n'+
          sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float r=wN(vgP.xz*0.11+vec2(vgT*0.35,vgT*0.21))+0.5*wN(vgP.xz*0.31-vec2(vgT*0.5,vgT*0.3));float band=smoothstep(0.95,1.2,r);gl_FragColor.rgb+=vec3(0.16,0.2,0.22)*band;gl_FragColor.rgb*=0.9+0.14*r;}');};
    }else mat=new T.MeshBasicMaterial({color,transparent:opacity<1,opacity:opacity==null?1:opacity,depthWrite:opacity>=1});
    const m=new T.Mesh(BOX,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);return this.add(m);}
  spawn(o){const c=new Char(this,o);if(c.isBot){c.brain=new Brain(c,this);c.botIdx=this._botN++;}this.chars.push(c);if(this.net&&this.net.live&&c.isBot)this.net.dropBot(c);return c;}
  /* everyone a tool or blast can hit: the round's characters plus friends playing from other devices */
  targets(){return this.remotes.length?this.chars.concat(this.remotes):this.chars;}
  /* add n bots with fresh names. each gets .brain */
  bots(n,o){o=o||{};const names=shuffle(VG.BOT_NAMES.slice()),cols=Object.values(VG.COLORS).slice(0,8),out=[];
    for(let i=0;i<n;i++)out.push(this.spawn({name:names[(this.chars.length+i)%names.length],color:o.color!=null?o.color:cols[(i+1)%cols.length],team:o.team,bot:true}));return out;}
  despawn(c){const i=this.chars.indexOf(c);if(i>=0)this.chars.splice(i,1);c.alive=false;c.dispose();}
  after(sec,fn){const t={at:this.time+sec,fn,every:0};this.timers.push(t);return t;}
  every(sec,fn){const t={at:this.time+sec,fn,every:sec};this.timers.push(t);return t;}
  cancel(t){if(t)t.dead=true;}
  sfx(n){SFX.play(n);}
  shake(a){this.shakeAmt=Math.max(this.shakeAmt,a);}
  status(t){this.hud.status(t);} announce(t,s){this.hud.announce(t,s);} score(rows){this.hud.score(rows);}
  fmt(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  living(filter){return this.chars.filter(c=>c.alive&&(!filter||filter(c)));}
  /* ---- combat */
  damage(c,amt,by,o){
    if(!c.alive||c.invuln>0||this.over)return false;if(by&&by!==c&&by.team!=null&&by.team===c.team)return false;
    if(this.game&&this.game.canDamage&&this.game.canDamage(c,by)===false)return false;
    if(this.net){const r=this.net.damage(c,amt,by);if(r!==undefined)return r;}
    if(by===c)amt*=0.5;c.hp-=amt;if(by&&by!==c){c.lastHitBy=by;c.lastHitT=this.time;}
    this.fx.burst(c.chest(),0xffffff,4,5,0.2);if(c===this.player){this.hud.hurt();this.shake(0.25);}
    if(c.hp<=0)this.kill(c,by||(this.time-c.lastHitT<8?c.lastHitBy:null));else if(!o||!o.quiet)this.sfx('hit');return true;
  }
  kill(c,by){
    if(!c.alive)return;if(this.net&&c.puppet&&!this.net.applying){if(by&&!by.puppet)this.net.sendHit(c,9999,by);return;}
    if(!by&&this.time-c.lastHitT<8)by=c.lastHitBy;c.alive=false;c.hp=0;c.outs++;c.group.visible=false;if(by&&by!==c)by.kos++;
    this.fx.burst(c.chest(),[c.color,0xffffff,0xffc93c],26,11,0.36,{life:1.4});this.sfx('out');
    if(c===this.player){this.shake(0.5);this.hud.hp();}
    if(this.game&&this.game.onDeath&&!c.remote){try{this.game.onDeath(c,by);}catch(e){console.error(e);}}
    if(this.net&&!c.puppet)this.net.onKill(c,by);
  }
  respawn(c,x,y,z,shield){if(c.removed)return;if(this.net&&c.puppet&&!this.net.applying)return;c.alive=true;c.hp=c.maxHp;c.teleport(x,y,z);c.group.visible=true;c.invuln=shield==null?2.5:shield;c.lastHitBy=null;if(c===this.player)this.hud.hp();}
  heal(c,amt){if(!c.alive)return;c.hp=Math.min(c.maxHp,c.hp+amt);if(c===this.player)this.hud.hp();}
  /* fire a projectile. spec: speed,r,dmg,life,grav(0..1),bounce,fuse,explode:{r,dmg},color,trail,onHit(char),noOwnerHit */
  shoot(c,dir,spec){
    const o=c.chest();o.x+=dir.x*1.1;o.y+=dir.y*1.1;o.z+=dir.z*1.1;
    const m=new T.Mesh(SPH,new T.MeshBasicMaterial({color:spec.color||0xffffff}));m.scale.setScalar(spec.r||0.3);m.position.copy(o);this.scene.add(m);
    const s={m,pos:o,vel:V(dir.x,dir.y,dir.z).multiplyScalar(spec.speed||40),owner:c,spec,life:spec.life||3,hit:new Set(),t:0};this.shots.push(s);
    if(this.net&&!this._inUse&&c&&!c.puppet)this.net.onShoot(c,o,dir,spec);return s;
  }
  /* drop a free projectile from anywhere (meteors, falling balls). owner may be null */
  drop(pos,vel,spec){const m=new T.Mesh(SPH,new T.MeshBasicMaterial({color:spec.color||0xffffff}));m.scale.setScalar(spec.r||0.3);m.position.copy(pos);this.scene.add(m);
    const s={m,pos:pos.clone(),vel:vel.clone(),owner:null,spec,life:spec.life||6,hit:new Set(),t:0};this.shots.push(s);return s;}
  explode(pos,r,dmg,owner,o){
    o=o||{};if(o.breaks!==false)this.world.blast(pos,r*0.8,o.maxBreak);
    for(const c of this.targets()){if(!c.alive)continue;const p=c.chest(),d=p.distanceTo(pos);if(d<r*1.15){
      const k=clamp(1-d/(r*1.25),0.25,1),dir=p.sub(pos);if(dir.lengthSq()<0.01)dir.set(0,1,0);dir.normalize();
      c.vel.x+=dir.x*20*k;c.vel.z+=dir.z*20*k;c.vel.y+=11*k;c.onGround=false;this.damage(c,dmg*k,owner,{quiet:true});}}
    this.fx.burst(pos,[0xffc93c,0xff8a3c,0xff4d5e,0xffffff],22,14,0.5,{life:1.2});this.fx.flash(pos,r,o.color);this.sfx('boom');
    const pd=this.player.pos.distanceTo(pos);if(pd<r*4)this.shake(clamp(1.2-pd/(r*4),0.1,0.9));
  }
  rayChar(o,d,c,len){/* distance along the ray to a character, or null */
    const cx=c.pos.x-o.x,cy=c.pos.y+1.3-o.y,cz=c.pos.z-o.z,t=cx*d.x+cy*d.y+cz*d.z;if(t<0||t>len)return null;
    const px=cx-d.x*t,py=(cy-d.y*t)*0.55,pz=cz-d.z*t;return px*px+py*py+pz*pz<0.85*0.85?t:null;}
  beam(a,b,color){const d=b.clone().sub(a),len=d.length(),m=new T.Mesh(BOX,new T.MeshBasicMaterial({color,transparent:true,opacity:0.9}));m.scale.set(0.14,0.14,len);m.position.copy(a).addScaledVector(d,0.5);m.lookAt(b);this.scene.add(m);this.beams.push({m,t:0.18});}
  /* a spinning pickup. o: pos,color,size,onTake(char) -> return false to refuse, bots(default true), respawn(sec) */
  pickup(o){const m=new T.Mesh(new T.OctahedronGeometry(o.size||0.7),new T.MeshBasicMaterial({color:o.color||0xffc93c}));m.position.copy(o.pos);this.scene.add(m);{const h=new T.Sprite(new T.SpriteMaterial({map:VG.glowTex(),color:o.color||0xffc93c,transparent:true,opacity:0.55,depthWrite:false,blending:T.AdditiveBlending}));h.scale.setScalar(3.2);m.add(h);}const p={m,o,on:true,base:o.pos.y};this.pickups.push(p);return p;}
  removePickup(p){const i=this.pickups.indexOf(p);if(i>=0)this.pickups.splice(i,1);this.scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();}
  /* where the crosshair points */
  aimPoint(){const d=V();this.camera.getWorldDirection(d);const o=this.camera.position.clone(),skip=this.cam.curDist||this.cam.dist;o.addScaledVector(d,skip);
    const hit=this.world.ray(o,d,160);let len=hit?hit.t:160;for(const c of this.targets()){if(c===this.player||!c.alive)continue;const k=this.rayChar(o,d,c,len);if(k!=null)len=k;}
    return o.addScaledVector(d,len);}
  aimDir(){const p=this.aimPoint(),c=this.player.chest();p.sub(c);if(p.lengthSq()<0.01)p.set(Math.sin(this.player.yaw),0,Math.cos(this.player.yaw));return p.normalize();}
  /* end the round. r: {win, title, lines:[...], stars(0-3)} */
  finish(r){if(this.over)return;this.over=true;this.sfx(r.win?'win':'lose');try{document.exitPointerLock&&document.exitPointerLock();}catch(e){}
    if(VG.onResult)VG.onResult(this.def.id,this.level,r);this.hud.end(r);}
  /* ---- frame */
  _loop(now){
    if(this._dead)return;this._raf=requestAnimationFrame(t=>this._loop(t));
    let dt=Math.min(0.05,(now-this._last)/1000);this._last=now;if(this.paused){this.renderer.render(this.scene,this.camera);return;}
    if(this.shadows){const raw=(now-(this._prevT||now))/1000;this._slow=raw>0.045?this._slow+raw:Math.max(0,this._slow-raw*0.5);
      if(this._slow>4){this.shadows=false;this.sun.castShadow=false;this.renderer.shadowMap.enabled=false;this.scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.needsUpdate=true;});}});}}
    this._prevT=now;
    this.step(dt);this.renderer.render(this.scene,this.camera);
  }
  step(dt){
    this.time+=dt;if(this.net)this.net.pre(dt);
    for(let i=this.timers.length-1;i>=0;i--){const t=this.timers[i];if(t.dead){this.timers.splice(i,1);continue;}if(this.time>=t.at){if(t.every)t.at+=t.every;else this.timers.splice(i,1);try{t.fn();}catch(e){console.error(e);}}}
    if(!this.over){if(window.VG_AUTOPILOT&&this.game.autopilot){try{this.game.autopilot(dt);}catch(e){console.error(e);}}else this._player(dt);if(this.game.update){try{this.game.update(dt);}catch(e){console.error(e);}}}
    const sub=dt>0.02?2:1,h=dt/sub;
    for(const c of this.chars){if(!c.alive)continue;if(c.puppet){this.net.move(c,dt);continue;}if(c.brain&&!this.over&&!c.brain.manual&&(c.isBot||window.VG_AUTOPILOT))c.brain.step(dt);
      if(this.over){c.vel.x*=0.85;c.vel.z*=0.85;}
      for(let s=0;s<sub;s++)this.world.move(c,h);
      if(c.pos.y<this.world.killY)this.kill(c,null);}
    for(const c of this.remotes)if(c.alive)this.net.move(c,dt);
    for(const c of this.targets())if(c.alive)c.animate(dt);
    this._shots(dt);this._pickups(dt);this.fx.update(dt);
    for(let i=this.beams.length-1;i>=0;i--){const b=this.beams[i];b.t-=dt;b.m.material.opacity=Math.max(0,b.t/0.18);if(b.t<=0){this.scene.remove(b.m);b.m.material.dispose();this.beams.splice(i,1);}}
    this._camera(dt);this.hud.frame(dt);this.input.fire=false;this.input.jump=false;if(this.net)this.net.post(dt);
  }
  _player(dt){
    const p=this.player,I=this.input,K=I.keys;if(!p.alive)return;
    let f=0,s=0;if(K.has('w')||K.has('arrowup'))f+=1;if(K.has('s')||K.has('arrowdown'))f-=1;if(K.has('d')||K.has('arrowright'))s+=1;if(K.has('a')||K.has('arrowleft'))s-=1;
    if(I.joy){f=-I.joy.y;s=I.joy.x;}
    if(K.has('q'))this.cam.yaw+=2.2*dt;if(K.has('e'))this.cam.yaw-=2.2*dt;
    const n=Math.hypot(f,s);if(n>1){f/=n;s/=n;}
    const y=this.cam.yaw,fx=-Math.sin(y),fz=-Math.cos(y),rx=Math.cos(y),rz=-Math.sin(y);let dx=fx*f+rx*s,dz=fz*f+rz*s;
    if(this.frozen||p.frozen){dx=dz=0;}
    const a=p.onGround?16:6,k=Math.min(1,a*dt);p.vel.x+=(dx*p.speed-p.vel.x)*k;p.vel.z+=(dz*p.speed-p.vel.z)*k;
    if(p.onGround)p.coyote=0.1;else p.coyote=(p.coyote||0)-dt;
    if((I.jump||K.has(' '))&&p.coyote>0&&!this.frozen&&!p.frozen&&p.vel.y<=0.5){p.vel.y=p.jumpV;p.coyote=0;this.sfx('jump');}
    if(dx||dz)p.yaw=angLerp(p.yaw,Math.atan2(dx,dz),Math.min(1,14*dt));
    if((I.fire||I.fireHeld||K.has('f'))&&p.tool&&!this.frozen){const d=this.aimDir();if(p.use(d))this.hud.tools();}
  }
  _shots(dt){
    for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i],sp=s.spec;s.life-=dt;s.t+=dt;let dead=false,boom=false;
      s.vel.y+=this.world.gravity*(sp.grav==null?1:sp.grav)*dt;
      const len=s.vel.length()*dt;if(len>1e-5){const d=s.vel.clone().normalize(),hit=this.world.ray(s.pos,d,len+(sp.r||0.3)*0.5);
        if(hit){if(sp.bounce){s.pos.copy(hit.point).addScaledVector(hit.normal,(sp.r||0.3)*0.6);const vn=s.vel.dot(hit.normal);s.vel.addScaledVector(hit.normal,-2*vn).multiplyScalar(sp.bounce);if(Math.abs(vn)>6)this.sfx('bounce');if(sp.fuse&&hit.normal.y>0.5){s.vel.x*=0.7;s.vel.z*=0.7;}}
          else{s.pos.copy(hit.point);dead=true;boom=!!sp.explode;if(sp.onLand)sp.onLand(hit,s);}}
        else s.pos.addScaledVector(s.vel,dt);}
      if(!dead&&!sp.fuse){for(const c of this.targets()){if(!c.alive||c===s.owner||s.hit.has(c))continue;if(s.owner&&s.owner.team!=null&&s.owner.team===c.team)continue;
        const dx=c.pos.x-s.pos.x,dz=c.pos.z-s.pos.z,cy=clamp(s.pos.y,c.pos.y+0.3,c.pos.y+2.3),dy=cy-s.pos.y,rr=(sp.r||0.3)+0.62;
        if(dx*dx+dy*dy+dz*dz<rr*rr){s.hit.add(c);if(sp.dmg)this.damage(c,sp.dmg,s.owner);if(sp.onHit)sp.onHit(c,s);if(sp.explode){dead=true;boom=true;}else if(!sp.bounce){dead=true;}break;}}}
      if(sp.trail&&Math.random()<0.7)this.fx.burst(s.pos,sp.trail,1,1.5,0.22,{gravity:0,life:0.5});
      if(sp.blink)s.m.material.color.set(Math.floor(s.t*(4+s.t*4))%2?sp.blink:sp.color);
      if(s.life<=0){dead=true;boom=!!sp.explode;}
      if(s.pos.y<this.world.killY-20)dead=true,boom=false;
      s.m.position.copy(s.pos);
      if(dead){if(boom)this.explode(s.pos.clone(),sp.explode.r,sp.explode.dmg,s.owner,sp.explode);else this.fx.burst(s.pos,sp.color||0xffffff,4,4,0.18);this.scene.remove(s.m);s.m.material.dispose();this.shots.splice(i,1);}
    }
  }
  _pickups(dt){for(let i=this.pickups.length-1;i>=0;i--){const p=this.pickups[i];p.m.rotation.y+=dt*2.4;p.m.position.y=p.base+Math.sin(this.time*3+i)*0.25;if(!p.on)continue;
    for(const c of this.chars){if(!c.alive||(c.isBot&&p.o.bots===false))continue;const dx=c.pos.x-p.m.position.x,dz=c.pos.z-p.m.position.z,dy=c.pos.y+1.2-p.base;
      if(dx*dx+dz*dz<3.2&&Math.abs(dy)<2.6){if(p.o.onTake&&p.o.onTake(c)===false)continue;this.fx.burst(p.m.position,p.o.color||0xffc93c,12,7,0.25);if(c===this.player)this.sfx('pickup');
        if(p.o.respawn){p.on=false;p.m.visible=false;this.after(p.o.respawn,()=>{p.on=true;p.m.visible=true;});}else this.removePickup(p);break;}}}}
  _camera(dt){
    const C=this.cam,p=this.player;C.pitch=clamp(C.pitch,-0.9,1.35);
    const tx=p.pos.x,ty=p.pos.y+2.5,tz=p.pos.z;C.look.x=lerp(C.look.x,tx,Math.min(1,18*dt));C.look.y=lerp(C.look.y,ty,Math.min(1,10*dt));C.look.z=lerp(C.look.z,tz,Math.min(1,18*dt));
    const cp=Math.cos(C.pitch),dir=V(Math.sin(C.yaw)*cp,Math.sin(C.pitch),Math.cos(C.yaw)*cp),rx=Math.cos(C.yaw),rz=-Math.sin(C.yaw);
    const o=V(C.look.x+rx*C.shoulder,C.look.y,C.look.z+rz*C.shoulder),hit=this.world.ray(o,dir,C.dist+0.6);let d=hit?Math.max(1.2,hit.t-0.5):C.dist;C.curDist=d;
    this.camera.position.set(o.x+dir.x*d,o.y+dir.y*d,o.z+dir.z*d);
    if(this.shakeAmt>0.01){this.camera.position.x+=rand(-1,1)*this.shakeAmt;this.camera.position.y+=rand(-1,1)*this.shakeAmt;this.shakeAmt*=Math.pow(0.02,dt);}
    this.camera.lookAt(o.x-dir.x*4,o.y-dir.y*4,o.z-dir.z*4);
    if(this.sky){this.sky.position.copy(this.camera.position);this.sky.material.uniforms.tm.value=this.time;}
    if(this._waterT)this._waterT.value=this.time;
    if(this.shadows){const f=(this.player&&this.player.pos)||this.camera.position,g=140/2048*4;const tx=Math.round(f.x/g)*g,ty=Math.round(f.y/g)*g,tz=Math.round(f.z/g)*g;
      this.sun.target.position.set(tx,ty,tz);this.sun.position.set(tx+this.sunDir.x*150,ty+this.sunDir.y*150,tz+this.sunDir.z*150);}
  }
  _resize(){const w=this.host.clientWidth||window.innerWidth,h=this.host.clientHeight||window.innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/Math.max(1,h);this.camera.updateProjectionMatrix();}
  _bind(){
    const I=this.input,cv=this.renderer.domElement,L=this._listeners=[];const on=(t,ev,fn,o)=>{t.addEventListener(ev,fn,o);L.push([t,ev,fn,o]);};
    on(window,'resize',()=>this._resize());
    on(window,'keydown',e=>{if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();I.keys.add(k);
      if(k===' '){I.jump=true;e.preventDefault();}if(k.startsWith('arrow'))e.preventDefault();
      if(k>='1'&&k<='9'){const t=this.player.tools[+k-1];if(t)this.player.equip(t);}
      if(k==='escape'||k==='p'){if(!this.over)this.pause(!this._menu);}});
    on(window,'keyup',e=>{I.keys.delete(e.key.toLowerCase());});
    on(window,'blur',()=>{I.keys.clear();I.fireHeld=false;});
    on(cv,'mousedown',e=>{SFX.init();if(this.over||this.paused)return;
      if(!I.locked&&!I.noLock){try{const pr=cv.requestPointerLock&&cv.requestPointerLock();if(pr&&pr.catch)pr.catch(()=>{I.noLock=true;});}catch(err){I.noLock=true;}}
      I.drag={x:e.clientX,y:e.clientY,moved:0,t:performance.now()};if(I.locked&&e.button===0){I.fire=true;I.fireHeld=true;}});
    on(window,'mouseup',e=>{I.fireHeld=false;if(I.drag&&!I.locked&&e.button===0&&I.drag.moved<6&&performance.now()-I.drag.t<300)I.fire=true;I.drag=null;});
    on(window,'mousemove',e=>{if(I.locked){this.cam.yaw-=e.movementX*0.0026;this.cam.pitch+=e.movementY*0.0026;}
      else if(I.drag){const dx=e.clientX-I.drag.x,dy=e.clientY-I.drag.y;I.drag.x=e.clientX;I.drag.y=e.clientY;I.drag.moved+=Math.abs(dx)+Math.abs(dy);this.cam.yaw-=dx*0.006;this.cam.pitch+=dy*0.006;}});
    on(document,'pointerlockchange',()=>{I.locked=document.pointerLockElement===cv;this.hud.hint(!I.locked&&!I.touch);});
    on(document,'pointerlockerror',()=>{I.noLock=true;});
    on(cv,'wheel',e=>{const p=this.player;if(p.tools.length>1){const i=p.tools.indexOf(p.tool),n=p.tools.length;p.equip(p.tools[(i+(e.deltaY>0?1:n-1))%n]);}e.preventDefault();},{passive:false});
    on(cv,'contextmenu',e=>e.preventDefault());
    /* touch: left half = move stick, right half = look */
    const tstart=e=>{SFX.init();I.touch=true;this.hud.touch(true);for(const t of e.changedTouches){const left=t.clientX<window.innerWidth*0.45;
      if(left&&!I.joyId&&I.joyId!==0){I.joyId=t.identifier;I.joy0={x:t.clientX,y:t.clientY};I.joy={x:0,y:0};this.hud.stick(I.joy0,I.joy);}
      else if(I.lookId==null){I.lookId=t.identifier;I.look={x:t.clientX,y:t.clientY};}}e.preventDefault();};
    const tmove=e=>{for(const t of e.changedTouches){if(t.identifier===I.joyId){const dx=(t.clientX-I.joy0.x)/55,dy=(t.clientY-I.joy0.y)/55,n=Math.hypot(dx,dy);I.joy={x:n>1?dx/n:dx,y:n>1?dy/n:dy};this.hud.stick(I.joy0,I.joy);}
      else if(t.identifier===I.lookId){this.cam.yaw-=(t.clientX-I.look.x)*0.007;this.cam.pitch+=(t.clientY-I.look.y)*0.007;I.look={x:t.clientX,y:t.clientY};}}e.preventDefault();};
    const tend=e=>{for(const t of e.changedTouches){if(t.identifier===I.joyId){I.joyId=null;I.joy=null;this.hud.stick(null);}if(t.identifier===I.lookId){I.lookId=null;}}};
    on(cv,'touchstart',tstart,{passive:false});on(cv,'touchmove',tmove,{passive:false});on(cv,'touchend',tend);on(cv,'touchcancel',tend);
  }
  pause(v){this._menu=v;this.paused=this.net?false:v;this.hud.pause(v);if(v){try{document.exitPointerLock&&document.exitPointerLock();}catch(e){}}this._last=performance.now();}
  dispose(){
    this._dead=true;cancelAnimationFrame(this._raf);for(const [t,ev,fn,o] of this._listeners)t.removeEventListener(ev,fn,o);
    try{document.exitPointerLock&&document.exitPointerLock();}catch(e){}
    if(this.game&&this.game.dispose){try{this.game.dispose();}catch(e){}}
    if(this.net)this.net.end(this);for(const c of this.targets())c.dispose();this.scene.traverse(o=>{if(o.geometry&&o.geometry!==SPH&&o.geometry!==CYL&&o.geometry!==BOX)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();if(o.material.dispose)o.material.dispose();}});
    this.renderer.dispose();this.hud.dispose();if(this.renderer.domElement.parentNode)this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  }
}
VG.Engine=Engine;

/* ---------------------------------------------------------------- heads-up display */
class Hud{
  constructor(E){this.E=E;const el=this.el=document.createElement('div');el.className='vg-hud';
    el.innerHTML='<div class="vg-top"><button class="vg-btn vg-menu" type="button" aria-label="Pause">II</button><div class="vg-status"></div></div>'+
      '<div class="vg-score"></div><div class="vg-announce"></div><div class="vg-cross"></div><div class="vg-hurt"></div>'+
      '<div class="vg-hp"><span>HP</span><div class="vg-hpbar"><i></i></div><b>100</b></div><div class="vg-tools"></div>'+
      '<div class="vg-hint">Click the game to aim with your mouse. Esc pauses.</div>'+
      '<div class="vg-touch"><div class="vg-stick"><i></i></div><button class="vg-tbtn vg-jump" type="button">Jump</button><button class="vg-tbtn vg-fire" type="button">Use</button></div>'+
      '<div class="vg-panel vg-pause"><h2>Paused</h2><button class="vg-big" data-a="resume" type="button">Keep playing</button><button class="vg-big" data-a="again" type="button">Restart</button><button class="vg-big" data-a="exit" type="button">Back to games</button></div>'+
      '<div class="vg-panel vg-end"><h2></h2><div class="vg-stars"></div><div class="vg-lines"></div><div class="vg-endbtns"></div></div>';
    E.host.appendChild(el);const q=s=>el.querySelector(s);
    this.$={status:q('.vg-status'),score:q('.vg-score'),ann:q('.vg-announce'),hp:q('.vg-hp'),hpi:q('.vg-hpbar i'),hpb:q('.vg-hp b'),tools:q('.vg-tools'),hint:q('.vg-hint'),touch:q('.vg-touch'),stick:q('.vg-stick'),knob:q('.vg-stick i'),pause:q('.vg-pause'),end:q('.vg-end'),hurt:q('.vg-hurt'),cross:q('.vg-cross')};
    q('.vg-menu').addEventListener('click',()=>{if(!E.over)E.pause(!E._menu);});
    this.$.pause.addEventListener('click',e=>{const a=e.target.getAttribute&&e.target.getAttribute('data-a');if(a==='resume')E.pause(false);if(a==='again'){if(E.net){if(E.net.isHost())E.net.start(E.def.id);else E.pause(false);}else VG.play(E.def.id);}if(a==='exit')VG.exit();});
    const I=E.input,hold=(b,fn,up)=>{b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();fn();},{passive:false});b.addEventListener('touchend',e=>{e.preventDefault();if(up)up();});b.addEventListener('mousedown',fn);b.addEventListener('mouseup',()=>{if(up)up();});};
    hold(q('.vg-jump'),()=>{I.jump=true;I.keys.add(' ');},()=>I.keys.delete(' '));hold(q('.vg-fire'),()=>{I.fire=true;I.fireHeld=true;},()=>{I.fireHeld=false;});
    this.annT=0;this.lastHp=-1;this.hint(true);}
  status(t){if(this.$.status.textContent!==t)this.$.status.textContent=t;}
  announce(t,s){this.$.ann.textContent=t;this.$.ann.classList.remove('on');void this.$.ann.offsetWidth;this.$.ann.classList.add('on');this.annT=s||2.6;}
  score(rows){this.$.score.innerHTML=rows.map(r=>'<div class="vg-row'+(r.me?' me':'')+'"><i style="background:#'+new T.Color(r.color==null?0xffffff:r.color).getHexString()+'"></i><span>'+esc(r.label)+'</span><b>'+esc(String(r.value))+'</b></div>').join('');}
  hp(){const p=this.E.player,v=Math.max(0,Math.round(p.hp));if(v===this.lastHp)return;this.lastHp=v;this.$.hpi.style.width=(v/p.maxHp*100)+'%';this.$.hpb.textContent=v;this.$.hp.classList.toggle('low',v<=30);}
  hurt(){this.$.hurt.classList.remove('on');void this.$.hurt.offsetWidth;this.$.hurt.classList.add('on');}
  tools(){const p=this.E.player;if(!p)return;const now=this.E.time;this.$.tools.innerHTML='';p.tools.forEach((id,i)=>{const t=VG.TOOLS[id],b=document.createElement('button');b.type='button';b.className='vg-tool'+(id===p.tool?' on':'');
    b.innerHTML='<em>'+(i+1)+'</em><span>'+esc(t.name)+'</span><u></u>';b.addEventListener('click',()=>{p.equip(id);});this.$.tools.appendChild(b);});this.$.cross.style.display=p.tools.length?'block':'none';}
  hint(v){this.$.hint.style.display=v&&!this.E.input.touch?'block':'none';}
  touch(v){this.$.touch.classList.toggle('on',v);this.hint(false);}
  stick(o,j){if(!o){this.$.stick.style.display='none';return;}const s=this.$.stick.style;s.display='block';s.left=(o.x-60)+'px';s.top=(o.y-60)+'px';this.$.knob.style.transform='translate('+(j.x*38)+'px,'+(j.y*38)+'px)';}
  pause(v){this.$.pause.classList.toggle('on',v);}
  end(r){const E=this.E,e=this.$.end;e.querySelector('h2').textContent=r.title||(r.win?'You win!':'Round over');e.classList.toggle('win',!!r.win);
    e.querySelector('.vg-stars').innerHTML=r.stars!=null?[1,2,3].map(i=>'<i class="'+(i<=r.stars?'on':'')+'"></i>').join(''):'';
    e.querySelector('.vg-lines').innerHTML=(r.lines||[]).map(l=>'<p>'+esc(l)+'</p>').join('');const bx=e.querySelector('.vg-endbtns');bx.innerHTML='';
    const btn=(label,fn,main)=>{const b=document.createElement('button');b.type='button';b.className='vg-big'+(main?' main':'');b.textContent=label;b.addEventListener('click',fn);bx.appendChild(b);};
    if(E.net){if(E.net.isHost()){btn('Play again',()=>E.net.start(E.def.id),true);btn('Pick another game',()=>VG.exit());}
      else{const w=document.createElement('p');w.textContent='The party leader can start the next round.';e.querySelector('.vg-lines').appendChild(w);btn('Back to party',()=>VG.exit(),true);}}
    else{btn(r.win?'Play again':'Try again',()=>VG.play(E.def.id),true);btn('Back to games',()=>VG.exit());}
    e.classList.add('on');}
  frame(dt){this.hp();if(this.annT>0){this.annT-=dt;if(this.annT<=0)this.$.ann.classList.remove('on');}
    const p=this.E.player,now=this.E.time,bs=this.$.tools.children;for(let i=0;i<bs.length;i++){const id=p.tools[i],t=VG.TOOLS[id],left=(p.cd[id]||0)-now,u=bs[i].lastChild;u.style.width=left>0?Math.min(100,left/t.cd*100)+'%':'0';bs[i].classList.toggle('on',id===p.tool);}}
  dispose(){if(this.el.parentNode)this.el.parentNode.removeChild(this.el);}
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
VG.esc=esc;

/* ---------------------------------------------------------------- start / stop (the hub sets VG.stage, VG.onResult, VG.onExit) */
VG.play=function(id){
  const def=VG.byId[id];if(!def)return;if(VG.current){VG.current.dispose();VG.current=null;}
  const st=VG.stage;st.innerHTML='';st.classList.add('on');SFX.init();
  const P=VG.profile||{};VG.current=new Engine(st,def,{name:P.name,color:P.color});
  if(VG.onPlay)VG.onPlay(id);
};
VG.exit=function(){if(VG.current){VG.current.dispose();VG.current=null;}VG.stage.classList.remove('on');VG.stage.innerHTML='';if(VG.onExit)VG.onExit();};
})();
