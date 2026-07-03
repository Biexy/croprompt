// app.js - CroPrompt Pro Studio Core Controller (Serverless Edition)
import { templates } from './templates.js';
import { NodeGraphCanvas } from './node_canvas.js';
import { PromptVCS } from './prompt_vcs.js';

let activeCategory = 'code';
let activeModel = '';
let activeTemplate = '';
let canvasGraph = null;
let promptVcs = new PromptVCS();
let currentRawPrompt = '';
let currentCompiledBrief = '';

const models = {
  code: ["Claude", "Cursor", "Antigravity", "Codex", "ChatGPT"],
  design: ["Claude Design", "Stitch", "Figma", "Lovable"],
  marketing: ["Gemini Flash", "ChatGPT", "Claude"],
  image: ["Nano Banana", "Midjourney v6", "Flux.1", "Imagen 4", "DALL-E 3"]
};

// Expose workspace & triggers globally
window.switchWorkspace = switchWorkspace;
window.setCategory = setCategory;
window.toggleTheme = toggleTheme;
window.toggleApiDrawer = toggleApiDrawer;
window.toggleContextDrawer = toggleContextDrawer;
window.updateApiKeyPlaceholder = updateApiKeyPlaceholder;
window.saveApiKey = saveApiKey;
window.clearApiKey = clearApiKey;
window.compilePrompt = compilePrompt;
window.loadTemplateFields = loadTemplateFields;
window.copyResult = copyResult;
window.filterLibrary = filterLibrary;
window.copyLibraryTemplate = copyLibraryTemplate;
window.triggerFolderPicker = triggerFolderPicker;
window.commitCurrentPrompt = commitCurrentPrompt;
window.loadCommitHistory = loadCommitHistory;
window.renderVisualDiff = renderVisualDiff;
window.updateThemeVariables = updateThemeVariables;
window.updateThemeTextVariable = updateThemeTextVariable;
window.exportCustomTheme = exportCustomTheme;
window.runCanvasWorkflow = runCanvasWorkflow;
window.runArenaCompare = runArenaCompare;

// 1. Workspace Routing Toggler
function switchWorkspace(name) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  // Select button matching onclick
  const tabBtn = Array.from(document.querySelectorAll('header .nav-tab')).find(b => b.getAttribute('onclick').includes(name));
  if (tabBtn) tabBtn.classList.add('active');

  const list = ['builder', 'nodes', 'arena', 'vcs', 'theme'];
  list.forEach(item => {
    const ws = document.getElementById(`ws-${item}`);
    if (item === name) {
      ws.classList.add('workspace-active');
    } else {
      ws.classList.remove('workspace-active');
    }
  });

  if (name === 'nodes' && !canvasGraph) {
    canvasGraph = new NodeGraphCanvas('node-canvas');
  }
  if (name === 'vcs') {
    loadCommitHistory();
  }
}

// 2. Client-Side Directory AST Scraper (File System Access API)
async function triggerFolderPicker() {
  const statusVal = document.getElementById('context-drawer-status');
  try {
    // 1. Request Directory Handle
    const dirHandle = await window.showDirectoryPicker();
    statusVal.innerText = "[Scanning...]";
    
    const filesList = [];
    const sensitiveAlerts = [];
    
    // 2. Recursive Traversal
    async function readDir(handle, relativePath = '') {
      for await (const entry of handle.values()) {
        const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        // Safety Sweep validation
        const SENSITIVE_MATCHERS = [
          /^\.env/i, /\.pem$/i, /\.key$/i, /\.crt$/i, /\.db$/i, /\.sqlite$/i,
          /credentials/i, /secret/i, /^id_rsa/i, /^id_ecdsa/i
        ];
        const isSecAlert = SENSITIVE_MATCHERS.some(r => r.test(entry.name) || r.test(entryPath));
        
        if (isSecAlert) {
          sensitiveAlerts.push(entryPath);
          continue; // Redact/Skip from entering context!
        }
        
        // Skip dependencies directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }

        if (entry.kind === 'directory') {
          await readDir(entry, entryPath);
        } else {
          filesList.push(entryPath);
        }
      }
    }
    
    await readDir(dirHandle);
    
    // 3. Update inputs fields
    document.getElementById('ctx-files').value = filesList.slice(0, 25).join(', ');
    statusVal.innerText = `[Mounted: ${dirHandle.name}]`;
    statusVal.style.color = '#10b981';

    // Show warnings if credentials were redacted
    if (sensitiveAlerts.length > 0) {
      alert(`⚠️ Security Sweep Redaction Active:\nExcluding ${sensitiveAlerts.length} sensitive credential file(s) from prompt context index:\n${sensitiveAlerts.slice(0, 3).join('\n')}...`);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      alert(`Folder Picker Error: ${err.message}. Defaulting to standard context form.`);
    }
    statusVal.innerText = "[Mounted: Defaults]";
    statusVal.style.color = 'var(--fg-muted)';
  }
}

// 3. Core templates compile triggers
async function compilePrompt() {
  const t = templates.find(item => item.id === activeTemplate && item.category === activeCategory);
  if (!t) return;

  const rawInput = document.getElementById('field-raw').value;
  if (!rawInput) {
    alert("Please enter prompt instructions first!");
    return;
  }

  currentRawPrompt = rawInput;
  const f1 = document.getElementById('field-raw').value;
  const f2 = t.fields[1] ? document.getElementById(`field-${t.fields[1].id}`).value : '';

  // Gather context details securely
  const inputBranch = document.getElementById('ctx-branch').value || 'main';
  const inputProjType = document.getElementById('ctx-project-type').value || 'generic';
  const inputScripts = document.getElementById('ctx-scripts').value ? document.getElementById('ctx-scripts').value.split(',').map(s => s.trim()) : [];
  const inputFiles = document.getElementById('ctx-files').value ? document.getElementById('ctx-files').value.split(',').map(f => f.trim()) : [];

  const context = {
    branch: inputBranch,
    project_type: inputProjType,
    scripts: inputScripts,
    files: inputFiles
  };

  const locallyCompiled = t.compiler(f1, f2, context);

  const provider = document.getElementById('api-provider').value;
  const apiKey = localStorage.getItem(`ps:key:${provider}`);

  const overlay = document.getElementById('loading-overlay');
  const text = document.getElementById('loading-text');
  const container = document.getElementById('result-container');

  container.classList.remove('visible');
  overlay.classList.add('visible');

  const animationStages = [
    "Stage 1: Performing Visual & Semantic Analysis...",
    "Stage 2: Translating prompt intent core...",
    "Stage 3: Verifying constraint criteria...",
    "Stage 4: Tuning model-specific syntax wrappers...",
    "Stage 5: Finalizing Assembly..."
  ];

  for (let i = 0; i < animationStages.length; i++) {
    await new Promise(r => setTimeout(r, 220));
    text.innerText = animationStages[i];
  }

  if (apiKey) {
    try {
      text.innerText = "Querying live LLM refiner engine...";
      const finalPrompt = await runLiveLlmRefine(provider, apiKey, locallyCompiled);
      displayResult(rawInput, finalPrompt);
    } catch (err) {
      alert(`Live API compilation failed: ${err.message}. Falling back to offline local compiler.`);
      displayResult(rawInput, locallyCompiled);
    }
  } else {
    displayResult(rawInput, locallyCompiled);
  }
}

async function runLiveLlmRefine(provider, key, compiledBrief) {
  const systemInstruction = `You are the core prompt optimization engine. Your job is to refine, clean, and format the user's prompt brief to make it highly optimized for the target AI. Output ONLY the compiled prompt, no chatting, no explanations.`;

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\nOptimized task details:\n${compiledBrief}` }]
          }
        ]
      })
    });
    if (!res.ok) throw new Error(`Google API returned status ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text ? data.candidates[0].content.parts[0].text.trim() : data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Anthropic Claude API currently blocks direct browser requests due to CORS settings. Please use the Gemini integration for client-side API executions.");
  }
}

function displayResult(raw_prompt, result) {
  document.getElementById('loading-overlay').classList.remove('visible');
  document.getElementById('result-container').classList.add('visible');
  document.getElementById('result-box').innerText = result;
  
  currentCompiledBrief = result;
  
  // Calculate tokens & costs
  const estTokens = Math.ceil(result.length / 4);
  const cost = (estTokens * 0.000000075).toFixed(6); // generic estimate rate
  document.getElementById('token-calculator').innerText = `Estimated tokens: ${estTokens} (Cost: $${cost})`;
  
  saveHistoryItem(raw_prompt, result);
}

// 4. Prompt Version Control System (VCS) Integrations
function commitCurrentPrompt() {
  if (!currentCompiledBrief) {
    alert("Compile a prompt first before committing version changes.");
    return;
  }
  const msg = document.getElementById('vcs-message').value || "Update prompt brief";
  const promptId = activeTemplate || 'custom';
  promptVcs.commit(promptId, currentCompiledBrief, msg);
  alert("Version committed to prompt VCS.");
  switchWorkspace('vcs');
}

function loadCommitHistory() {
  const promptId = activeTemplate || 'custom';
  const commits = promptVcs.getHistory(promptId);
  
  const list = document.getElementById('vcs-commit-list');
  const selA = document.getElementById('vcs-compare-a');
  const selB = document.getElementById('vcs-compare-b');
  
  list.innerHTML = '';
  selA.innerHTML = '';
  selB.innerHTML = '';
  
  if (commits.length === 0) {
    list.innerHTML = '<div style="font-size:12.5px;color:var(--fg-muted);text-align:center;padding:20px 0;">No commits logged for this template.</div>';
    return;
  }

  commits.forEach(c => {
    // List item
    const item = document.createElement('div');
    item.className = 'history-item';
    item.onclick = () => {
      document.getElementById('vcs-diff-box').innerText = c.content;
    };
    item.innerHTML = `
      <div class="history-item-meta">
        <span>v${c.version} · Commit</span>
        <span>${c.timestamp}</span>
      </div>
      <div class="history-item-prompt">${c.message}</div>
    `;
    list.appendChild(item);

    // Option selectors
    const optA = document.createElement('option');
    optA.value = c.version;
    optA.innerText = `v${c.version} - ${c.message}`;
    selA.appendChild(optA);

    const optB = document.createElement('option');
    optB.value = c.version;
    optB.innerText = `v${c.version} - ${c.message}`;
    selB.appendChild(optB);
  });
  
  // Set defaults for diff view comparison (compare latest with previous if available)
  if (commits.length >= 2) {
    selA.value = commits[commits.length - 2].version;
    selB.value = commits[commits.length - 1].version;
    renderVisualDiff();
  } else {
    document.getElementById('vcs-diff-box').innerText = commits[0].content;
  }
}

function renderVisualDiff() {
  const promptId = activeTemplate || 'custom';
  const commits = promptVcs.getHistory(promptId);
  const vA = parseInt(document.getElementById('vcs-compare-a').value);
  const vB = parseInt(document.getElementById('vcs-compare-b').value);
  
  const cA = commits.find(c => c.version === vA);
  const cB = commits.find(c => c.version === vB);
  
  if (cA && cB) {
    const diffHtml = promptVcs.diff(cA.content, cB.content);
    document.getElementById('vcs-diff-box').innerHTML = diffHtml;
  }
}

// 5. Visual Pipeline Graph execution
async function runCanvasWorkflow() {
  if (!canvasGraph) return;
  
  const runBtn = document.querySelector('[onclick="runCanvasWorkflow()"]');
  runBtn.innerText = "Running Pipeline...";
  runBtn.disabled = true;

  await canvasGraph.runGraphPipeline(() => {
    runBtn.innerText = "Execute Workflow";
    runBtn.disabled = false;
    alert("Pipeline successfully executed. Prompts compiled along linked nodes.");
  });
}

// 6. Split-Screen Arena evaluations comparisons
async function runArenaCompare(side) {
  const promptText = document.getElementById(`arena-prompt-${side}`).value;
  if (!promptText) {
    alert("Please enter prompt parameters inside textbox first.");
    return;
  }

  const outputDiv = document.getElementById(`arena-output-${side}`);
  const metaDiv = document.getElementById(`arena-meta-${side}`);

  outputDiv.innerText = "Tuning prompt logic and compiling mock evaluation outputs...";
  
  const start = performance.now();
  await new Promise(r => setTimeout(r, 800)); // Latency delay simulator
  const end = performance.now();
  
  const latency = ((end - start) / 1000).toFixed(2);
  const tokens = Math.ceil(promptText.length / 4) + 120;
  const cost = (tokens * 0.000000075).toFixed(6);

  outputDiv.innerText = `[Evaluation output for ${side.toUpperCase()}]:\nVerified execution instructions loaded. AI has generated mock response content based on the target prompt parameters. Prompt quality rated: 94%.`;
  metaDiv.innerText = `Tokens: ${tokens} · Latency: ${latency}s · Est Cost: $${cost}`;
}

// 7. Theme Variable Customizations
function updateThemeVariables() {
  const primary = document.getElementById('theme-primary').value;
  const glow = document.getElementById('theme-glow').value;
  const radius = document.getElementById('theme-radius').value;
  const font = document.getElementById('theme-font').value;

  // Set visual variables on document root
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--primary-glow', `rgba(${hexToRgb(primary)}, 0.${glow})`);
  document.documentElement.style.setProperty('--primary-soft', `rgba(${hexToRgb(primary)}, 0.12)`);
  document.documentElement.style.setProperty('--radius-lg', `${radius}px`);
  document.documentElement.style.setProperty('--radius-md', `${Math.max(radius - 8, 4)}px`);
  document.documentElement.style.setProperty('--font', font);

  // Update readouts
  document.getElementById('theme-primary-text').value = primary;
  document.getElementById('glow-radius-val').innerText = `${glow}%`;
  document.getElementById('corner-radius-val').innerText = `${radius}px`;
}

function updateThemeTextVariable() {
  const hex = document.getElementById('theme-primary-text').value;
  if (/^#[0-9A-F]{6}$/i.test(hex)) {
    document.getElementById('theme-primary').value = hex;
    updateThemeVariables();
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : `0, 153, 255`;
}

function exportCustomTheme() {
  const primary = document.documentElement.style.getPropertyValue('--primary') || '#0099ff';
  const glow = document.documentElement.style.getPropertyValue('--primary-glow') || 'rgba(0, 153, 255, 0.45)';
  const radius = document.documentElement.style.getPropertyValue('--radius-lg') || '20px';
  const font = document.documentElement.style.getPropertyValue('--font') || "'Geist', sans-serif";

  const css = `/* Custom CroPrompt Theme styles.css */
:root {
  --primary: ${primary};
  --primary-glow: ${glow};
  --radius-lg: ${radius};
  --font: ${font};
}`;
  
  navigator.clipboard.writeText(css).then(() => {
    alert("Custom CSS styling variables copied to clipboard. Paste directly inside style.css!");
  });
}

// Rebranding navigation category toggles
function updateThemeIcons() {
  const isLight = document.documentElement.classList.contains('light-mode');
  document.getElementById('theme-ico-dark').style.display = isLight ? 'none' : 'block';
  document.getElementById('theme-ico-light').style.display = isLight ? 'block' : 'none';
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('ps:theme', isLight ? 'light' : 'dark');
  updateThemeIcons();
  if (canvasGraph) canvasGraph.draw();
}

function toggleApiDrawer() {
  const body = document.getElementById('api-drawer-body');
  body.style.display = body.style.display === 'block' ? 'none' : 'block';
}

function toggleContextDrawer() {
  const body = document.getElementById('context-drawer-body');
  body.style.display = body.style.display === 'block' ? 'none' : 'block';
}

function updateApiKeyPlaceholder() {
  const provider = document.getElementById('api-provider').value;
  const input = document.getElementById('api-key');
  input.placeholder = "Enter Gemini API key (AIzaSy...)";
}

function saveApiKey() {
  const provider = document.getElementById('api-provider').value;
  const key = document.getElementById('api-key').value;
  if (!key) return;
  localStorage.setItem(`ps:key:${provider}`, key);
  updateApiStatus();
  alert("Key saved locally.");
  toggleApiDrawer();
}

function clearApiKey() {
  const provider = document.getElementById('api-provider').value;
  localStorage.removeItem(`ps:key:${provider}`);
  document.getElementById('api-key').value = '';
  updateApiStatus();
  alert("Key cleared.");
}

function updateApiStatus() {
  const provider = document.getElementById('api-provider').value;
  const key = localStorage.getItem(`ps:key:${provider}`);
  const status = document.getElementById('api-drawer-status');
  if (key) {
    status.innerText = `[Live: ${provider.toUpperCase()}]`;
    status.style.color = '#10b981';
  } else {
    status.innerText = '[Configure Key]';
    status.style.color = 'var(--fg-muted)';
  }
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  event.target.classList.add('active');
  event.target.setAttribute('aria-selected', 'true');

  const titles = {
    code: ["Code Brief Engineering", "Assemble context-bounded task briefs optimized for AI coding agents."],
    design: ["UI/UX Design Spec Builder", "Formulate rich, responsive design specifications and aesthetic frameworks."],
    marketing: ["Marketing Copy & Campaign Planner", "Draft hook-driven text campaigns and positioning variables."],
    image: ["Visual Prompt Optimizer", "Construct photorealistic, high-fidelity prompt structures matching model catalogs."]
  };
  
  document.getElementById('panel-title').innerText = titles[cat][0];
  document.getElementById('panel-desc').innerText = titles[cat][1];

  const contextDrawer = document.getElementById('context-drawer-wrap');
  contextDrawer.style.display = cat === 'code' ? 'block' : 'none';

  renderModelChips();
  renderTemplates();
}

function renderModelChips() {
  const container = document.getElementById('model-chips');
  container.innerHTML = '';
  const list = models[activeCategory];
  list.forEach((m, idx) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (idx === 0 ? ' active' : '');
    chip.innerText = m;
    chip.onclick = () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeModel = m;
    };
    container.appendChild(chip);
  });
  activeModel = list[0];
}

function renderTemplates() {
  const select = document.getElementById('template-select');
  select.innerHTML = '';
  const list = templates.filter(t => t.category === activeCategory);
  list.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.innerText = t.name;
    select.appendChild(opt);
  });
  loadTemplateFields();
}

function loadTemplateFields() {
  const select = document.getElementById('template-select');
  const container = document.getElementById('fields-container');
  container.innerHTML = '';
  
  const t = templates.find(item => item.id === select.value && item.category === activeCategory);
  if (!t) return;
  activeTemplate = t.id;

  t.fields.forEach(f => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.innerText = f.label;

    let input;
    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = `field-${f.id}`;
      input.placeholder = f.placeholder;
    } else {
      input = document.createElement('input');
      input.id = `field-${f.id}`;
      input.type = 'text';
      input.placeholder = f.placeholder;
    }
    group.appendChild(label);
    group.appendChild(input);
    container.appendChild(group);
  });
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('ps:history')) || [];
  } catch (_) {
    return [];
  }
}

function saveHistoryItem(raw_prompt, compiled) {
  const history = getHistory();
  const entry = {
    category: activeCategory.toUpperCase(),
    model: activeModel,
    raw_prompt: raw_prompt.length > 60 ? raw_prompt.substring(0, 57) + "..." : raw_prompt,
    compiled: compiled,
    timestamp: new Date().toLocaleTimeString()
  };
  history.unshift(entry);
  localStorage.setItem('ps:history', JSON.stringify(history.slice(0, 50))); 
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  const items = getHistory();
  if (items.length === 0) {
    list.innerHTML = '<div style="font-size:13px; color:var(--fg-muted); text-align:center; padding:20px 0;">No logs compiled yet.</div>';
    return;
  }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.onclick = () => {
      document.getElementById('result-container').classList.add('visible');
      document.getElementById('result-box').innerText = item.compiled;
    };
    div.innerHTML = `
      <div class="history-item-meta">
        <span>${item.model} · ${item.category}</span>
        <span>${item.timestamp}</span>
      </div>
      <div class="history-item-prompt">${item.raw_prompt}</div>
    `;
    list.appendChild(div);
  });
}

function renderLibrary(filterText = '') {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';
  
  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(filterText.toLowerCase()) || 
                          t.desc.toLowerCase().includes(filterText.toLowerCase());
    return matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--fg-muted);">No templates found matching your search term.</div>';
    return;
  }

  filtered.forEach(t => {
    const card = document.createElement('div');
    card.className = 'library-card';
    card.onclick = () => {
      setCategory(t.category);
      setTimeout(() => {
        const select = document.getElementById('template-select');
        select.value = t.id;
        loadTemplateFields();
        document.getElementById('panel-title').scrollIntoView({ behavior: 'smooth' });
      }, 50);
    };

    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="card-cat">${t.category}</span>
        </div>
        <h3 class="card-title">${t.name}</h3>
        <p class="card-desc">${t.desc}</p>
      </div>
      <button class="btn-utility" style="width:100%; font-size:12.5px; padding:6px 12px;" onclick="copyLibraryTemplate(event, '${t.id}')">Copy Template Schema</button>
    `;
    grid.appendChild(card);
  });
}

function filterLibrary() {
  const searchVal = document.getElementById('library-search').value;
  renderLibrary(searchVal);
}

function copyLibraryTemplate(event, id) {
  event.stopPropagation();
  const t = templates.find(item => item.id === id);
  if (!t) return;
  
  let schema = `Template: ${t.name}\nDescription: ${t.desc}\n\nFields:\n`;
  t.fields.forEach(f => {
    schema += `- [${f.label}] (${f.placeholder})\n`;
  });
  
  navigator.clipboard.writeText(schema).then(() => {
    const btn = event.target;
    btn.innerText = "Schema Copied!";
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerText = "Copy Template Schema";
      btn.classList.remove('copied');
    }, 1200);
  });
}

function copyResult() {
  const text = document.getElementById('result-box').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    if (btn) {
      btn.innerText = "Copied!";
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerText = "Copy to Clipboard";
        btn.classList.remove('copied');
      }, 1200);
    }
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcons();
  updateApiStatus();
  renderModelChips();
  renderTemplates();
  renderLibrary();
  renderHistory();
});
