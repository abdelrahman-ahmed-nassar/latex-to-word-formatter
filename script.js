/* ── LaTeX Formatter – script.js ───────────────────────── */

const inputEl   = document.getElementById('input');
const previewEl = document.getElementById('preview');
const statusBar = document.getElementById('status-bar');

document.getElementById('btn-render').addEventListener('click', renderOutput);
document.getElementById('btn-copy').addEventListener('click', copyOutput);
document.getElementById('btn-pdf').addEventListener('click', exportPDF);
document.getElementById('btn-clear').addEventListener('click', clearAll);

/* ── Status helper ─────────────────────────────────────── */
let statusTimer = null;
function showStatus(msg, isError = false) {
  statusBar.textContent = msg;
  statusBar.className = 'status-bar' + (isError ? ' error' : '');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { statusBar.className = 'status-bar hidden'; }, 3000);
}

/* ── 1. Pre-process text before rendering ──────────────── */
function preprocessText(text) {
  // Normalise Windows line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Block math ($$...$$) spacing fixes ──
  // Ensure $$ is preceded by a blank line (or start of string)
  text = text.replace(/([^\n])([ \t]*\$\$)/g, '$1\n\n$2');
  // Ensure $$ is followed by a newline
  text = text.replace(/(\$\$[^\n]*\$\$)([^\n])/g, '$1\n\n$2');

  // ── Multi-line block math: $$\n...\n$$ ──
  // Ensure blank line before opening $$
  text = text.replace(/([^\n])\n(\$\$\s*\n)/g, '$1\n\n$2');
  // Ensure blank line after closing $$
  text = text.replace(/(\n\s*\$\$)([^\n$])/g, '$1\n\n$2');

  // ── Strip markdown-style bold/italic from inside $...$ / $$...$$ ──
  // (AI sometimes wraps equations in **...**)
  // We leave LaTeX delimiters alone; just remove stray ** around them
  text = text.replace(/\*\*(\$\$[\s\S]*?\$\$)\*\*/g, '$1');
  text = text.replace(/\*\*(\$[^$\n]+?\$)\*\*/g, '$1');

  // Collapse more than 3 consecutive blank lines → 2
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text;
}

/* ── 2. Render ─────────────────────────────────────────── */
function renderOutput() {
  const raw = inputEl.value.trim();
  if (!raw) {
    showStatus('Nothing to render.', true);
    return;
  }

  try {
    const cleaned = preprocessText(raw);

    // Configure marked to NOT mangle underscores inside math
    marked.setOptions({
      gfm: true,
      breaks: false,
      // Protect LaTeX delimiters from marked's emphasis parser
      // by using a custom tokenizer extension
    });

    // Temporarily replace LaTeX delimiters with placeholders so
    // marked doesn't eat underscores or asterisks inside them.
    const mathBlocks = [];
    let protected_text = cleaned;

    // Protect block math $$...$$ (single-line and multi-line)
    protected_text = protected_text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
      const id = `MATHBLOCK${mathBlocks.length}ENDMATH`;
      mathBlocks.push({ id, content: match });
      return id;
    });

    // Protect inline math $...$
    protected_text = protected_text.replace(/\$([^$\n]+?)\$/g, (match) => {
      const id = `MATHINLINE${mathBlocks.length}ENDMATH`;
      mathBlocks.push({ id, content: match });
      return id;
    });

    // Parse markdown
    let html = marked.parse(protected_text);

    // Restore math placeholders
    mathBlocks.forEach(({ id, content }) => {
      // Escape the id for use in regex (numbers + letters only, safe)
      html = html.split(id).join(content);
    });

    previewEl.innerHTML = html;

    // Render KaTeX via auto-render
    renderMathInElement(previewEl, {
      delimiters: [
        { left: '$$', right: '$$', display: true  },
        { left: '$',  right: '$',  display: false },
      ],
      throwOnError: false,
      errorColor: '#cc0000',
    });

    showStatus('Rendered successfully.');
  } catch (err) {
    showStatus('Render error: ' + err.message, true);
    console.error(err);
  }
}

/* ── 3. Copy rendered HTML to clipboard ────────────────── */
async function copyOutput() {
  const html = previewEl.innerHTML;
  if (!html || previewEl.querySelector('.placeholder-hint')) {
    showStatus('Nothing to copy. Render first.', true);
    return;
  }

  // Build a full HTML document so Word understands it
  const fullHtml = buildWordHtml(html);

  // Try Clipboard API with HTML type
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([item]);
      showStatus('Copied as rich HTML — paste into Word.');
      return;
    } catch (e) {
      console.warn('ClipboardItem failed, trying execCommand:', e);
    }
  }

  // Fallback: execCommand copy via hidden div
  try {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(previewEl);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    showStatus('Copied (selection method) — paste into Word.');
  } catch (e) {
    // Last resort: plain text
    try {
      await navigator.clipboard.writeText(previewEl.innerText);
      showStatus('Copied as plain text (HTML clipboard not supported).', false);
    } catch (e2) {
      showStatus('Copy failed: ' + e2.message, true);
    }
  }
}

/* Build minimal HTML document for Word compatibility */
function buildWordHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; }
  h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 13pt; }
  code { font-family: 'Courier New', monospace; background: #f4f4f4; padding: 1px 4px; }
  pre  { background: #f4f4f4; padding: 8px; }
  blockquote { border-left: 4px solid #ccc; padding-left: 12px; color: #555; }
  table { border-collapse: collapse; } th, td { border: 1px solid #999; padding: 4px 8px; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

/* ── 4. Export PDF ─────────────────────────────────────── */
function exportPDF() {
  const html = previewEl.innerHTML;
  if (!html || previewEl.querySelector('.placeholder-hint')) {
    showStatus('Nothing to export. Render first.', true);
    return;
  }

  showStatus('Generating PDF…');

  const opt = {
    margin:       [12, 14, 12, 14],   // top, right, bottom, left (mm)
    filename:     'latex-formatted.pdf',
    image:        { type: 'jpeg', quality: 0.97 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Clone preview and apply inline styles for PDF accuracy
  const clone = previewEl.cloneNode(true);
  clone.style.cssText = `
    font-family: Georgia, serif;
    font-size: 13px;
    line-height: 1.75;
    color: #111;
    padding: 0;
    background: #fff;
    max-width: 700px;
  `;

  html2pdf()
    .set(opt)
    .from(clone)
    .save()
    .then(() => showStatus('PDF exported.'))
    .catch(err => showStatus('PDF error: ' + err.message, true));
}

/* ── 5. Clear all ──────────────────────────────────────── */
function clearAll() {
  inputEl.value = '';
  previewEl.innerHTML = '<p class="placeholder-hint">Rendered output will appear here.</p>';
  statusBar.className = 'status-bar hidden';
}

/* ── Keyboard shortcut: Ctrl/Cmd + Enter → Render ──────── */
inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    renderOutput();
  }
});