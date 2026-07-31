#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'input', 'raw');
const OUT = path.join(ROOT, 'output');
const READY = path.join(OUT, 'import-ready');
const REJECTED = path.join(OUT, 'rejected');
const REPORTS = path.join(OUT, 'reports');
const TEMPLATES = path.join(ROOT, 'templates');
const CONFIG = path.join(ROOT, 'config');

for (const p of [INPUT, READY, REJECTED, REPORTS]) fs.mkdirSync(p, { recursive: true });

const schemas = JSON.parse(fs.readFileSync(path.join(CONFIG, 'schemas.json'), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(path.join(CONFIG, 'aliases.json'), 'utf8'));
const modulesCfg = JSON.parse(fs.readFileSync(path.join(CONFIG, 'modules.json'), 'utf8')).modules;

const MODULE_ORDER = ['classes','vehicles','routes','fees','faculty','students'];
const SHEET_PATTERNS = {
  classes: [/^classes?_raw$/i, /^classes?$/i],
  sections: [/^sections?_raw$/i, /^sections?$/i],
  students: [/student/i, /learner/i, /pupil/i],
  faculty: [/faculty/i, /teacher/i, /staff/i],
  vehicles: [/vehicle/i, /fleet/i, /bus/i],
  routes: [/route/i],
  fees: [/fee/i]
};

function norm(s) {
  return String(s ?? '').trim().toLowerCase().replace(/[₹$]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function clean(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return formatDate(v);
  return String(v).replace(/\s+/g,' ').trim();
}
function formatDate(v) {
  if (!v) return '';
  let d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) {
    const m = String(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (!m) return clean(v);
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${String(m[1]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${y}`;
  }
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function yesNo(v, fallback='no') {
  const n=norm(v);
  if (['active','yes','y','true','1','enabled','monthly'].includes(n)) return 'yes';
  if (['inactive','no','n','false','0','disabled'].includes(n)) return 'no';
  return fallback;
}
function status(v) {
  const n=norm(v);
  if (['inactive','disabled','no','false','0'].includes(n)) return 'Inactive';
  return 'Active';
}
function slug(v) {
  return norm(v).replace(/\s+/g,'.').replace(/[^a-z0-9.]/g,'');
}
function digits(v) { return clean(v).replace(/\D/g, ''); }
function phone(v) {
  let d=digits(v);
  if (d.length===12 && d.startsWith('91')) d=d.slice(2);
  if (d.length===11 && d.startsWith('0')) d=d.slice(1);
  return d.length===10 ? d : '';
}
function gender(v, fallback='Other') {
  const n=norm(v);
  if (['m','male','man','boy'].includes(n)) return 'Male';
  if (['f','female','woman','girl'].includes(n)) return 'Female';
  if (['other','others','non binary','transgender','third gender'].includes(n)) return 'Other';
  return fallback;
}
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const t=clean(v);
  let m=t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    let y=Number(m[3]); if (y<100) y += y>30 ? 1900 : 2000;
    const d=new Date(y,Number(m[2])-1,Number(m[1]));
    return Number.isNaN(d.getTime())?null:d;
  }
  const d=new Date(t); return Number.isNaN(d.getTime())?null:d;
}
function ageFromDob(v, asOf=new Date()) {
  const d=parseDate(v); if (!d) return '';
  let a=asOf.getFullYear()-d.getFullYear();
  const md=asOf.getMonth()-d.getMonth();
  if (md<0 || (md===0 && asOf.getDate()<d.getDate())) a--;
  return a>=0 && a<120 ? String(a) : '';
}
function stableCode(prefix, rowIndex, seed='') {
  const base=(slug(seed).replace(/\./g,'').toUpperCase().slice(0,6)||prefix);
  return `${prefix}-${base}-${String(rowIndex+1).padStart(5,'0')}`;
}
function normalizeClass(v) {
  const t=clean(v); if (!t) return '';
  const m=t.match(/(?:class|grade)?\s*(\d{1,2})/i);
  return m ? `Class ${Number(m[1])}` : t.replace(/\b\w/g,c=>c.toUpperCase());
}
function normalizeSection(v) {
  const t=clean(v).replace(/^section\s*/i,'');
  return t ? t.toUpperCase() : '';
}
function loadTemplate(id) {
  const cfg=modulesCfg.find(m=>m.id===id);
  const wb=XLSX.readFile(path.join(TEMPLATES,cfg.template), {raw:false});
  return Object.keys(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''})[0] || {});
}
function templateHeaders(id) {
  const cfg=modulesCfg.find(m=>m.id===id);
  const text=fs.readFileSync(path.join(TEMPLATES,cfg.template),'utf8').replace(/^\uFEFF/,'');
  return text.split(/\r?\n/)[0].split(',').map(x=>x.replace(/^"|"$/g,''));
}
function classify(sheetName, headers) {
  for (const [id, regs] of Object.entries(SHEET_PATTERNS)) if (regs.some(r=>r.test(sheetName))) return id;
  const h=new Set(headers.map(norm));
  const scores={
    students:['admission no','student full name','father name','current class'],
    faculty:['employee id','designation','qualification','monthly salary'],
    vehicles:['registration number','vehicle type','fuel type'],
    routes:['route name','start point','end point','distance km'],
    fees:['fee name','amount','frequency'],
    classes:['class name','academic session','level'],
    sections:['section name','class name','capacity']
  };
  let best=null,bestScore=0;
  for (const [id, keys] of Object.entries(scores)) {
    const s=keys.filter(k=>h.has(k)).length;
    if (s>bestScore) {best=id;bestScore=s;}
  }
  return bestScore>=2?best:null;
}
function readInputs() {
  const files=fs.readdirSync(INPUT).filter(f=>/\.(xlsx|xls|csv)$/i.test(f));
  const datasets=[];
  for (const file of files) {
    const full=path.join(INPUT,file);
    const wb=XLSX.readFile(full,{cellDates:true,raw:false});
    for (const sheetName of wb.SheetNames) {
      if (/^(readme|instructions?|notes?|metadata)$/i.test(String(sheetName).trim())) continue;
      // Driver import is intentionally disabled because the current portal module is unstable.
      if (/driver/i.test(String(sheetName))) continue;
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:'',raw:false});
      if (!rows.length) continue;
      const headers=Object.keys(rows[0]);
      datasets.push({file,sheetName,headers,rows,module:classify(sheetName,headers)});
    }
  }
  return datasets;
}
function sourceMap(id, headers) {
  const byNorm=new Map(headers.map(h=>[norm(h),h]));
  const out={};
  for (const target of templateHeaders(id)) {
    const candidates=[target,...((aliases[id]&&aliases[id][target])||[])];
    for (const c of candidates) {
      const found=byNorm.get(norm(c));
      if (found) { out[target]=found; break; }
    }
  }
  return out;
}
function mapBase(id,row,map) {
  const out={};
  for (const h of templateHeaders(id)) out[h]=map[h]?clean(row[map[h]]):'';
  return out;
}
function transform(id,row,map,ctx,rowIndex=0) {
  const o=mapBase(id,row,map);
  if (id==='classes') {
    const name=normalizeClass(row[map.name] || row['class name'] || row.class_name);
    o.name=name;
    o.description=clean(row.remarks || row.description || [row.level,row.board,row.stream].filter(Boolean).join(' · '));
    o.sections=(ctx.sectionsByClass.get(norm(name))||[]).join(', ') || clean(o.sections) || 'A';
  }
  if (id==='vehicles') {
    const mm=clean(row['make/model']||'');
    if (!o.make && mm) o.make=mm.split(/[\/-]/)[0].trim();
    if (!o.model && mm) o.model=mm.split(/[\/-]/).slice(1).join('-').trim() || mm;
    o.year=o.year||clean(row.purchase_year)||String(new Date().getFullYear());
    o.capacity=clean(o.capacity)||'1';
    o.fuelType=clean(o.fuelType)||'Other';
    o.status=status(o.status);
    o.insuranceExpiryDate=formatDate(o.insuranceExpiryDate);
    o.registrationNumber=clean(o.registrationNumber)||stableCode('VEH',rowIndex,o.make||o.model);
  }
  if (id==='drivers') {
    o.Contact=phone(o.Contact||row['phone no']||row.phone);
    o['Emergency Contact']=phone(o['Emergency Contact']||row.alternate_contact);
    o['License Number']=clean(o['License Number'])||stableCode('DL',rowIndex,o.Name);
    o['Joining Date']=formatDate(o['Joining Date']||'01/01/2026');
    o['Date of Birth']=formatDate(o['Date of Birth']);
    o.Age=clean(o.Age)||ageFromDob(o['Date of Birth']);
    o.Gender=gender(o.Gender,'Other');
    o.Status=status(o.Status);
  }
  if (id==='routes') {
    o.isActive=yesNo(o.isActive,'yes');
    o.description=o.description||clean(row.notes);
    o.distance=clean(o.distance)||'0';
    o.monthlyFeeAmount=clean(o.monthlyFeeAmount)||'0';
    const pickup=clean(row.pickup_time), drop=clean(row.drop_time);
    if (!o.estimatedTime && pickup && drop) o.estimatedTime=`${pickup} - ${drop}`;
  }
  if (id==='fees') {
    const f=norm(row.frequency);
    o.Category=o.Category||clean(row.frequency)||'Other';
    o['Default amount (₹)']=clean(o['Default amount (₹)'])||'0';
    o['Monthly fee (yes/no)']=f.includes('month')?'yes':yesNo(o['Monthly fee (yes/no)'],'no');
    o['Active (yes/no)']=yesNo(row.status||o['Active (yes/no)'],'yes');
    o.Description=o.Description||clean(row.notes);
  }
  if (id==='faculty') {
    o.employeeCode=clean(o.employeeCode||row['Employee ID'])||stableCode('EMP',rowIndex,o.name);
    o.username=o.username||slug(o.email?o.email.split('@')[0]:`${o.name}.${o.employeeCode}`);
    o.email=clean(o.email)||`${slug(o.name||o.employeeCode).replace(/\.+/g,'.')}@placeholder.local`;
    o.phone=phone(o.phone||o.emergencyContact);
    o.emergencyContact=phone(o.emergencyContact||o.phone);
    o.gender=gender(o.gender,'Other');
    const wt=norm(o.workforceType||row['Employment Type']);
    o.workforceType=wt.includes('non') ? 'Non Teaching' : 'Teaching';
    // Staff Category is optional in the current GyanSetu Faculty importer. Keep it blank.
    o.staffCategory='';
    o.designation=clean(o.designation)||'Staff';
    o.qualification=clean(o.qualification)||'Not Specified';
    o.dateOfBirth=formatDate(o.dateOfBirth);
    o.age=clean(o.age)||ageFromDob(o.dateOfBirth);
    o.joiningDate=formatDate(o.joiningDate||'01/01/2026');
    o.status=status(o.status);
    o.isClassIncharge=yesNo(o.isClassIncharge,'no');
  }
  if (id==='students') {
    o['Admission Number']=clean(o['Admission Number'])||stableCode('ADM',rowIndex,o['Full Name']);
    o['Student Register No']=clean(o['Student Register No'])||stableCode('REG',rowIndex,o['Admission Number']);
    o['Academic Registration No']=clean(o['Academic Registration No'])||stableCode('ACAD',rowIndex,o['Admission Number']);
    o['Student ID']=clean(o['Student ID'])||stableCode('STU',rowIndex,o['Admission Number']);
    o['Admit Date']=formatDate(o['Admit Date']);
    o['Date of Birth']=formatDate(o['Date of Birth']);
    o.Age=clean(o.Age)||ageFromDob(o['Date of Birth']);
    o.Gender=gender(o.Gender,'Other');
    o['Admit Section']=normalizeSection(o['Admit Section']||o['Current Section']||row.Section);
    o['Current Section']=normalizeSection(o['Current Section']||o['Admit Section']||row.Section);
    o['Admit Class']=normalizeClass(o['Admit Class']||o['Current Class']);
    o['Current Class']=normalizeClass(o['Current Class']||o['Admit Class']);
    o['Admit Roll No']=clean(o['Admit Roll No']||o['Current Roll No']||row['Roll No']);
    o['Current Roll No']=clean(o['Current Roll No']||o['Admit Roll No']||row['Roll No']);
    o['Mobile Number']=phone(o['Mobile Number']||o['Father Contact']||o['Guardian Contact']||row['Guardian Phone']);
    o['Emergency Contact']=phone(o['Emergency Contact']||row['Alternate Phone']||o['Mobile Number']);
    o['Father Contact']=phone(o['Father Contact']||o['Mobile Number']);
    o['Mother Contact']=phone(o['Mother Contact']||o['Mobile Number']);
    o['Guardian Contact']=phone(o['Guardian Contact']||o['Mobile Number']);
    o['Aadhaar Number']=digits(o['Aadhaar Number']||row['Aadhaar/ID']).slice(-12);
    o['House No']=o['House No']||clean(row.Address);
    o.City=o.City||clean(row.City);
    o.Category=o.Category||'General';
  }
  const defs=schemas[id].defaults||{};
  for (const [k,v] of Object.entries(defs)) if (!clean(o[k])) o[k]=v;
  return repairRequired(id,o,rowIndex);
}
function fallbackPhone(rowIndex, salt=0) {
  // Deterministic 10-digit test-safe number in the 9xxxxxxxxx range.
  return `9${String((rowIndex + 1 + salt) % 1000000000).padStart(9,'0')}`;
}
function fallbackDob(rowIndex, baseYear=2008) {
  const day=(rowIndex%28)+1, month=(rowIndex%12)+1, year=baseYear-(rowIndex%8);
  return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
}
function repairRequired(id,o,rowIndex) {
  const n=rowIndex+1;
  if (id==='classes') {
    o.name=clean(o.name)||`Class ${n}`;
    o.sections=clean(o.sections)||'A';
  } else if (id==='vehicles') {
    o.registrationNumber=clean(o.registrationNumber)||stableCode('VEH',rowIndex,'vehicle');
    o.make=clean(o.make)||'Generic'; o.model=clean(o.model)||`Model ${n}`;
    o.capacity=clean(o.capacity)||'1'; o.fuelType=clean(o.fuelType)||'Other'; o.status=status(o.status);
  } else if (id==='drivers') {
    o.Name=clean(o.Name)||`Driver ${n}`;
    o['License Number']=clean(o['License Number'])||stableCode('DL',rowIndex,o.Name);
    o.Contact=phone(o.Contact)||fallbackPhone(rowIndex,10);
    o.Address=clean(o.Address)||'Address Not Provided';
    o['Joining Date']=formatDate(o['Joining Date']||'01/01/2026');
    o.Status=status(o.Status);
    o['Date of Birth']=formatDate(o['Date of Birth']||fallbackDob(rowIndex,1985));
    o.Age=clean(o.Age)||ageFromDob(o['Date of Birth']);
    o.Gender=gender(o.Gender,'Other');
  } else if (id==='routes') {
    o.name=clean(o.name)||`Route ${n}`;
    o.startLocation=clean(o.startLocation)||'Start Point'; o.endLocation=clean(o.endLocation)||'End Point';
    o.distance=clean(o.distance)||'0'; o.monthlyFeeAmount=clean(o.monthlyFeeAmount)||'0'; o.isActive=yesNo(o.isActive,'yes');
  } else if (id==='fees') {
    o['Fee Type Name']=clean(o['Fee Type Name'])||`Fee Type ${n}`;
    o.Category=clean(o.Category)||'Other'; o['Default amount (₹)']=clean(o['Default amount (₹)'])||'0';
    o['Monthly fee (yes/no)']=yesNo(o['Monthly fee (yes/no)'],'no'); o['Active (yes/no)']=yesNo(o['Active (yes/no)'],'yes');
  } else if (id==='faculty') {
    o.name=clean(o.name)||`Faculty ${n}`;
    o.employeeCode=clean(o.employeeCode)||stableCode('EMP',rowIndex,o.name);
    o.email=clean(o.email)||`${slug(o.name)||'faculty'+n}.${n}@placeholder.local`;
    o.username=clean(o.username)||`${slug(o.name)||'faculty'+n}.${n}`;
    o.phone=phone(o.phone)||fallbackPhone(rowIndex,1000);
    o.gender=gender(o.gender,'Other');
    const wt=norm(o.workforceType); o.workforceType=wt.includes('non') ? 'Non Teaching' : 'Teaching';
    o.staffCategory=''; o.designation=clean(o.designation)||'Staff';
    o.qualification=clean(o.qualification)||'Not Specified'; o.joiningDate=formatDate(o.joiningDate||'01/01/2026');
    o.status=status(o.status); o.dateOfBirth=formatDate(o.dateOfBirth||fallbackDob(rowIndex,1980));
    o.age=clean(o.age)||ageFromDob(o.dateOfBirth);
  } else if (id==='students') {
    o['Full Name']=clean(o['Full Name'])||`Student ${n}`;
    o['Admission Number']=clean(o['Admission Number'])||stableCode('ADM',rowIndex,o['Full Name']);
    o['Date of Birth']=formatDate(o['Date of Birth']||fallbackDob(rowIndex,2010));
    o.Age=clean(o.Age)||ageFromDob(o['Date of Birth']);
    o.Gender=gender(o.Gender,'Other');
    o['Admit Class']=normalizeClass(o['Admit Class']||o['Current Class'])||'Class 1';
    o['Current Class']=normalizeClass(o['Current Class']||o['Admit Class'])||o['Admit Class'];
    o['Admit Section']=normalizeSection(o['Admit Section']||o['Current Section'])||'A';
    o['Current Section']=normalizeSection(o['Current Section']||o['Admit Section'])||o['Admit Section'];
    o['Father Name']=clean(o['Father Name'])||'Not Provided'; o['Mother Name']=clean(o['Mother Name'])||'Not Provided';
    o['Mobile Number']=phone(o['Mobile Number'])||fallbackPhone(rowIndex,2000);
    o['Father Contact']=phone(o['Father Contact'])||o['Mobile Number']; o['Mother Contact']=phone(o['Mother Contact'])||o['Mobile Number'];
    o['Guardian Contact']=phone(o['Guardian Contact'])||o['Mobile Number']; o['Emergency Contact']=phone(o['Emergency Contact'])||o['Mobile Number'];
    o.Category=clean(o.Category)||'General';
  }
  return o;
}
function validate(id,row) {
  const missing=(schemas[id].required||[]).filter(k=>!clean(row[k]));
  return missing.map(field=>({field,reason:'Missing required field after repair'}));
}
function duplicateKey(id,row) {
  return (schemas[id].unique||[]).map(k=>norm(row[k])).filter(Boolean).join('|');
}
function writeCsv(file,headers,rows) {
  const esc=v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
  fs.writeFileSync(file,[headers.map(esc).join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n'),'utf8');
}
function html(report) {
  const trs=report.modules.map(m=>`<tr><td>${m.name}</td><td>${m.status}</td><td>${m.raw}</td><td>${m.ready}</td><td>${m.rejected}</td><td>${m.duplicates}</td><td>${m.warnings}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>GyanSetu DPE Report</title><style>body{font-family:Arial,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#1f2937}h1{margin-bottom:6px}.pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff;font-weight:700}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border:1px solid #ddd;padding:9px;text-align:left}th{background:#f5f5f5}.ok{color:#067647}.bad{color:#b42318}</style></head><body><h1>GyanSetu Data Preparation Engine — Phase 1</h1><p>Run ${report.runId} · <span class="pill">${report.status}</span></p><p>Raw: <b>${report.totals.raw}</b> · Ready: <b>${report.totals.ready}</b> · Rejected: <b>${report.totals.rejected}</b> · Duplicates: <b>${report.totals.duplicates}</b></p><table><thead><tr><th>Module</th><th>Status</th><th>Raw</th><th>Ready</th><th>Rejected</th><th>Duplicates</th><th>Warnings</th></tr></thead><tbody>${trs}</tbody></table><p>See the JSON report for mapping details and field-level rejection reasons.</p></body></html>`;
}
function main() {
  const runId=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
  for (const d of [READY,REJECTED]) for (const f of fs.readdirSync(d)) if (f!=='.gitkeep') fs.rmSync(path.join(d,f),{recursive:true,force:true});
  const datasets=readInputs();
  const sections= datasets.filter(d=>d.module==='sections').flatMap(d=>d.rows);
  const sectionsByClass=new Map();
  for (const r of sections) {
    const c=norm(r.class_name||r['class name']); const s=clean(r.section_name||r['section name']);
    if(c&&s){if(!sectionsByClass.has(c))sectionsByClass.set(c,[]); if(!sectionsByClass.get(c).includes(s))sectionsByClass.get(c).push(s);}
  }
  const report={runId,engine:'GyanSetu DPE Phase 1 v5.2 No-Driver / No-Staff-Category Mode',startedAt:new Date().toISOString(),status:'',sources:datasets.map(d=>({file:d.file,sheet:d.sheetName,module:d.module,rows:d.rows.length})),unclassified:datasets.filter(d=>!d.module).map(d=>`${d.file} :: ${d.sheetName}`),modules:[],totals:{raw:0,ready:0,rejected:0,duplicates:0}};
  const workbook=XLSX.utils.book_new();
  for (const id of MODULE_ORDER) {
    const cfg=modulesCfg.find(m=>m.id===id); const headers=templateHeaders(id);
    const ds=datasets.filter(d=>d.module===id);
    let raw=[]; const mapping=[];
    for (const d of ds) { const m=sourceMap(id,d.headers); mapping.push({source:`${d.file} :: ${d.sheetName}`,fields:m}); raw.push(...d.rows.map(r=>({r,m,source:`${d.file} :: ${d.sheetName}`}))); }
    const ready=[], rejected=[], seen=new Set(); let duplicates=0,warnings=0;
    for (let i=0;i<raw.length;i++) {
      const item=raw[i]; const transformed=transform(id,item.r,item.m,{sectionsByClass},i); const errs=validate(id,transformed);
      if (errs.length) {rejected.push({...transformed,'__source':item.source,'__row':i+2,'__errors':errs.map(e=>`${e.field}: ${e.reason}`).join('; ')});continue;}
      let key=duplicateKey(id,transformed);
      if(key&&seen.has(key)){
        duplicates++;
        // Preserve the row by deterministically repairing its unique identifier(s).
        if(id==='students') transformed['Admission Number']=`${transformed['Admission Number']}-${String(i+1).padStart(4,'0')}`;
        else if(id==='faculty'){ transformed.employeeCode=`${transformed.employeeCode}-${String(i+1).padStart(4,'0')}`; transformed.email=`${slug(transformed.name)||'faculty'}.${i+1}@placeholder.local`; transformed.username=`${slug(transformed.name)||'faculty'}.${i+1}`; transformed.phone=fallbackPhone(i,3000); }
        else if(id==='drivers'){ transformed['License Number']=`${transformed['License Number']}-${String(i+1).padStart(4,'0')}`; transformed.Contact=fallbackPhone(i,4000); }
        else if(id==='vehicles') transformed.registrationNumber=`${transformed.registrationNumber}-${String(i+1).padStart(4,'0')}`;
        else if(id==='classes') transformed.name=`${transformed.name} ${String(i+1)}`;
        else if(id==='routes') transformed.name=`${transformed.name} ${String(i+1)}`;
        else if(id==='fees') transformed['Fee Type Name']=`${transformed['Fee Type Name']} ${String(i+1)}`;
        key=duplicateKey(id,transformed);
      }
      if(key)seen.add(key);
      ready.push(transformed);
    }
    if (ready.length) {
      writeCsv(path.join(READY,cfg.output),headers,ready);
      XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(ready,{header:headers}),cfg.name.slice(0,31));
    }
    if (rejected.length) writeCsv(path.join(REJECTED,`${cfg.name.replace(/\s+/g,'-')}-rejected.csv`),[...headers,'__source','__row','__errors'],rejected);
    const stat=raw.length===0?'NO_DATA':ready.length===0?'REJECTED_ALL':rejected.length?'READY_WITH_REJECTIONS':'READY';
    report.modules.push({id,name:cfg.name,status:stat,raw:raw.length,ready:ready.length,rejected:rejected.length,duplicates,warnings,mapping});
    report.totals.raw+=raw.length; report.totals.ready+=ready.length; report.totals.rejected+=rejected.length; report.totals.duplicates+=duplicates;
  }
  if (workbook.SheetNames.length) XLSX.writeFile(workbook,path.join(READY,'GyanSetu_Import_Ready_Data.xlsx'));
  report.status=report.totals.ready===0?'FAILED':report.totals.rejected>0||report.unclassified.length?'READY_WITH_REVIEW':'READY';
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(REPORTS,`preparation-${runId}.json`),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(REPORTS,'latest-preparation.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(REPORTS,`preparation-${runId}.html`),html(report));
  fs.writeFileSync(path.join(REPORTS,'latest-preparation.html'),html(report));
  console.log(`GyanSetu DPE Phase 1 v5.2 — ${report.status}`);
  console.log(`Raw ${report.totals.raw} | Ready ${report.totals.ready} | Rejected ${report.totals.rejected} | Duplicates ${report.totals.duplicates}`);
  for(const m of report.modules) console.log(`${m.name}: ${m.status} (${m.ready}/${m.raw})`);
  if(report.status==='FAILED') process.exitCode=2;
}

try { main(); } catch (err) { console.error(err.stack||err); process.exit(1); }
