#!/usr/bin/env python3
"""Click through the hub like a player: tile -> game page -> Play -> move/jump/fire -> pause -> exit -> ideas box."""
import functools, http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.path.join(ROOT, "test", "node_modules", "three", "build", "three.min.js")
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    page = b.new_page(viewport={"width": 1100, "height": 680})
    page.route("**/three.min.js", lambda r: r.fulfill(path=THREE, content_type="application/javascript"))
    page.route("**/fonts.g*/**", lambda r: r.abort())
    page.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    page.on("console", lambda m: errs.append("CONSOLE " + m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    page.goto("http://127.0.0.1:%d/index.html" % srv.server_address[1]); page.wait_for_timeout(400)
    gid = sys.argv[1] if len(sys.argv) > 1 else "wreck-island"
    page.click('[data-game="%s"]' % gid); page.wait_for_timeout(200)
    print("hash", page.evaluate("location.hash"), "| title", page.inner_text("aside h1"))
    page.screenshot(path=os.path.join(ROOT, "test", "flow-page.png"))
    page.click("#playBtn"); page.wait_for_timeout(1500)
    page.mouse.click(550, 340); page.keyboard.down("w"); page.wait_for_timeout(1200); page.keyboard.press("Space"); page.wait_for_timeout(600)
    page.keyboard.up("w"); page.keyboard.press("f"); page.wait_for_timeout(500)
    print("in game:", page.evaluate("({t:+VG.current.time.toFixed(1),pos:VG.current.player.pos.toArray().map(v=>+v.toFixed(1)),shots:VG.current.shots.length,locked:VG.current.input.locked,fps:1})"))
    page.screenshot(path=os.path.join(ROOT, "test", "flow-game.png"))
    page.keyboard.press("Escape"); page.wait_for_timeout(300)
    print("paused:", page.evaluate("VG.current.paused"))
    page.click('.vg-pause [data-a="exit"]'); page.wait_for_timeout(300)
    print("after exit: current", page.evaluate("VG.current"), "stage on", page.evaluate("VG.stage.classList.contains('on')"))
    page.click('.rail [data-go="ideas-box"]'); page.fill("#itext", "Test idea: add a volcano"); page.click(".send"); page.wait_for_timeout(11500)
    print("idea status:", page.inner_text("#istat"))
    page.click('.rail [data-go="more-games"]'); page.wait_for_timeout(100); print("more games cards:", page.locator(".card").count())
    page.click('.rail [data-go="my-player"]'); page.fill("#pname", "Knox"); page.wait_for_timeout(100); print("me:", page.inner_text("#meName"))
    b.close()
print("errors:", len(errs))
for e in errs[:15]: print("  ", e[:400])
