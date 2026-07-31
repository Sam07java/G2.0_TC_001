const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'input', 'raw');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const RUNTIME_DIR = path.join(ROOT, 'runtime', 'imports');
const READY_DIR = path.join(ROOT, 'output', 'import-ready');
const REPORT_DIR = path.join(ROOT, 'output', 'reports');
const REJECT_DIR = path.join(ROOT, 'output', 'rejected');
for (const dir of [RAW_DIR, RUNTIME_DIR, READY_DIR, REPORT_DIR, REJECT_DIR]) fs.mkdirSync(dir, { recursive: true });

const modules = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'modules.json'), 'utf8')).modules;
const aliasConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'aliases.json'), 'utf8'));
const memoryPath = path.join(ROOT, 'config', 'mapping-memory.json');
const mappingMemory = fs.existsSync(memoryPath) ? JSON.parse(fs.readFileSync(memoryPath, 'utf8')) : {};

const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const report = {
  runId,
  startedAt: new Date().toISOString(),
  engine: 'GyanSetu ADSE Intelligent Data Preparation Engine v4',
  rawSources: [],
  modules: [],
  totals: { rawRows: 0, acceptedRows: 0, rejectedRows: 0, duplicatesRemoved: 0, correctedValues: 0 }
};

function norm(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compact(value) { return norm(value).replace(/\s+/g, ''); }
function nonEmptyRow(row) { return Object.values(row).some(v => String(v ?? '').trim() !== ''); }
function safeName(value) { return String(value).replace(/[^a-z0-9._-]+/gi, '-'); }

function readTemplate(module) {
  const file = path.join(TEMPLATE_DIR, module.template);
  const wb = XLSX.readFile(file, { raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!matrix.length) throw new Error(`Empty template: ${module.template}`);
  return matrix[0].map(v => String(v).replace(/^\uFEFF/, '').trim());
}

function sourceFiles() {
  return fs.readdirSync(RAW_DIR)
    .filter(f => !f.startsWith('.') && /\.(xlsx|xls|csv)$/i.test(f))
    .map(f => path.join(RAW_DIR, f));
}

function loadDatasets(file) {
  const wb = XLSX.readFile(file, { raw: false, cellDates: false });
  const datasets = [];
  for (const sheetName of wb.SheetNames) {
    if (/^(readme|instructions?|notes?|summary)$/i.test(String(sheetName).trim())) continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', raw: false });
    if (!rows.length) continue;
    datasets.push({ file, sheetName, headers: Object.keys(rows[0]), rows: rows.filter(nonEmptyRow) });
  }
  return datasets;
}

function aliasesFor(target) {
  const targetNorm = norm(target);
  const targetCompact = compact(target);
  const aliases = new Set([targetNorm, targetCompact]);
  for (const [key, values] of Object.entries(aliasConfig.global || {})) {
    if (norm(key) === targetNorm || compact(key) === targetCompact) {
      for (const v of values) aliases.add(norm(v));
    }
  }
  return aliases;
}

function tokenSimilarity(a, b) {
  const aa = new Set(norm(a).split(' ').filter(Boolean));
  const bb = new Set(norm(b).split(' ').filter(Boolean));
  if (!aa.size || !bb.size) return 0;
  const intersection = [...aa].filter(x => bb.has(x)).length;
  return intersection / Math.max(aa.size, bb.size);
}

function bestHeader(target, headers, used) {
  const targetNorm = norm(target);
  const mem = mappingMemory[targetNorm];
  if (mem) {
    const remembered = headers.find(h => norm(h) === norm(mem) && !used.has(h));
    if (remembered) return { header: remembered, confidence: 1, method: 'memory' };
  }

  const aliases = aliasesFor(target);
  let best = null;
  for (const header of headers) {
    if (used.has(header)) continue;
    const hn = norm(header);
    let score = 0;
    let method = 'fuzzy';
    if (hn === targetNorm || compact(header) === compact(target)) { score = 1; method = 'exact'; }
    else if (aliases.has(hn) || aliases.has(compact(header))) { score = 0.96; method = 'alias'; }
    else score = tokenSimilarity(target, header) * 0.82;
    if (!best || score > best.confidence) best = { header, confidence: score, method };
  }
  return best && best.confidence >= 0.48 ? best : null;
}

function classificationScore(dataset, module, templateHeaders) {
  const sheet = norm(dataset.sheetName);
  let score = 0;
  if ((module.sheetAliases || []).some(a => sheet === norm(a))) score += 8;
  else if ((module.sheetAliases || []).some(a => sheet.includes(norm(a)) || norm(a).includes(sheet))) score += 4;
  const headerNorms = new Set(dataset.headers.map(norm));
  for (const target of templateHeaders) {
    const aliases = aliasesFor(target);
    if ([...aliases].some(a => headerNorms.has(a))) score += 1;
  }
  for (const req of module.required || []) {
    const aliases = aliasesFor(req);
    if ([...aliases].some(a => headerNorms.has(a))) score += 1.5;
  }
  return score;
}

function classify(dataset, moduleSchemas) {
  const scores = moduleSchemas.map(ms => ({ module: ms.module, headers: ms.headers, score: classificationScore(dataset, ms.module, ms.headers) }))
    .sort((a, b) => b.score - a.score);
  if (!scores.length || scores[0].score < 2) return { status: 'UNCLASSIFIED', candidates: scores.slice(0, 3) };
  if (scores[1] && scores[0].score - scores[1].score < 1 && scores[0].score < 7) {
    return { status: 'AMBIGUOUS', candidates: scores.slice(0, 3) };
  }
  return { status: 'CLASSIFIED', ...scores[0], candidates: scores.slice(0, 3) };
}

function cleanPhone(v) {
  let digits = String(v ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

function parseDateValue(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(s)) {
    const p = s.split(/[\/-]/).map(Number);
    let day = p[0], month = p[1], year = p[2];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return s;
}

function titleCase(v) {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeValue(header, value) {
  const original = String(value ?? '').trim();
  const h = compact(header);
  if (!original) return '';
  if (/phone|contact|mobile|aadhaar/.test(h)) return cleanPhone(original);
  if (/date|dob|joining/.test(h)) return parseDateValue(original);
  if (/gender/.test(h)) {
    const n = norm(original);
    if (['m', 'male', 'boy'].includes(n)) return 'Male';
    if (['f', 'female', 'girl'].includes(n)) return 'Female';
    if (['other', 'others', 'transgender'].includes(n)) return 'Other';
  }
  if (/yesno|isactive|ishostelopted|minority|disability|singleparent|onlychild|onlygirlchild|transfercase|belongs/.test(h)) {
    return ['yes', 'y', 'true', '1', 'active'].includes(norm(original)) ? 'yes' : 'no';
  }
  if (h === 'status') {
    const n = norm(original);
    if (n === 'maintenance') return 'maintenance';
    if (['inactive', 'disabled'].includes(n)) return 'inactive';
    return 'active';
  }
  if (/amount|salary|distance|time|capacity|experience|age|year|percentage|height|weight/.test(h)) {
    const n = original.replace(/[^0-9.-]/g, '');
    return n || original;
  }
  if (/email/.test(h)) return original.toLowerCase();
  if (/name|class|section|category|make|model|color|fuel|designation|qualification|religion|caste|nationality|address|location|city|state|bloodgroup/.test(h)) return titleCase(original);
  return original.replace(/\s+/g, ' ');
}

function deriveValue(target, raw, mapped) {
  const t = norm(target);
  const byNorm = Object.fromEntries(Object.entries(raw).map(([k, v]) => [norm(k), v]));
  if (t === 'admit class' && mapped['Current Class']) return mapped['Current Class'];
  if (t === 'current class' && mapped['Admit Class']) return mapped['Admit Class'];
  if (t === 'admit section' && (byNorm.section || mapped['Current Section'])) return byNorm.section || mapped['Current Section'];
  if (t === 'current section' && (byNorm.section || mapped['Admit Section'])) return byNorm.section || mapped['Admit Section'];
  if (t === 'mobile number') return byNorm['contact number'] || byNorm.mobile || byNorm.phone || '';
  if (t === 'contact') return byNorm['contact number'] || byNorm.mobile || byNorm.phone || '';
  if (t === 'monthly fee yes no') return 'yes';
  if (t === 'active yes no') return 'yes';
  if (t === 'isactive') return 'true';
  return '';
}

function buildMapping(templateHeaders, datasetHeaders) {
  const used = new Set();
  const mapping = {};
  const details = [];
  for (const target of templateHeaders) {
    const match = bestHeader(target, datasetHeaders, used);
    if (match) {
      mapping[target] = match.header;
      used.add(match.header);
      details.push({ target, source: match.header, confidence: match.confidence, method: match.method });
    } else {
      mapping[target] = null;
      details.push({ target, source: '', confidence: 0, method: 'derived-or-empty' });
    }
  }
  return { mapping, details };
}

function rowKey(row, fields) { return fields.map(f => norm(row[f])).join('|'); }

function validateRecord(module, record, rowNumber) {
  const errors = [];
  for (const field of module.required || []) {
    if (!String(record[field] ?? '').trim()) errors.push(`Mandatory field '${field}' is empty`);
  }
  for (const [field, value] of Object.entries(record)) {
    if (/phone|contact|mobile/.test(compact(field)) && value && !/^\d{10}$/.test(String(value))) errors.push(`'${field}' must contain 10 digits`);
    if (/email/.test(compact(field)) && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) errors.push(`'${field}' is not a valid email`);
  }
  return errors.map(error => ({ rowNumber, error }));
}

function writeCsv(headers, rows, file) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  fs.writeFileSync(file, XLSX.utils.sheet_to_csv(ws), 'utf8');
}

function clearGenerated() {
  for (const dir of [RUNTIME_DIR, READY_DIR, REJECT_DIR]) {
    for (const f of fs.readdirSync(dir)) if (!f.startsWith('.')) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
}

clearGenerated();
const moduleSchemas = modules.map(module => ({ module, headers: readTemplate(module) }));
const datasets = [];
for (const file of sourceFiles()) {
  const loaded = loadDatasets(file);
  report.rawSources.push({ file: path.relative(ROOT, file), datasets: loaded.map(d => d.sheetName) });
  datasets.push(...loaded);
}
if (!datasets.length) throw new Error(`No CSV/XLS/XLSX raw data found in ${RAW_DIR}`);

const grouped = new Map(modules.map(m => [m.id, []]));
const unclassified = [];
for (const ds of datasets) {
  report.totals.rawRows += ds.rows.length;
  const result = classify(ds, moduleSchemas);
  if (result.status === 'CLASSIFIED') grouped.get(result.module.id).push(ds);
  else unclassified.push({ dataset: ds, classification: result });
}

const combinedWb = XLSX.utils.book_new();
const rejectedWb = XLSX.utils.book_new();
const manifest = { runId, generatedAt: new Date().toISOString(), files: [], noDataModules: [], unclassifiedDatasets: [] };
const acceptedByModule = {};

for (const schema of moduleSchemas) {
  const { module, headers } = schema;
  const sourceSets = grouped.get(module.id) || [];
  const moduleReport = {
    id: module.id,
    name: module.name,
    status: sourceSets.length ? 'PROCESSING' : 'NO_DATA',
    sources: sourceSets.map(s => `${path.basename(s.file)} :: ${s.sheetName}`),
    rawRows: sourceSets.reduce((a, s) => a + s.rows.length, 0),
    acceptedRows: 0,
    rejectedRows: 0,
    duplicatesRemoved: 0,
    correctedValues: 0,
    mappings: []
  };
  report.modules.push(moduleReport);
  if (!sourceSets.length) {
    manifest.noDataModules.push(module.id);
    continue;
  }

  const accepted = [];
  const rejected = [];
  const seen = new Set();

  for (const ds of sourceSets) {
    const built = buildMapping(headers, ds.headers);
    moduleReport.mappings.push({ source: `${path.basename(ds.file)} :: ${ds.sheetName}`, fields: built.details });
    ds.rows.forEach((raw, index) => {
      const record = {};
      for (const target of headers) {
        const source = built.mapping[target];
        const rawValue = source ? raw[source] : deriveValue(target, raw, record);
        const cleaned = normalizeValue(target, rawValue);
        if (String(rawValue ?? '').trim() !== String(cleaned ?? '').trim()) moduleReport.correctedValues++;
        record[target] = cleaned;
      }
      // Second derivation pass handles cross-field dependencies.
      for (const target of headers) if (!record[target]) record[target] = normalizeValue(target, deriveValue(target, raw, record));

      const errors = validateRecord(module, record, index + 2);
      const keyFields = module.unique || [];
      const key = rowKey(record, keyFields);
      if (keyFields.length && key && seen.has(key)) {
        moduleReport.duplicatesRemoved++;
        rejected.push({ ...record, __Source: `${path.basename(ds.file)} :: ${ds.sheetName}`, __RawRow: index + 2, __Reason: `Duplicate by ${keyFields.join(', ')}` });
        return;
      }
      if (errors.length) {
        rejected.push({ ...record, __Source: `${path.basename(ds.file)} :: ${ds.sheetName}`, __RawRow: index + 2, __Reason: errors.map(e => e.error).join('; ') });
        return;
      }
      if (keyFields.length && key) seen.add(key);
      accepted.push(record);
    });
  }

  acceptedByModule[module.id] = accepted;
  moduleReport.acceptedRows = accepted.length;
  moduleReport.rejectedRows = rejected.length;
  moduleReport.status = accepted.length ? 'READY' : 'REJECTED_ALL';
  report.totals.acceptedRows += accepted.length;
  report.totals.rejectedRows += rejected.length;
  report.totals.duplicatesRemoved += moduleReport.duplicatesRemoved;
  report.totals.correctedValues += moduleReport.correctedValues;

  if (accepted.length) {
    const readyFile = path.join(READY_DIR, module.output);
    const runtimeFile = path.join(RUNTIME_DIR, module.output);
    writeCsv(headers, accepted, readyFile);
    fs.copyFileSync(readyFile, runtimeFile);
    XLSX.utils.book_append_sheet(combinedWb, XLSX.utils.json_to_sheet(accepted, { header: headers }), module.name.slice(0, 31));
    manifest.files.push({ module: module.id, file: module.output, rows: accepted.length, runtimePath: path.relative(ROOT, runtimeFile) });
  }
  if (rejected.length) {
    const rejectFile = path.join(REJECT_DIR, `${safeName(module.name)}-rejected.csv`);
    writeCsv(Object.keys(rejected[0]), rejected, rejectFile);
    XLSX.utils.book_append_sheet(rejectedWb, XLSX.utils.json_to_sheet(rejected), module.name.slice(0, 26) + '-Rejected');
  }
}

// Deterministic dependency validation after all module files are prepared.
const dependencyIssues = [];
if (acceptedByModule.students?.length) {
  const classes = new Set((acceptedByModule.classes || []).map(r => norm(r.name)));
  if (classes.size) {
    for (const [index, student] of acceptedByModule.students.entries()) {
      for (const field of ['Current Class', 'Admit Class']) {
        if (!classes.has(norm(student[field]))) dependencyIssues.push({ module: 'students', row: index + 2, field, value: student[field], issue: 'Referenced class is absent from prepared Classes data' });
      }
    }
  }
}
report.dependencyIssues = dependencyIssues;

for (const item of unclassified) {
  manifest.unclassifiedDatasets.push({
    file: path.relative(ROOT, item.dataset.file),
    sheet: item.dataset.sheetName,
    rows: item.dataset.rows.length,
    status: item.classification.status,
    candidates: item.classification.candidates.map(c => ({ module: c.module.id, score: c.score }))
  });
}

if (combinedWb.SheetNames.length) XLSX.writeFile(combinedWb, path.join(READY_DIR, 'GyanSetu_Import_Ready_Data.xlsx'));
if (rejectedWb.SheetNames.length) XLSX.writeFile(rejectedWb, path.join(REJECT_DIR, 'Rejected_Rows.xlsx'));

report.finishedAt = new Date().toISOString();
report.status = dependencyIssues.length || report.totals.rejectedRows || unclassified.length ? 'READY_WITH_REVIEW' : 'READY';
fs.writeFileSync(path.join(RUNTIME_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(REPORT_DIR, `preparation-${runId}.json`), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(REPORT_DIR, 'latest-preparation.json'), JSON.stringify(report, null, 2));

const rowsHtml = report.modules.map(m => `<tr><td>${m.name}</td><td>${m.status}</td><td>${m.rawRows}</td><td>${m.acceptedRows}</td><td>${m.rejectedRows}</td><td>${m.duplicatesRemoved}</td><td>${m.correctedValues}</td></tr>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>GyanSetu ADSE Preparation Report</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#172033}h1{margin-bottom:4px}.status{font-weight:700}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #d8deea;padding:10px;text-align:left}th{background:#17365d;color:white}.cards{display:flex;gap:12px;flex-wrap:wrap}.card{border:1px solid #d8deea;border-radius:10px;padding:14px;min-width:150px}.warn{background:#fff7df;padding:12px;border-radius:8px;margin-top:18px}</style></head><body><h1>GyanSetu ADSE — Data Preparation</h1><p>Run ${runId} · <span class="status">${report.status}</span></p><div class="cards"><div class="card"><b>Raw rows</b><br>${report.totals.rawRows}</div><div class="card"><b>Accepted</b><br>${report.totals.acceptedRows}</div><div class="card"><b>Rejected</b><br>${report.totals.rejectedRows}</div><div class="card"><b>Duplicates removed</b><br>${report.totals.duplicatesRemoved}</div><div class="card"><b>Values normalized</b><br>${report.totals.correctedValues}</div></div>${dependencyIssues.length ? `<div class="warn"><b>Dependency review:</b> ${dependencyIssues.length} issue(s). See JSON report.</div>` : ''}${unclassified.length ? `<div class="warn"><b>Unclassified:</b> ${unclassified.length} dataset(s). See JSON report.</div>` : ''}<table><thead><tr><th>Module</th><th>Status</th><th>Raw</th><th>Ready</th><th>Rejected</th><th>Duplicates</th><th>Corrected</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
fs.writeFileSync(path.join(REPORT_DIR, `preparation-${runId}.html`), html);
fs.writeFileSync(path.join(REPORT_DIR, 'latest-preparation.html'), html);

console.log(`\nGyanSetu preparation status: ${report.status}`);
console.log(`Raw rows: ${report.totals.rawRows}`);
console.log(`Import-ready rows: ${report.totals.acceptedRows}`);
console.log(`Rejected rows: ${report.totals.rejectedRows}`);
for (const m of report.modules) console.log(`- ${m.name}: ${m.status} (${m.acceptedRows} ready)`);
console.log(`\nFiles delivered to: ${READY_DIR}`);
console.log(`ADSE runtime files: ${RUNTIME_DIR}`);
console.log(`Report: ${path.join(REPORT_DIR, 'latest-preparation.html')}`);

if (process.argv.includes('--validate-only')) process.exit(report.status === 'READY' ? 0 : 2);
