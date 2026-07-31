const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('required ADSE repository assets exist', async () => {
  const root = path.resolve(__dirname, '../..');
  for (const required of ['src/dpe.js', 'src/importer.js', 'src/orchestrator.js', 'config/workflow.json', 'templates/faculty.csv']) {
    expect(fs.existsSync(path.join(root, required)), `${required} should exist`).toBeTruthy();
  }
  expect(fs.existsSync(path.join(root, 'templates/drivers.csv'))).toBeFalsy();
});
