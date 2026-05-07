# LaTeX Formatter

A minimal, browser-based tool for rendering AI-generated text that contains Markdown and LaTeX equations — with one-click copy to Microsoft Word and PDF export.

No server. No build step. Just open `index.html`.

---

## Live Demo

🔗 [View on GitHub Pages](https://your-username.github.io/your-repo-name/)
_(replace with your actual URL after first deploy)_

---

## Features

- **Markdown rendering** — headings, paragraphs, lists, bold, italic, tables, code blocks
- **LaTeX equations** — inline `$...$` and display `$$...$$` via KaTeX
- **Auto cleanup** — fixes common AI formatting issues (e.g. equations missing surrounding blank lines)
- **Copy to Word** — copies rendered HTML to clipboard; paste directly into Microsoft Word with formatting preserved
- **Export PDF** — exports the rendered preview as a clean A4 PDF
- **Keyboard shortcut** — `Ctrl + Enter` / `Cmd + Enter` to render instantly

---

## Getting Started

### Option 1 — Open locally

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
open index.html        # macOS
# or just double-click index.html in your file explorer
```

### Option 2 — GitHub Pages (auto-deploy)

Every push to `main` automatically deploys the site via the included GitHub Actions workflow.
See [Deployment](#deployment) below.

---

## Usage

1. Paste AI-generated text into the **Input** panel on the left
2. Click **▶ Render** (or press `Ctrl/Cmd + Enter`)
3. View the rendered output in the **Preview** panel on the right
4. Use the toolbar buttons:

| Button           | Action                                                |
| ---------------- | ----------------------------------------------------- |
| **▶ Render**     | Parse Markdown and render LaTeX equations             |
| **⎘ Copy**       | Copy rendered HTML to clipboard for pasting into Word |
| **⬇ Export PDF** | Download the preview as a PDF file                    |
| **✕ Clear**      | Clear both the input and preview panels               |

### Example input

```
## SR Latch

The output is defined as $Q$ and the next state equation is:

$$Q_{next} = S + R'Q$$

Where:
- $S$ = Set input
- $R$ = Reset input
- $Q$ = Current output
```

---

## File Structure

```
├── index.html                  # App shell and CDN imports
├── style.css                   # Layout and typography
├── script.js                   # All app logic
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Pages auto-deploy workflow
```

---

## Tech Stack

| Library                                                 | Purpose                  | Version |
| ------------------------------------------------------- | ------------------------ | ------- |
| [KaTeX](https://katex.org/)                             | LaTeX equation rendering | 0.16.9  |
| [marked.js](https://marked.js.org/)                     | Markdown parsing         | 9.1.6   |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | PDF export               | 0.10.1  |

No frameworks. No build tools. All libraries loaded from CDN.

---

## Deployment

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that deploys automatically on every push to `main`.

### One-time setup

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Click **Save**

After your first push, the site will be live at:

```
https://<your-username>.github.io/<your-repo-name>/
```

---

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Edge, Safari).

> **Copy to Word** works best in Chromium-based browsers (Chrome, Edge), which fully support the `ClipboardItem` HTML API. Firefox falls back to a selection-based copy which also pastes with formatting in Word.

---

## License

MIT
