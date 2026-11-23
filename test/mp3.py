#!/usr/bin/env python3
"""Nine Rooms with three people (no computer players), and the public server."""
import http.server, os, socketserver, sys, threading, functools, json
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
S = "()=>{const E=VG.current;if(!E)return null;return {role:E.player.data.role,alive:E.player.alive,bots:E.chars.filter(c=>c.isBot&&c.alive).length,remotes:E.remotes.map(c=>({role:c.data.role,alive:c.alive,tag:c.tag.visible})),over:E.over,title:E.hud.$.end.querySelector('h2').textContent,status:E.hud.$.status.textContent,tools:E.player.tools};}"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    ctx = b.new_context(viewport={"width": 800, "height": 500})
    P = [mk(ctx, n) for n in ("Robert", "Knox", "Sam")]
    P[0].click("#mkParty"); P[0].wait_for_timeout(300); code = P[0].inner_text(".code")
    for pg in P[1:]:
        pg.fill("#jcode", code); pg.click("#joinForm button")
    P[0].wait_for_timeout(1200)
    P[0].click('[data-pick="nine-rooms"]'); P[0].wait_for_timeout(300); P[0].click("#startBtn"); P[0].wait_for_timeout(4200); run(P, 2)
    st = [pg.evaluate(S) for pg in P]
    roles = sorted(s["role"] for s in st)
    check(all(st) and roles == ["detective", "guest", "phantom"], "three people get three roles: %s" % roles)
    check(all(s["bots"] == 0 for s in st), "no computer players in the round")
    check(all(len(s["remotes"]) == 2 and not any(r["tag"] for r in s["remotes"]) for s in st), "each sees the two others, names hidden")
    agree = all(sorted([s["role"]] + [r["role"] for r in s["remotes"]]) == roles for s in st)
    check(agree, "all three devices agree on who is who")
    ph = next(i for i, s in enumerate(st) if s["role"] == "phantom"); gu = next(i for i, s in enumerate(st) if s["role"] == "guest"); de = next(i for i, s in enumerate(st) if s["role"] == "detective")
    # a guest cannot hurt anyone; the phantom zaps the guest
    r0 = P[gu].evaluate("()=>{const E=VG.current;return E.damage(E.remotes[0],999,E.player);}")
    check(r0 is False, "a guest cannot zap anyone")
    P[ph].evaluate("()=>{const E=VG.current,c=E.remotes.find(c=>c.data.role==='guest');E.damage(c,999,E.player);}"); run(P, 2)
    st = [pg.evaluate(S) for pg in P]
    check(st[gu]["alive"] is False and not st[gu]["over"], "the Phantom zaps the Guest out, round goes on: %s" % st[gu]["status"][:40])
    # the detective catches the phantom
    P[de].evaluate("()=>{const E=VG.current,c=E.remotes.find(c=>c.data.role==='phantom');E.damage(c,999,E.player);}"); run(P, 3)
    st = [pg.evaluate(S) for pg in P]
    check(all(s["over"] for s in st), "catching the Phantom ends the round for everyone")
    print("titles:", [s["title"] for s in st])
    check(st[ph]["title"] == "The Phantom was caught" and st[de]["title"] == "Phantom caught!" and st[gu]["title"] == "Phantom caught!", "each side sees the right result")
    for pg in P: pg.evaluate("VG.exit();VG.net.leave()")
    # public server
    A, B = P[0], P[1]
    A.wait_for_timeout(400); A.click("#pubBtn"); B.click("#pubBtn"); A.wait_for_timeout(1200)
    check(A.locator(".people li").count() == 2 and B.locator("#startBtn").count() == 1, "public server: both listed, both can start")
    names = A.locator(".people li span").all_inner_texts(); print("names shown:", names)
    check(all(n.startswith("Player ") for n in names), "typed names are hidden on the public server")
    B.click('[data-pick="rubble-royale"]'); B.wait_for_timeout(300); B.click("#startBtn"); B.wait_for_timeout(4200); run([A, B], 2)
    ra = A.evaluate("()=>VG.current?{n:VG.current.remotes.length,name:VG.current.remotes[0]&&VG.current.remotes[0].name}:null"); rb = B.evaluate("()=>VG.current?{n:VG.current.remotes.length}:null")
    check(ra and rb and ra["n"] == 1 and rb["n"] == 1 and ra["name"].startswith("Player "), "a round started by the second player runs for both: %s %s" % (ra, rb))
    for e in errs[:10]: print("ERR", e)
    check(not errs, "no page errors")
    b.close()
print("RESULT", "OK" if ok else "FAILED")
