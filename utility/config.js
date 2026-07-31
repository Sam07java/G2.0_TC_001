const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function workflowModules() {
  return readJson('config/workflow.json').modules;
}

module.exports = { ROOT, readJson, workflowModules };
