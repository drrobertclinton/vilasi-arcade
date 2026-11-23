/* Vilasi Blocks: an open block world. Break blocks, place blocks, build anything. All textures are drawn here by code. */
(function(){
const T=THREE;
const WX=128,WZ=128,WY=48,SEA=15,CH=16;
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let q=Math.imul(a^a>>>15,1|a);q=q+Math.imul(q^q>>>7,61|q)^q;return((q^q>>>14)>>>0)/4294967296;};

/* ---------------------------------------------------------------- blocks */
const AIR=0,GRASS=1,DIRT=2,STONE=3,COBBLE=4,SAND=5,LOG=6,PLANK=7,LEAF=8,GLASS=9,WATER=10,BRICK=11,GRAVEL=12,SNOW=13,COAL=14,GOLD=15,BASE=16,LAMP=17,TILE=26;
/* name, [top,side,bottom] tile names, particle colour */
const B=[];
function def(id,name,tiles,col,o){B[id]=Object.assign({id,name,tiles,col},o||{});}
def(GRASS,'Grass',['grass','grass_side','dirt'],0x58b45a);
def(DIRT,'Dirt',['dirt','dirt','dirt'],0x8a5f3c);
def(STONE,'Stone',['stone','stone','stone'],0x8c909c);
def(COBBLE,'Cobble',['cobble','cobble','cobble'],0x7d8290);
def(SAND,'Sand',['sand','sand','sand'],0xe6d49a);
def(LOG,'Log',['log_top','log','log_top'],0x7a5632);
def(PLANK,'Planks',['plank','plank','plank'],0xc79a58);
def(LEAF,'Leaves',['leaf','leaf','leaf'],0x3f9a4c);
def(GLASS,'Glass',['glass','glass','glass'],0xcfefff,{clear:true});
def(WATER,'Water',['water','water','water'],0x3a8fe0,{clear:true,fluid:true,hidden:true});
def(BRICK,'Brick',['brick','brick','brick'],0xb8553f);
def(GRAVEL,'Gravel',['gravel','gravel','gravel'],0x9a948c);
def(SNOW,'Snow',['snow','snow','snow'],0xf4f8ff);
def(COAL,'Coal rock',['coal','coal','coal'],0x4a4d57);
def(GOLD,'Gold rock',['gold','gold','gold'],0xe9c145);
def(BASE,'Base rock',['base','base','base'],0x2d2f3a,{hidden:true,fixed:true});
def(LAMP,'Lamp',['lamp','lamp','lamp'],0xffe58a,{bright:true});
const COLS=[['Red',0xe0483e],['Orange',0xf08a2c],['Yellow',0xf4d03a],['Green',0x4fb85a],['Blue',0x3f7fe0],['Purple',0x9a5fd6],['White',0xf2f2f2],['Black',0x2a2c33]];
COLS.forEach((c,i)=>def(18+i,c[0],['c'+i,'c'+i,'c'+i],c[1]));
def(TILE,'Tile',['tile','tile','tile'],0xd8dce6);
const EGG=40,PEGG=41;def(EGG,'Cow egg',['egg','egg','egg'],0xf4efe6,{item:true});def(PEGG,'Pig egg',['egg2','egg2','egg2'],0xf2a0b5,{item:true});
const PLACE=[GRASS,DIRT,STONE,COBBLE,SAND,LOG,PLANK,LEAF,GLASS,BRICK,GRAVEL,SNOW,COAL,GOLD,LAMP,TILE,18,19,20,21,22,23,24,25,EGG,PEGG];
const HOT0=[GRASS,DIRT,STONE,PLANK,LOG,BRICK,GLASS,EGG,PEGG];

/* ---------------------------------------------------------------- textures (every pixel is made here) */
const TS=16,AC=8,AR=5,TILES={};let atlasCanvas=null,atlasURL='';
function buildAtlas(){
  if(atlasCanvas)return;
  const cv=atlasCanvas=document.createElement('canvas');cv.width=AC*TS;cv.height=AR*TS;const g=cv.getContext('2d');let n=0;
  const hx=c=>[(c>>16)&255,(c>>8)&255,c&255];
  function tile(name,fn){const r=mul(n*7919+13),im=g.createImageData(TS,TS),d=im.data;
    const set=(x,y,c,a)=>{if(x<0||y<0||x>=TS||y>=TS)return;const i=(y*TS+x)*4;d[i]=Math.max(0,Math.min(255,c[0]));d[i+1]=Math.max(0,Math.min(255,c[1]));d[i+2]=Math.max(0,Math.min(255,c[2]));d[i+3]=a==null?255:a;};
    const sh=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
    fn({r,set,sh,noise(c,v){for(let y=0;y<TS;y++)for(let x=0;x<TS;x++)set(x,y,sh(hx(c),1-v/2+r()*v));},hx});
    g.putImageData(im,(n%AC)*TS,Math.floor(n/AC)*TS);TILES[name]=n++;}
  tile('grass',t=>{t.noise(0x58b45a,0.15);for(let i=0;i<10;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0x7fd06a));});
  tile('dirt',t=>{t.noise(0x8a5f3c,0.26);for(let i=0;i<10;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0x6a4628));});
  tile('grass_side',t=>{t.noise(0x8a5f3c,0.26);for(let x=0;x<16;x++){const h=3+((t.r()*3)|0);for(let y=0;y<h;y++)t.set(x,y,t.sh(t.hx(0x58b45a),0.85+t.r()*0.3));}});
  tile('stone',t=>{t.noise(0x8c909c,0.16);for(let i=0;i<5;i++){const x=(t.r()*13)|0,y=(t.r()*14)|0,w=2+((t.r()*3)|0);for(let k=0;k<w;k++)t.set(x+k,y,t.hx(0x70747f));}});
  tile('cobble',t=>{t.noise(0x7d8290,0.2);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const cx=(x+((y>>2)&1)*2)%5,cy=y%4;if(cx===0||cy===0)t.set(x,y,t.sh(t.hx(0x4f535e),0.9+t.r()*0.2));}});
  tile('sand',t=>{t.noise(0xe6d49a,0.14);for(let i=0;i<8;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0xcdb877));});
  tile('log',t=>{for(let x=0;x<16;x++){const k=0.8+t.r()*0.35;for(let y=0;y<16;y++)t.set(x,y,t.sh(t.hx(0x7a5632),k*(0.94+t.r()*0.12)));}});
  tile('log_top',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));t.set(x,y,d>7?t.hx(0x6a4a2a):t.sh(t.hx(0xc9a06a),(Math.floor(d)%2?0.84:1)*(0.95+t.r()*0.1)));}});
  tile('plank',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const row=y>>2,edge=(y%4)===3||((x+row*5)%16)===0;t.set(x,y,t.sh(t.hx(0xc79a58),edge?0.7:0.92+t.r()*0.14));}});
  tile('leaf',t=>{t.noise(0x3f9a4c,0.22);for(let i=0;i<22;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0x2a7238));for(let i=0;i<8;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0x74cc6c));});
  tile('glass',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=x===0||y===0||x===15||y===15;t.set(x,y,e?t.hx(0xe8f8ff):t.hx(0xbfe6ff),e?235:46);}for(let k=0;k<4;k++){t.set(3+k,6-k,t.hx(0xffffff),200);t.set(9+k,12-k,t.hx(0xffffff),150);}});
  tile('water',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)t.set(x,y,t.sh(t.hx(0x3a8fe0),0.9+t.r()*0.2),170);for(let i=0;i<5;i++){const x=(t.r()*12)|0,y=(t.r()*16)|0;for(let k=0;k<4;k++)t.set(x+k,y,t.hx(0x8cc8ff),190);}});
  tile('brick',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const row=y>>2,m=(y%4)===3||((x+(row%2)*4)%8)===7;t.set(x,y,m?t.hx(0xd9cfc0):t.sh(t.hx(0xb8553f),0.88+t.r()*0.2));}});
  tile('gravel',t=>{t.noise(0x9a948c,0.34);for(let i=0;i<16;i++){const x=(t.r()*15)|0,y=(t.r()*15)|0,c=t.r()<0.5?0x6f6a64:0xbdb7ad;t.set(x,y,t.hx(c));t.set(x+1,y,t.hx(c));}});
  tile('snow',t=>{t.noise(0xf4f8ff,0.06);for(let i=0;i<8;i++)t.set((t.r()*16)|0,(t.r()*16)|0,t.hx(0xdce8f8));});
  const ore=(c,c2)=>t=>{t.noise(0x8c909c,0.16);for(let i=0;i<6;i++){const x=1+((t.r()*12)|0),y=1+((t.r()*12)|0);t.set(x,y,t.hx(c));t.set(x+1,y,t.hx(c));t.set(x,y+1,t.hx(c));t.set(x+1,y+1,t.hx(c2));}};
  tile('coal',ore(0x23252c,0x3a3d47));tile('gold',ore(0xf2c230,0xfff0a0));
  tile('base',t=>{t.noise(0x2d2f3a,0.5);});
  tile('lamp',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=x===0||y===0||x===15||y===15,d=Math.hypot(x-7.5,y-7.5);t.set(x,y,e?t.hx(0x8a6a2a):t.sh(t.hx(0xffe58a),1.12-d*0.035));}});
  COLS.forEach((c,i)=>tile('c'+i,t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)t.set(x,y,t.sh(t.hx(c[1]),((x+y)%2?0.94:1)*(0.96+t.r()*0.08)));}));
  tile('tile',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=x===0||y===0||x===8||y===8;t.set(x,y,t.sh(t.hx(0xd8dce6),e?0.78:0.96+t.r()*0.06));}});
  tile('egg',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const dx=(x-7.5)/5.2,dy=(y-8.5)/(y<8.5?6.8:5.6),in_=dx*dx+dy*dy<1;
      t.set(x,y,in_?t.sh(t.hx(0xf4efe6),1.03-(dx*0.1+dy*0.08)):t.hx(0x24284a),in_?255:255);}
    for(const q of [[5,6],[9,5],[10,9],[6,11],[8,8]]){t.set(q[0],q[1],t.hx(0x5a3d2b));t.set(q[0]+1,q[1],t.hx(0x5a3d2b));t.set(q[0],q[1]+1,t.hx(0x5a3d2b));}});
  tile('egg2',t=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const dx=(x-7.5)/5.2,dy=(y-8.5)/(y<8.5?6.8:5.6),in_=dx*dx+dy*dy<1;
      t.set(x,y,in_?t.sh(t.hx(0xf7b6c8),1.05-(dx*0.12+dy*0.1)):t.hx(0x24284a));}
    for(const q of [[5,6],[9,5],[10,9],[6,11],[8,8]]){t.set(q[0],q[1],t.hx(0xd9668c));t.set(q[0]+1,q[1],t.hx(0xd9668c));t.set(q[0],q[1]+1,t.hx(0xd9668c));}});
  atlasURL=cv.toDataURL();
}
function swatch(el,id,px){const n=TILES[B[id].tiles[1]],k=px/TS;el.style.backgroundImage='url('+atlasURL+')';el.style.backgroundSize=(AC*TS*k)+'px '+(AR*TS*k)+'px';el.style.backgroundPosition=(-(n%AC)*px)+'px '+(-Math.floor(n/AC)*px)+'px';el.style.imageRendering='pixelated';}

const CSS='.vb-ui{position:absolute;right:12px;top:118px;display:flex;flex-direction:column;gap:8px;z-index:6}'+
'.vb-ui button{min-width:76px;height:44px;border-radius:10px;border:2px solid rgba(255,255,255,.22);background:rgba(18,22,48,.8);color:#fff;font:600 14px/1 inherit;padding:0 10px}'+
'.vb-ui button.on{border-color:#ffd24a;background:rgba(70,80,160,.92)}.vb-ui .vb-t{display:none}.vb-touch .vb-ui .vb-t{display:block}'+
'.vb .vg-hp{display:none}.vb .vg-tools{gap:4px;flex-wrap:nowrap}.vb .vg-tool{min-width:0;width:46px;height:46px;padding:0;border-radius:8px}.vb .vg-tool span{display:none}.vb .vg-tool em{left:3px;top:1px;text-shadow:0 1px 2px #000;z-index:1}'+
'.vb .vg-tool i.sw{position:absolute;left:5px;top:5px;width:32px;height:32px;border-radius:4px}.vb .vg-tool.on{border-color:#ffd24a;transform:translateY(-4px)}'+
'@media(max-width:560px){.vb .vg-tool{width:34px;height:34px}.vb .vg-tool i.sw{left:3px;top:3px;width:24px;height:24px}}'+
'.vb-pick{position:absolute;inset:0;background:rgba(8,10,28,.72);display:none;align-items:center;justify-content:center;z-index:9;pointer-events:auto}.vb-pick.on{display:flex}'+
'.vb-pick>div{background:#141a3c;border:2px solid rgba(255,255,255,.2);border-radius:16px;padding:18px;max-width:min(92vw,520px);max-height:86vh;max-height:86dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;color:#fff;box-sizing:border-box}'+
'.vb-pick>div *{touch-action:pan-y}'+
'@media(max-height:520px){.vb-grid button i{width:36px;height:36px}.vb-pick>div{padding:12px}}'+''+
'.vb-pick h2{margin:0 0 4px;font-size:20px}.vb-pick p{margin:0 0 12px;opacity:.8;font-size:14px}.vb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px}'+
'.vb-grid button{display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 4px;border-radius:10px;border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:600 12px/1.1 inherit}'+
'.vb-grid button i{width:48px;height:48px;border-radius:6px;display:block}.vb-row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}'+
'.vb-row button{height:42px;border-radius:10px;border:2px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:600 14px/1 inherit;padding:0 14px}.vb-row .main{background:#ffd24a;color:#1a1d3a;border-color:#ffd24a}';

VG.register({
  id:'vilasi-blocks',name:'Vilasi Blocks',tagline:'An open world made of blocks. Break them, place them, build anything.',color:0x58b45a,levels:1,custom:true,
  /* a party builds in the leader's own saved world */
  partySeed(){let sv=null;try{sv=JSON.parse(localStorage.getItem('va_blocks_v1')||'null');}catch(e){}
    if(sv&&typeof sv.seed==='number')return sv.seed;const sd=(Math.random()*2147483647)|0;try{localStorage.setItem('va_blocks_v1',JSON.stringify({seed:sd,e:{}}));}catch(e){}return sd;},
  howTo:[
    'Walk around the island and look at a block. A white outline shows the block you are aiming at.',
    'Click or tap Break to remove a block. Right-click, press R, or tap Build to place the block you are holding.',
    'Keys 1 to 9 or the mouse wheel change the block in your hand. Press E or tap Blocks to swap in any block.',
    'Press F or tap Fly to fly. While flying, Space goes up and Shift goes down.',
    'Hold the Cow egg or the Pig egg and use Build to hatch an animal. Break an animal to pop it away. You can have up to 12 animals.',
    'Your world is saved on this device every few seconds, so your builds are there when you come back.',
    'With friends, everyone builds in the party leader\'s world at the same time, and it is saved on the leader\'s device.'
  ],
  create(E){
    buildAtlas();
    const {V,clamp}=VG.util,P=E.player,I=E.input,C=E.cam;
    const net=E.net&&E.net.cur?E.net:null,SAVE='va_blocks_v1';
    if(!document.getElementById('vb-css')){const st=document.createElement('style');st.id='vb-css';st.textContent=CSS;document.head.appendChild(st);}
    E.hud.el.classList.add('vb');
    let save=null;try{save=JSON.parse(localStorage.getItem(SAVE)||'null');}catch(e){save=null;}if(!save||typeof save.seed!=='number')save=null;
    if(net&&save&&save.seed!==(net.cur.seed|0))save=null;
    const owner=!!(net&&save),canSave=!net||owner; /* in a party the world belongs to whoever's saved world it is */
    const SEED=net?(net.cur.seed|0):save?save.seed:((Math.random()*2147483647)|0);
    const edits=(save&&save.e&&typeof save.e==='object')?save.e:{};
    /* ---- world data */
    const blocks=new Uint8Array(WX*WY*WZ),idx=(x,y,z)=>(y*WZ+z)*WX+x;
    const get=(x,y,z)=>(x<0||z<0||x>=WX||z>=WZ||y<0||y>=WY)?AIR:blocks[idx(x,y,z)];
    const solid=(x,y,z)=>{const b=get(x,y,z);return b!==AIR&&b!==WATER;};
    const hgt=new Uint8Array(WX*WZ);
    (function gen(){
      const r=mul(SEED),G=17,gs=new Float32Array(G*G*3);for(let i=0;i<gs.length;i++)gs[i]=r();
      const sm=t=>t*t*(3-2*t);
      const n2=(x,z,o,f)=>{x*=f;z*=f;const x0=Math.floor(x)%16,z0=Math.floor(z)%16,fx=sm(x-Math.floor(x)),fz=sm(z-Math.floor(z)),a=gs[(z0*G+x0)*3+o],b=gs[(z0*G+x0+1)*3+o],c=gs[((z0+1)*G+x0)*3+o],d=gs[((z0+1)*G+x0+1)*3+o];return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;};
      for(let z=0;z<WZ;z++)for(let x=0;x<WX;x++){
        const e=n2(x,z,0,1/40)*0.6+n2(x,z,1,1/17)*0.28+n2(x,z,2,1/7)*0.12;
        const dx=(x-WX/2)/(WX/2),dz=(z-WZ/2)/(WZ/2),edge=Math.max(Math.abs(dx),Math.abs(dz)),isl=1-Math.pow(clamp((edge-0.55)/0.42,0,1),2);
        let h=Math.round(6+(e*30+2)*isl);h=clamp(h,3,WY-12);hgt[z*WX+x]=h;
        for(let y=0;y<=h;y++){let b=STONE;if(y===0)b=BASE;else if(y===h)b=h<=SEA+1?SAND:h>=31?SNOW:GRASS;else if(y>h-4)b=h<=SEA+1?SAND:DIRT;
          else{const q=r();if(q<0.012)b=COAL;else if(q<0.016&&y<14)b=GOLD;else if(q<0.03)b=GRAVEL;}
          blocks[idx(x,y,z)]=b;}
        for(let y=h+1;y<=SEA;y++)blocks[idx(x,y,z)]=WATER;}
      /* trees */
      for(let i=0;i<340;i++){const x=3+((r()*(WX-6))|0),z=3+((r()*(WZ-6))|0),h=hgt[z*WX+x];if(blocks[idx(x,h,z)]!==GRASS||h>27)continue;
        let near=false;for(let a=-2;a<=2&&!near;a++)for(let b=-2;b<=2;b++)if(get(x+a,h+1,z+b)===LOG){near=true;break;}if(near)continue;
        const th=4+((r()*2)|0);for(let y=1;y<=th;y++)blocks[idx(x,h+y,z)]=LOG;
        for(let dy=th-2;dy<=th+1;dy++){const rad=dy>=th?1:2;for(let a=-rad;a<=rad;a++)for(let b=-rad;b<=rad;b++){if(Math.abs(a)===rad&&Math.abs(b)===rad&&(dy>=th||r()<0.5))continue;
          const k=idx(x+a,h+dy,z+b);if(blocks[k]===AIR)blocks[k]=LEAF;}}}
      for(const k in edits){const i=+k,v=edits[k]|0;if(i>=0&&i<blocks.length&&(v===AIR||B[v]))blocks[i]=v;}
    })();
    /* ---- drawing: one mesh per 16x16 column of blocks, only faces you can see */
    const tex=new T.CanvasTexture(atlasCanvas);tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;
    const matO=new T.MeshBasicMaterial({map:tex,vertexColors:true}),matT=new T.MeshBasicMaterial({map:tex,vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide});
    const NCX=WX/CH,NCZ=WZ/CH,chunks=[];
    /* faces: normal, then 4 corners (unit cube), u axis, v axis */
    const FACES=[
      {n:[1,0,0],c:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],t:1,s:0.8},{n:[-1,0,0],c:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],t:1,s:0.8},
      {n:[0,1,0],c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],t:0,s:1},{n:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],t:2,s:0.55},
      {n:[0,0,1],c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],t:1,s:0.68},{n:[0,0,-1],c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],t:1,s:0.68}];
    const UV=[[0,0],[1,0],[1,1],[0,1]],eu=0.02/(AC*TS),ev=0.02/(AR*TS);
    function meshChunk(cx,cz){
      const ch=chunks[cz*NCX+cx],o={p:[],u:[],c:[],i:[]},t={p:[],u:[],c:[],i:[]};
      for(let y=0;y<WY;y++)for(let z=cz*CH;z<cz*CH+CH;z++)for(let x=cx*CH;x<cx*CH+CH;x++){
        const b=blocks[idx(x,y,z)];if(b===AIR)continue;const bd=B[b],clear=!!bd.clear;
        for(let f=0;f<6;f++){const F=FACES[f],n=F.n,nb=get(x+n[0],y+n[1],z+n[2]);
          if(nb!==AIR){if(!B[nb].clear||nb===b)continue;if(clear&&b===WATER&&nb!==AIR)continue;}
          if(b===WATER&&f!==2)continue; /* water only shows its surface */
          const out=clear?t:o,base=out.p.length/3,tn=TILES[bd.tiles[F.t]],tu=(tn%AC)/AC,tv=1-(Math.floor(tn/AC)+1)/AR,ao=[];
          for(let k=0;k<4;k++){const c=F.c[k];let br=F.s;
            if(!clear&&!bd.bright){ /* soft shadow in corners */
              const ax=n[0]?1:0,sx=[0,0,0],sz=[0,0,0];
              if(n[0]){sx[1]=c[1]?1:-1;sz[2]=c[2]?1:-1;}else if(n[1]){sx[0]=c[0]?1:-1;sz[2]=c[2]?1:-1;}else{sx[0]=c[0]?1:-1;sz[1]=c[1]?1:-1;}
              const px=x+n[0],py=y+n[1],pz=z+n[2],s1=solid(px+sx[0],py+sx[1],pz+sx[2])?1:0,s2=solid(px+sz[0],py+sz[1],pz+sz[2])?1:0,cr=solid(px+sx[0]+sz[0],py+sx[1]+sz[1],pz+sx[2]+sz[2])?1:0;
              const a=(s1&&s2)?0:3-(s1+s2+cr);ao.push(a);br*=0.58+0.14*a;}
            else{ao.push(3);if(bd.bright)br=1.05;if(b===WATER)br=1;}
            out.p.push(x+c[0],y+c[1]-(b===WATER?0.12:0),z+c[2]);out.u.push(tu+eu+UV[k][0]*(1/AC-2*eu),tv+ev+UV[k][1]*(1/AR-2*ev));out.c.push(br,br,br);}
          if(ao[0]+ao[2]>=ao[1]+ao[3])out.i.push(base,base+1,base+2,base,base+2,base+3);else out.i.push(base+1,base+2,base+3,base+1,base+3,base);}
      }
      for(const [key,d,mat] of [['o',o,matO],['t',t,matT]]){
        if(ch[key]){E.scene.remove(ch[key]);ch[key].geometry.dispose();ch[key]=null;}
        if(!d.p.length)continue;const g=new T.BufferGeometry();
        g.setAttribute('position',new T.Float32BufferAttribute(d.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(d.u,2));g.setAttribute('color',new T.Float32BufferAttribute(d.c,3));g.setIndex(d.i);
        const m=new T.Mesh(g,mat);m.matrixAutoUpdate=false;if(key==='t')m.renderOrder=2;E.scene.add(m);ch[key]=m;}
      ch.dirty=false;
    }
    for(let cz=0;cz<NCZ;cz++)for(let cx=0;cx<NCX;cx++){chunks.push({o:null,t:null,dirty:false});meshChunk(cx,cz);}
    const mark=(x,z)=>{if(x<0||z<0||x>=WX||z>=WZ)return;chunks[(z>>4)*NCX+(x>>4)].dirty=true;};
    /* the sea goes on past the island */
    E.setSky(0x4f9df0,0xd6efff,0xcfeaff,60,170);E.sun.castShadow=false;E.shadows=false;E.renderer.shadowMap.enabled=false;
    const sea=E.slab(WX/2,SEA+0.86,WZ/2,1400,0.02,1400,0x3a8fe0,0.62);sea.renderOrder=1;
    /* ---- player */
    P.group.visible=false;P.noPhys=true;P.name=P.name||'You';
    const pos=V(WX/2+0.5,0,WZ/2+0.5),vel=V();let fly=false,onGround=false,inWater=false;
    function topY(x,z){for(let y=WY-1;y>=0;y--)if(solid(x|0,y,z|0))return y+1;return SEA+1;}
    function spawnSpot(){let bx=WX/2,bz=WZ/2,bh=-1;for(let r=0;r<30&&bh<0;r++)for(let a=0;a<12;a++){const x=(WX/2+Math.cos(a/12*6.283)*r*1.5)|0,z=(WZ/2+Math.sin(a/12*6.283)*r*1.5)|0,h=hgt[z*WX+x];if(h>SEA+1){bx=x;bz=z;bh=h;break;}}
      pos.set(bx+0.5,topY(bx,bz)+0.05,bz+0.5);vel.set(0,0,0);}
    if(net){const m=net.cur.m||[],i=Math.max(0,m.indexOf(net.myPeer));spawnSpot();pos.x+=(i%4)*1.2-1.8;pos.z+=Math.floor(i/4)*1.2;pos.y=topY(pos.x,pos.z)+0.05;}
    else if(!net&&save&&Array.isArray(save.p)&&save.p.length>=5){pos.set(+save.p[0]||0,+save.p[1]||0,+save.p[2]||0);C.yaw=+save.p[3]||0;C.pitch=+save.p[4]||0;if(!(pos.y>-5&&pos.y<WY+20))spawnSpot();}
    else spawnSpot();
    const HW=0.3,HH=1.8;
    const hits=(x,y,z)=>{const x0=Math.floor(x-HW),x1=Math.floor(x+HW),y0=Math.floor(y),y1=Math.floor(y+HH-0.001),z0=Math.floor(z-HW),z1=Math.floor(z+HW);
      for(let yy=y0;yy<=y1;yy++)for(let zz=z0;zz<=z1;zz++)for(let xx=x0;xx<=x1;xx++)if(solid(xx,yy,zz))return true;return false;};
    function moveAxis(ax,d){if(!d)return false;const n=Math.ceil(Math.abs(d)/0.2),st=d/n;for(let i=0;i<n;i++){pos[ax]+=st;if(hits(pos.x,pos.y,pos.z)){pos[ax]-=st;
        /* slide right up to the block */
        for(let k=0;k<6;k++){const h=st/Math.pow(2,k+1);pos[ax]+=h;if(hits(pos.x,pos.y,pos.z))pos[ax]-=h;}return true;}}return false;}
    /* ---- hotbar */
    let mySave=save;if(!canSave){try{mySave=JSON.parse(localStorage.getItem(SAVE)||'null');}catch(e){mySave=null;}}
    const hot=(mySave&&Array.isArray(mySave.hot)&&mySave.hot.length===9&&mySave.hot.every(b=>PLACE.indexOf(b)>=0))?mySave.hot.slice():HOT0.slice();
    if(mySave&&mySave.egg!==2){if(hot.indexOf(PEGG)<0)hot[8]=PEGG;if(hot.indexOf(EGG)<0)hot[7]=EGG;} /* worlds from before the animals get both eggs in the last two slots */
    PLACE.forEach(id=>{VG.TOOLS['vb:'+id]={name:B[id].name,cd:0.05,use(){return false;}};});
    const setHot=()=>{const cur=P.tools.indexOf(P.tool);P.setTools(hot.map(b=>'vb:'+b));P.equip(P.tools[Math.max(0,cur)]);E.hud.tools();};
    P.setTools(hot.map(b=>'vb:'+b));
    const held=()=>{const t=P.tool||'';return +t.slice(3)||hot[0];};
    function dressTools(){const bs=E.hud.$.tools.children;for(let i=0;i<bs.length;i++){const id=P.tools[i];if(bs[i].getAttribute('data-vb')===id)continue;bs[i].setAttribute('data-vb',id);
      let sw=bs[i].querySelector('i.sw');if(!sw){sw=document.createElement('i');sw.className='sw';bs[i].insertBefore(sw,bs[i].firstChild);}swatch(sw,+id.slice(3),bs[i].clientWidth>40?32:24);bs[i].title=B[+id.slice(3)].name;}}
    /* ---- buttons and the block picker */
    const ui=document.createElement('div');ui.className='vb-ui';
    ui.innerHTML='<button type="button" data-a="pick">Blocks</button><button type="button" data-a="fly">Fly</button><button type="button" class="vb-t" data-a="place">Build</button><button type="button" class="vb-t" data-a="down">Down</button>';
    E.hud.el.appendChild(ui);
    const pick=document.createElement('div');pick.className='vb-pick';E.hud.el.appendChild(pick);
    let wantPlace=false,downHeld=false,askNew=false;
    function openPick(v){if(v){try{document.exitPointerLock&&document.exitPointerLock();}catch(e){}askNew=false;drawPick();}pick.classList.toggle('on',v);try{VG.stage.style.touchAction=v?'auto':'';}catch(e){}}
    function drawPick(){
      let h='<div><h2>Blocks</h2><p>Pick a block to put in slot '+(P.tools.indexOf(P.tool)+1)+' of your bar.</p><div class="vb-grid">';
      PLACE.forEach(id=>{h+='<button type="button" data-b="'+id+'"><i></i>'+VG.esc(B[id].name)+'</button>';});
      h+='</div><div class="vb-row"><button type="button" class="main" data-a="close">Back to building</button>'+(net?'':'<button type="button" data-a="new">'+(askNew?'Yes, erase this world and make a new one':'Start a new world')+'</button>')+'</div></div>';
      pick.innerHTML=h;pick.querySelectorAll('[data-b]').forEach(b=>swatch(b.firstChild,+b.getAttribute('data-b'),b.firstChild.clientWidth||48));
    }
    pick.addEventListener('click',e=>{const t=e.target.closest('button');if(!t){if(e.target===pick)openPick(false);return;}
      const b=t.getAttribute('data-b'),a=t.getAttribute('data-a');
      if(b){const i=Math.max(0,P.tools.indexOf(P.tool));hot[i]=+b;setHot();P.equip('vb:'+b);E.hud.tools();dirty=true;openPick(false);}
      else if(a==='close')openPick(false);
      else if(a==='new'){if(!askNew){askNew=true;drawPick();}else{try{localStorage.removeItem(SAVE);}catch(err){}noSave=true;VG.play('vilasi-blocks');}}});
    const press=(el,dn,up)=>{el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();dn();},{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();if(up)up();});el.addEventListener('mousedown',e=>{e.stopPropagation();dn();});el.addEventListener('mouseup',()=>{if(up)up();});};
    const flyBtn=ui.querySelector('[data-a="fly"]');
    press(ui.querySelector('[data-a="pick"]'),()=>openPick(true));
    press(flyBtn,()=>{fly=!fly;vel.y=0;flyBtn.classList.toggle('on',fly);});
    press(ui.querySelector('[data-a="place"]'),()=>{wantPlace=true;});
    press(ui.querySelector('[data-a="down"]'),()=>{downHeld=true;},()=>{downHeld=false;});
    const onKey=e=>{if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();
      if(k==='e'){openPick(!pick.classList.contains('on'));}else if(k==='f'){fly=!fly;vel.y=0;flyBtn.classList.toggle('on',fly);}else if(k==='r')wantPlace=true;};
    window.addEventListener('keydown',onKey);
    /* ---- aiming */
    const hl=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.004,1.004,1.004)),new T.LineBasicMaterial({color:0xffffff}));hl.visible=false;E.scene.add(hl);
    const eye=V(),fwd=V();let aim=null;
    function look(){const cp=Math.cos(C.pitch);fwd.set(-Math.sin(C.yaw)*cp,-Math.sin(C.pitch),-Math.cos(C.yaw)*cp);eye.set(pos.x,pos.y+1.62,pos.z);}
    function cast(){
      let x=Math.floor(eye.x),y=Math.floor(eye.y),z=Math.floor(eye.z);const sx=fwd.x>0?1:-1,sy=fwd.y>0?1:-1,sz=fwd.z>0?1:-1;
      const tdx=Math.abs(1/(fwd.x||1e-9)),tdy=Math.abs(1/(fwd.y||1e-9)),tdz=Math.abs(1/(fwd.z||1e-9));
      let tx=(fwd.x>0?x+1-eye.x:eye.x-x)*tdx,ty=(fwd.y>0?y+1-eye.y:eye.y-y)*tdy,tz=(fwd.z>0?z+1-eye.z:eye.z-z)*tdz,px=x,py=y,pz=z,t=0;
      while(t<=6.5){if(solid(x,y,z))return {x,y,z,px,py,pz};px=x;py=y;pz=z;if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;}else if(ty<tz){y+=sy;t=ty;ty+=tdy;}else{z+=sz;t=tz;tz+=tdz;}}
      return null;
    }
    /* ---- changing the world */
    let dirty=false,saveT=5,noSave=false,nEd=Object.keys(edits).length,queue=null,qi=0,qT=0,chkT=1,lowT=0,lastFull=-99;
    function setBlock(x,y,z,id,told){
      if(x<0||z<0||x>=WX||z>=WZ||y<1||y>=WY)return false;const i=idx(x,y,z);if(blocks[i]===id)return false;
      blocks[i]=id;mark(x,z);mark(x-1,z);mark(x+1,z);mark(x,z-1);mark(x,z+1);
      if(!(i in edits))nEd++;edits[i]=id;if(canSave)dirty=true;if(net&&!told)net.send({b:[i,id]});return true;
    }
    function doSave(){if(!canSave||noSave)return;try{localStorage.setItem(SAVE,JSON.stringify({seed:SEED,e:edits,p:[+pos.x.toFixed(2),+pos.y.toFixed(2),+pos.z.toFixed(2),+C.yaw.toFixed(3),+C.pitch.toFixed(3)],hot,egg:2,pg:cows.map(q=>[+q.x.toFixed(1),+q.y.toFixed(1),+q.z.toFixed(1),+q.yaw.toFixed(2),q.k])}));}catch(e){}dirty=false;}
    /* ---- animals: cows and pigs (our own blocky designs). Each player's device runs the animals that player hatched; everyone else sees them move. */
    const KIND=[{hw:0.38,hh:1.3,sp:1.3,ah:0.85,ahead:1,jump:7.4},{hw:0.3,hh:0.85,sp:1.5,ah:0.5,ahead:0.75,jump:7.4}]; /* 0 cow, 1 pig */
    const cows=[],farCows=new Map();let cowN=1;
    const PM=c=>new T.MeshLambertMaterial({color:c}),pm={body:PM(0xf4efe6),dark:PM(0x5a3d2b),snout:PM(0xf0b4b4),ink:PM(0x2a2230),horn:PM(0xe6d6b0)};
    const pg={};function bx(w,h,d){const k=w+'_'+h+'_'+d;return pg[k]||(pg[k]=new T.BoxGeometry(w,h,d));}
    const pp={body:PM(0xf2a0b5),dark:PM(0xdc7f9c),snout:PM(0xf7c3d1),patch:PM(0xfbd3de)};
    function pigMesh(){
      const g=new T.Group(),add=(par,geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);par.add(m);return m;};
      add(g,bx(0.62,0.5,0.95),pp.body,0,0.55,0);add(g,bx(0.4,0.06,0.5),pp.patch,0,0.82,-0.05);
      const head=new T.Group();head.position.set(0,0.66,0.52);g.add(head);
      add(head,bx(0.5,0.46,0.42),pp.body,0,0,0.1);add(head,bx(0.26,0.18,0.1),pp.snout,0,-0.08,0.36);
      add(head,bx(0.05,0.07,0.02),pm.ink,-0.06,-0.08,0.415);add(head,bx(0.05,0.07,0.02),pm.ink,0.06,-0.08,0.415);
      add(head,bx(0.07,0.09,0.02),pm.ink,-0.15,0.08,0.315);add(head,bx(0.07,0.09,0.02),pm.ink,0.15,0.08,0.315);
      const e1=add(head,bx(0.16,0.2,0.06),pp.dark,-0.22,0.24,0.02),e2=add(head,bx(0.16,0.2,0.06),pp.dark,0.22,0.24,0.02);e1.rotation.z=0.5;e2.rotation.z=-0.5;
      const legs=[];for(const q of [[-0.2,0.3],[0.2,0.3],[-0.2,-0.3],[0.2,-0.3]]){const l=new T.Group();l.position.set(q[0],0.32,q[1]);add(l,bx(0.17,0.32,0.17),pp.dark,0,-0.16,0);g.add(l);legs.push(l);}
      const tail=add(g,bx(0.08,0.08,0.16),pp.dark,0,0.7,-0.52);tail.rotation.x=-0.6;
      g.userData={head,legs};E.scene.add(g);return g;
    }
    const mkMesh=k=>k===1?pigMesh():cowMesh();
    function cowMesh(){
      const g=new T.Group(),add=(par,geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);par.add(m);return m;};
      add(g,bx(0.72,0.66,1.3),pm.body,0,0.86,0);
      /* patches sit proud of the body so nothing shares a surface */
      add(g,bx(0.76,0.36,0.42),pm.dark,0,0.98,-0.3);add(g,bx(0.5,0.05,0.4),pm.dark,0.08,1.2,0.22);add(g,bx(0.04,0.3,0.3),pm.dark,0.37,0.8,0.28);add(g,bx(0.04,0.26,0.34),pm.dark,-0.37,0.92,0.1);
      add(g,bx(0.3,0.1,0.26),pm.snout,0,0.5,-0.3);
      const head=new T.Group();head.position.set(0,1.08,0.7);g.add(head);
      add(head,bx(0.52,0.5,0.46),pm.body,0,0,0.12);add(head,bx(0.56,0.2,0.3),pm.dark,0,0.17,0.06);add(head,bx(0.4,0.22,0.12),pm.snout,0,-0.14,0.4);
      add(head,bx(0.06,0.07,0.02),pm.ink,-0.09,-0.14,0.465);add(head,bx(0.06,0.07,0.02),pm.ink,0.09,-0.14,0.465);
      add(head,bx(0.08,0.1,0.02),pm.ink,-0.16,0.03,0.355);add(head,bx(0.08,0.1,0.02),pm.ink,0.16,0.03,0.355);
      const h1=add(head,bx(0.08,0.22,0.08),pm.horn,-0.24,0.34,0.06),h2=add(head,bx(0.08,0.22,0.08),pm.horn,0.24,0.34,0.06);h1.rotation.z=0.45;h2.rotation.z=-0.45;
      const e1=add(head,bx(0.2,0.1,0.06),pm.dark,-0.34,0.12,0.02),e2=add(head,bx(0.2,0.1,0.06),pm.dark,0.34,0.12,0.02);e1.rotation.z=0.25;e2.rotation.z=-0.25;
      const legs=[];for(const q of [[-0.24,0.45],[0.24,0.45],[-0.24,-0.45],[0.24,-0.45]]){const l=new T.Group();l.position.set(q[0],0.55,q[1]);add(l,bx(0.19,0.45,0.19),pm.body,0,-0.2,0);add(l,bx(0.2,0.12,0.2),pm.ink,0,-0.49,0);g.add(l);legs.push(l);}
      const tail=add(g,bx(0.07,0.5,0.07),pm.dark,0,0.9,-0.68);tail.rotation.x=0.25;
      g.userData={head,legs};E.scene.add(g);return g;
    }
    const boxHit=(x,y,z,hw,hh)=>{const x0=Math.floor(x-hw),x1=Math.floor(x+hw),y0=Math.floor(y),y1=Math.floor(y+hh-0.001),z0=Math.floor(z-hw),z1=Math.floor(z+hw);
      for(let yy=y0;yy<=y1;yy++)for(let zz=z0;zz<=z1;zz++)for(let xx=x0;xx<=x1;xx++)if(solid(xx,yy,zz))return true;return false;};
    function hatch(x,y,z,yaw,k){k=k===1?1:0;
      while(cows.length>=12){const o=cows.shift();E.scene.remove(o.m);}
      const q={id:cowN++,x,y,z,vy:0,yaw:yaw==null?Math.random()*6.283:yaw,want:0,walk:0,idle:1+Math.random()*2,ph:0,hop:0,k,m:mkMesh(k)};q.want=q.yaw;cows.push(q);if(canSave)dirty=true;return q;
    }
    function popCow(q){const i=cows.indexOf(q);if(i<0)return;cows.splice(i,1);E.scene.remove(q.m);E.fx.burst(V(q.x,q.y+0.9,q.z),[0xf4efe6,0x5a3d2b],14,5,0.16,{life:0.7});E.sfx('pickup');if(canSave)dirty=true;}
    function pose(m,x,y,z,yaw,ph,moving){m.position.set(x,y,z);m.rotation.y=yaw;const sw=moving?Math.sin(ph)*0.6:0,L=m.userData.legs;L[0].rotation.x=sw;L[3].rotation.x=sw;L[1].rotation.x=-sw;L[2].rotation.x=-sw;m.userData.head.rotation.x=moving?0:Math.sin(E.time*1.3+x)*0.12;}
    function cowsUpdate(dt){
      for(const q of cows){const KK=KIND[q.k],HWp=KK.hw,HHp=KK.hh;
        if(q.walk>0){q.walk-=dt;if(q.walk<=0)q.idle=1+Math.random()*3;}else{q.idle-=dt;if(q.idle<=0){q.walk=1.5+Math.random()*3;q.want=q.yaw+(Math.random()-0.5)*3.2;}}
        let d=q.want-q.yaw;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;q.yaw+=d*Math.min(1,4*dt);
        const ground=boxHit(q.x,q.y-0.05,q.z,HWp,0.05);
        if(q.walk>0){const sp=KK.sp*dt,fx=Math.sin(q.yaw),fz=Math.cos(q.yaw),nx=q.x+fx*sp,nz=q.z+fz*sp,ax=q.x+fx*KK.ahead,az=q.z+fz*KK.ahead;
          const wet=get(Math.floor(ax),Math.floor(q.y-0.5),Math.floor(az))===WATER||get(Math.floor(ax),Math.floor(q.y),Math.floor(az))===WATER;
          const drop=!solid(Math.floor(ax),Math.floor(q.y-0.5),Math.floor(az))&&!solid(Math.floor(ax),Math.floor(q.y-1.5),Math.floor(az))&&!solid(Math.floor(ax),Math.floor(q.y-2.5),Math.floor(az));
          if(nx<1||nz<1||nx>WX-1||nz>WZ-1||wet||drop){q.want=q.yaw+2.2+Math.random();q.walk=Math.max(q.walk,0.8);}
          else if(boxHit(nx,q.y,nz,HWp,HHp)){if(ground&&!boxHit(nx,q.y+1.02,nz,HWp,HHp)&&!boxHit(q.x,q.y+1.02,q.z,HWp,HHp))q.vy=7.4;else if(ground){q.want=q.yaw+1.6+Math.random();}
            if(!ground&&!boxHit(nx,q.y,nz,HWp,HHp)){q.x=nx;q.z=nz;}}
          else{q.x=nx;q.z=nz;}
          q.ph+=dt*9;}
        if(q.hop>0){q.hop=0;if(ground)q.vy=6;}
        q.vy-=24*dt;if(q.vy<-30)q.vy=-30;let ny=q.y+q.vy*dt;
        if(boxHit(q.x,ny,q.z,HWp,HHp)){if(q.vy<0)ny=Math.floor(q.y+0.0001)<=q.y&&boxHit(q.x,Math.floor(q.y),q.z,HWp,0.01)?q.y:Math.floor(ny)+1;else ny=q.y;q.vy=0;}
        q.y=ny;if(q.y<-10){q.y=topY(q.x,q.z)+0.1;q.vy=0;}
        if(get(Math.floor(q.x),Math.floor(q.y+0.3),Math.floor(q.z))===WATER)q.vy=Math.max(q.vy,2.2);
        pose(q.m,q.x,q.y,q.z,q.yaw,q.ph,q.walk>0);
      }
      /* other players' cows */
      const seen={};
      for(const c of E.remotes){const x=c.netX;if(!Array.isArray(x)||!Array.isArray(x[2]))continue;
        for(const a of x[2]){if(!Array.isArray(a))continue;const k=c.remote+':'+a[0];seen[k]=1;let f=farCows.get(k);
          if(!f){f={k:a[5]===1?1:0,m:mkMesh(a[5]===1?1:0),x:+a[1],y:+a[2],z:+a[3],yaw:+a[4]||0,ph:0,peer:c.remote,id:a[0]};farCows.set(k,f);}
          const ox=f.x,oz=f.z,kk=Math.min(1,10*dt);f.x+=(+a[1]-f.x)*kk;f.y+=(+a[2]-f.y)*kk;f.z+=(+a[3]-f.z)*kk;
          let d=(+a[4]||0)-f.yaw;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;f.yaw+=d*kk;
          const mv=Math.hypot(f.x-ox,f.z-oz)>0.4*dt;if(mv)f.ph+=dt*9;pose(f.m,f.x,f.y,f.z,f.yaw,f.ph,mv);}}
      for(const [k,f] of farCows)if(!seen[k]){E.scene.remove(f.m);farCows.delete(k);}
    }
    /* which cow, if any, is in front of the crosshair before the block */
    function cowAim(maxT){let best=null,bt=maxT;const test=(o,x,y,z)=>{const kk=KIND[o.k||0],cx=x-eye.x,cy=y+kk.ah-eye.y,cz=z-eye.z,t=cx*fwd.x+cy*fwd.y+cz*fwd.z;if(t<0||t>bt)return;const dx=cx-fwd.x*t,dy=cy-fwd.y*t,dz=cz-fwd.z*t;if(dx*dx+dy*dy+dz*dz<(o.k===1?0.3:0.5)){bt=t;best=o;}};
      for(const q of cows)test(q,q.x,q.y,q.z);for(const f of farCows.values())test(f,f.x,f.y,f.z);return best;}
    if(canSave&&save&&Array.isArray(save.pg))for(const a of save.pg.slice(0,12))if(Array.isArray(a))hatch(+a[0]||0,+a[1]||0,+a[2]||0,+a[3]||0,a[4]);
    let breakCd=0,placeCd=0,stepT=0;
    function update(dt){
      dressTools();E.hud.el.classList.toggle('vb-touch',!!I.touch);
      if(pick.classList.contains('on')){I.fire=false;I.alt=false;wantPlace=false;look();return;}
      C.pitch=clamp(C.pitch,-1.5,1.5);
      /* move */
      const K=I.keys;let f=0,s=0;if(K.has('w')||K.has('arrowup'))f+=1;if(K.has('s')||K.has('arrowdown'))f-=1;if(K.has('d')||K.has('arrowright'))s+=1;if(K.has('a')||K.has('arrowleft'))s-=1;
      if(I.joy){f=-I.joy.y;s=I.joy.x;}const n=Math.hypot(f,s);if(n>1){f/=n;s/=n;}
      const y=C.yaw,dx=-Math.sin(y)*f+Math.cos(y)*s,dz=-Math.cos(y)*f-Math.sin(y)*s;
      const fx=Math.floor(pos.x),fz=Math.floor(pos.z);inWater=get(fx,Math.floor(pos.y+0.4),fz)===WATER;
      const up=K.has(' ')||I.jump,down=K.has('shift')||downHeld,sp=fly?11:inWater?2.6:4.6,k=Math.min(1,(fly||onGround?14:5)*dt);
      vel.x+=(dx*sp-vel.x)*k;vel.z+=(dz*sp-vel.z)*k;
      if(fly){vel.y+=(((up?1:0)-(down?1:0))*9-vel.y)*Math.min(1,12*dt);}
      else if(inWater){vel.y+=(-3-vel.y)*Math.min(1,3*dt);if(up)vel.y=3.4;}
      else{vel.y-=27*dt;if(vel.y<-40)vel.y=-40;if(up&&onGround){vel.y=8.6;E.sfx('jump');}}
      moveAxis('x',vel.x*dt)&&(vel.x=0);moveAxis('z',vel.z*dt)&&(vel.z=0);
      const vy=vel.y,hitY=moveAxis('y',vel.y*dt);onGround=hitY&&vy<0;if(hitY)vel.y=0;
      pos.x=clamp(pos.x,0.4,WX-0.4);pos.z=clamp(pos.z,0.4,WZ-0.4);if(pos.y<-12||pos.y>WY+60)spawnSpot();
      if(onGround&&(dx||dz)&&!fly){stepT-=dt;if(stepT<=0){stepT=0.34;E.sfx('tick');}}
      P.pos.set(pos.x,pos.y,pos.z);P.yaw=C.yaw+Math.PI;P.onGround=onGround;P.vel.set(0,0,0);
      /* aim, break, place */
      look();aim=cast();hl.visible=!!aim;if(aim)hl.position.set(aim.x+0.5,aim.y+0.5,aim.z+0.5);
      breakCd-=dt;placeCd-=dt;
      const aimT=aim?Math.hypot(aim.x+0.5-eye.x,aim.y+0.5-eye.y,aim.z+0.5-eye.z)+0.4:6.5,cow=cowAim(aimT);if(cow)hl.visible=false;
      if(I.fire&&cow&&breakCd<=0){breakCd=0.3;if(cow.m&&cows.indexOf(cow)>=0)popCow(cow);else if(net)net.send({pop:[cow.peer,cow.id]});}
      else if((I.fire||I.fireHeld)&&breakCd<=0&&aim&&!cow){const b=get(aim.x,aim.y,aim.z);
        if(b!==AIR&&!B[b].fixed&&setBlock(aim.x,aim.y,aim.z,(aim.y<=SEA&&[[1,0],[-1,0],[0,1],[0,-1]].some(d=>get(aim.x+d[0],aim.y,aim.z+d[1])===WATER))?WATER:AIR)){
          E.fx.burst(V(aim.x+0.5,aim.y+0.5,aim.z+0.5),B[b].col,9,5,0.16,{life:0.7});E.sfx('hit');breakCd=0.22;}}
      if((I.alt||wantPlace)&&placeCd<=0&&(held()===EGG||held()===PEGG)){
        if(cow){cow.hop=1;if(!cow.m||cows.indexOf(cow)<0){}E.fx.burst(V(cow.x,cow.y+1,cow.z),[0xff6fa5,0xffffff],6,3,0.14,{life:0.6});placeCd=0.3;}
        else if(aim&&!solid(aim.px,aim.py,aim.pz)){hatch(aim.px+0.5,aim.py+0.02,aim.pz+0.5,C.yaw,held()===PEGG?1:0);E.fx.burst(V(aim.px+0.5,aim.py+0.5,aim.pz+0.5),[0xf4efe6,0x5a3d2b],14,5,0.16,{life:0.7});E.sfx('pickup');placeCd=0.35;}}
      else if((I.alt||wantPlace)&&placeCd<=0&&aim){const x=aim.px,yy=aim.py,z=aim.pz,cur=get(x,yy,z);
        if((cur===AIR||cur===WATER)&&yy>=1&&yy<WY){
          const blocked=q=>Math.abs(q.x-(x+0.5))<0.5+HW&&Math.abs(q.z-(z+0.5))<0.5+HW&&q.y<yy+1&&q.y+HH>yy;
          if(!blocked(pos)&&!E.remotes.some(c=>c.alive&&blocked(c.pos))&&setBlock(x,yy,z,held())){E.sfx('build');placeCd=0.18;}}}
      wantPlace=false;cowsUpdate(dt);
      /* rebuild what changed (a few per frame keeps it smooth) */
      let nfix=0;for(let i=0;i<chunks.length&&nfix<3;i++)if(chunks[i].dirty){meshChunk(i%NCX,(i/NCX)|0);nfix++;}
      if(dirty){saveT-=dt;if(saveT<=0){saveT=5;doSave();}}
      /* party: whoever holds the most of the world (the owner first) sends it to anyone who is missing blocks, such as a late joiner */
      if(net&&net.live){
        chkT-=dt;if(chkT<=0){chkT=1;let best=true,low=false;const mine=[owner?1:0,nEd];
          for(const c of E.remotes){const x=c.netX;if(!Array.isArray(x))continue;if(x[0]>mine[0]||(x[0]===mine[0]&&(x[1]>mine[1]||(x[1]===mine[1]&&c.remote<net.myPeer))))best=false;if(x[1]<nEd)low=true;}
          lowT=best&&low?lowT+1:0;if(lowT>=2&&!queue&&E.time-lastFull>6){queue=Object.keys(edits);qi=0;lastFull=E.time;lowT=0;}}
        if(queue){qT-=dt;if(qT<=0){qT=0.12;const out=[];for(let k=0;k<120&&qi<queue.length;k++,qi++){out.push(+queue[qi],edits[queue[qi]]);}if(out.length)net.send({bs:out});if(qi>=queue.length)queue=null;}}}
      E.status(net?(owner?'Building together in your world. It saves on this device.':'Building together. Break, build, and make something.'):'Break blocks, place blocks, build anything.'+(fly?'  Flying.':''));
      E.score([{label:'In hand',value:B[held()].name,color:B[held()].col,me:true}]);
    }
    function camera(){look();const bob=fly||!onGround?0:Math.sin(E.time*9)*Math.min(1,Math.hypot(vel.x,vel.z)/4.6)*0.035;
      E.camera.position.set(eye.x,eye.y+bob,eye.z);E.camera.lookAt(eye.x+fwd.x,eye.y+bob+fwd.y,eye.z+fwd.z);sea.position.x=eye.x;sea.position.z=eye.z;}
    E.hud.$.cross.style.display='block';
    E.announce(net?'Build together':(save?'Welcome back':'Welcome to your world'),2.6);
    return {
      update,camera,
      onRemote(c){c.group.scale.setScalar(0.72);},
      netMine(){return [owner?1:0,nEd,cows.map(q=>[q.id,+q.x.toFixed(1),+q.y.toFixed(1),+q.z.toFixed(1),+q.yaw.toFixed(1),q.k])];},
      onNet(d){if(!d)return;const one=(i,id)=>{i|=0;id|=0;if(i<0||i>=blocks.length||(id!==AIR&&id!==WATER&&(PLACE.indexOf(id)<0||id===EGG||id===PEGG)))return;
          const x=i%WX,z=Math.floor(i/WX)%WZ,y=Math.floor(i/(WX*WZ));if(B[blocks[i]]&&B[blocks[i]].fixed)return;if(!setBlock(x,y,z,id,true)&&!(i in edits)){nEd++;edits[i]=id;}};
        if(Array.isArray(d.pop)&&d.pop[0]===(net&&net.myPeer)){const q=cows.find(o=>o.id===d.pop[1]);if(q)popCow(q);}
        if(Array.isArray(d.b))one(d.b[0],d.b[1]);
        if(Array.isArray(d.bs))for(let k=0;k+1<d.bs.length&&k<400;k+=2)one(d.bs[k],d.bs[k+1]);},
      canDamage(){return false;},
      dispose(){doSave();window.removeEventListener('keydown',onKey);for(const ch of chunks){for(const k of ['o','t'])if(ch[k]){E.scene.remove(ch[k]);ch[k].geometry.dispose();}}tex.dispose();matO.dispose();matT.dispose();E.hud.el.classList.remove('vb','vb-touch');try{VG.stage.style.touchAction='';}catch(e){}},
      _t:{get,setBlock,pos,cast:()=>aim,held,blocks,idx,WX,WZ,WY,cows,farCows,hatch}
    };
  }
});
})();
