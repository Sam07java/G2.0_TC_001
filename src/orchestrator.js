const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROOT = path.resolve(__dirname, '..');
function run(label, script, args = []) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} exited with code ${result.status}`);
}

try {
  run('1/3 DPE Excel validation, repair and template generation', 'dpe.js');
  run('2/3 Validate DPE result and stage files for ADSE', 'stage-imports.js');

  const manifestPath = path.join(ROOT, 'runtime', 'imports', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`\nDPE accepted ${manifest.dpeTotals.ready}/${manifest.dpeTotals.raw} row(s), with ${manifest.dpeTotals.rejected} rejected.`);
  console.log(`Prepared ${manifest.files.length} module file(s) for portal import.`);

  if (process.argv.includes('--validate-only')) {
    console.log('\nValidation-only run completed. No portal data was changed.');
    process.exit(0);
  }

  if (String(process.env.CONFIRM_WRITE || 'false').toLowerCase() !== 'true') {
    console.log('\nDPE validation completed. Portal import was not started because CONFIRM_WRITE is not true.');
    console.log('Review output/reports/latest-preparation.html, then set CONFIRM_WRITE=true and run npm run adse again.');
    process.exit(0);
  }

  run('3/3 GyanSetu browser import', 'importer.js');
  console.log('\nIntegrated DPE + ADSE run completed.');
} catch (error) {
  console.error(`\nIntegrated run stopped: ${error.message}`);
  process.exit(1);
}
