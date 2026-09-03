import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const widths = [320, 375, 430, 768, 1024, 1280, 1440];

async function checkPage(page, path, label) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30000 });
  // Skip splash redirect for home
  if (path === "/") {
    await page.evaluate(() => localStorage.setItem("wandr_onboarded", "1"));
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  }

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientW = doc.clientWidth;

    const tabs = [...document.querySelectorAll("button")].filter((b) =>
      ["Overview", "Menu", "Reviews", "Info"].includes(b.textContent?.trim())
    );
    let tabOverlap = false;
    for (let i = 0; i < tabs.length - 1; i++) {
      const a = tabs[i].getBoundingClientRect();
      const b = tabs[i + 1].getBoundingClientRect();
      if (a.right > b.left + 2) tabOverlap = true;
    }

    const email = document.querySelector('input[type="email"]');
    let inputPadOk = null;
    if (email) {
      const cs = getComputedStyle(email);
      inputPadOk = parseFloat(cs.paddingLeft) >= 36;
    }

    const maxW3 = [...document.querySelectorAll("*")].some((el) => {
      const c = el.className;
      return typeof c === "string" && c.includes("max-w-3xl") && el.closest("main, .page-shell");
    });

    return {
      overflowX: scrollW > clientW + 1,
      scrollW,
      clientW,
      tabOverlap,
      inputPadOk,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim()?.slice(0, 40) || null,
    };
  });

  return { label, ...result };
}

const browser = await chromium.launch({ headless: true });
const report = [];

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.addInitScript(() => localStorage.setItem("wandr_onboarded", "1"));

  report.push(await checkPage(page, "/login", `login@${w}`));
  report.push(await checkPage(page, "/", `home@${w}`));
  report.push(await checkPage(page, "/cafe/16", `detail@${w}`));

  await page.close();
}

await browser.close();

const problems = report.filter(
  (r) => r.overflowX || r.tabOverlap || r.inputPadOk === false
);

console.log(JSON.stringify({ ok: problems.length === 0, problems, sample: report.filter((_, i) => i % 3 === 0 || i < 6) }, null, 2));
console.log("\n--- FULL ---");
for (const r of report) {
  const flags = [
    r.overflowX ? "OVERFLOW_X" : "ok-x",
    r.tabOverlap ? "TAB_OVERLAP" : "",
    r.inputPadOk === false ? "INPUT_PAD" : r.inputPadOk === true ? "pad-ok" : "",
  ]
    .filter(Boolean)
    .join(" ");
  console.log(`${r.label}: ${flags} (${r.clientW}px) h1="${r.h1}"`);
}
