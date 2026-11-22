/* Skyline Sprint: five rooftop obstacle courses above a neon city at dusk, raced against the clock.
   Levels are plain data (LEVELS below). Each node is one piece of the course, placed one after the other:
     k     start | plat | beam | stairs | tile | move | bounce | check | finish
     l, w  length (along the running direction) and width
     g     empty gap between the previous piece and this one
     dy    height change (top of this piece minus top of the previous piece)
     t     'L' or 'R': turn before placing this piece      s: sideways shift
     b     number of bolts on it      gb: put a bolt in the air over the gap before it
     move: amp (travel), per (seconds per cycle), mode 'along' (default) or 'up'
     bounce: v (launch speed: 20 about 4.7 high, 26 about 8)     stairs: n (steps), rise
     bar:{at,amp,per,ph}  sweeper bar across a platform      orb:{R,per,ph}  orbiting block
     lava:[{at,len}]      lava strips across a platform
   The two computer racers and the autopilot all follow the same waypoint list (one per piece). */
(function(){
'use strict';

const HD=[[0,-1],[1,0],[0,1],[-1,0]]; // heading: north (-z), east (+x), south (+z), west (-x)

const PAL=[
  {a:0x22c9c2,b:0xffc93c,base:0x1f2f5c,glow:0x9bfff6,mover:0xff8a3c,tile:0xfff0a8,pad:0xff6fb5},
  {a:0xff6fb5,b:0x3d8bff,base:0x2a2158,glow:0xffc2e6,mover:0xffd23e,tile:0xffe0f2,pad:0x9dff4a},
  {a:0x35d07f,b:0xff8a3c,base:0x1b3250,glow:0xb8ffd6,mover:0xa56bff,tile:0xfff3a0,pad:0xff4fa8},
  {a:0xa56bff,b:0x22c9c2,base:0x241a52,glow:0xe0c8ff,mover:0xff8a3c,tile:0xc6f7ff,pad:0xffe14a},
  {a:0xff4d5e,b:0xffd23e,base:0x3a1b45,glow:0xffd0a0,mover:0x4fd1ff,tile:0xffe9b0,pad:0x4fd1ff}
];

const LEVELS=[
 {name:'Warm Up',target:45,pal:PAL[0],nodes:[
  {k:'start',l:6,w:6},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'plat',l:5,w:5,g:3.5,dy:1,b:1,gb:1},
  {k:'plat',l:6,w:5,g:3.5,t:'R',b:2},
  {k:'plat',l:5,w:5,g:3,dy:1.5,b:1},
  {k:'plat',l:5,w:5,g:4,dy:-1,gb:1,b:1},
  {k:'check',l:6,w:6,g:3,t:'L'},
  {k:'plat',l:5,w:5,g:3.5,dy:1,b:2},
  {k:'plat',l:6,w:4,g:4,gb:1,b:1},
  {k:'plat',l:5,w:5,g:3.5,t:'L',dy:1.5,b:2},
  {k:'plat',l:5,w:5,g:4,dy:-1,gb:1,b:1},
  {k:'plat',l:6,w:5,g:3.5,t:'R',b:1},
  {k:'plat',l:5,w:5,g:3.5,dy:1,b:2,gb:1},
  {k:'finish',l:7,w:7,g:3}
 ]},
 {name:'Moving Day',target:70,pal:PAL[1],nodes:[
  {k:'start',l:6,w:6},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'plat',l:5,w:4,g:3.5,dy:1,b:1},
  {k:'move',l:4,w:4,g:2.5,amp:3.5,per:5.5},
  {k:'check',l:5,w:5,g:2.5},
  {k:'plat',l:5,w:5,g:3.5,t:'R',dy:1,b:2},
  {k:'plat',l:4,w:4,g:4,dy:-1,gb:1,b:1},
  {k:'bounce',l:3.5,w:3.5,g:3,v:24,t:'L'},
  {k:'plat',l:5,w:5,g:3,dy:4,b:2},
  {k:'plat',l:4,w:4,g:3.5,b:1},
  {k:'move',l:4,w:4,g:2.5,amp:4,per:6,t:'R'},
  {k:'plat',l:5,w:5,g:2.5,b:2},
  {k:'check',l:5,w:5,g:3.5,dy:-1},
  {k:'plat',l:4,w:4,g:3.5,t:'L',dy:1,b:1},
  {k:'bounce',l:3.5,w:3.5,g:3,v:24},
  {k:'plat',l:4,w:4,g:3,dy:5,b:2},
  {k:'move',l:4,w:4,g:3,amp:1.5,per:4,mode:'up'},
  {k:'plat',l:4,w:4,g:3,b:1},
  {k:'plat',l:5,w:5,g:3.5,t:'R',dy:-1,b:2,gb:1},
  {k:'move',l:4,w:4,g:3,amp:4.5,per:6.5},
  {k:'plat',l:5,w:5,g:3,dy:1,b:2},
  {k:'finish',l:7,w:7,g:3.5}
 ]},
 {name:'Vanishing Act',target:90,pal:PAL[2],nodes:[
  {k:'start',l:6,w:6},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'beam',l:9,w:1.5,g:3,b:3},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'tile',l:3.4,w:3.4,g:2.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,t:'R',b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'check',l:5,w:5,g:3,t:'L'},
  {k:'beam',l:10,w:1.5,g:3,dy:1,b:3},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,t:'R',dy:0.5},
  {k:'tile',l:3.4,w:3.4,g:3,dy:0.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,t:'L',dy:0.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'plat',l:4,w:4,g:3,dy:-1,b:1},
  {k:'beam',l:8,w:1.5,g:3,b:2},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'check',l:5,w:5,g:3,t:'R'},
  {k:'tile',l:3.4,w:3.4,g:2.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,dy:1,b:1},
  {k:'tile',l:3.4,w:3.4,g:3.5,t:'L',b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'beam',l:11,w:1.5,g:3,dy:1,b:3},
  {k:'plat',l:4,w:4,g:3,b:1},
  {k:'beam',l:9,w:1.5,g:3,dy:-0.5,b:2},
  {k:'finish',l:7,w:7,g:3}
 ]},
 {name:'Sweep Street',target:110,pal:PAL[3],nodes:[
  {k:'start',l:6,w:6},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'plat',l:14,w:5,g:3,b:3,bar:{at:7,amp:3.5,per:3.8}},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'check',l:5,w:5,g:3},
  {k:'plat',l:5,w:5,g:3.5,t:'R',dy:1,b:1},
  {k:'plat',l:14,w:5,g:3,b:2,lava:[{at:5,len:3}]},
  {k:'plat',l:4,w:4,g:3.5,dy:1,b:1},
  {k:'move',l:4,w:4,g:2.5,amp:3.5,per:5},
  {k:'plat',l:5,w:5,g:2.5,b:1},
  {k:'check',l:5,w:5,g:3,t:'L'},
  {k:'plat',l:12,w:5,g:3,b:2,lava:[{at:4,len:3.5}]},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'plat',l:13,w:13,g:3,t:'R',b:3,orb:{R:3.2,per:4.5}},
  {k:'plat',l:5,w:5,g:3.5,b:1},
  {k:'check',l:5,w:5,g:3},
  {k:'plat',l:5,w:5,g:3,t:'L',dy:1,b:1},
  {k:'plat',l:19,w:5,g:3,b:3,lava:[{at:3,len:3}],bar:{at:14,amp:3,per:3.6}},
  {k:'plat',l:5,w:5,g:3.5,b:1},
  {k:'move',l:4,w:4,g:2.5,amp:4,per:5.5},
  {k:'plat',l:5,w:5,g:2.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,t:'R',b:1},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'plat',l:12,w:5,g:3,b:2,bar:{at:6,amp:3,per:3.4}},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'finish',l:7,w:7,g:3}
 ]},
 {name:'The Spire',target:140,pal:PAL[4],nodes:[
  {k:'start',l:6,w:6},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'stairs',n:6,w:4,g:0,b:3},
  {k:'plat',l:5,w:5,g:3,t:'R',b:1},
  {k:'plat',l:4,w:4,g:3.5,dy:1,b:1},
  {k:'bounce',l:3.5,w:3.5,g:3,v:24},
  {k:'plat',l:5,w:5,g:3,dy:4,b:2},
  {k:'check',l:5,w:5,g:3,t:'R'},
  {k:'move',l:4,w:4,g:2.5,amp:4,per:5.5},
  {k:'plat',l:5,w:5,g:2.5,b:1},
  {k:'beam',l:8,w:1.5,g:3,b:2},
  {k:'plat',l:5,w:5,g:3,dy:1,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,t:'R'},
  {k:'tile',l:3.4,w:3.4,g:3,dy:0.5,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,b:1},
  {k:'plat',l:5,w:5,g:3,b:2},
  {k:'check',l:5,w:5,g:3},
  {k:'stairs',n:8,w:4,g:0,t:'R',b:3},
  {k:'plat',l:14,w:5,g:3,b:2,lava:[{at:5,len:3}]},
  {k:'plat',l:5,w:5,g:3.5,b:1},
  {k:'bounce',l:3.5,w:3.5,g:3,v:26},
  {k:'plat',l:5,w:5,g:3,dy:6,b:2},
  {k:'move',l:4,w:4,g:3,amp:1.5,per:4.2,mode:'up'},
  {k:'plat',l:5,w:5,g:3,t:'R',b:1},
  {k:'plat',l:14,w:5,g:3,b:2,bar:{at:7,amp:3.5,per:3.6}},
  {k:'check',l:5,w:5,g:3},
  {k:'move',l:4,w:4,g:2.5,amp:4,per:5.5,t:'R'},
  {k:'plat',l:5,w:5,g:2.5,b:1},
  {k:'beam',l:9,w:1.5,g:3,dy:1,b:2},
  {k:'plat',l:5,w:5,g:3,dy:1,b:1},
  {k:'tile',l:3.4,w:3.4,g:2.5,t:'R'},
  {k:'tile',l:3.4,w:3.4,g:3,dy:1,b:1},
  {k:'tile',l:3.4,w:3.4,g:3,dy:1,b:1},
  {k:'plat',l:4,w:4,g:3,b:2},
  {k:'bounce',l:3.5,w:3.5,g:3,v:24},
  {k:'plat',l:5,w:5,g:3,dy:4,b:2},
  {k:'check',l:5,w:5,g:3},
  {k:'stairs',n:6,w:4,g:0,t:'R',b:3},
  {k:'plat',l:5,w:5,g:3,b:1},
  {k:'plat',l:19,w:5,g:3,b:2,lava:[{at:3,len:3}],bar:{at:14,amp:2.5,per:3.4}},
  {k:'plat',l:5,w:5,g:3.5,b:1},
  {k:'move',l:4,w:4,g:2.5,amp:4,per:5},
  {k:'plat',l:5,w:5,g:2.5,b:1},
  {k:'finish',l:7,w:7,g:3,dy:1}
 ]}
];

/* turn the node list into positions */
function layout(def){
  const nodes=[];let hi=0,prev=null;
  def.nodes.forEach((d,idx)=>{
    if(d.t==='R')hi=(hi+1)%4;else if(d.t==='L')hi=(hi+3)%4;
    const h=HD[hi],n=Object.assign({},d);n.idx=idx;n.hi=hi;n.h=h;n.run=2.2;
    if(n.k==='stairs'){n.rise=n.rise||1;n.l=n.n*n.run;}
    n.w=n.w||5;n.l=n.l||5;n.g=n.g||0;n.dy=n.dy||0;
    const ax=h[0]!==0;n.sx=ax?n.l:n.w;n.sz=ax?n.w:n.l;
    let rsx=n.sx,rsz=n.sz;
    if(n.k==='move'&&n.mode!=='up'){if(ax)rsx+=2*n.amp;else rsz+=2*n.amp;}
    n.rsx=rsx;n.rsz=rsz;n.mover=n.k==='move';
    const y0=prev?prev.y:0;
    if(n.k==='stairs'){n.y0=y0+n.dy;n.y=n.y0+n.n*n.rise;}else n.y=y0+n.dy;
    if(!prev){n.x=0;n.z=0;}
    else{
      const ep=Math.abs(h[0])*prev.rsx+Math.abs(h[1])*prev.rsz,en=Math.abs(h[0])*rsx+Math.abs(h[1])*rsz,d0=ep/2+n.g+en/2,s=n.s||0;
      n.x=prev.x+h[0]*d0-h[1]*s;n.z=prev.z+h[1]*d0+h[0]*s;
    }
    nodes.push(n);prev=n;
  });
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(const n of nodes){x0=Math.min(x0,n.x-n.rsx/2);x1=Math.max(x1,n.x+n.rsx/2);z0=Math.min(z0,n.z-n.rsz/2);z1=Math.max(z1,n.z+n.rsz/2);}
  const ox=(x0+x1)/2,oz=(z0+z1)/2;
  for(const n of nodes){n.x-=ox;n.z-=oz;}
  nodes.bounds={x0:x0-ox,x1:x1-ox,z0:z0-oz,z1:z1-oz};
  return nodes;
}

function moverAt(n,t){
  const s=Math.sin(t*6.2832/n.per+(n.ph||0))*n.amp;
  if(n.mode==='up')return{x:n.x,y:n.y+s,z:n.z};
  return{x:n.x+n.h[0]*s,y:n.y,z:n.z+n.h[1]*s};
}

const def={
  id:'skyline-sprint',name:'Skyline Sprint',tagline:'Run, jump and climb rooftop courses against the clock.',color:0x3d8bff,levels:1,
  howTo:[
    'Run and jump from rooftop to rooftop until you reach the glowing gold finish pad.',
    'If you fall or touch a hot bar or lava, you go back to your last checkpoint flag. Nothing is lost but time.',
    'Grab the yellow bolts on the way. Bounce pads launch you high, and glowing tiles disappear after you step on them.',
    'Two computer racers run the same course. You win by reaching the finish before time runs out.',
    'For three stars, beat the goal time and collect most of the bolts.'
  ],
  layout,LEVELS,
  create(E){
    const {V,clamp,angLerp}=VG.util,W=E.world,L=1,LV=LEVELS[Math.floor(Math.random()*LEVELS.length)],pal=LV.pal,THR=THREE;
    const nodes=layout(LV),N=nodes.length,fin=N-1;
    const p=E.player;
    let minTop=1e9;
    for(const n of nodes){const lo=n.k==='stairs'?n.y0:(n.mode==='up'?n.y-n.amp:n.y);n.lo=lo;minTop=Math.min(minTop,lo);}
    W.killY=minTop-14;
    E.setSky(0x2a1b6b,0xff9a62,0xe0728a,110,520);E.setLight(0.8,0.5,0xffd7a8);E.stars(300,0xffffff);
    E.cam.dist=11;E.cam.pitch=0.5;
    E.cam.yaw=Math.atan2(-nodes[1].h[0],-nodes[1].h[1]);
    try{E.hud.$.hp.style.display='none';E.hud.el.querySelector('.vg-fire').style.display='none';}catch(e){}

    /* ---------- the course ---------- */
    let M=0,got=0,falls=0,running=false,startT=3,over=false;
    const hazards=[],lavas=[],tiles=[],movers=[],cpFx={};
    const mkParts=(cx,top,cz,sx,sz,col,data,o)=>{o=o||{};
      const a=[W.addBox(cx,top-0.15,cz,sx,0.3,sz,col,{jitter:0,data,tag:'plat',glow:!!o.glow})];
      if(!o.bare){
        a.push(W.addBox(cx,top-0.36,cz,Math.max(0.3,sx-0.12),0.1,Math.max(0.3,sz-0.12),o.trim||pal.glow,{jitter:0,glow:true,solid:false}));
        a.push(W.addBox(cx,top-0.96,cz,Math.max(0.4,sx-0.6),1.3,Math.max(0.4,sz-0.6),o.base||pal.base,{jitter:0,solid:false}));
      }
      return a;};
    const dropBolt=(x,y,z)=>{M++;E.pickup({pos:V(x,y,z),color:0xffd23e,size:0.42,bots:false,onTake(c){if(c!==p)return false;got++;return true;}});};
    let platCount=0;
    nodes.forEach(n=>{
      const h=n.h,r=[-h[1],h[0]],data={node:n.idx};n.data=data;
      const col=(platCount++%2)?pal.b:pal.a;
      if(n.k==='start'){
        n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,pal.b,data,{trim:0xffffff});n.plate=n.parts[0];
        E.slab(n.x-h[0]*(n.l/2-0.7),n.y+0.04,n.z-h[1]*(n.l/2-0.7),h[0]?0.6:n.sx-1,0.06,h[0]?n.sz-1:0.6,0xffffff,1);
      }else if(n.k==='plat'||n.k==='beam'){
        const lo=n.lava;
        if(lo){
          let pos=0;const segs=[];
          lo.slice().sort((a,b)=>a.at-b.at).forEach(lv=>{segs.push([pos,lv.at,false]);segs.push([lv.at,lv.at+lv.len,true]);pos=lv.at+lv.len;});
          segs.push([pos,n.l,false]);
          segs.forEach(sg=>{
            const len=sg[1]-sg[0];if(len<0.05)return;
            const s=-n.l/2+sg[0]+len/2,cx=n.x+h[0]*s,cz=n.z+h[1]*s,sx=h[0]?len:n.w,sz=h[0]?n.w:len;
            if(sg[2]){const b=W.addBox(cx,n.y-0.15,cz,sx,0.3,sz,0xff6a1a,{jitter:0,glow:true,data:{node:n.idx,lava:true},tag:'lava'});lavas.push(b);
              W.addBox(cx,n.y-1.0,cz,sx-0.2,1.4,sz-0.2,0x7a1c0a,{jitter:0,solid:false});}
            else{const a=mkParts(cx,n.y,cz,sx,sz,col,data);if(!n.plate)n.plate=a[0];n.parts=(n.parts||[]).concat(a);}
          });
        }else{n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,col,data);n.plate=n.parts[0];}
        if(n.bar){
          const bar=n.bar,th=0.9,hl=n.w+0.1,y0=n.y+0.1,y1=n.y+1.3,s0=-n.l/2+bar.at;
          const bx=h[0]?th:hl,bz=h[0]?hl:th;
          const box=W.addBox(n.x+h[0]*s0,(y0+y1)/2,n.z+h[1]*s0,bx,y1-y0,bz,0xff3b5c,{jitter:0,glow:true,solid:false,tag:'bar'});
          const hz={box,hx:bx/2,hz:bz/2,y0,y1,at:t=>{const s=s0+Math.sin(t*6.2832/bar.per+(bar.ph||0))*bar.amp;return{x:n.x+h[0]*s,z:n.z+h[1]*s};}};
          hz.zone={minx:Math.min(n.x+h[0]*(s0-bar.amp),n.x+h[0]*(s0+bar.amp))-bx/2,maxx:Math.max(n.x+h[0]*(s0-bar.amp),n.x+h[0]*(s0+bar.amp))+bx/2,minz:Math.min(n.z+h[1]*(s0-bar.amp),n.z+h[1]*(s0+bar.amp))-bz/2,maxz:Math.max(n.z+h[1]*(s0-bar.amp),n.z+h[1]*(s0+bar.amp))+bz/2};
          hazards.push(hz);
        }
        if(n.orb){
          const o=n.orb,sz=1.6,y0=n.y+0.2,y1=y0+1.7;
          const box=W.addBox(n.x+o.R,(y0+y1)/2,n.z,sz,y1-y0,sz,0xff3b5c,{jitter:0,glow:true,solid:false,tag:'bar'});
          hazards.push({box,hx:sz/2,hz:sz/2,y0,y1,zone:{minx:n.x-o.R-sz/2,maxx:n.x+o.R+sz/2,minz:n.z-o.R-sz/2,maxz:n.z+o.R+sz/2},at:t=>{const a=t*6.2832/o.per+(o.ph||0);return{x:n.x+Math.cos(a)*o.R,z:n.z+Math.sin(a)*o.R};}});
          E.slab(n.x,n.y+0.05,n.z,o.R*2+2.4,0.05,o.R*2+2.4,0x3a1c52,0.5);
        }
      }else if(n.k==='stairs'){
        n.parts=[];
        for(let i=0;i<n.n;i++){
          const top=n.y0+(i+1)*n.rise,s=-n.l/2+(i+0.5)*n.run,cx=n.x+h[0]*s,cz=n.z+h[1]*s,sx=h[0]?n.run:n.w,sz=h[0]?n.w:n.run;
          const a=mkParts(cx,top,cz,sx,sz,i%2?pal.b:pal.a,data,{bare:true});n.parts.push(a[0]);
          W.addBox(cx,top-0.3-(top-n.y0+0.3)/2,cz,sx-0.1,top-n.y0+0.3,sz-0.1,pal.base,{jitter:0,solid:false});
        }
        n.plate=n.parts[0];
      }else if(n.k==='tile'){
        n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,pal.tile,data,{trim:0xffffff});n.plate=n.parts[0];
        const t={n,state:'idle',t:0,blink:0};tiles.push(t);n.tile=t;
      }else if(n.k==='move'){
        const mp=moverAt(n,0);
        n.parts=mkParts(mp.x,mp.y,mp.z,n.sx,n.sz,pal.mover,data,{trim:0xffffff});n.plate=n.parts[0];movers.push(n);
        // faint track so players can see where it travels
        if(n.mode==='up')E.slab(n.x,n.y,n.z,0.25,n.amp*2+0.3,0.25,pal.mover,0.35);
        else E.slab(n.x,n.y-0.7,n.z,h[0]?n.rsx-0.4:0.3,0.12,h[0]?0.3:n.rsz-0.4,pal.mover,0.4);
      }else if(n.k==='bounce'){
        const v=n.v||22;data.pad=v;
        n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,pal.pad,data,{glow:true,trim:0xffffff});n.plate=n.parts[0];
        E.slab(n.x,n.y+0.04,n.z,n.sx-1.4,0.06,n.sz-1.4,0xffffff,1);
      }else if(n.k==='check'){
        n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,0xbfefff,data,{glow:true,trim:0x6cf5ff});n.plate=n.parts[0];
        const fx=n.x+r[0]*(n.w/2-0.7)-h[0]*(n.l/2-0.7),fz=n.z+r[1]*(n.w/2-0.7)-h[1]*(n.l/2-0.7);
        W.addBox(fx,n.y+1.6,fz,0.22,3.2,0.22,0x2b2f55,{jitter:0,solid:false});
        const flag=W.addBox(fx+r[0]*0.0+h[0]*0.7,n.y+2.7,fz+h[1]*0.7,h[0]?1.4:0.1,0.9,h[0]?0.1:1.4,0x6cf5ff,{jitter:0,glow:true,solid:false});
        const pil=E.slab(fx,n.y+9,fz,0.5,18,0.5,0x7de8ff,0.22);
        cpFx[n.idx]={flag,pil};
      }else if(n.k==='finish'){
        n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,0xffd23e,data,{glow:true,trim:0xffffff});n.plate=n.parts[0];
        const cs=n.w/6;
        for(let i=0;i<6;i++)for(let j=0;j<6;j++)if((i+j)%2===0)E.slab(n.x-n.sx/2+(i+0.5)*(n.sx/6),n.y+0.04,n.z-n.sz/2+(j+0.5)*(n.sz/6),n.sx/6,0.06,n.sz/6,0xffffff,1);
        E.slab(n.x,n.y+22,n.z,1.0,44,1.0,0xffe27a,0.3);
        E.slab(n.x,n.y+3.5,n.z,n.sx*0.8,0.3,0.3,0xffe27a,0.9);
      }
      // bolts
      const bn=n.b||0;
      if(bn&&!n.mover){
        for(let i=0;i<bn;i++){
          const f=(i+0.5)/bn,s=-n.l/2+1+f*(n.l-2),side=(i%2?1:-1)*(n.w>=4&&n.k!=='finish'?0.9:0);
          let top=n.y;if(n.k==='stairs'){const si=Math.min(n.n-1,Math.floor((s+n.l/2)/n.run));top=n.y0+(si+1)*n.rise;}
          dropBolt(n.x+h[0]*s+r[0]*side,top+1.5,n.z+h[1]*s+r[1]*side);
        }
      }
      if(n.gb&&n.idx>0&&!n.mover){
        const pv=nodes[n.idx-1],ep=Math.abs(h[0])*pv.rsx+Math.abs(h[1])*pv.rsz,en=Math.abs(h[0])*n.rsx+Math.abs(h[1])*n.rsz;
        const a=ep/2,b=ep/2+n.g,mid=(a+b)/2;
        dropBolt(pv.x+h[0]*mid,Math.max(pv.y,n.y)+2.4,pv.z+h[1]*mid);
      }
    });
    const bolts=M,need=Math.ceil(bolts*0.7);

    /* ---------- skyline backdrop ---------- */
    (function city(){
      let seed=4242+L*131;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      const bd=nodes.bounds,top0=minTop-17,cols=[0x241f55,0x2c2566,0x372e7a,0x1c1e4a,0x33265c,0x3f3585],lit=[0xffd27a,0xffb347,0xff7ac8,0x7ad9ff,0xffe9a8],neon=[0xff5ad1,0x4fd1ff,0xffd23e,0x9dff4a];
      const cell=30,ext=120,gx0=Math.floor((bd.x0-ext)/cell),gx1=Math.ceil((bd.x1+ext)/cell),gz0=Math.floor((bd.z0-ext)/cell),gz1=Math.ceil((bd.z1+ext)/cell);
      for(let gx=gx0;gx<gx1;gx++)for(let gz=gz0;gz<gz1;gz++){
        const sx=9+rnd()*13,sz=9+rnd()*13,x=(gx+0.5)*cell+(rnd()-0.5)*(cell-sx-3),z=(gz+0.5)*cell+(rnd()-0.5)*(cell-sz-3);
        let clear=1e9;
        for(const n of nodes){const dx=Math.max(0,Math.abs(x-n.x)-n.rsx/2-sx/2),dz=Math.max(0,Math.abs(z-n.z)-n.rsz/2-sz/2);clear=Math.min(clear,Math.max(dx,dz));}
        const top=clear>70?top0+rnd()*(20+L*8):top0-2-rnd()*28;
        if(clear<3)continue;
        const base=-150,col=cols[(rnd()*cols.length)|0];
        W.addBox(x,(top+base)/2,z,sx,top-base,sz,col,{jitter:0,solid:false});
        const near=clear<95;
        if(near){
          const rows=Math.min(7,Math.floor((top-top0+40)/4));
          for(let rI=0;rI<rows;rI++){
            const y=top-2.2-rI*3.7;
            for(let f=0;f<4;f++){
              if(rnd()<0.42)continue;
              const c=lit[(rnd()*lit.length)|0],ax=f<2,len=(ax?sz:sx)*(0.3+rnd()*0.5),off=(rnd()-0.5)*((ax?sz:sx)-len-1),sg=f%2?1:-1;
              if(ax)W.addBox(x+sg*(sx/2+0.08),y,z+off,0.16,0.9,len,c,{jitter:0,glow:true,solid:false});
              else W.addBox(x+off,y,z+sg*(sz/2+0.08),len,0.9,0.16,c,{jitter:0,glow:true,solid:false});
            }
          }
          if(rnd()<0.4){const c=neon[(rnd()*neon.length)|0];
            W.addBox(x,top+0.15,z-sz/2+0.2,sx,0.3,0.4,c,{jitter:0,glow:true,solid:false});W.addBox(x,top+0.15,z+sz/2-0.2,sx,0.3,0.4,c,{jitter:0,glow:true,solid:false});
            W.addBox(x-sx/2+0.2,top+0.15,z,0.4,0.3,sz,c,{jitter:0,glow:true,solid:false});W.addBox(x+sx/2-0.2,top+0.15,z,0.4,0.3,sz,c,{jitter:0,glow:true,solid:false});}
        }
      }
      // low sun ahead of the first stretch
      const h0=nodes[1].h,sun=new THR.Mesh(new THR.SphereGeometry(42,24,16),new THR.MeshBasicMaterial({color:0xffc060,fog:false}));
      sun.position.set(h0[0]*430,70,h0[1]*430);E.add(sun);
      const halo=new THR.Mesh(new THR.SphereGeometry(78,20,14),new THR.MeshBasicMaterial({color:0xff7a5c,transparent:true,opacity:0.28,fog:false,depthWrite:false}));
      halo.position.copy(sun.position);E.add(halo);
    })();

    /* ---------- waypoints (one per piece, two for stairs) ---------- */
    const WP=[],WPfirst=[];
    nodes.forEach(n=>{
      WPfirst[n.idx]=WP.length;
      if(n.k==='stairs'){
        const s0=-n.l/2+n.run/2,s1=n.l/2-n.run/2;
        WP.push({x:n.x+n.h[0]*s0,z:n.z+n.h[1]*s0,y:n.y0+n.rise,node:n.idx});
        WP.push({x:n.x+n.h[0]*s1,z:n.z+n.h[1]*s1,y:n.y,node:n.idx});
      }else if(n.lava||n.bar||n.orb){
        const sl=[-n.l/2+1.8];
        if(n.lava){let e=0;for(const lv of n.lava)e=Math.max(e,lv.at+lv.len);sl.push(-n.l/2+(n.bar||n.orb?e+1.8:Math.max(e+1.6,(e+n.l)/2)));}
        if(n.bar||n.orb)sl.push(n.l/2-1.8);
        for(const s of sl)WP.push({x:n.x+n.h[0]*s,z:n.z+n.h[1]*s,y:n.y,node:n.idx});
      }else WP.push({x:n.x,z:n.z,y:n.y,node:n.idx});
    });
    const rectOf=n=>{if(n.mover){const b=n.plate;return{minx:b.minx,maxx:b.maxx,minz:b.minz,maxz:b.maxz};}
      return{minx:n.x-n.sx/2,maxx:n.x+n.sx/2,minz:n.z-n.sz/2,maxz:n.z+n.sz/2};};

    /* ---------- racers ---------- */
    const h1=nodes[1].h,r1=[-h1[1],h1[0]],st0=nodes[0];
    const place=(c,lat,back)=>{c.teleport(st0.x+r1[0]*lat-h1[0]*back,st0.y+0.05,st0.z+r1[1]*lat-h1[1]*back);c.yaw=Math.atan2(h1[0],h1[1]);};
    place(p,0,0.5);
    const drv=()=>({i:1,go:false,jc:0,land:null,wait:0,fin:false,delay:0});
    const auto=drv();
    const racers=[
      {c:E.spawn({name:'Turbo',color:0xff8a3c,bot:true}),mul:0.82,s:drv(),said:false},
      {c:E.spawn({name:'Pixel',color:0xc9ff4a,bot:true}),mul:0.72,s:drv(),said:false}
    ];
    racers[0].s.delay=0.15;racers[1].s.delay=0.45;
    place(racers[0].c,-2.2,1.5);place(racers[1].c,2.2,1.5);
    for(const c of E.chars){c.data.cp=0;c.data.reach=0;c.data.cur=0;c.canDmg=false;}
    for(const rc of racers){rc.c.brain.manual=true;rc.c.brain.goal=null;}
    E.cam.look.set(p.pos.x,p.pos.y+2.5,p.pos.z);
    E.frozen=true;

    /* ---------- the follower: same code for the autopilot and the two racers ---------- */
    const flightTime=(c,ay)=>{const vy=c.vel.y,disc=vy*vy-84*(ay-c.pos.y);if(disc<0)return 0.4;return Math.max(0.06,(vy+Math.sqrt(disc))/42);};
    /* is it safe to run (or jump) from here past the sweepers? looks a little into the future */
    function simSafe(c,dx,dz,sp,jump,far,mg){
      const v0=Math.hypot(c.vel.x,c.vel.z),Dl=5.2,TA=0.762;
      for(let tau=0.05;tau<=3;tau+=0.05){
        let dist,feet=c.pos.y;
        if(!jump)dist=sp*tau-(sp-v0)*(1-Math.exp(-14*tau))/14;
        else if(tau<TA){dist=Dl*tau/TA-(Dl/TA-v0)*(1-Math.exp(-12*tau))/12;feet=c.pos.y+16*tau-21*tau*tau;}
        else dist=Dl+sp*(tau-TA);
        const px=c.pos.x+dx*dist,pz=c.pos.z+dz*dist;
        for(const hz of hazards){const hp=hz.at(E.time+tau);
          if(Math.abs(px-hp.x)<hz.hx+mg&&Math.abs(pz-hp.z)<hz.hz+mg&&feet<hz.y1+0.4&&feet+2.2>hz.y0)return false;}
        if(dist>far)break;
      }
      return true;
    }
    function planHazard(c,s,dx,dz,sp){
      for(const hz of hazards){
        const z=hz.zone,m=1.0;
        if(c.pos.x<z.minx-14||c.pos.x>z.maxx+14||c.pos.z<z.minz-14||c.pos.z>z.maxz+14)continue;
        const inside=(x,zz)=>x>z.minx-m&&x<z.maxx+m&&zz>z.minz-m&&zz<z.maxz+m;
        if(c.pos.x>z.minx&&c.pos.x<z.maxx&&c.pos.z>z.minz&&c.pos.z<z.maxz)continue;
        let tin=-1,tout=0;
        for(let t=0.25;t<=30;t+=0.25){if(inside(c.pos.x+dx*t,c.pos.z+dz*t)){if(tin<0)tin=t;tout=t;}else if(tin>=0&&t>tout+1)break;}
        if(tin<0||tin>3.4)continue;
        if(Math.abs(c.pos.y-hz.y0)>3)continue;
        if(s.hwait>12)return null;
        const mg=s.hwait>0?1.5:1.0;
        if(simSafe(c,dx,dz,sp,false,tout+1.2,mg))return{act:'run'};
        if(tin<=2.6&&simSafe(c,dx,dz,sp,true,tout+1.2,mg))return{act:'jump',land:{x:c.pos.x+dx*5.2,z:c.pos.z+dz*5.2,y:c.pos.y}};
        return{act:'wait'};
      }
      return null;
    }
    function drive(c,s,dt,mul){
      if(!c.alive||s.fin)return;
      if(!running||(c===p&&E.frozen)){c.vel.x*=0.8;c.vel.z*=0.8;return;}
      if(s.delay>0){s.delay-=dt;c.vel.x*=0.8;c.vel.z*=0.8;return;}
      s.jc-=dt;
      const wp=WP[s.i];if(!wp){s.fin=true;return;}
      const n=nodes[wp.node],pw=WP[s.i-1],pn=nodes[pw.node],sp=c.speed*mul,air=Math.max(sp,c.speed*0.95);
      let tx=wp.x,tz=wp.z,ty=wp.y,tm=null;
      if(n.mover){tm=moverAt(n,E.time);tx=tm.x;tz=tm.z;ty=tm.y;}
      /* arrival */
      if(c.onGround){
        s.land=null;
        const dd=Math.hypot(tx-c.pos.x,tz-c.pos.z);
        const gd=c.ground&&c.ground.data?c.ground.data:null;
        let arrived=false;
        if(n.mover||n.k==='bounce')arrived=!!gd&&gd.node===wp.node;
        else arrived=dd<1.3&&Math.abs(c.pos.y-ty)<1.7;
        if(arrived){
          if(s.i>=WP.length-1){s.fin=true;c.vel.x=c.vel.z=0;return;}
          s.i++;s.go=false;s.wait=0;
          if(n.k!=='bounce')return;
          return;
        }
      }
      /* waiting for a moving platform */
      if(pw.node!==wp.node&&(n.mover||pn.mover)&&!s.go&&c.onGround){
        s.wait+=dt;
        const tr=n.mover?rectOf(n):{minx:wp.x-n.sx/2,maxx:wp.x+n.sx/2,minz:wp.z-n.sz/2,maxz:wp.z+n.sz/2},pr=rectOf(pn);
        const dE=Math.hypot(Math.max(tr.minx-c.pos.x,0,c.pos.x-tr.maxx),Math.max(tr.minz-c.pos.z,0,c.pos.z-tr.maxz));
        if((dE<=3.8&&ty-c.pos.y<=1.8)||s.wait>16)s.go=true;
        else{
          const sx=clamp(tx,pr.minx+0.6,pr.maxx-0.6),sz=clamp(tz,pr.minz+0.6,pr.maxz-0.6),d=Math.hypot(sx-c.pos.x,sz-c.pos.z),v=d>0.2?Math.min(sp,d*5):0,k=Math.min(1,12*dt);
          c.vel.x+=((d>0.01?(sx-c.pos.x)/d:0)*v-c.vel.x)*k;c.vel.z+=((d>0.01?(sz-c.pos.z)/d:0)*v-c.vel.z)*k;
          const fy=Math.atan2(tx-c.pos.x,tz-c.pos.z);c.yaw=angLerp(c.yaw,fy,Math.min(1,10*dt));
          return;
        }
      }
      if(!c.onGround){
        /* in the air: aim the landing */
        let ax=tx,az=tz,ay=ty;
        if(s.land){ax=s.land.x;az=s.land.z;ay=s.land.y;}
        else if(tm){for(let q=0;q<2;q++){const tt=flightTime(c,ay),mp=moverAt(n,E.time+tt);ax=mp.x;az=mp.z;ay=mp.y;}}
        const D=Math.hypot(ax-c.pos.x,az-c.pos.z),vh=Math.min(air,D/flightTime(c,ay)),k=Math.min(1,12*dt);
        const ux=D>0.01?(ax-c.pos.x)/D:0,uz=D>0.01?(az-c.pos.z)/D:0;
        c.vel.x+=(ux*vh-c.vel.x)*k;c.vel.z+=(uz*vh-c.vel.z)*k;
        if(vh>1)c.yaw=angLerp(c.yaw,Math.atan2(ux,uz),Math.min(1,10*dt));
        return;
      }
      /* on the ground: run toward the target */
      const d=Math.hypot(tx-c.pos.x,tz-c.pos.z),dx=d>0.01?(tx-c.pos.x)/d:0,dz=d>0.01?(tz-c.pos.z)/d:0,k=Math.min(1,14*dt);
      if(d>0.05)c.yaw=angLerp(c.yaw,Math.atan2(dx,dz),Math.min(1,12*dt));
      const hp=hazards.length?planHazard(c,s,dx,dz,sp):null;
      if(hp&&hp.act==='wait'){s.hwait=(s.hwait||0)+dt;c.vel.x*=0.4;c.vel.z*=0.4;return;}
      if(!hp||hp.act==='run')s.hwait=0;
      c.vel.x+=(dx*sp-c.vel.x)*k;c.vel.z+=(dz*sp-c.vel.z)*k;
      if(s.jc<=0){
        let jump=false,land=null;
        if(hp&&hp.act==='jump'){jump=true;land=hp.land;}
        const ax=c.pos.x+dx*0.95,az=c.pos.z+dz*0.95;
        if(W.groundY(ax,az,c.pos.y+1.2)<c.pos.y-1.4)jump=true;
        if(!jump){
          for(const lv of lavas){
            if(ax>lv.minx&&ax<lv.maxx&&az>lv.minz&&az<lv.maxz&&Math.abs(c.pos.y-lv.maxy)<1.5){
              let px=ax,pz=az;for(let q=0;q<60;q++){px+=dx*0.25;pz+=dz*0.25;if(!(px>lv.minx&&px<lv.maxx&&pz>lv.minz&&pz<lv.maxz))break;}
              jump=true;land={x:px+dx*2.6,z:pz+dz*2.6,y:lv.maxy};break;
            }
          }
        }
        if(!jump&&!hp){
          outer:for(const hz of hazards){
            if(Math.abs(hz.box.x-c.pos.x)>14||Math.abs(hz.box.z-c.pos.z)>14)continue;
            for(let q=1;q<=5;q++){
              const tau=q*0.1,hp=hz.at(E.time+tau),px=c.pos.x+dx*sp*tau,pz=c.pos.z+dz*sp*tau;
              if(Math.abs(px-hp.x)<hz.hx+0.95&&Math.abs(pz-hp.z)<hz.hz+0.95&&c.pos.y<hz.y1&&c.pos.y+2.2>hz.y0){jump=true;land={x:c.pos.x+dx*5.2,z:c.pos.z+dz*5.2,y:c.pos.y};break outer;}
            }
          }
        }
        if(jump){c.vel.y=c.jumpV;c.onGround=false;s.jc=0.35;s.land=land;if(c===p)E.sfx('jump');}
      }
    }

    /* ---------- falling, respawning and bookkeeping ---------- */
    function sendBack(c,s){
      const k=c.data.cp,n=nodes[k];
      E.respawn(c,n.x,n.y+0.4,n.z,1.6);c.vel.set(0,0,0);c.data.cur=k;
      const nx=nodes[Math.min(N-1,k+1)];c.yaw=Math.atan2(nx.h[0],nx.h[1]);
      if(s){s.i=WPfirst[Math.min(N-1,k+1)];s.go=false;s.land=null;s.wait=0;s.fin=false;}
    }
    const stateOf=c=>c===p?auto:(racers.find(r=>r.c===c)||{}).s;
    function hurt(c){if(!c.alive||c.invuln>0||over)return;E.kill(c,null);}
    function pct(c){if(c.data.done)return 100;return Math.min(99,Math.round(c.data.reach/(N-1)*100));}
    function tlim(){return LV.target*3;}
    const fmt1=t=>{const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(1);};
    function finishWin(){
      over=true;const t=Math.max(0,E.time-startT);
      const stars=(t<=LV.target&&got>=need)?3:(t<=LV.target*1.5?2:1);
      E.finish({win:true,stars,title:stars===3?'Gold run!':stars===2?'Nice run!':'You made it!',
        lines:['Time '+fmt1(t)+'. Falls '+falls+'. Bolts '+got+' / '+bolts+'.',
          stars===3?'You beat the goal time and grabbed most of the bolts.':'For 3 stars: finish in '+E.fmt(LV.target)+' or less and collect at least '+need+' of the '+bolts+' bolts.']});
    }
    function finishLose(){
      over=true;
      E.finish({win:false,title:'Time is up!',lines:['You ran out of time at '+E.fmt(tlim())+', '+pct(p)+'% of the way along.','Falls '+falls+'. Bolts '+got+' / '+bolts+'. Try again and keep moving!']});
    }

    const lastYaw={v:E.cam.yaw,userT:-9};
    let hudT=0,pulse=0,pulseOn=false,cd=-1;

    function updateMovers(){
      const t=E.time;
      for(const n of movers){
        const mp=moverAt(n,t),b=n.plate,dx=mp.x-b.x,dy=(mp.y-0.15)-b.y,dz=mp.z-b.z;
        W.moveBox(b,b.x+dx,b.y+dy,b.z+dz);
        for(let i=1;i<n.parts.length;i++){const q=n.parts[i];W.moveBox(q,q.x+dx,q.y+dy,q.z+dz);}
      }
      for(const hz of hazards){const q=hz.at(t);W.moveBox(hz.box,q.x,hz.box.y,q.z);}
    }
    function updateTiles(dt){
      for(const T of tiles){
        const n=T.n;
        if(T.state==='idle'){
          for(const c of E.chars)if(c.alive&&c.onGround&&c.ground===n.plate){T.state='armed';T.t=0;T.blink=0;W.setColor(n.plate,0xffd9a0);break;}
        }else if(T.state==='armed'){
          T.t+=dt;
          if(T.t>1.0){T.blink+=dt;const on=Math.floor(T.blink/0.07)%2===0;W.setColor(n.plate,on?0xffffff:0xff9a5c);}
          if(T.t>=1.5){
            E.fx.burst(V(n.x,n.y,n.z),[pal.tile,0xffffff],10,6,0.3);
            for(const b of n.parts)W.removeBox(b);
            T.state='gone';T.t=0;
          }
        }else if(T.state==='gone'){
          T.t+=dt;
          if(T.t>=3){
            n.parts=mkParts(n.x,n.y,n.z,n.sx,n.sz,pal.tile,n.data,{trim:0xffffff});n.plate=n.parts[0];T.state='idle';
          }
        }
      }
    }

    return {
      canDamage(){return false;},
      onDeath(c,by){
        if(c===p){falls++;if(!over)E.announce('Oops! Back to your checkpoint.',1.3);}
        if(over)return;
        E.after(c===p?0.9:1.5,()=>{if(over||c.alive)return;sendBack(c,stateOf(c));});
      },
      update(dt){
        const t=E.time;
        /* countdown */
        if(!running){
          const left=startT-t;
          const num=left>2?3:left>1?2:left>0?1:0;
          if(num!==cd){cd=num;if(num>0){E.announce(String(num),0.95);E.sfx('tick');}}
          E.status(LV.name+'  -  Get ready!');
          if(t>=startT){running=true;E.frozen=false;E.announce('Go!',1.0);E.sfx('pickup');}
        }
        updateMovers();updateTiles(dt);
        pulse+=dt;if(pulse>0.25){pulse=0;pulseOn=!pulseOn;for(const b of lavas)W.setColor(b,pulseOn?0xffa31a:0xff5a14);}
        /* drive the computer racers */
        for(const rc of racers)drive(rc.c,rc.s,dt,rc.mul);
        /* everyone: bounce pads, hazards, checkpoints, progress */
        for(const c of E.chars){
          if(!c.alive)continue;
          const d=c.data;
          if(c.onGround&&c.ground&&c.ground.data){
            const gd=c.ground.data;
            if(gd.node!=null){
              d.cur=gd.node;if(gd.node>d.reach)d.reach=gd.node;
              const nn=nodes[gd.node];
              if(nn.k==='check'&&gd.node>d.cp){d.cp=gd.node;
                if(c===p){E.announce('Checkpoint!',1.4);E.sfx('pickup');}
                const fxo=cpFx[gd.node];if(fxo&&c===p){W.setColor(nn.plate,0x9dffb0);W.setColor(fxo.flag,0x9dff6a);fxo.pil.material.color.set(0x9dff6a);}}
              if(nn.k==='finish'&&!d.done){
                d.done=true;
                if(c===p&&!over)finishWin();
                else if(c!==p&&!over)E.announce(c.name+' finished!',1.8);
              }
            }
            if(gd.pad&&c.vel.y<=0.5){c.vel.y=gd.pad;c.onGround=false;E.fx.burst(c.pos,[0xffffff,pal.pad],8,6,0.25);if(c===p)E.sfx('bounce');}
            if(gd.lava)hurt(c);
          }
          if(c.alive&&c.invuln<=0&&!over){
            for(const hz of hazards){
              if(Math.abs(c.pos.x-hz.box.x)<hz.hx+0.45&&Math.abs(c.pos.z-hz.box.z)<hz.hz+0.45&&c.pos.y<hz.y1&&c.pos.y+2.2>hz.y0){hurt(c);break;}
            }
          }
          /* quick falls: out when well below the pieces nearby */
          if(c.alive&&!over){
            let lo=nodes[d.cp].lo;
            for(let j=Math.max(0,d.cur-3);j<=Math.min(N-1,d.cur+8);j++)if(nodes[j].lo<lo)lo=nodes[j].lo;
            if(c.pos.y<lo-11)E.kill(c,null);
          }
        }
        /* camera: gently turn to face the next stretch when the player is not steering it */
        const cm=E.cam;
        if(Math.abs(cm.yaw-lastYaw.v)>1e-5)lastYaw.userT=t;
        if(!over&&p.alive&&t-lastYaw.userT>1.8&&t>startT-1){
          const nx=nodes[Math.min(N-1,p.data.reach+1)];
          cm.yaw=angLerp(cm.yaw,Math.atan2(-nx.h[0],-nx.h[1]),Math.min(1,1.3*dt));
        }
        lastYaw.v=cm.yaw;
        /* clock, hud */
        const el=running?t-startT:0;
        if(running){
          E.status(LV.name+'  -  Time '+E.fmt(el)+'  (goal '+E.fmt(LV.target)+')  -  Falls '+falls);
          if(!over&&el>=tlim())finishLose();
        }
        hudT+=dt;
        if(hudT>0.2){hudT=0;
          E.score([
            {label:'Bolts',value:got+' / '+bolts,color:0xffd23e,me:true},
            {label:'Falls',value:falls,color:0xff6a6a},
            {label:'You',value:pct(p)+'%',color:0x3d8bff,me:true},
            {label:racers[0].c.name,value:pct(racers[0].c)+'%',color:0xff8a3c},
            {label:racers[1].c.name,value:pct(racers[1].c)+'%',color:0xc9ff4a}]);
        }
      },
      autopilot(dt){drive(p,auto,dt,1);},
      dispose(){}
    };
  }
};
VG.register(def);
})();
