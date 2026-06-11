/**
 * Converts GUIDE.md → GUIDE.pdf using Edge headless.
 * Run: node scripts/export-guide-pdf.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── 1. Read markdown ──────────────────────────────────────────────────────────
const md = readFileSync(resolve(root, 'GUIDE.md'), 'utf8');

// ── 2. Minimal markdown → HTML (no external deps) ────────────────────────────
function mdToHtml(src) {
  return src
    // Headings
    .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // Fenced code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Tables — convert | row | to <tr><td>
    .replace(/^\|(.+)\|$/gm, (_, inner) => {
      const cells = inner.split('|').map(c => c.trim());
      const isHeader = cells.every(c => /^[-: ]+$/.test(c));
      if (isHeader) return '';
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    // Wrap consecutive <tr> blocks in <table>
    .replace(/(<tr>[\s\S]*?<\/tr>(\n<tr>[\s\S]*?<\/tr>)*)/g, '<table>$1</table>')
    // Mark first <tr> as thead
    .replace(/<table>\n?<tr>/g, '<table><thead><tr>')
    .replace(/<\/tr>\n?(<tr>)/, '</tr></thead><tbody>$1')
    .replace(/<\/table>/, '</tbody></table>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>(\n<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>')
    // Paragraphs (lines not already wrapped)
    .split('\n\n')
    .map(block => {
      const t = block.trim();
      if (!t || /^<[h|t|u|p|h|c|p|o|b]/.test(t)) return t;
      return `<p>${t.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}

const body = mdToHtml(md);

// ── 3. Wrap in styled HTML ────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="he" dir="ltr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Fredoka', 'Segoe UI', Arial, sans-serif;
    font-size: 13pt;
    line-height: 1.7;
    color: #1a2540;
    background: #fff;
    padding: 18mm 20mm;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 22pt;
    font-weight: 600;
    color: #1e3a6e;
    border-bottom: 3px solid #1e3a6e;
    padding-bottom: 6px;
    margin: 0 0 18px;
  }
  h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #1e3a6e;
    margin: 28px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #c8d6f0;
  }
  h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #2c4a8a;
    margin: 18px 0 6px;
  }

  p { margin: 8px 0; }

  hr {
    border: none;
    border-top: 1px solid #d0d8e8;
    margin: 22px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 18px;
    font-size: 11.5pt;
    page-break-inside: avoid;
  }
  thead tr { background: #1e3a6e; color: #fff; }
  thead td { padding: 8px 10px; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f4f7fb; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #dde5f0; }

  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10.5pt;
    background: #f0f4fa;
    padding: 1px 5px;
    border-radius: 3px;
    color: #1e3a6e;
  }
  pre {
    background: #1a2540;
    color: #e8edf8;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 10px 0 16px;
    font-size: 10pt;
    line-height: 1.5;
    page-break-inside: avoid;
  }
  pre code { background: none; color: inherit; padding: 0; }

  ul { padding-right: 22px; padding-left: 22px; margin: 8px 0; }
  li { margin: 4px 0; }

  a { color: #2c5ab8; text-decoration: none; }

  strong { font-weight: 600; }

  @media print {
    body { padding: 0; }
    h2 { page-break-before: auto; }
    pre, table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;

// ── 4. Write temp HTML ────────────────────────────────────────────────────────
const htmlPath = resolve(root, 'GUIDE_tmp.html');
const pdfPath  = resolve(root, 'GUIDE.pdf');
writeFileSync(htmlPath, html, 'utf8');

// ── 5. Edge headless → PDF ────────────────────────────────────────────────────
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd  = `"${edge}" --headless --disable-gpu --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "file:///${htmlPath.replace(/\\/g, '/')}"`;

console.log('Generating PDF…');
execSync(cmd, { stdio: 'pipe' });

// ── 6. Clean up ───────────────────────────────────────────────────────────────
unlinkSync(htmlPath);
console.log(`Done: ${pdfPath}`);
