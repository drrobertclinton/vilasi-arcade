import http.server, socketserver, threading, functools, os, sys
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE=os.path.join(ROOT,"test","node_modules","three","build","three.min.js")
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
srv=socketserver.TCPServer(("127.0.0.1",0),functools.partial(Q,directory=ROOT));threading.Thread(target=srv.serve_forever,daemon=True).start()
ok=True
def check(c,m):
    global ok; print(("PASS " if c else "FAIL ")+m); ok=ok and c
with sync_playwright() as p:
    b=p.chromium.launch(channel="chrome",headless=True,args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"])
    pg=b.new_page(viewport={"width":1000,"height":640});errs=[]
    pg.route("**/three.min.js",lambda r:r.fulfill(path=THREE,content_type="application/javascript"))
    pg.route("**/fonts.g*/**",lambda r:r.abort())
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://127.0.0.1:%d/index.html"%srv.server_address[1]);pg.wait_for_timeout(600)
    pg.evaluate("try{localStorage.removeItem('va_blocks_v1')}catch(e){};VG.play('vilasi-blocks');VG.current.paused=true")
    pg.wait_for_timeout(800)
    step="n=>{const E=VG.current;for(let i=0;i<n;i++)E.step(1/30);}"
    # build a sand column floating in the air, plus gravel on top
    r=pg.evaluate("""()=>{const g=VG.current.game._t,x=(g.pos.x|0)+3,z=(g.pos.z|0)+3;let top=0;for(let y=g.WY-1;y>0;y--)if(g.get(x,y,z)){top=y;break;}
      const y0=top+6;g.setBlock(x,y0,z,5);g.setBlock(x,y0+1,z,5);g.setBlock(x,y0+2,z,12);return [x,top,z,y0];}""")
    x,top,z,y0=r
    pg.evaluate(step,90)
    col=pg.evaluate("([x,z,t])=>{const g=VG.current.game._t;return [1,2,3,4,5,6,7,8,9].map(k=>g.get(x,t+k,z));}",[x,z,top])
    check(col[:3]==[5,5,12] and col[3:]==[0]*6, "sand and gravel placed in the air fell and stacked on the ground %s"%col[:4])
    # break the block under the stack: the stack drops one
    pg.evaluate("([x,z,t])=>{const g=VG.current.game._t;g.setBlock(x,t,z,0);}",[x,z,top])
    pg.evaluate(step,60)
    col=pg.evaluate("([x,z,t])=>{const g=VG.current.game._t;return [0,1,2,3].map(k=>g.get(x,t+k,z));}",[x,z,top])
    check(col==[5,5,12,0],"breaking the block underneath made the whole stack drop %s"%col)
    check(pg.evaluate("VG.current.game._t.fallers.length")==0,"no blocks left in mid-air")
    # sound: walking and breaking make no sfx
    calls=pg.evaluate("""()=>{const E=VG.current,g=E.game._t,c=[];const o=E.sfx;E.sfx=n=>c.push(n);E.input.keys.add('w');for(let i=0;i<60;i++)E.step(1/30);E.input.keys.delete('w');
      E.sfx=o;return c;}""")
    check('tick' not in calls,"walking makes no click sound %s"%calls)
    # water: put the player in the sea next to the beach and push toward land
    res=pg.evaluate("""()=>{const E=VG.current,g=E.game._t;const SEA=15;
      for(let z=4;z<g.WZ-4;z++)for(let x=4;x<g.WX-4;x++){if(g.get(x,SEA,z)===10&&g.get(x,SEA-1,z)===10&&g.get(x+1,SEA+1,z)===0&&g.get(x+1,SEA,z)!==10&&g.get(x+1,SEA,z)!==0&&g.get(x+1,SEA+2,z)===0&&g.get(x+1,SEA+3,z)===0&&g.get(x,SEA+2,z)===0){
        g.pos.set(x+0.5,SEA-0.5,z+0.5);E.cam.yaw=-Math.PI/2;E.input.keys.add('d');E.input.keys.delete('d');E.input.keys.add('w');
        for(let i=0;i<150;i++)E.step(1/30);E.input.keys.delete('w');for(let i=0;i<20;i++)E.step(1/30);return [x,z,g.pos.x,g.pos.y,g.get(Math.floor(g.pos.x),Math.floor(g.pos.y),Math.floor(g.pos.z))];}}return null;}""")
    print(res)
    check(res is not None and res[2]>res[0]+1.3 and res[3]>=15.9 and res[4]!=10,"swimming into the shore climbs out onto land without flying")
    for e in errs[:5]:print("ERR",e)
    check(not errs,"no page errors")
print("RESULT","OK" if ok else "FAILED")
