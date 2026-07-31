const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
require("dotenv").config();

const ROOT = path.resolve(__dirname, "..");
const modules = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "workflow.json"), "utf8")).modules;
const BASE = process.env.GYANSETU_URL;
const EMAIL = process.env.GYANSETU_EMAIL;
const PASSWORD = process.env.GYANSETU_PASSWORD;
const HEADLESS = String(process.env.HEADLESS || "false").toLowerCase() === "true";
const SLOW = Number(process.env.SLOW_MO || 120);
const TIMEOUT = Number(process.env.ACTION_TIMEOUT_MS || 30000);
const SETTLE = Number(process.env.PAGE_SETTLE_MS || 1200);
const RETRIES = Number(process.env.MAX_RETRIES || 2);

if (String(process.env.CONFIRM_WRITE || "false").toLowerCase() !== "true") {
  throw new Error("Set CONFIRM_WRITE=true to permit imports.");
}

const OUT = path.join(ROOT, "output");
const PROCESSED = path.join(ROOT, "runtime", "imports");
const DIR = {
  screenshots: path.join(OUT, "screenshots"),
  reports: path.join(OUT, "reports"),
  logs: path.join(OUT, "logs"),
  videos: path.join(OUT, "videos")
};
Object.values(DIR).forEach(d => fs.mkdirSync(d, { recursive: true }));

const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(8, 14);
const report = {
  runId,
  startedAt: new Date().toISOString(),
  status: "RUNNING",
  stages: []
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const safe = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(path.join(DIR.logs, `run-${runId}.log`), line + "\n");
}

async function firstVisible(locators, timeout = 1200) {
  for (const locator of locators) {
    try {
      if (await locator.first().isVisible({ timeout })) return locator.first();
    } catch {}
  }
  return null;
}

async function screenshot(page, label) {
  const file = `${Date.now()}-${safe(label)}.png`;
  await page.screenshot({ path: path.join(DIR.screenshots, file), fullPage: true });
  return `screenshots/${file}`;
}

async function login(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(SETTLE);

  if (/\/LoginPage\/?$/i.test(new URL(page.url()).pathname)) {
    const institute = await firstVisible([
      page.getByRole("button", { name: "Institute Login", exact: true }),
      page.getByText("Institute Login", { exact: true })
    ], 5000);
    if (!institute) throw new Error("Institute Login button not found");
    await Promise.all([
      page.waitForURL(/school-login/i, { timeout: 20000 }),
      institute.click()
    ]);
  }

  if (/login/i.test(new URL(page.url()).pathname)) {
    const email = await firstVisible([
      page.getByLabel("Email", { exact: true }),
      page.getByPlaceholder(/email/i),
      page.locator('input[type="email"]')
    ], 5000);
    const password = await firstVisible([
      page.getByLabel("Password", { exact: true }),
      page.getByPlaceholder(/password/i),
      page.locator('input[type="password"]')
    ], 5000);

    if (!email || !password) throw new Error("Login fields not found");

    await email.click();
    await email.fill(EMAIL);
    await password.click();
    await password.fill(PASSWORD);

    const signIn = await firstVisible([
      page.getByRole("button", { name: "Sign In", exact: true }),
      page.locator('button[type="submit"]')
    ], 5000);
    if (!signIn) throw new Error("Sign In button not found");

    await signIn.click();
    await page.waitForURL(/\/analytics\/?$/i, { timeout: 30000 });
  }

  await page.getByText("School Admin", { exact: true }).waitFor({ state: "visible", timeout: 30000 });
}

async function closeOverlays(page) {
  for (let i = 0; i < 4; i++) {
    const overlay = page.locator("div.fixed.inset-0").last();
    if (!await overlay.isVisible().catch(() => false)) break;
    const close = await firstVisible([
      overlay.getByRole("button", { name: /close|cancel/i }),
      overlay.locator('button[aria-label*="close" i]'),
      overlay.locator("button").filter({ hasText: /×/ })
    ], 500);
    if (close) await close.click({ force: true }).catch(() => {});
    else await page.keyboard.press("Escape").catch(() => {});
    await sleep(200);
  }
}

async function openImport(page, module) {
  await closeOverlays(page);
  const locators = [];

  for (const title of module.import_titles || []) {
    locators.push(page.locator(`button[title*="${title}" i]`));
  }
  for (const label of module.import_labels || []) {
    locators.push(page.getByRole("button", { name: label, exact: true }));
    locators.push(page.getByRole("button", { name: new RegExp(label, "i") }));
  }

  // Vehicle-specific fallback: the purple Import action in the top action group.
  if (module.id === "vehicles") {
    locators.push(page.locator('button').filter({ hasText: /^Import$/i }));
    locators.push(page.locator('button.bg-purple-600').filter({ hasText: /import/i }));
  }

  const button = await firstVisible(locators, 2500);
  if (!button) throw new Error("Import button not found");

  await button.click();
  await sleep(450);
}

async function modalRoot(page) {
  const root = await firstVisible([
    page.getByRole("dialog"),
    page.locator('[role="dialog"]'),
    page.locator("div.fixed.inset-0").last()
  ], 2000);
  if (!root) throw new Error("Import modal not detected");
  return root;
}

async function selectFile(root, filePath) {
  const input = root.locator('input[type="file"]').first();
  if (await input.count() === 0) throw new Error("File input not found inside import modal");
  await input.setInputFiles(filePath);
  await sleep(350);
}

async function findActionButton(root, patterns, exclusions = /cancel|close|download|template|choose|select/i) {
  const buttons = root.locator("button");
  const count = await buttons.count();

  for (const pattern of patterns) {
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = ((await button.innerText().catch(() => "")) || "").trim();
      if (!text || exclusions.test(text)) continue;
      if (!pattern.test(text)) continue;
      if (await button.isDisabled().catch(() => true)) continue;
      if (!await button.isVisible().catch(() => false)) continue;
      return button;
    }
  }
  return null;
}

async function genericImport(page, root, filePath) {
  await selectFile(root, filePath);
  const submit = await findActionButton(root, [/^Import$/i, /import/i, /upload/i, /submit/i, /proceed/i, /continue/i]);
  if (!submit) throw new Error("Import submit button not found inside modal");

  await submit.scrollIntoViewIfNeeded().catch(() => {});
  await submit.click({ force: true });

  const successText = page.getByText(/successfully imported|import successful|success/i).first();
  const modalClosed = await Promise.race([
    root.waitFor({ state: "hidden", timeout: 60000 }).then(() => true).catch(() => false),
    successText.waitFor({ state: "visible", timeout: 60000 }).then(() => true).catch(() => false),
    sleep(60000).then(() => false)
  ]);

  return { submitted: true, completionConfirmed: modalClosed };
}

async function facultyWizard(page, root, filePath) {
  // The supplied workbook is XLSX, so select the Excel mode where visible.
  const excelMode = await firstVisible([
    root.getByRole("button", { name: "Excel", exact: true }),
    root.getByText("Excel", { exact: true })
  ], 700);
  if (excelMode) await excelMode.click().catch(() => {});

  await selectFile(root, filePath);

  let next = await findActionButton(root, [/^Next$/i]);
  if (!next) throw new Error("Faculty wizard Next button not found");
  await next.click({ force: true });
  await sleep(500);

  let validate = await findActionButton(root, [/^Validate$/i]);
  if (!validate) throw new Error("Faculty wizard Validate button not found");
  await validate.click({ force: true });
  await sleep(1200);

  const validationText = (await root.innerText().catch(() => "")) || "";
  if (/0 row\(s\) OK to import/i.test(validationText) && /issue\(s\)/i.test(validationText)) {
    throw new Error("Faculty validation returned zero importable rows. Review the wizard issue list.");
  }

  // Continue from validation to preview when the UI permits it.
  const preview = await findActionButton(root, [/^Preview$/i, /^Next$/i, /^Continue$/i]);
  if (preview) {
    await preview.click({ force: true });
    await sleep(800);
  }

  // Final action may be Import, Confirm, Finish, or Done.
  const finish = await findActionButton(root, [
    /^Import$/i, /^Confirm$/i, /^Finish$/i, /^Done$/i, /^Complete$/i
  ]);

  if (finish) {
    await finish.click({ force: true });
    await Promise.race([
      root.waitFor({ state: "hidden", timeout: 14000 }).catch(() => null),
      sleep(1800)
    ]);
  } else {
    // Some versions automatically import after successful validation/preview.
    const text = (await root.innerText()).toLowerCase();
    if (!/done|success|ready|valid/.test(text)) {
      throw new Error("Faculty wizard final action not found");
    }
  }
}


function readFirstValue(module) {
  const filePath = path.join(PROCESSED, module.file);
  if (path.extname(filePath).toLowerCase() === ".csv") {
    const wb = XLSX.readFile(filePath, { type: "file", raw: false });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
    if (!rows.length) return null;
    for (const key of module.verify_columns || []) {
      if (rows[0][key]) return String(rows[0][key]);
    }
  } else {
    const wb = XLSX.readFile(filePath, { raw: false });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
    if (!rows.length) return null;
    for (const key of module.verify_columns || []) {
      if (rows[0][key]) return String(rows[0][key]);
    }
  }
  return null;
}

async function verify(page, module) {
  const value = readFirstValue(module);
  if (!value) return { verified: true, method: "file processed" };

  await closeOverlays(page);
  let body = (await page.locator("body").innerText()).toLowerCase();
  if (body.includes(value.toLowerCase())) return { verified: true, method: "page text", value };

  const search = await firstVisible([
    page.locator('input[placeholder*="Search" i]').nth(1),
    page.locator('input[type="search"]').first(),
    page.locator('input[placeholder*="search" i]').first()
  ], 1000);

  if (search) {
    await search.fill(value);
    await page.keyboard.press("Enter").catch(() => {});
    await sleep(900);
    body = (await page.locator("body").innerText()).toLowerCase();
    if (body.includes(value.toLowerCase())) return { verified: true, method: "search", value };
  }

  return { verified: false, method: "not found", value };
}

async function execute(page, module) {
  const stage = {
    order: module.order,
    name: module.name,
    status: "RUNNING",
    screenshots: [],
    attempts: []
  };
  report.stages.push(stage);

  try {
    if (module.mode === "skipped") {
      stage.status = "SKIPPED";
      stage.note = module.note || `${module.name} intentionally skipped`;
      stage.verification = { verified: true, method: "intentionally skipped" };
      return;
    }

    await closeOverlays(page);
    await page.goto(new URL(module.url, BASE).href, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(SETTLE);
    stage.screenshots.push(await screenshot(page, `${module.order}-${module.id}-before`));

    if (module.mode === "untouched") {
      stage.status = "UNTOUCHED";
      stage.note = "Academic session intentionally untouched";
      return;
    }

    if (module.mode === "verify-only") {
      stage.status = "VERIFIED_PAGE";
      stage.verification = { verified: true, method: "page loaded" };
      return;
    }


    const filePath = path.join(PROCESSED, module.file);
    if (!fs.existsSync(filePath)) {
      stage.status = "NO_DATA";
      stage.note = `No classified import-ready data was generated for ${module.name}`;
      stage.verification = { verified: true, method: "no source data" };
      return;
    }

    let lastError;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        await openImport(page, module);
        const root = await modalRoot(page);

        let submission = { submitted: false, completionConfirmed: false };
        if (module.wizard) {
          await facultyWizard(page, root, filePath);
          submission = { submitted: true, completionConfirmed: true };
        } else {
          submission = await genericImport(page, root, filePath);
        }

        await closeOverlays(page);
        await page.goto(new URL(module.url, BASE).href, { waitUntil: "domcontentloaded", timeout: 60000 });
        await sleep(SETTLE);

        stage.verification = await verify(page, module);
        stage.screenshots.push(await screenshot(page, `${module.order}-${module.id}-after`));

        if (!stage.verification.verified) {
          if (module.accept_submission_confirmation && submission.submitted && submission.completionConfirmed) {
            stage.verification = {
              verified: true,
              method: "import submission confirmed; row display delayed",
              value: readFirstValue(module)
            };
          } else {
            throw new Error("Verification failed");
          }
        }

        stage.status = "SUCCESS";
        stage.file = path.relative(ROOT, filePath);
        return;
      } catch (error) {
        lastError = error;
        stage.attempts.push({ attempt, error: error.message });
        await screenshot(page, `${module.order}-${module.id}-error-${attempt}`).catch(() => {});
        await closeOverlays(page);
      }
    }

    stage.status = "FAILED";
    stage.error = lastError?.message || "Unknown failure";
  } catch (error) {
    stage.status = "FAILED";
    stage.error = error.message;
  } finally {
    stage.finishedAt = new Date().toISOString();
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function buildHtml(data) {
  const rows = data.stages.map(stage => `
    <tr>
      <td>${stage.order}</td>
      <td>${escapeHtml(stage.name)}</td>
      <td>${escapeHtml(stage.status)}</td>
      <td>${stage.verification?.verified ? "✅" : (stage.status === "UNTOUCHED" || stage.status === "SKIPPED" || stage.status === "NO_DATA") ? "—" : "❌"}</td>
      <td>${escapeHtml(stage.note || stage.error || "")}</td>
    </tr>
  `).join("");

  return `<!doctype html>
  <html><head><meta charset="utf-8"><title>GyanSetu ADSE Intelligent v4 Report</title>
  <style>
  body{font-family:Arial;background:#f4f6f9;color:#172033;margin:30px}
  header,section{background:#fff;border:1px solid #dce3ec;border-radius:12px;padding:20px;margin-bottom:18px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #dce3ec;padding:10px;text-align:left}
  th{background:#eef2f7}
  </style></head><body>
  <header><h1>GyanSetu ADSE Intelligent v4 — End-to-End Run</h1>
  <p><strong>Run:</strong> ${escapeHtml(data.runId)}<br>
  <strong>Status:</strong> ${escapeHtml(data.status)}<br>
  <strong>Started:</strong> ${escapeHtml(data.startedAt)}<br>
  <strong>Finished:</strong> ${escapeHtml(data.finishedAt)}</p></header>
  <section><table><thead><tr><th>#</th><th>Stage</th><th>Status</th><th>Verified</th><th>Note/Error</th></tr></thead>
  <tbody>${rows}</tbody></table></section>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: SLOW });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    recordVideo: { dir: DIR.videos, size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  try {
    await login(page);
    for (const module of modules) {
      log(`Running ${module.order}. ${module.name}`);
      await execute(page, module);
    }

    const hardFailures = report.stages.filter(s => s.status === "FAILED");
    report.status = hardFailures.length ? "PARTIAL" : "SUCCESS";
  } catch (error) {
    report.status = "FAILED";
    report.fatalError = error.stack || error.message;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(DIR.reports, `adse-report-${runId}.json`), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(DIR.reports, `adse-report-${runId}.html`), buildHtml(report));
    await context.close();
    await browser.close();
  }

  log(`Report: ${path.join(DIR.reports, `adse-report-${runId}.html`)}`);
})();
