/* Wreck Island: survive a run of disasters on a small island. */
VG.register({
  id:'wreck-island',name:'Wreck Island',tagline:'Outlast every disaster the island throws at you.',color:0x22c9c2,levels:1,
  howTo:[
    'Stay alive until the last disaster ends. Disasters get worse as the round goes on.',
    'Read the warning at the top. Roofs block lightning and acid rain; the stepped hill beats a flood.',
    'Buildings can be smashed, so do not hide in one during a quake or a twister.',
    'Your Bouncer ball shoves other players around but does not hurt them.',
    'Green gems give health back.',
    'Finish with lots of health for three stars.'
  ],
  create(E){
    const {V,rand,irand,pick,clamp,shuffle}=VG.util,C=VG.COLORS,W=E.world,B=VG.build,L=E.level,T=THREE;
    W.killY=-16;E.cam.dist=12;
    const SKY=[0x4fb4ff,0xd9f4ff,0xcdeeff,80,330];E.setSky.apply(E,SKY);
    /* island */
    for(let i=0;i<8;i++)for(let j=0;j<8;j++)W.addBox(-49+i*14,-2,-49+j*14,14,4,14,(i+j)%2?0x58c26b:0x4fb862,{jitter:0});W.addBox(0,-3,0,122,4,122,C.sand);
    E.slab(0,-7,0,900,1,900,0x2d8fe0,0.8);
    const blds=[];
    function tower(x,z,half,floors,col,fc){B.tower(W,x,z,half,floors,col,fc,0,{tag:'bld'});blds.push({x,z,half});}
    tower(-30,-26,6,4,0xdfe3ee,C.stone);tower(28,-30,8,2,0xff8a7a,C.wood);tower(-32,26,6,3,0x8fb8ff,0xf4f1ea);tower(4,-38,5,2,0xffd86b,C.wood);
    /* stepped hill: every step is 1 high so anyone can walk straight up */
    const HX=30,HZ=28,HT=14;for(let i=0;i<HT;i++){const s=40-i*2.6;W.addBox(HX,i+0.5,HZ,s,1,s,i%2?0x79c988:0x66b877);}
    for(let i=0;i<16;i++){const x=rand(-50,50),z=rand(-50,50);if(Math.hypot(x,z)<12||Math.hypot(x-HX,z-HZ)<26||blds.some(b=>Math.abs(x-b.x)<b.half+3&&Math.abs(z-b.z)<b.half+3))continue;
      W.addBox(x,2,z,1,4,1,C.wood,{breakable:true});W.addBox(x,5.5,z,4,3,4,0x3fae5a,{breakable:true});W.addBox(x,7.5,z,2.4,1.4,2.4,0x4cc26a,{breakable:true});}
    /* a gentler ball for this game: mostly a shove */
    VG.TOOLS['wreck-island-ball']={name:'Bouncer',cd:1.1,range:26,use(c,d,E){E.shoot(c,d,{speed:44,r:0.6,dmg:0,life:6,grav:1,bounce:0.85,color:pick([0xff6fb5,0x22c9c2,0xffc93c,0xa56bff]),
      onHit(o,s){const v=s.vel.clone().setY(0);if(v.lengthSq()>0.01){v.normalize();o.vel.x+=v.x*16;o.vel.z+=v.z*16;o.vel.y+=7;}}});E.sfx('shoot');}};
    for(const q of [[-12,-12],[14,-10],[-10,16],[12,40],[-44,0],[46,-4]])E.pickup({pos:V(q[0],1.6,q[1]),color:0x35d07f,size:0.6,respawn:22,onTake(c){if(c.hp>=c.maxHp)return false;E.heal(c,30);}});
    /* scenery: lighthouse, dock, rocks */
    for(let i=0;i<7;i++)W.addBox(-47,1.5+i*3,46,4.4-i*0.25,3,4.4-i*0.25,i%2?0xf4f1ea:0xff4d5e,{jitter:0});
    W.addBox(-47,23,46,5,1,5,C.ink);W.addBox(-47,24.6,46,2.6,2.2,2.6,0xfff27a,{glow:true});W.addBox(-47,26.2,46,3.6,1,3.6,0xff4d5e);
    for(let i=0;i<9;i++){W.addBox(57+i*2,-0.75,0,2,0.5,6,i%2?0xb07a4a:0xa06c40,{jitter:0});if(i%3===1){W.addBox(57+i*2,-3.5,3.2,0.8,6,0.8,0x7a5234);W.addBox(57+i*2,-3.5,-3.2,0.8,6,0.8,0x7a5234);}}
    for(let i=0;i<14;i++){const a2=rand(0,6.283),r=rand(40,53),x=Math.cos(a2)*r,z=Math.sin(a2)*r;if(Math.hypot(x-HX,z-HZ)<24||blds.some(b=>Math.abs(x-b.x)<b.half+3&&Math.abs(z-b.z)<b.half+3))continue;
      const s=rand(1.6,3.2);W.addBox(x,s*0.3,z,s,s*0.6,s*0.9,0x9aa1b5,{jitter:0.2});}
    /* players */
    const p=E.player;p.teleport(0,1,4);p.setTools(['wreck-island-ball']);
    const bots=E.bots(Math.min(10,4+L));bots.forEach((b,i)=>{const a=i/bots.length*6.283;b.teleport(Math.cos(a)*8,1,Math.sin(a)*8);b.setTools(['wreck-island-ball']);b.brain.skill=0.3+L*0.08;b.brain.data.next=0;});
    /* disasters */
    const power=1+(L-1)*0.18;let acc=0,objs=[];
    /* in a party every device follows one shared timeline, and strikes are worked out from the shared seed so everyone sees the same ones */
    const net=E.net&&E.net.cur?E.net:null,SEED=net?(net.cur.seed|0):0;
    const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let q=Math.imul(a^a>>>15,1|a);q=q+Math.imul(q^q>>>7,61|q)^q;return((q^q>>>14)>>>0)/4294967296;};
    const mix=(a,b)=>(SEED^Math.imul(a+1,0x9E3779B1)^Math.imul(b+1,0x85EBCA6B))|0;
    let R=Math.random,lastN=null;
    const rnd=(a,b)=>a+R()*(b-a),pk=a=>a[(R()*a.length)|0];
    const tick=(dt,every)=>{
      if(!net){acc+=dt;if(acc>=every){acc-=every;return true;}return false;}
      const n=Math.floor((DUR-t)/every);if(lastN==null||n-lastN>4)lastN=n-1;if(n<=lastN)return false;lastN++;R=mul(mix(wave,lastN));return true;};
    const anyone=()=>{if(!net){const l=E.living();return l.length?pick(l):null;}
      const l=[[net.myPeer,p]].concat(E.remotes.map(c=>[c.remote,c])).filter(q=>q[1].alive).sort((a,b)=>a[0]<b[0]?-1:1);return l.length?pk(l)[1]:null;};
    const D={
      meteors:{name:'Meteor shower',tip:'Keep moving and watch the sky',mode:'run',update(dt){if(!tick(dt,0.5/power))return;
        const t=R()<0.6?anyone():null,x=t?t.pos.x+rnd(-7,7):rnd(-52,52),z=t?t.pos.z+rnd(-7,7):rnd(-52,52);
        E.drop(V(x+rnd(-20,20),110,z+rnd(-20,20)),V(rnd(-4,4),-62,rnd(-4,4)),{r:1.5,color:0xff8a3c,trail:0xffc93c,grav:0.2,life:6,explode:{r:6.5,dmg:52}});}},
      flood:{name:'Flood',tip:'Get to high ground',mode:'high',start(){this.w=E.slab(0,-8,0,900,2,900,0x3aa0ff,0.62);this.t=0;},
        update(dt,k){this.t+=dt;const lvl=-6+Math.min(1,k/0.7)*(11+L*1.3);this.lvl=lvl;this.w.position.y=lvl-1;
          if(tick(dt,0.5))for(const c of E.living())if(c.pos.y+1.1<lvl)E.damage(c,7,null);},
        end(){E.remove(this.w);}},
      twister:{name:'Twister',tip:'Run from the funnel',mode:'flee',start(){this.g=new T.Group();for(let i=0;i<9;i++){const m=new T.Mesh(new T.CylinderGeometry(2+i*0.9,1.6+i*0.9,3,14,1,true),new T.MeshBasicMaterial({color:0xcfd6e6,transparent:true,opacity:0.42,side:T.DoubleSide}));m.position.y=1.5+i*3;this.g.add(m);}
          E.add(this.g);this.a0=this.a=net?mul(mix(wave,-7))()*6:rand(0,6);this.pos=V(40,0,0);},
        update(dt){if(net)this.a=this.a0+(DUR-t);else this.a+=dt;const x=42*Math.sin(this.a*0.33),z=42*Math.sin(this.a*0.47+1);this.pos.set(x,0,z);this.g.position.set(x,0,z);this.g.children.forEach((m,i)=>{m.rotation.y+=dt*(5+i);m.position.x=Math.sin(this.a*3+i)*i*0.25;});
          if(tick(dt,0.2)){W.blast(V(x,5,z),7.5,10);
            for(const c of E.living()){const dx=c.pos.x-x,dz=c.pos.z-z,d=Math.hypot(dx,dz);if(d<9){c.vel.x+=-dz/(d+0.1)*14+rnd(-6,6);c.vel.z+=dx/(d+0.1)*14+rnd(-6,6);c.vel.y=Math.max(c.vel.y,17);c.onGround=false;E.damage(c,5*power,null);}}}},
        end(){E.remove(this.g);}},
      quake:{name:'Earthquake',tip:'Get out of the buildings',mode:'open',start(){this.list=[];for(const b of W.boxes)if(b.breakable&&b.tag==='bld')this.list.push(b);
          if(net){const r=mul(mix(wave,-3)),l=this.list;l.sort((a,b)=>a.x-b.x||a.z-b.z||a.y-b.y);for(let i=l.length-1;i>0;i--){const j=(r()*(i+1))|0,q=l[i];l[i]=l[j];l[j]=q;}}else shuffle(this.list);},
        update(dt){E.shake(0.12);if(!tick(dt,0.28))return;for(let n=0;n<5+L&&this.list.length;n++){const b=this.list.pop();if(!b.alive)continue;
          for(const c of E.living())if(Math.abs(c.pos.x-b.x)<2.6&&Math.abs(c.pos.z-b.z)<2.6&&c.pos.y<b.y)E.damage(c,9,null);W.breakBox(b,V(b.x,b.y-2,b.z));}}},
      lightning:{name:'Lightning storm',tip:'Get under a roof',mode:'shelter',start(){E.setSky(0x1b2140,0x4a5378,0x3a4266,60,260);E.setLight(0.42,0.2);},
        update(dt){if(!tick(dt,0.85/power))return;const t=R()<0.75?anyone():null,x=t?t.pos.x+rnd(-5,5):rnd(-52,52),z=t?t.pos.z+rnd(-5,5):rnd(-52,52);
          const hit=W.ray(V(x,140,z),V(0,-1,0),200);if(!hit)return;const pt=hit.point,ring=E.slab(pt.x,pt.y+0.15,pt.z,5,0.2,5,0xfff27a,0.6);objs.push(ring);
          E.after(0.8,()=>{E.remove(ring);if(E.over)return;E.beam(V(pt.x,140,pt.z),pt,0xffffff);E.explode(pt,4.6,48,null,{color:0xdff4ff});});},
        end(){E.setSky.apply(E,SKY);E.setLight(0.66,0.62);}},
      acid:{name:'Acid rain',tip:'Get under a roof',mode:'shelter',start(){E.setSky(0x4d7a3a,0xb7d68a,0xa5c87c,50,230);},
        update(dt){E.fx.burst(V(p.pos.x+rand(-14,14),p.pos.y+16,p.pos.z+rand(-14,14)),0x9dff6a,2,1,0.16,{up:0,gravity:1.6,life:1.1});
          if(!tick(dt,0.5))return;for(const c of E.living()){const o=V(c.pos.x,c.pos.y+2.5,c.pos.z);if(!W.ray(o,V(0,1,0),120))E.damage(c,3*power,null);}},
        end(){E.setSky.apply(E,SKY);}},
      balls:{name:'Ball storm',tip:'Dodge the giant bouncing balls',mode:'run',update(dt){if(!tick(dt,0.55/power))return;
        E.drop(V(rnd(-48,48),70,rnd(-48,48)),V(rnd(-14,14),-20,rnd(-14,14)),{r:1.7,dmg:22,life:9,grav:1,bounce:0.82,color:pk([0xff6fb5,0x22c9c2,0xffc93c,0xa56bff,0xff8a3c])});}}
    };
    const order=shuffle(Object.keys(D)).slice(0,Math.min(7,2+L));let DUR=22+L*2;
    let wave=-1,phase='intro',t=7,cur=null,done=false;
    E.announce('Explore the island',3);
    function mode(){return phase==='active'&&cur?cur.mode:'wander';}
    function botThink(b,dt){
      const br=b.brain,d=br.data;d.next-=dt;
      const m=mode();
      if(d.next<=0||d.mode!==m){d.mode=m;d.next=rand(1.5,3.2);
        if(m==='high')br.goal=V(HX+rand(-2,2),0,HZ+rand(-2,2));
        else if(m==='shelter'){let best=null,bd=1e9;for(const s of blds){const q=Math.hypot(s.x-b.pos.x,s.z-b.pos.z);if(q<bd){bd=q;best=s;}}
          const h=best.half,inside=Math.abs(b.pos.x-best.x)<h-1&&Math.abs(b.pos.z-best.z)<h-1;d.next=0.5;
          if(inside)br.goal=V(best.x-1.5+rand(-1,1),0,best.z+rand(-1,1));
          else{const doors=[[best.x,best.z+h+2.5],[best.x,best.z-h-2.5],[best.x-h-2.5,best.z]];let dq=null,dd=1e9;for(const q of doors){const k=Math.hypot(q[0]-b.pos.x,q[1]-b.pos.z);if(k<dd){dd=k;dq=q;}}
            br.goal=dd>1.6?V(dq[0],0,dq[1]):V(best.x-1.5,0,best.z);br.arrive=0.8;}}
        else if(m==='flee'&&cur.pos){const dx=b.pos.x-cur.pos.x,dz=b.pos.z-cur.pos.z,q=Math.hypot(dx,dz)||1;br.goal=V(clamp(b.pos.x+dx/q*18,-48,48),0,clamp(b.pos.z+dz/q*18,-48,48));}
        else if(m==='open')br.goal=V(rand(-14,14),0,rand(-8,18));
        else br.goal=V(rand(-46,46),0,rand(-46,46));
        if(Math.random()<0.08+L*0.03){const tg=br.nearest();if(tg&&br.dist(tg)<16&&br.canSee(tg))br.fireAt(tg,'wreck-island-ball');}}
    }
    return {
      update(dt){
        if(done)return;t-=dt;
        if(net&&net.live&&!net.amRH&&net.gAge()<1.5&&t<=0)t=0.01; /* the round host moves the timeline on */
        const alive=E.living().length;
        if(phase==='intro'){E.status('Wreck Island. First disaster in '+E.fmt(t));if(t<=0){phase='warn';wave=0;t=4;warn();}}
        else if(phase==='warn'){E.status('Incoming: '+cur.name+' in '+E.fmt(t));if(t<=0){phase='active';t=DUR;acc=0;lastN=null;if(cur.start)cur.start();}}
        else if(phase==='active'){E.status(cur.name+': '+cur.tip+'  '+E.fmt(t));cur.update(dt,1-t/DUR);R=Math.random;
          if(t<=0){if(cur.end)cur.end();for(const o of objs)E.remove(o);objs=[];wave++;if(wave>=order.length){win();return;}phase='calm';t=3.5;E.announce('It passed. Get ready...',2.5);}}
        else if(phase==='calm'){E.status('Wave '+(wave+1)+' of '+order.length+' is coming');if(t<=0){phase='warn';t=3.5;warn();}}
        for(const b of bots)if(b.alive)botThink(b,dt);
        E.score([{label:'Wave',value:Math.min(order.length,Math.max(1,wave+1))+' / '+order.length,color:0xffc93c},{label:'Still standing',value:alive,color:0x35d07f,me:true}]);
        if(!p.alive){done=true;if(cur&&phase==='active'&&cur.end)cur.end();E.after(1.2,()=>E.finish({win:false,title:'Wiped out',lines:['You made it to wave '+Math.max(1,wave+1)+' of '+order.length+'.']}));}
      },
      /* party: the round host says which disaster is on and how long is left; everyone else follows */
      netState(){return done?null:{w:wave,ph:phase,t:Math.round(t*10)/10,d:DUR,o:order.join(',')};},
      netApply(s){
        if(done||!s||typeof s!=='object')return;
        const o=String(s.o||'').split(',').filter(k=>D[k]);if(o.length&&o.join(',')!==order.join(',')){order.length=0;for(const k of o)order.push(k);}
        if(+s.d>0)DUR=+s.d;
        const w=s.w|0,ph=s.ph;if(['intro','warn','active','calm'].indexOf(ph)<0||w>=order.length||(ph!=='intro'&&w<0))return;
        if(w!==wave||ph!==phase){
          if(phase==='active'&&cur){if(cur.end)cur.end();for(const q of objs)E.remove(q);objs=[];}
          wave=w;phase=ph;
          if(ph==='warn')warn();else if(ph==='active'){cur=D[order[w]];acc=0;lastN=null;if(cur.start)cur.start();}else if(ph==='calm')E.announce('It passed. Get ready...',2.5);
          t=+s.t||0;}
        else if(Math.abs(t-(+s.t||0))>0.5)t=+s.t||0;
      },
      autopilot(dt){if(!p.brain){p.brain=new VG.Brain(p,E);p.brain.data.next=0;p.brain.skill=0.5;}botThink(p,dt);},
      dispose(){}
    };
    function warn(){cur=D[order[wave]];E.announce('Warning: '+cur.name+'!',3);E.sfx('alarm');}
    function win(){done=true;const hp=Math.round(p.hp),stars=hp>=70?3:hp>=35?2:1;E.finish({win:true,title:'You survived!',stars,lines:['All '+order.length+' disasters beaten with '+hp+' health left.',E.living(c=>c.isBot).length+' computer players made it too.']});}
  }
});
