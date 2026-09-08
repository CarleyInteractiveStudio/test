import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8097

def run_server():
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_timeout(2000)

    # Click start button if visible or invoke startExperience
    page.evaluate("if (typeof startExperience === 'function') startExperience();")
    page.wait_for_timeout(1000)

    # 1. Gift box opening stage (18s)
    page.evaluate("window.setAnimationTime(18.0)")
    page.wait_for_timeout(800)
    page.screenshot(path="verify_letter_envelope.png")

    # 2. Moon stage (24s)
    page.evaluate("window.setAnimationTime(24.0)")
    page.wait_for_timeout(800)
    page.screenshot(path="verify_letter_moon.png")

    # 3. Multiverse stage (72s)
    page.evaluate("window.setAnimationTime(72.0)")
    page.wait_for_timeout(800)
    page.screenshot(path="verify_letter_multiverse.png")

    # 4. Infinity stage (78s)
    page.evaluate("window.setAnimationTime(78.0)")
    page.wait_for_timeout(800)
    page.screenshot(path="verify_letter_infinity.png")

    browser.close()
print("Birthday letter verification screenshots captured successfully.")
