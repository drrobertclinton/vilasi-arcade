#!/usr/bin/env python3
"""Two-player test: two tabs linked by the test transport play one round together.
usage: python3 test/mp.py <game-id> [--secs 12] [--shots]"""
import argparse, http.server, json, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(ROOT, "test", "node_modules", "three", "build", "three.min.js")
ap = argparse.ArgumentParser(); ap.add_argument("game"); ap.add_argument("--secs", type=float, default=12); ap.add_argument("--shots", action="store_true"); ap.add_argument("--auto", action="store_true")
a = ap.parse_args()
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = {"A": [], "B": []}
def mk(ctx, tag, name):
    page = ctx.new_page()
    page.route("**/three.min.js", lambda r: r.fulfill(path=THREE, content_type="application/javascript"))
    page.route("**/fonts.googleapis.com/**", lambda r: r.abort()); page.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    page.on("pageerror", lambda e: errs[tag].append("PAGEERROR " + str(e)))
    page.on("console", lambda m: errs[tag].append("CONSOLE " + m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    page.add_init_script("try{localStorage.setItem('va_profile',JSON.stringify({name:'%s',color:%d}))}catch(e){}" % (name, 0xff4d5e if tag == "A" else 0x35d07f))
    page.goto("http://127.0.0.1:%d/index.html?fakenet=1#friends" % port); page.wait_for_timeout(700); return page
STATE = """()=>{const E=VG.current;if(!E)return null;const f=c=>({n:c.name,x:+c.pos.x.toFixed(1),y:+c.pos.y.toFixed(1),z:+c.pos.z.toFixed(1),hp:Math.round(c.hp),al:c.alive,ko:c.kos});
 return {t:+E.time.toFixed(1),over:E.over,host:VG.net.isHost(),boxes:E.world.boxes.size,me:f(E.player),remotes:E.remotes.map(f),bots:E.chars.filter(c=>c.isBot).map(c=>Object.assign(f(c),{i:c.botIdx,pup:!!c.puppet}))};}"""
ok = True
def check(c, msg):
    global ok
    print(("PASS " if c else "FAIL ") + msg); ok = ok and c
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    ctx = b.new_context(viewport={"width": 900, "height": 560})
    A = mk(ctx, "A", "Robert"); B = mk(ctx, "B", "Knox")
    if a.auto:
        A.evaluate("window.VG_AUTOPILOT=true"); B.evaluate("window.VG_AUTOPILOT=true")
    A.click("#mkParty"); A.wait_for_timeout(300)
    code = A.inner_text(".code"); print("party code", code)
    B.fill("#jcode", code); B.click("#joinForm button"); B.wait_for_timeout(900)
    check(A.locator(".people li").count() == 2 and B.locator(".people li").count() == 2, "both tabs list two people in the party")
    check(B.locator("#startBtn").count() == 0, "only the leader has the start button")
    A.click('[data-pick="%s"]' % a.game); A.wait_for_timeout(300); A.click("#startBtn")
    A.wait_for_timeout(3600); B.wait_for_timeout(300)
    sa, sb = A.evaluate(STATE), B.evaluate(STATE)
    check(bool(sa) and bool(sb), "the round started on both tabs")
    if not (sa and sb):
        print(errs); sys.exit(1)
    check(sa["boxes"] == sb["boxes"], "same map on both (boxes %d / %d)" % (sa["boxes"], sb["boxes"]))
    check(sa["host"] and not sb["host"], "A leads, B follows")
    # drive both by hand so the run is repeatable
    for pg in (A, B): pg.evaluate("VG.current.paused=true")
    if not a.auto: B.evaluate("VG.current.input.keys.add('w')")
    steps = int(a.secs * 30)
    for i in range(0, steps, 6):
        for pg in (A, B): pg.evaluate("()=>{const E=VG.current;if(E)for(let i=0;i<6;i++)E.step(1/30);}")
        A.wait_for_timeout(25)
    for i in range(8):
        for pg in (A, B): pg.evaluate("()=>{const E=VG.current;if(E)for(let i=0;i<3;i++)E.step(1/30);}")
        A.wait_for_timeout(40)
    sa, sb = A.evaluate(STATE), B.evaluate(STATE)
    check(len(sa["remotes"]) == 1 and len(sb["remotes"]) == 1, "each sees the other player")
    if sa["remotes"] and sb["remotes"]:
        ra, rb = sa["remotes"][0], sb["remotes"][0]
        d1 = abs(ra["x"] - sb["me"]["x"]) + abs(ra["z"] - sb["me"]["z"]) + abs(ra["y"] - sb["me"]["y"])
        d2 = abs(rb["x"] - sa["me"]["x"]) + abs(rb["z"] - sa["me"]["z"]) + abs(rb["y"] - sa["me"]["y"])
        check(d1 < 3 and d2 < 3, "positions agree (off by %.1f and %.1f)" % (d1, d2))
        check(ra["n"] == "Knox" and rb["n"] == "Robert", "names shown: %s / %s" % (ra["n"], rb["n"]))
    if sa["bots"]:
        bm = {x["i"]: x for x in sb["bots"]}; worst = 0; miss = 0
        for x in sa["bots"]:
            y = bm.get(x["i"])
            if not y: miss += 1; continue
            if x["al"] and y["al"]: worst = max(worst, abs(x["x"] - y["x"]) + abs(x["z"] - y["z"]))
        check(miss == 0 and len(sa["bots"]) == len(sb["bots"]), "same computer players on both (%d / %d)" % (len(sa["bots"]), len(sb["bots"])))
        check(worst < 4, "computer players are in the same places (worst gap %.1f)" % worst)
        check(all(x["pup"] for x in sb["bots"]) and not any(x["pup"] for x in sa["bots"]), "the leader's device runs them")
    # a hit from A on B's player must land on B's own device
    hp0 = B.evaluate("VG.current.player.hp"); al0 = B.evaluate("VG.current.player.alive")
    res = A.evaluate("()=>{const E=VG.current,c=E.remotes[0];return c?E.damage(c,20,E.player):null;}")
    for i in range(10):
        for pg in (A, B): pg.evaluate("()=>{const E=VG.current;if(E)for(let i=0;i<3;i++)E.step(1/30);}")
        A.wait_for_timeout(40)
    hp1 = B.evaluate("VG.current.player.hp")
    print("hit sent:", res, "| B hp", hp0, "->", hp1, "| alive before", al0)
    if a.shots:
        A.screenshot(path=os.path.join(ROOT, "test", "mp-%s-A.png" % a.game)); B.screenshot(path=os.path.join(ROOT, "test", "mp-%s-B.png" % a.game))
    print("A:", json.dumps(sa)[:600]); print("B:", json.dumps(sb)[:600])
    for k in errs:
        for e in errs[k][:8]: print("ERR", k, e)
    check(not errs["A"] and not errs["B"], "no page errors")
    b.close()
print("RESULT", "OK" if ok else "FAILED"); sys.exit(0 if ok else 1)
