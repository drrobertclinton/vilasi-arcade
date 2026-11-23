/* Vilasi Arcade: playing with friends.
   Each device runs its own player. A party shares one map (same seed), sees everyone move, and the party leader's
   device runs the computer players for all. Everything travels as "presence": a small state object per player. */
(function(){
'use strict';
const VG=window.VG,T=THREE;
const V=(x,y,z)=>new T.Vector3(x||0,y||0,z||0);
let N_sendIdea=null;const SEND=0.07,LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ';
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function angLerp(a,b,t){const d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t;}
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;

/* ---- transports: the real one talks to everyone who has the arcade open; the test one links tabs of one browser */
function fakeTransport(){
  const ch=new BroadcastChannel('va-fakenet'),id='t'+Math.random().toString(36).slice(2,8),others=new Map();let mine={};
  ch.onmessage=e=>{const m=e.data;if(!m||m.id===id)return;if(m.bye)others.delete(m.id);else others.set(m.id,{p:m.p,t:Date.now()});};
  setInterval(()=>ch.postMessage({id,p:mine}),400);window.addEventListener('pagehide',()=>ch.postMessage({id,bye:1}));
  return{peers(){const now=Date.now(),out=[{peer:id,isMe:true,sameTab:true,presence:mine}];others.forEach((v,k)=>{if(now-v.t>6000)others.delete(k);else out.push({peer:k,isMe:false,sameTab:false,presence:v.p});});return out;},
    set(patch){mine=Object.assign({},mine);for(const k in patch){if(patch[k]===null)delete mine[k];else mine[k]=patch[k];}ch.postMessage({id,p:JSON.parse(JSON.stringify(mine))});}};
}
/* the website: a small realtime database relays each player's state to the others in the same party */
const FB_URL='https://vilasi-arcade-default-rtdb.firebaseio.com',FB_SDK='https://www.gstatic.com/firebasejs/10.12.2/';
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load '+src));document.head.appendChild(s);});}
let fbDb=null;
function fbReady(){
  if(fbDb)return Promise.resolve(fbDb);
  return loadScript(FB_SDK+'firebase-app-compat.js').then(()=>loadScript(FB_SDK+'firebase-database-compat.js')).then(()=>{
    const app=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp({databaseURL:FB_URL});fbDb=app.database();return fbDb;});
}
function fbTransport(db){
  let id='w';for(let i=0;i<11;i++)id+='abcdefghijklmnopqrstuvwxyz0123456789'[(Math.random()*36)|0];
  let mine={},code=null,room=null,ref=null,offset=0,lastW=0,timer=null;const others=new Map(),TS=window.firebase.database.ServerValue.TIMESTAMP;
  db.ref('.info/serverTimeOffset').on('value',s=>{offset=s.val()||0;});
  db.ref('.info/connected').on('value',s=>{if(s.val()&&ref){ref.onDisconnect().remove();flush();}});
  function flush(){timer=null;if(!ref)return;lastW=Date.now();let d;try{d=JSON.stringify(mine);}catch(e){return;}if(d.length>=6900)return;ref.set({t:TS,d}).catch(()=>{});}
  function detach(){if(room){room.off();try{ref.onDisconnect().cancel();ref.remove().catch(()=>{});}catch(e){}}others.clear();room=ref=null;code=null;}
  function attach(c){
    detach();code=c;room=db.ref('p/'+c);ref=room.child(id);ref.onDisconnect().remove();
    const up=s=>{if(s.key===id)return;const v=s.val();if(!v||typeof v.d!=='string')return;let p;try{p=JSON.parse(v.d);}catch(e){return;}if(p&&typeof p==='object')others.set(s.key,{p,t:+v.t||0});};
    room.on('child_added',up);room.on('child_changed',up);room.on('child_removed',s=>{others.delete(s.key);});
  }
  setInterval(()=>{if(ref&&Date.now()-lastW>3500)flush();},1000); /* a heartbeat, so a player who vanished without saying goodbye times out */
  window.addEventListener('pagehide',()=>{if(ref){try{ref.remove();}catch(e){}}});
  return{
    peers(){const now=Date.now()+offset,out=[{peer:id,isMe:true,sameTab:true,presence:mine}];others.forEach((v,k)=>{if(now-v.t<15000)out.push({peer:k,isMe:false,sameTab:false,presence:v.p});});return out;},
    set(patch){mine=Object.assign({},mine);for(const k in patch){if(patch[k]===null)delete mine[k];else mine[k]=patch[k];}
      const c=(mine.pt&&mine.pt.code)||null;if(c!==code){if(c)attach(c);else detach();}
      if(!ref||timer)return;const n=others.size,wait=(n>=5?220:n>=3?150:95)-(Date.now()-lastW);if(wait<=0)flush();else timer=setTimeout(flush,wait);}
  };
}
/* the ideas box on the website */
N_sendIdea=function(idea){return fbReady().then(db=>db.ref('ideas').push({from:String(idea.from||'').slice(0,40),game:String(idea.game||'').slice(0,60),text:String(idea.text||'').slice(0,1500),at:String(idea.at||'')}));};
function roomTransport(room){
  return{peers(){return room.peers();},set(patch){try{const p=room.presence(patch);if(p&&p.catch)p.catch(()=>{});}catch(e){}}};
}

const N=VG.net={ok:false,tried:false,tr:null,myPeer:null,code:null,pt:null,played:0,go:null,session:null,cur:null,E:null,
  seq:0,ev:[],evT:[],last:{},applying:0,sig:'',onChange:null,onCountdown:null,rng:Math.random};

N.init=function(){
  if(N.tried)return N._p;N.tried=true;
  const fake=/[?&]fakenet/.test(location.search)&&typeof BroadcastChannel!=='undefined';
  N._p=(fake?Promise.resolve(fakeTransport()):(window.claude&&window.claude.use?
      Promise.race([window.claude.use('room'),new Promise(r=>setTimeout(()=>r(null),10000))]).then(room=>room?roomTransport(room):null):
      Promise.race([fbReady().then(db=>fbTransport(db)),new Promise(r=>setTimeout(()=>r(null),12000))])))
    .catch(()=>null).then(tr=>{N.tr=tr;N.ok=!!tr;if(tr){N.hello();setInterval(N.poll,250);}if(N.onChange)N.onChange();return N.ok;});
  return N._p;
};
N.sendIdea=function(idea){return N_sendIdea(idea);};
N.hello=function(){const P=VG.profile||{};if(N.tr)N.tr.set({u:{n:String(P.name||'Player').slice(0,14),c:P.color||0x3d8bff}});};
N.peers=function(){if(!N.tr)return[];let l;try{l=N.tr.peers()||[];}catch(e){l=[];}
  for(const p of l)if(p.isMe&&p.sameTab){N.myPeer=p.peer;break;}return l;};
function ptOf(p){return p.peer===N.myPeer?(N.pt||null):(p.presence&&p.presence.pt)||null;}
/* on the public server nobody's typed name is shown: everyone is "Player" plus a number */
function uOf(p){const u=(p.presence&&p.presence.u)||{},c=typeof u.c==='number'?u.c:0x3d8bff;if(N.pub){let h=0;for(const ch of String(p.peer))h=(h*31+ch.charCodeAt(0))%9000;return{n:'Player '+(h%90+10),c};}return{n:String(u.n||'Player').slice(0,14),c};}
N.nameOf=uOf;
N.members=function(){if(!N.code)return[];return N.peers().filter(p=>{const t=ptOf(p);return t&&t.code===N.code;}).sort((a,b)=>a.peer<b.peer?-1:1);};
/* the party leader: whoever holds the leader mark (lowest label wins a tie); with nobody marked, the lowest label */
N.host=function(){const m=N.members();if(!m.length)return null;return m.find(p=>{const t=ptOf(p);return t&&t.h;})||m[0];};
/* in a private party only the leader picks and starts; on the public server anyone can */
N.isHost=function(){if(N.pub&&N.code)return true;const h=N.host();return !!h&&h.peer===N.myPeer;};
/* whose device runs the computer players this round: the party leader if they are in the round, else the lowest label in it */
N.roundHost=function(){if(!N.cur)return null;const lead=N.host(),inRound=p=>p.peer===N.myPeer||(p.presence&&p.presence.s&&p.presence.s.r===N.cur.r);
  if(lead&&inRound(lead))return lead.peer;const m=N.members().filter(inRound);return m.length?m[0].peer:N.myPeer;};
N.parties=function(){const by={};for(const p of N.peers()){const t=ptOf(p);if(!t||!t.code||t.code===N.code)continue;const o=by[t.code]||(by[t.code]={code:t.code,count:0,leader:null,game:null});o.count++;if(t.h||!o.leader){o.leader=uOf(p).n;if(t.go&&t.live)o.game=t.go.g;}}
  return Object.keys(by).sort().map(k=>by[k]);};
function pushPt(){if(N.tr)N.tr.set({pt:N.pt});}
N.create=function(){N.pub=false;N.full=false;let c='';for(let i=0;i<4;i++)c+=LETTERS[(Math.random()*LETTERS.length)|0];N.code=c;N.pt={code:c,h:1,g:null,go:null,live:0};N.played=0;pushPt();N.changed();};
N.PUBLIC='OPEN';N.MAXPUB=8;
N.join=function(code){code=String(code||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);if(code.length<4)return false;N.code=code;N.pub=code===N.PUBLIC;N.joinedAt=Date.now();N.full=false;N.pt={code,h:0,g:null,go:null,live:0};N.played=0;pushPt();N.changed();return true;};
N.joinPublic=function(){return N.join(N.PUBLIC);};
N.leave=function(){N.pub=false;N.code=null;N.pt=null;N.go=null;if(N.tr)N.tr.set({pt:null,s:null,ev:null,b:null});N.changed();};
N.pick=function(id){if(!N.pt||!N.isHost())return;N.pt.g=id;pushPt();N.changed();};
/* the party leader starts a round for everyone */
N.start=function(id){if(!N.pt||!N.isHost()||!VG.byId[id])return;if(!N.pub)N.pt.h=1;N.pt.g=id;N.pt.go={g:id,sd:(Math.random()*2147483647)|0,r:Math.floor(Date.now()/100)%1000000000,m:N.members().map(p=>p.peer).slice(0,12)};N.pt.live=1;pushPt();N.poll();};
N.changed=function(){N.sig='';if(N.onChange)N.onChange();};

/* runs four times a second, in the menus and during a round */
N.poll=function(){
  if(!N.tr)return;const peers=N.peers();
  if(N.code&&N.pt){
    const h=N.host();
    if(N.pub){ /* public server: the newest round anyone started is the one everybody plays; it holds a limited number of players */
      const m=N.members();if(m.length>N.MAXPUB&&Date.now()-N.joinedAt<4000){N.leave();N.full=true;N.changed();return;}
      let best=null;for(const p of m){const t=ptOf(p);if(t&&t.go&&t.live&&VG.byId[t.go.g]&&(!best||t.go.r>best.r))best=t.go;}
      if(best&&best.r!==N.played){N.played=best.r;N.go=best;N.countdown(best);}
    }else if(h){const t=ptOf(h);
      if(h.peer!==N.myPeer||N.pt.h)N._noLead=0;
      else{N._noLead=(N._noLead||0)+1;if(N._noLead>=12){N.pt.h=1;if(N.go&&!N.pt.go)N.pt.go=N.go;N.pt.live=N.E?1:0;pushPt();}} /* the leader has been gone 3 seconds: the next player takes over */
      if(h.peer!==N.myPeer&&N.pt.h){N.pt.h=0;pushPt();} /* two leaders after a hiccup: the lower label keeps it */
      if(t&&t.go&&t.go.r!==N.played&&t.live&&VG.byId[t.go.g]){N.played=t.go.r;N.go=t.go;N.countdown(t.go);}}
  }
  let sig=(N.code||'-')+'|'+(N.isHost()?1:0)+'|'+(N.pt&&N.pt.g||'')+'|';
  for(const p of peers){const t=ptOf(p),u=uOf(p);if(t&&t.code)sig+=p.peer+':'+t.code+':'+(t.h?1:0)+':'+(t.g||'')+':'+(t.live?1:0)+':'+u.n+':'+u.c+':'+((p.presence&&p.presence.s)?1:0)+';';}
  if(sig!==N.sig){N.sig=sig;if(N.onChange)N.onChange();}
};
N.countdown=function(go){if(N._cd)clearTimeout(N._cd);if(N.onCountdown)N.onCountdown(go,2500);N._cd=setTimeout(()=>{N._cd=null;if(N.onCountdown)N.onCountdown(null);if(!N.code)return;N.session={g:go.g,seed:go.sd,r:go.r,m:Array.isArray(go.m)?go.m:null};VG.play(go.g);},2500);};

/* ---- one round */
N.begin=function(E){
  const s=N.session;N.session=null;if(!s||!N.code||!N.tr||s.g!==E.def.id)return null;
  N.E=E;N.cur=s;N.live=false;N.rng=mulberry(s.seed);N.remotes=new Map();N.acc=0;N.hudT=0;N.seen={};
  if(N.pt&&(N.pt.h||N.pub)&&N.pt.go&&N.pt.go.r===s.r&&!N.pt.live){N.pt.live=1;pushPt();}
  const el=N.el=document.createElement('div');el.className='vg-party';E.hud.el.appendChild(el);
  return N;
};
/* a party is players only: the computer players a game creates are taken out (a game can keep helpers with partyKeepBots) */
N.dropBot=function(c){const E=N.E;if(!E||(E.def.partyKeepBots&&(E.def.partyKeepBots===true||E.def.partyKeepBots(c))))return;c.removed=true;c.alive=false;c.hp=0;c.frozen=true;c.group.visible=false;c.pos.y=-9999;};
N.created=function(E){N.live=true;for(const c of E.chars)if(c.isBot)N.dropBot(c);};
N.end=function(E){
  if(N.E!==E)return;N.E=null;N.cur=null;N.remotes=new Map();if(N.tr)N.tr.set({s:null,ev:null,b:null});N.ev=[];N.evT=[];
  if(N.pt&&N.pt.live&&!N.session&&!N._cd){N.pt.live=0;pushPt();}
};
function idOf(c){const E=N.E;return c===E.player?'p:'+N.myPeer:c.remote?'p:'+c.remote:'b'+c.botIdx;}
function botAt(i){for(const c of N.E.chars)if(c.botIdx===i)return c;return null;}
function resolve(id){if(typeof id!=='string')return null;if(id[0]==='b')return botAt(+id.slice(1));const peer=id.slice(2);return peer===N.myPeer?N.E.player:(N.remotes.get(peer)||null);}
function emit(ev){ev.q=++N.seq;ev.r=N.cur.r;N.ev.push(ev);N.evT.push(performance.now());N.dirty=true;}
function prune(){const now=performance.now();while(N.ev.length&&(N.ev.length>40||now-N.evT[0]>2500)){N.ev.shift();N.evT.shift();}
  while(N.ev.length>4&&JSON.stringify(N.ev).length>2300){N.ev.shift();N.evT.shift();}}

/* called by the engine */
N.damage=function(c,amt,by){
  if(N.applying)return undefined;
  if(c.puppet){if(by&&!by.puppet&&by!==c){N.sendHit(c,amt,by);return true;}return false;}
  if(by&&by.puppet)return false; /* the attacker's own device decides whether it hit */
  return undefined;
};
N.sendHit=function(c,amt,by){const E=N.E;emit({t:'h',to:idOf(c),a:Math.round(amt),by:idOf(by)});E.fx.burst(c.chest(),0xffffff,4,5,0.2);E.sfx('hit');};
N.onKill=function(c,by){emit({t:'k',id:idOf(c),by:by&&by!==c?idOf(by):null});};
N.onUse=function(c,id,dir){emit({t:'u',id:idOf(c),tl:id,d:[r2(dir.x),r2(dir.y),r2(dir.z)]});};
N.onShoot=function(c,o,dir,sp){if(N.applying)return;const q={speed:sp.speed,r:sp.r,life:sp.life,grav:sp.grav,bounce:sp.bounce,fuse:sp.fuse,color:sp.color,trail:sp.trail,blink:sp.blink};
  if(sp.explode)q.explode={r:sp.explode.r,dmg:sp.explode.dmg,breaks:sp.explode.breaks};
  emit({t:'s',id:idOf(c),o:[r1(o.x),r1(o.y),r1(o.z)],d:[r2(dir.x),r2(dir.y),r2(dir.z)],sp:q});};

function handle(ev,from,fromHost){
  const E=N.E;if(!ev||ev.r!==N.cur.r)return;
  const own=id=>typeof id==='string'&&(id==='p:'+from||(id[0]==='b'&&fromHost)); /* a player may only speak for its own characters */
  if(ev.t==='u'){if(!own(ev.id))return;const c=resolve(ev.id);if(!c||!c.puppet||!c.alive||!VG.TOOLS[ev.tl]||!Array.isArray(ev.d))return;
    const d=V(+ev.d[0]||0,+ev.d[1]||0,+ev.d[2]||0);if(d.lengthSq()<0.001)return;d.normalize();c._netUse=true;N.applying++;try{c.use(d,ev.tl);}catch(e){}N.applying--;c._netUse=false;}
  else if(ev.t==='s'){if(!own(ev.id))return;const c=resolve(ev.id);if(!c||!c.puppet||!ev.sp||!Array.isArray(ev.o)||!Array.isArray(ev.d))return;
    const sp=ev.sp,spec={speed:+sp.speed||40,r:Math.min(3,+sp.r||0.3),life:Math.min(12,+sp.life||3),grav:sp.grav,bounce:sp.bounce,fuse:!!sp.fuse,color:sp.color,trail:sp.trail,blink:sp.blink,dmg:0};
    if(sp.explode)spec.explode={r:Math.min(14,+sp.explode.r||4),dmg:0,breaks:sp.explode.breaks};
    const sh=E.drop(V(+ev.o[0]||0,+ev.o[1]||0,+ev.o[2]||0),V(+ev.d[0]||0,+ev.d[1]||0,+ev.d[2]||0).multiplyScalar(spec.speed),spec);sh.owner=c;}
  else if(ev.t==='h'){if(!own(ev.by))return;const c=resolve(ev.to),by=resolve(ev.by);if(!c||c.puppet||!c.alive||!by)return; /* only the owner of the target applies it */
    N.applying++;try{E.damage(c,Math.max(0,Math.min(9999,+ev.a||0)),by);}catch(e){}N.applying--;}
  else if(ev.t==='k'){if(!own(ev.id))return;const c=resolve(ev.id);if(!c||!c.puppet||!c.alive)return;N.applying++;try{E.kill(c,ev.by?resolve(ev.by):null);}catch(e){}N.applying--;}
}
function sync(c,x,y,z,yaw,hp,al,g,tl,dt){
  const E=N.E,n=c.netT||(c.netT={});n.x=x;n.y=y;n.z=z;n.yaw=yaw;n.g=g;
  if(tl&&tl!==c.tool&&VG.TOOLS[tl])c.equip(tl);
  if(al){c._gone=0;if(!c.alive){N.applying++;E.respawn(c,x,y,z,0);N.applying--;}if(typeof hp==='number')c.hp=hp;}
  else if(c.alive){c._gone=(c._gone||0)+dt;if(c._gone>0.5){N.applying++;try{E.kill(c,null);}catch(e){}N.applying--;}}
}
N.pre=function(dt){
  const E=N.E;if(!E||!N.cur)return;const peers=N.peers(),now=performance.now(),rh=N.roundHost(),amHost=rh===N.myPeer;N.amRH=amHost;
  for(const c of E.chars)if(c.isBot)c.puppet=c.removed?true:!amHost;
  for(const p of peers){
    if(p.peer===N.myPeer)continue;const pr=p.presence||{},t=pr.pt,s=pr.s;if(!t||t.code!==N.code||!s||s.r!==N.cur.r||!Array.isArray(s.p))continue;
    let c=N.remotes.get(p.peer);
    if(!c){const u=uOf(p);c=new VG.Char(E,{name:u.n,color:u.c});c.remote=p.peer;c.puppet=true;c.team=E.player.team;c.pos.set(+s.p[0]||0,+s.p[1]||0,+s.p[2]||0);N.remotes.set(p.peer,c);E.remotes.push(c);if(E.game&&E.game.onRemote){try{E.game.onRemote(c,p.peer);}catch(e){console.error(e);}}}
    N.seen[p.peer]=now;const fromHost=rh===p.peer;
    /* things that happened (hits, tool uses, knockouts) first, then where everyone is now */
    if(Array.isArray(pr.ev)){let lq=N.last[p.peer];if(lq==null){lq=0;for(const e of pr.ev)if(e&&e.q>lq&&e.r!==N.cur.r)lq=e.q;}
      for(const e of pr.ev){if(e&&e.q>lq){lq=e.q;try{handle(e,p.peer,fromHost);}catch(err){console.error(err);}}}N.last[p.peer]=lq;}
    sync(c,+s.p[0]||0,+s.p[1]||0,+s.p[2]||0,+s.p[3]||0,s.hp,!!s.al,!!s.gr,s.tl,dt);c.kos=+s.ko||0;
    if(fromHost&&!amHost&&Array.isArray(pr.b)){for(const b of pr.b){if(!Array.isArray(b))continue;const bc=botAt(b[0]);if(bc&&!bc.removed)sync(bc,b[1],b[2],b[3],b[4],b[5],!!(b[6]&1),!!(b[6]&2),b[7],dt);}}
  }
  for(const [peer,c] of N.remotes){if(now-(N.seen[peer]||0)>3000){N.remotes.delete(peer);const i=E.remotes.indexOf(c);if(i>=0)E.remotes.splice(i,1);c.alive=false;c.dispose();}}
};
/* glide a character that someone else controls toward where they last said it was */
N.move=function(c,dt){
  const n=c.netT;if(!n||dt<=0){c.vel.set(0,0,0);return;}
  const ox=c.pos.x,oy=c.pos.y,oz=c.pos.z,dx=n.x-ox,dy=n.y-oy,dz=n.z-oz,k=Math.min(1,13*dt);
  if(dx*dx+dy*dy+dz*dz>625)c.pos.set(n.x,n.y,n.z);else{c.pos.x+=dx*k;c.pos.y+=dy*k;c.pos.z+=dz*k;}
  c.vel.set((c.pos.x-ox)/dt,(c.pos.y-oy)/dt,(c.pos.z-oz)/dt);c.yaw=angLerp(c.yaw,n.yaw,k);c.onGround=!!n.g;c.blocked=false;
};
N.post=function(dt){
  const E=N.E;if(!E||!N.cur)return;N.acc+=dt;N.hudT-=dt;
  if(N.hudT<=0){N.hudT=0.5;let h='';for(const c of E.remotes)h+='<div><i style="background:#'+('000000'+(c.color>>>0).toString(16)).slice(-6)+'"></i><span>'+VG.esc(c.name)+'</span><b>'+(c.alive?Math.max(0,Math.round(c.hp)):'out')+'</b></div>';
    if(!E.remotes.length)h='<div><span>Waiting for friends...</span></div>';if(N.el.innerHTML!==h)N.el.innerHTML=h;}
  if(N.acc<SEND)return;N.acc=0;prune();
  const p=E.player,patch={s:{r:N.cur.r,p:[r2(p.pos.x),r2(p.pos.y),r2(p.pos.z),r2(p.yaw)],hp:Math.round(p.hp),al:p.alive?1:0,gr:p.onGround?1:0,tl:p.tool||null,ko:p.kos}};
  patch.ev=N.ev.slice();
  if(N.amRH){const b=[];for(const c of E.chars)if(c.isBot&&!c.removed)b.push([c.botIdx,r1(c.pos.x),r1(c.pos.y),r1(c.pos.z),r2(c.yaw),Math.round(c.hp),(c.alive?1:0)|(c.onGround?2:0),c.tool||0]);patch.b=b;}else patch.b=null;
  N.tr.set(patch);
};
})();
