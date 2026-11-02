import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.resolve(__dirname, "../docs/screens");
const rootScreensDir = path.resolve(__dirname, "../../docs/screens");

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}
if (!fs.existsSync(rootScreensDir)) {
  fs.mkdirSync(rootScreensDir, { recursive: true });
}

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error("Server timeout connecting to " + url));
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handleMsg = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handleMsg);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      } catch (err) {
        reject(err);
      }
    };
    ws.addEventListener("message", handleMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(ws, expression) {
  const res = await sendCDP(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return res.result?.value;
}

async function takeScreenshot(ws, filename) {
  const res = await sendCDP(ws, "Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const buf = Buffer.from(res.data, "base64");
  const localPath = path.join(screensDir, filename);
  const rootPath = path.join(rootScreensDir, filename);
  fs.writeFileSync(localPath, buf);
  fs.writeFileSync(rootPath, buf);
  console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const port = 4199;
  const chromePort = 9339;
  const tmpUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cap2-"));

  console.log(`Starting preview server on port ${port}...`);
  const preview = spawn(
    "npx",
    ["vite", "preview", "--port", String(port), "--host", "127.0.0.1", "--strictPort"],
    {
      cwd: path.resolve(__dirname, ".."),
      shell: true,
      stdio: "pipe",
    }
  );

  preview.stdout.on("data", (d) => process.stdout.write(d));
  preview.stderr.on("data", (d) => process.stderr.write(d));

  let chrome = null;

  try {
    await waitForServer(`http://127.0.0.1:${port}/`);
    console.log(`Preview server running at http://127.0.0.1:${port}/`);

    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    console.log("Launching headless Chrome...");
    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${tmpUserDataDir}`,
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1440,1080",
        `http://127.0.0.1:${port}/?user=usr-001&tab=all&info=true`,
      ],
      { stdio: "inherit" }
    );

    await waitForServer(`http://127.0.0.1:${chromePort}/json/list`);
    console.log("Chrome debugging port ready.");

    const targetsRes = await fetch(`http://127.0.0.1:${chromePort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) throw new Error("No page target found");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res) => ws.addEventListener("open", res));
    console.log("Connected to Chrome via CDP WebSocket.");

    await sendCDP(ws, "Page.enable");
    await sendCDP(ws, "Runtime.enable");

    // 1. Dashboard (1440x950) with User info bar open
    await sendCDP(ws, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(2000);
    await takeScreenshot(ws, "dashboard.png");

    // 2. Loans tab with 3 groups (Active, Eligible, Not eligible)
    console.log("Switching to Loans tab...");
    await evalJs(ws, `
      const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('Loans'));
      if (tab) tab.click();
    `);
    await sleep(1500);
    await takeScreenshot(ws, "loans-groups.png");

    // 3. Loan details with calculator (click Home Loan details button)
    console.log("Opening Loan Details with Calculator...");
    await evalJs(ws, `
      const card = Array.from(document.querySelectorAll('.card')).find(c => c.querySelector('.card-title')?.textContent.includes('Home Loan'));
      const btn = card?.querySelector('.cta');
      if (btn) btn.click();
    `);
    await sleep(1500);
    await takeScreenshot(ws, "calculator.png");

    // Close details dialog
    console.log("Closing Loan Details...");
    await evalJs(ws, `
      const closeBtn = document.querySelector('.dialog-footer button, .btn-close, [aria-label*="Close"]');
      if (closeBtn) closeBtn.click();
    `);
    await sleep(800);

    // 4. Compare dialog: switch to All tab, select 3 products, open compare
    console.log("Switching to All tab and selecting products for comparison...");
    await evalJs(ws, `
      const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('All'));
      if (tab) tab.click();
    `);
    await sleep(1000);
    await evalJs(ws, `
      const checkboxes = document.querySelectorAll('.card-compare input[type="checkbox"]');
      if (checkboxes.length >= 3) {
        checkboxes[0].click();
        checkboxes[1].click();
        checkboxes[2].click();
      }
    `);
    await sleep(1000);
    await evalJs(ws, `
      const compareBtn = document.querySelector('.compare-btn');
      if (compareBtn) compareBtn.click();
    `);
    await sleep(1200);
    await takeScreenshot(ws, "compare.png");

    // Close compare modal
    console.log("Closing Compare Modal...");
    await evalJs(ws, `
      const closeBtn = document.querySelector('button[aria-label="Close comparison"]');
      if (closeBtn) closeBtn.click();
      window.scrollTo(0, 0);
    `);
    await sleep(800);

    // 5. Mobile view (390x844)
    console.log("Capturing Mobile View...");
    await sendCDP(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1500);
    await takeScreenshot(ws, "mobile.png");

    console.log("All screenshots captured successfully!");
    ws.close();
  } finally {
    if (chrome) {
      try {
        process.kill(chrome.pid);
      } catch (e) {}
    }
    try {
      process.kill(preview.pid);
    } catch (e) {}
    try {
      fs.rmSync(tmpUserDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
