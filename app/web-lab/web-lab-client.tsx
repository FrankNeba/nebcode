'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Globe,
  Play,
  RotateCcw,
  Download,
  Code2,
  Eye,
  Columns,
  Terminal,
  Trash2,
  FileCode,
  Palette,
  Braces,
  Maximize2,
  Minimize2,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  CheckCircle2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const CodeEditor = dynamic(
  () => import('@/components/editor/CodeEditor').then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-7 w-7" />
      </div>
    ),
  }
);

interface WebTemplate {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
}

const WEB_TEMPLATES: WebTemplate[] = [
  {
    id: 'registration-form',
    name: 'GCE Student Registration Form',
    description: 'HTML5 form with CSS styling and JavaScript validation',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GCE Student Registration</title>
</head>
<body>
  <div class="card">
    <div class="badge">GCE Practical Lab</div>
    <h1>Student Exam Registration</h1>
    <p class="subtitle">Complete the form below to register for your subjects.</p>

    <form id="regForm">
      <div class="form-group">
        <label for="fullName">Full Name</label>
        <input type="text" id="fullName" placeholder="e.g. Ngwa Emilia" required />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="level">Exam Level</label>
          <select id="level">
            <option value="A-Level">GCE Advanced Level</option>
            <option value="O-Level">GCE Ordinary Level</option>
          </select>
        </div>

        <div class="form-group">
          <label for="centerNo">Center Number</label>
          <input type="text" id="centerNo" placeholder="e.g. 11045" required />
        </div>
      </div>

      <div class="form-group">
        <label>Select Main Practical Subject</label>
        <div class="radio-group">
          <label class="radio-item">
            <input type="radio" name="subject" value="Computer Science (0795)" checked />
            <span>Computer Science</span>
          </label>
          <label class="radio-item">
            <input type="radio" name="subject" value="ICT (0796)" />
            <span>ICT</span>
          </label>
        </div>
      </div>

      <button type="submit" class="btn-submit">Register Candidate</button>
    </form>

    <div id="resultBox" class="result-box hidden"></div>
  </div>
</body>
</html>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  background: #f1f5f9;
  color: #0f172a;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  border: 1px solid #e2e8f0;
}

.badge {
  display: inline-block;
  background: #ffe4e6;
  color: #be123c;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
  text-transform: uppercase;
}

h1 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
  margin-bottom: 18px;
}

.form-group {
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 6px;
}

input[type="text"],
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
select:focus {
  border-color: #e11d48;
}

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.btn-submit {
  width: 100%;
  background: #8b0a1a;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 6px;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #e11d48;
}

.result-box {
  margin-top: 16px;
  padding: 14px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  font-size: 13px;
  line-height: 1.5;
}

.hidden {
  display: none;
}`,
    js: `const form = document.getElementById('regForm');
const resultBox = document.getElementById('resultBox');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const level = document.getElementById('level').value;
  const centerNo = document.getElementById('centerNo').value.trim();
  const subject = document.querySelector('input[name="subject"]:checked').value;

  console.log('Candidate Registered:', { fullName, level, centerNo, subject });

  resultBox.classList.remove('hidden');
  resultBox.innerHTML = \`
    <strong>Registration Confirmed!</strong><br/>
    Candidate: <b>\${fullName}</b><br/>
    Level: \${level} (Center #\${centerNo})<br/>
    Subject: \${subject}
  \`;
});`,
  },
  {
    id: 'report-table',
    name: 'Student Report Card Table',
    description: 'HTML table with automatic JavaScript score & grade calculation',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Student Report Card</title>
</head>
<body>
  <div class="container">
    <h2>Term 1 Examination Report Card</h2>
    <p>Click "Calculate Grades" to compute totals, averages, and remarks.</p>

    <table id="scoresTable">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Test (20)</th>
          <th>Exam (80)</th>
          <th>Total (100)</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Computer Science</td>
          <td><input type="number" class="test" value="17" min="0" max="20" /></td>
          <td><input type="number" class="exam" value="68" min="0" max="80" /></td>
          <td class="total">-</td>
          <td class="grade">-</td>
        </tr>
        <tr>
          <td>Mathematics</td>
          <td><input type="number" class="test" value="15" min="0" max="20" /></td>
          <td><input type="number" class="exam" value="59" min="0" max="80" /></td>
          <td class="total">-</td>
          <td class="grade">-</td>
        </tr>
        <tr>
          <td>Physics</td>
          <td><input type="number" class="test" value="12" min="0" max="20" /></td>
          <td><input type="number" class="exam" value="44" min="0" max="80" /></td>
          <td class="total">-</td>
          <td class="grade">-</td>
        </tr>
      </tbody>
    </table>

    <div class="actions">
      <button id="calcBtn">Calculate Grades</button>
      <span id="avgDisplay">Overall Average: --</span>
    </div>
  </div>
</body>
</html>`,
    css: `body {
  font-family: system-ui, sans-serif;
  background: #f8fafc;
  padding: 20px;
  color: #1e293b;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

h2 {
  margin-bottom: 4px;
  color: #0f172a;
}

p {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 14px;
}

th, td {
  border: 1px solid #cbd5e1;
  padding: 10px;
  text-align: left;
}

th {
  background: #8b0a1a;
  color: white;
}

input[type="number"] {
  width: 65px;
  padding: 6px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

button {
  background: #8b0a1a;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

#avgDisplay {
  font-weight: 700;
  color: #0f172a;
}`,
    js: `function getLetterGrade(score) {
  if (score >= 75) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function calculateAll() {
  const rows = document.querySelectorAll('#scoresTable tbody tr');
  let sum = 0;

  rows.forEach((row) => {
    const test = Number(row.querySelector('.test').value) || 0;
    const exam = Number(row.querySelector('.exam').value) || 0;
    const total = test + exam;
    const grade = getLetterGrade(total);

    row.querySelector('.total').textContent = total;
    row.querySelector('.grade').textContent = grade;
    sum += total;
  });

  const avg = (sum / rows.length).toFixed(1);
  document.getElementById('avgDisplay').textContent = 'Overall Average: ' + avg + '%';
  console.log('Calculated average:', avg + '%');
}

document.getElementById('calcBtn').addEventListener('click', calculateAll);
calculateAll();`,
  },
  {
    id: 'calculator',
    name: 'Simple JavaScript Calculator',
    description: 'Interactive calculator using CSS Grid and JavaScript functions',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>JS Calculator</title>
</head>
<body>
  <div class="calc">
    <input type="text" id="display" readonly value="0" />
    <div class="keys">
      <button onclick="clearDisplay()" class="op span-2">AC</button>
      <button onclick="press('/')" class="op">&divide;</button>
      <button onclick="press('*')" class="op">&times;</button>

      <button onclick="press('7')">7</button>
      <button onclick="press('8')">8</button>
      <button onclick="press('9')">9</button>
      <button onclick="press('-')" class="op">&minus;</button>

      <button onclick="press('4')">4</button>
      <button onclick="press('5')">5</button>
      <button onclick="press('6')">6</button>
      <button onclick="press('+')" class="op">+</button>

      <button onclick="press('1')">1</button>
      <button onclick="press('2')">2</button>
      <button onclick="press('3')">3</button>
      <button onclick="calculate()" class="eq">=</button>

      <button onclick="press('0')" class="span-2">0</button>
      <button onclick="press('.')">.</button>
    </div>
  </div>
</body>
</html>`,
    css: `body {
  background: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  margin: 0;
  font-family: system-ui, sans-serif;
}

.calc {
  background: #1e293b;
  padding: 18px;
  border-radius: 18px;
  width: 280px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

#display {
  width: 100%;
  box-sizing: border-box;
  height: 54px;
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid #334155;
  border-radius: 10px;
  text-align: right;
  padding: 0 14px;
  font-size: 24px;
  font-family: monospace;
  margin-bottom: 14px;
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

button {
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #334155;
  color: white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}

button:active {
  transform: scale(0.96);
}

button.op {
  background: #475569;
  color: #fda4af;
}

button.eq {
  background: #e11d48;
  grid-row: span 2;
  height: 100%;
}

.span-2 {
  grid-column: span 2;
}`,
    js: `let expr = '';
const display = document.getElementById('display');

function press(char) {
  expr += char;
  display.value = expr;
}

function clearDisplay() {
  expr = '';
  display.value = '0';
}

function calculate() {
  try {
    const res = Function('"use strict"; return (' + (expr || '0') + ')')();
    console.log(expr + ' = ' + res);
    expr = String(res);
    display.value = expr;
  } catch (err) {
    display.value = 'Error';
    console.error('Invalid expression:', expr);
    expr = '';
  }
}`,
  },
  {
    id: 'blank',
    name: 'Blank HTML / CSS / JS Project',
    description: 'Clean starter boilerplate for any web exercise',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Web Page</title>
</head>
<body>
  <h1>Hello from Nebcode Web Lab!</h1>
  <p id="message">Edit the HTML, CSS, and JavaScript tabs to build your page.</p>
  <button id="actionBtn">Click Me</button>
</body>
</html>`,
    css: `body {
  font-family: system-ui, sans-serif;
  padding: 24px;
  background: #ffffff;
  color: #0f172a;
}

h1 {
  color: #8b0a1a;
}

button {
  margin-top: 12px;
  padding: 10px 18px;
  background: #8b0a1a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}`,
    js: `document.getElementById('actionBtn').addEventListener('click', () => {
  const msg = document.getElementById('message');
  msg.textContent = 'Button clicked at ' + new Date().toLocaleTimeString();
  console.log('Button was clicked!');
});`,
  },
];

interface ConsoleLogItem {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info';
  text: string;
  time: string;
}

const STORAGE_KEY = 'nebcode_web_lab_state_v1';

export default function WebLabClient() {
  const [activeFile, setActiveFile] = useState<'html' | 'css' | 'js'>('html');
  const [htmlCode, setHtmlCode] = useState(WEB_TEMPLATES[0].html);
  const [cssCode, setCssCode] = useState(WEB_TEMPLATES[0].css);
  const [jsCode, setJsCode] = useState(WEB_TEMPLATES[0].js);

  // Mobile-friendly view mode: 'split' | 'code' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [previewDevice, setPreviewDevice] = useState<'full' | 'mobile' | 'tablet'>('full');
  const [autoRun, setAutoRun] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [srcDoc, setSrcDoc] = useState('');
  const [runVersion, setRunVersion] = useState(0);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  // Load saved workspace on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.html !== undefined) setHtmlCode(parsed.html);
        if (parsed.css !== undefined) setCssCode(parsed.css);
        if (parsed.js !== undefined) setJsCode(parsed.js);
      }
    } catch {}
    // Default to code view on very small screens or split view
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setShowConsole(false);
    }
  }, []);

  // Save workspace changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ html: htmlCode, css: cssCode, js: jsCode })
      );
    } catch {}
  }, [htmlCode, cssCode, jsCode]);

  // Listen for console messages from sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'nebcode-web-preview') return;
      const { level, args } = event.data;
      const now = new Date().toLocaleTimeString([], { hour12: false });
      setLogs((prev) => [
        ...prev.slice(-99),
        {
          id: `${Date.now()}-${Math.random()}`,
          level: level || 'log',
          text: Array.isArray(args) ? args.join(' ') : String(args),
          time: now,
        },
      ]);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const buildCombinedHtml = useCallback(
    (rawHtml: string, rawCss: string, rawJs: string, includeBridge = true) => {
      const consoleBridge = includeBridge
        ? `<script>
(function() {
  function send(level, args) {
    try {
      var serialized = Array.prototype.slice.call(args).map(function(a) {
        if (typeof a === 'object' && a !== null) {
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }
        return String(a);
      });
      window.parent.postMessage({ source: 'nebcode-web-preview', level: level, args: serialized }, '*');
    } catch (e) {}
  }
  var origLog = console.log, origWarn = console.warn, origErr = console.error, origInfo = console.info;
  console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('error', arguments); origErr.apply(console, arguments); };
  console.info = function() { send('info', arguments); origInfo.apply(console, arguments); };
  window.addEventListener('error', function(e) {
    send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
})();
</script>`
        : '';

      const styleTag = `<style>\n${rawCss}\n</style>`;
      const scriptTag = `<script>\ntry {\n${rawJs}\n} catch (err) { console.error(err && err.message ? err.message : err); }\n</script>`;

      let doc = rawHtml || '';
      if (!/<html[\s>]/i.test(doc)) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${consoleBridge}
${styleTag}
</head>
<body>
${doc}
${scriptTag}
</body>
</html>`;
      }

      if (/<\/head>/i.test(doc)) {
        doc = doc.replace(/<\/head>/i, `${consoleBridge}\n${styleTag}\n</head>`);
      } else {
        doc = `${consoleBridge}\n${styleTag}\n` + doc;
      }

      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        doc = doc + `\n${scriptTag}`;
      }
      return doc;
    },
    []
  );

  const runPreview = useCallback(() => {
    setLogs([]);
    setSrcDoc(buildCombinedHtml(htmlCode, cssCode, jsCode, true));
    setRunVersion((v) => v + 1);
  }, [htmlCode, cssCode, jsCode, buildCombinedHtml]);

  // Initial & debounced auto-run
  useEffect(() => {
    if (!autoRun && runVersion > 0) return;
    const timer = setTimeout(() => {
      setSrcDoc(buildCombinedHtml(htmlCode, cssCode, jsCode, true));
    }, 350);
    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, jsCode, autoRun, buildCombinedHtml, runVersion]);

  const handleLoadTemplate = (tpl: WebTemplate) => {
    setHtmlCode(tpl.html);
    setCssCode(tpl.css);
    setJsCode(tpl.js);
    setLogs([]);
    setShowTemplateMenu(false);
    toast.success(`Loaded "${tpl.name}"`);
  };

  const handleDownloadHtml = () => {
    const standalone = buildCombinedHtml(htmlCode, cssCode, jsCode, false);
    const blob = new Blob([standalone], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebcode-web-project.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded standalone HTML file');
  };

  const currentCode = activeFile === 'html' ? htmlCode : activeFile === 'css' ? cssCode : jsCode;
  const handleCodeChange = (val: string) => {
    if (activeFile === 'html') setHtmlCode(val);
    else if (activeFile === 'css') setCssCode(val);
    else setJsCode(val);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-dark-950 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-dark-900 border-b border-dark-700 shrink-0 flex-wrap">
        {/* Left: Title + Template Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neb-600/15 border border-neb-600/30 text-neb-500 text-xs font-extrabold">
            <Globe className="h-3.5 w-3.5" />
            <span>Web Lab</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-semibold text-gray-200 transition"
            >
              <FolderOpen className="h-3.5 w-3.5 text-neb-500" />
              <span>Templates</span>
            </button>

            {showTemplateMenu && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-dark-900 border border-dark-700 shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 border-b border-dark-700 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Load Starter Practice Project
                </div>
                {WEB_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleLoadTemplate(tpl)}
                    className="w-full text-left px-3 py-2.5 hover:bg-dark-800 transition flex flex-col gap-0.5 border-b border-dark-800/60 last:border-0"
                  >
                    <span className="text-xs font-bold text-white">{tpl.name}</span>
                    <span className="text-[11px] text-gray-400">{tpl.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: View Switcher (Code / Split / Live View) */}
        <div className="flex items-center bg-dark-950 p-0.5 rounded-xl border border-dark-700">
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition',
              viewMode === 'code'
                ? 'bg-neb-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition',
              viewMode === 'split'
                ? 'bg-neb-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition',
              viewMode === 'preview'
                ? 'bg-neb-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live View</span>
          </button>
        </div>

        {/* Right: Run, Auto-Run, Download */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              runPreview();
              toast.success('Preview refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRun(!autoRun)}
            className={cn(
              'hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition',
              autoRun
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-dark-800 border-dark-700 text-gray-400'
            )}
            title="Automatically update preview as you type"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Auto</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-xs font-semibold transition"
            title="Download combined HTML file"
          >
            <Download className="h-3.5 w-3.5 text-neb-500" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* ─── CODE EDITOR PANE ─── */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-hidden min-h-0 border-b md:border-b-0 md:border-r border-dark-700',
              viewMode === 'split' ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'
            )}
          >
            {/* File Tabs: index.html | style.css | script.js */}
            <div className="flex items-center justify-between px-2 bg-dark-900 border-b border-dark-700 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveFile('html')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap',
                    activeFile === 'html'
                      ? 'border-orange-500 text-orange-400 bg-dark-800/70'
                      : 'border-transparent text-gray-400 hover:text-white'
                  )}
                >
                  <FileCode className="h-3.5 w-3.5 text-orange-500" />
                  <span>index.html</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFile('css')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap',
                    activeFile === 'css'
                      ? 'border-blue-500 text-blue-400 bg-dark-800/70'
                      : 'border-transparent text-gray-400 hover:text-white'
                  )}
                >
                  <Palette className="h-3.5 w-3.5 text-blue-500" />
                  <span>style.css</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFile('js')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap',
                    activeFile === 'js'
                      ? 'border-amber-500 text-amber-400 bg-dark-800/70'
                      : 'border-transparent text-gray-400 hover:text-white'
                  )}
                >
                  <Braces className="h-3.5 w-3.5 text-amber-500" />
                  <span>script.js</span>
                </button>
              </div>

              <span className="text-[10px] font-mono uppercase text-gray-500 px-2 hidden sm:inline">
                {activeFile === 'html' ? 'HTML5' : activeFile === 'css' ? 'CSS3' : 'JavaScript ES6'}
              </span>
            </div>

            {/* CodeMirror 6 Editor */}
            <div className="flex-1 overflow-hidden min-h-0">
              <CodeEditor
                height="100%"
                language={activeFile === 'js' ? 'javascript' : activeFile}
                value={currentCode}
                onChange={handleCodeChange}
                onSave={runPreview}
              />
            </div>
          </div>
        )}

        {/* ─── LIVE BROWSER PREVIEW + JS CONSOLE PANE ─── */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-hidden min-h-0 bg-dark-950',
              viewMode === 'split' ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'
            )}
          >
            {/* Simulated Browser Address & Controls Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-dark-900 border-b border-dark-700 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="px-2.5 py-1 rounded-md bg-dark-950 border border-dark-700 text-[11px] font-mono text-gray-400 truncate flex-1 max-w-xs">
                  https://preview.nebcode.local/index.html
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Device Width Selector on larger screens */}
                <div className="hidden sm:flex items-center bg-dark-950 rounded-lg p-0.5 border border-dark-700 mr-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                      'p-1 rounded text-xs transition',
                      previewDevice === 'mobile' ? 'bg-neb-600 text-white' : 'text-gray-400 hover:text-white'
                    )}
                    title="Phone Width (375px)"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={cn(
                      'p-1 rounded text-xs transition',
                      previewDevice === 'tablet' ? 'bg-neb-600 text-white' : 'text-gray-400 hover:text-white'
                    )}
                    title="Tablet Width (768px)"
                  >
                    <Tablet className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('full')}
                    className={cn(
                      'p-1 rounded text-xs transition',
                      previewDevice === 'full' ? 'bg-neb-600 text-white' : 'text-gray-400 hover:text-white'
                    )}
                    title="Full Width"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={runPreview}
                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 transition"
                  title="Reload Preview"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowConsole(!showConsole)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition',
                    showConsole
                      ? 'bg-neb-600/15 border-neb-600/40 text-neb-400'
                      : 'bg-dark-800 border-dark-700 text-gray-300'
                  )}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Console</span>
                  {logs.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-neb-600 text-white text-[10px]">
                      {logs.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'preview' ? 'split' : 'preview')}
                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 transition"
                  title={viewMode === 'preview' ? 'Restore Split View' : 'Maximize Preview'}
                >
                  {viewMode === 'preview' ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Sandboxed Iframe */}
            <div className="flex-1 overflow-auto bg-slate-200 flex justify-center min-h-0">
              <div
                className={cn(
                  'h-full bg-white transition-all duration-200 shadow-lg',
                  previewDevice === 'mobile'
                    ? 'w-[375px] max-w-full border-x border-slate-300'
                    : previewDevice === 'tablet'
                    ? 'w-[768px] max-w-full border-x border-slate-300'
                    : 'w-full'
                )}
              >
                <iframe
                  key={runVersion}
                  title="Nebcode Live Web Preview"
                  srcDoc={srcDoc}
                  sandbox="allow-scripts allow-forms allow-modals"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>

            {/* Collapsible JavaScript Console */}
            {showConsole && (
              <div className="h-36 sm:h-44 bg-dark-900 border-t border-dark-700 flex flex-col shrink-0">
                <div className="flex items-center justify-between px-3 py-1.5 bg-dark-950 border-b border-dark-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-neb-500" />
                    JavaScript Console Output ({logs.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {logs.length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const text = logs.map((l) => `[${l.time}] ${l.level.toUpperCase()}: ${l.text}`).join('\n');
                          const ok = await copyToClipboard(text);
                          if (ok) toast.success('Console logs copied');
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-700 text-[10px] font-semibold text-gray-300 border border-dark-700"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-700 text-[10px] font-semibold text-gray-400 hover:text-white border border-dark-700"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-1 select-text">
                  {logs.length === 0 ? (
                    <p className="text-gray-500 text-[11px] italic">
                      No console output yet. Use console.log() in script.js to inspect values here.
                    </p>
                  ) : (
                    logs.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'px-2 py-1 rounded border text-[11px] flex items-start gap-2 break-all',
                          item.level === 'error'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : item.level === 'warn'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-dark-800/60 border-dark-700 text-emerald-400'
                        )}
                      >
                        <span className="text-[10px] text-gray-500 shrink-0">{item.time}</span>
                        <span className="flex-1 whitespace-pre-wrap">{item.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
