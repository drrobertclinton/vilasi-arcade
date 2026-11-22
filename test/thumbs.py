#!/usr/bin/env python3
"""Capture a tile picture for each game: thumbs/<id>.jpg (640x400), taken from a real moment of play."""
import functools, http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(ROOT, "test", "node_modules", "three", "build", "three.min.js")
# id -> (seconds to fast-forward, level, camera position, look-at point)
SHOTS = {
    "wreck-island": (9, 2, (58, 34, 66), (0, 5, -4)),
    "hull-breach": (14, 4, (70, 46, 70), (0, 4, 0)),
    "nine-rooms": (10, 4, (30, 40, 42), (0, 0, 3)),
    "rubble-royale": (20, 3, (70, 44, 80), (0, 4, 0)),
    "skyline-sprint": (9, 2, (30, 30, 40), (0, 8, 0)),
    "steal-a-creator": (45, 1, (40, 30, 46), (0, 2, 0)),
    "grow-a-kaiju": (56, 1, (58, 40, 70), (0, 5, 0)),
    "last-elevator": (20, 1, None, None),
    "mountain-nights": (40, 1, None, None),
}
only = sys.argv[1:]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
os.makedirs(os.path.join(ROOT, "thumbs"), exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    page = b.new_page(viewport={"width": 640, "height": 400}, device_scale_factor=1)
    page.route("**/three.min.js", lambda r: r.fulfill(path=THREE, content_type="application/javascript"))
    page.route("**/fonts.g*/**", lambda r: r.abort())
    page.goto("http://127.0.0.1:%d/index.html" % srv.server_address[1])
    page.wait_for_timeout(500)
    for gid, (sec, level, cp, ct) in SHOTS.items():
        if only and gid not in only: continue
        if not page.evaluate("id=>!!VG.byId[id]", gid):
            print("skip (not registered):", gid); continue
        page.evaluate("window.VG_AUTOPILOT=true")
        page.evaluate("([id,l])=>{VG.play(id,l);VG.current.paused=true;}", [gid, level])
        page.evaluate("""([sec,cp,ct])=>{const E=VG.current;for(let i=0;i<sec*30;i++){try{E.step(1/30);}catch(e){break;}}
          if(cp){E.camera.position.set(cp[0],cp[1],cp[2]);E.camera.lookAt(ct[0],ct[1],ct[2]);if(E.sky)E.sky.position.copy(E.camera.position);
            if(E.shadows){const c=E.sun.shadow.camera;c.left=c.bottom=-150;c.right=c.top=150;c.far=500;c.updateProjectionMatrix();E.sun.target.position.set(ct[0],ct[1],ct[2]);E.sun.position.set(ct[0]+E.sunDir.x*220,ct[1]+E.sunDir.y*220,ct[2]+E.sunDir.z*220);E.sun.target.updateMatrixWorld();}}
          E.hud.el.style.display='none';document.querySelectorAll('body *').forEach(n=>{if(n.tagName!=='CANVAS'&&!n.contains(E.renderer.domElement)&&getComputedStyle(n).position!=='static'&&n.closest&&E.host.contains(n))n.style.display='none';});E.renderer.render(E.scene,E.camera);}""", [sec, list(cp) if cp else None, list(ct) if ct else None])
        out = os.path.join(ROOT, "thumbs", gid + ".jpg")
        page.screenshot(path=out, type="jpeg", quality=82)
        print("saved", out, os.path.getsize(out))
    b.close()
