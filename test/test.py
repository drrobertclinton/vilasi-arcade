#!/usr/bin/env python3
"""Headless smoke test for one arcade game.

usage: python3 test.py <game-id> [--level N] [--ff SECONDS] [--shot out.png] [--keys w,d] [--at SECONDS] [--auto]

Loads the hub in headless Chrome, starts the game, optionally holds keys, fast-forwards the
simulation by SECONDS of game time (stepping the engine directly, much faster than real time),
then prints errors, a state summary and saves a screenshot. --at takes extra screenshots at
those fast-forward times (comma separated). Exit code 1 if any page error was seen.
"""
import argparse, http.server, json, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(ROOT, "test", "node_modules", "three", "build", "three.min.js")

ap = argparse.ArgumentParser()
ap.add_argument("game")
ap.add_argument("--level", type=int, default=1)
ap.add_argument("--ff", type=float, default=20)
ap.add_argument("--shot", default=None)
ap.add_argument("--keys", default="")
ap.add_argument("--at", default="")
ap.add_argument("--size", default="1100x680")
ap.add_argument("--hub", action="store_true", help="only load the hub and screenshot it")
ap.add_argument("--auto", action="store_true", help="autopilot: the game drives the player (game.autopilot)")
a = ap.parse_args()

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

errors, logs = [], []
w, h = [int(v) for v in a.size.split("x")]
shot = a.shot or os.path.join(ROOT, "test", "shot-%s.png" % a.game)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    page = b.new_page(viewport={"width": w, "height": h})
    page.route("**/three.min.js", lambda r: r.fulfill(path=THREE, content_type="application/javascript"))
    page.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    page.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    page.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    page.on("console", lambda m: (errors if m.type == "error" else logs).append(m.type.upper() + " " + m.text))
    page.goto("http://127.0.0.1:%d/index.html" % port)
    page.wait_for_timeout(600)
    if a.hub:
        page.screenshot(path=shot)
        print("games registered:", page.evaluate("VG.games.map(g=>g.id)"))
    else:
        ok = page.evaluate("id=>!!VG.byId[id]", a.game)
        if not ok:
            print("GAME NOT REGISTERED:", a.game, "| registered:", page.evaluate("VG.games.map(g=>g.id)"))
            print("\n".join(errors)); sys.exit(1)
        if a.auto: page.evaluate("window.VG_AUTOPILOT=true")
        page.evaluate("([id,l])=>{VG.play(id,l);VG.current.paused=true;}", [a.game, a.level])
        for k in [k for k in a.keys.split(",") if k]:
            page.evaluate("k=>VG.current.input.keys.add(k)", k)
        marks = sorted(float(x) for x in a.at.split(",") if x)
        done = 0.0
        def ff(sec):
            return page.evaluate("""sec=>{const E=VG.current;let n=Math.round(sec*30),err=null;
              for(let i=0;i<n;i++){try{E.step(1/30);}catch(e){err=String(e&&e.stack||e);break;}}
              E.renderer.render(E.scene,E.camera);return err;}""", sec)
        for m in marks + [a.ff]:
            if m > done:
                err = ff(m - done); done = m
                if err: errors.append("STEP ERROR at t=%.1f: %s" % (m, err)); break
            if m != a.ff or m in marks:
                page.screenshot(path=shot.replace(".png", "-%d.png" % int(m)))
        page.screenshot(path=shot)
        state = page.evaluate("""()=>{const E=VG.current,p=E.player;return {time:+E.time.toFixed(1),over:E.over,level:E.level,
          player:{alive:p.alive,hp:Math.round(p.hp),pos:[+p.pos.x.toFixed(1),+p.pos.y.toFixed(1),+p.pos.z.toFixed(1)],tools:p.tools},
          chars:E.chars.length,alive:E.chars.filter(c=>c.alive).length,boxes:E.world.boxes.size,shots:E.shots.length,
          status:E.hud.$.status.textContent,endTitle:E.over?E.hud.$.end.querySelector('h2').textContent:null,
          bots:E.chars.filter(c=>c.isBot).slice(0,12).map(c=>({n:c.name,a:c.alive,hp:Math.round(c.hp),p:[Math.round(c.pos.x),Math.round(c.pos.y),Math.round(c.pos.z)],kos:c.kos}))};}""")
        bots = state.pop("bots")
        print(json.dumps(state))
        for bt in bots: print("   bot", json.dumps(bt))
    b.close()
errors = [e for e in errors if "ERR_FAILED" not in e and "Failed to load resource" not in e and "thumbs/" not in e]
print("screenshot:", shot)
print("errors:", len(errors))
for e in errors[:25]: print("  ", e[:600])
sys.exit(1 if errors else 0)
