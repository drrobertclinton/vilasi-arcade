#!/usr/bin/env python3
"""Party flow test: play again, a friend leaving, joining a round late, leader leaving."""
import http.server, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(ROOT, "test", "node_modules", "three", "build", "three.min.js")
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = []; ok = True
def check(c, msg):
    global ok
    print(("PASS " if c else "FAIL ") + msg); ok = ok and c
def mk(ctx, name):
    page = ctx.new_page()
    page.route("**/three.min.js", lambda r: r.fulfill(path=THREE, content_type="application/javascript"))
    page.route("**/fonts.googleapis.com/**", lambda r: r.abort()); page.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    page.on("pageerror", lambda e: errs.append(name + " PAGEERROR " + str(e)))
    page.on("console", lambda m: errs.append(name + " CONSOLE " + m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    page.add_init_script("try{localStorage.setItem('va_profile',JSON.stringify({name:'%s',color:3505279}))}catch(e){}" % name)
    page.goto("http://127.0.0.1:%d/index.html?fakenet=1#friends" % port); page.wait_for_timeout(700); return page
def run(pages, secs=1.5):
    for i in range(int(secs * 10)):
        for pg in pages: pg.evaluate("()=>{const E=VG.current;if(E){E.paused=true;for(let i=0;i<3;i++)E.step(1/30);}}")
        pages[0].wait_for_timeout(30)
R = "()=>VG.current?{r:VG.net.cur&&VG.net.cur.r,n:VG.current.remotes.length,boxes:VG.current.world.boxes.size,host:VG.net.isHost(),rh:VG.net.amRH,bots:VG.current.chars.filter(c=>c.isBot&&c.puppet&&!c.removed).length}:null"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    ctx = b.new_context(viewport={"width": 800, "height": 500})
    A = mk(ctx, "Robert"); B = mk(ctx, "Knox")
    A.click("#mkParty"); A.wait_for_timeout(300); code = A.inner_text(".code")
    B.fill("#jcode", code); B.click("#joinForm button"); B.wait_for_timeout(800)
    A.click('[data-pick="rubble-royale"]'); A.wait_for_timeout(300); A.click("#startBtn"); A.wait_for_timeout(4000); run([A, B])
    a1, b1 = A.evaluate(R), B.evaluate(R)
    check(a1 and b1 and a1["r"] == b1["r"] and a1["n"] == 1 and b1["n"] == 1, "round 1 running for both: %s %s" % (a1, b1))
    # leader presses play again
    A.evaluate("VG.net.start('rubble-royale')"); A.wait_for_timeout(4000); run([A, B])
    a2, b2 = A.evaluate(R), B.evaluate(R)
    check(a2 and b2 and a2["r"] == b2["r"] and a2["r"] != a1["r"] and a2["n"] == 1 and b2["n"] == 1 and a2["boxes"] == b2["boxes"], "play again restarts both in a new round: %s %s" % (a2, b2))
    # a third player arrives late and joins the running round
    C = mk(ctx, "Sam"); C.fill("#jcode", code); C.click("#joinForm button"); C.wait_for_timeout(4000); run([A, B, C])
    c2 = C.evaluate(R); a3 = A.evaluate(R)
    check(c2 and c2["r"] == a2["r"] and c2["n"] == 2 and a3["n"] == 2, "a late friend drops into the round: %s / leader sees %s" % (c2, a3["n"]))
    # friend leaves the round
    B.evaluate("VG.exit()"); B.wait_for_timeout(600); A.wait_for_timeout(3400); run([A, C])
    check(B.evaluate("location.hash") == "#friends" and B.locator(".code").count() == 1, "leaving a round returns to the party page")
    check(A.evaluate(R)["n"] == 1, "the friend disappears from the leader's round")
    # leader closes the tab: someone else takes over and their computer players wake up
    A.close(); C.wait_for_timeout(7000); run([C])
    c3 = C.evaluate(R)
    check(c3 and c3["rh"] and c3["bots"] == 0, "when the leader leaves, a player still in the round runs the computer players: %s" % c3)
    B.wait_for_timeout(300); check(B.evaluate("VG.net.isHost()") or C.evaluate("VG.net.isHost()"), "the party gets a new leader")
    # solo play still works while in a party
    B.evaluate("location.hash='play-wreck-island'"); B.wait_for_timeout(300); B.click("#playBtn"); B.wait_for_timeout(1500)
    check(B.evaluate("!!VG.current&&!VG.current.net"), "solo play still starts without the party")
    for e in errs[:10]: print("ERR", e)
    check(not errs, "no page errors")
    b.close()
print("RESULT", "OK" if ok else "FAILED")
