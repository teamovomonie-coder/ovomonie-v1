const fs = require('fs');
const path = require('path');

const htmlPath = path.join('playwright-report', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('playwright-report/index.html not found');
  process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script id="playwrightReportBase64"[^>]*>([\s\S]*?)<\/script>/);
if (!m) {
  console.error('playwrightReportBase64 element not found in index.html');
  process.exit(3);
}

let data = m[1].trim();
if (data.startsWith('data:')) {
  const i = data.indexOf('base64,');
  if (i >= 0) data = data.slice(i + 7);
}

const outZip = path.join('playwright-report', 'report.zip');
fs.writeFileSync(outZip, Buffer.from(data, 'base64'));
console.log('Wrote', outZip);
