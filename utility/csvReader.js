const fs = require('fs');

function readFirstDataRow(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const values = lines[1].split(',');
  return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
}

module.exports = { readFirstDataRow };
