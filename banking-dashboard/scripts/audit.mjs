import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on("error", () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error("Server timeout"));
      } else {
        setTimeout(check, 400);
      }
    };

    check();
  });
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd} ${args.join(" ")}`);
    const proc = spawn(cmd, args, {
      shell: true,
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

async function main() {
  const port = 4185;
  console.log(`Starting preview server on port ${port}...`);
  const preview = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
    cwd: process.cwd(),
    shell: true,
    stdio: "pipe",
  });

  preview.stdout.on("data", (data) => process.stdout.write(data));
  preview.stderr.on("data", (data) => process.stderr.write(data));

  const url = `http://localhost:${port}/`;

  try {
    await waitForServer(url);
    console.log(`Preview server is up at ${url}!`);

    // 1. Mobile Lighthouse run
    console.log("\n--- Running Mobile Lighthouse ---");
    await runCommand("npx", [
      "lighthouse",
      url,
      "--chrome-flags=\"--headless=new --no-sandbox\"",
      "--only-categories=accessibility,best-practices,seo,performance",
      "--output=json",
      "--output-path=lighthouse-mobile.json",
      "--quiet",
    ]);

    // 2. Desktop Lighthouse run
    console.log("\n--- Running Desktop Lighthouse ---");
    await runCommand("npx", [
      "lighthouse",
      url,
      "--preset=desktop",
      "--chrome-flags=\"--headless=new --no-sandbox\"",
      "--only-categories=accessibility,best-practices,seo,performance",
      "--output=json",
      "--output-path=lighthouse-desktop.json",
      "--quiet",
    ]);

    // Read results
    const mob = JSON.parse(fs.readFileSync("lighthouse-mobile.json", "utf-8"));
    const desk = JSON.parse(fs.readFileSync("lighthouse-desktop.json", "utf-8"));

    console.log("\n================ LIGHTHOUSE RESULTS ================");
    console.log("Category         | Mobile Score | Desktop Score | Target");
    console.log("-----------------+--------------+---------------+-------");
    const categories = ["performance", "accessibility", "best-practices", "seo"];
    categories.forEach((cat) => {
      const mScore = Math.round((mob.categories[cat]?.score || 0) * 100);
      const dScore = Math.round((desk.categories[cat]?.score || 0) * 100);
      const target = cat === "seo" ? ">= 90" : ">= 95 (or 90 for perf)";
      console.log(
        `${cat.padEnd(16)} | ${String(mScore).padStart(12)} | ${String(dScore).padStart(13)} | ${target}`
      );
    });
    console.log("====================================================\n");
  } finally {
    console.log("Stopping preview server...");
    preview.kill();
    // On windows ensure killed
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", preview.pid, "/f", "/t"]);
    }
  }
}

main().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
