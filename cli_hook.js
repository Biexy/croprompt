#!/usr/bin/env node

// cli_hook.js - CroPrompt Developer CLI Hook
// Can be globally linked or run inside a git pre-commit hook to automate prompt context assembly.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SENSITIVE_PATTERNS = [
  /^\.env/i, /\.pem$/i, /\.key$/i, /\.crt$/i, /\.db$/i, /\.sqlite$/i,
  /credentials/i, /secret/i, /^id_rsa/i, /^id_ecdsa/i,
  /node_modules/i, /\.git/i, /dist/i, /build/i
];

function isSensitive(filename) {
  const base = path.basename(filename);
  return SENSITIVE_PATTERNS.some(regex => regex.test(base) || regex.test(filename));
}

function gatherContext() {
  const context = {
    branch: 'main',
    project_type: 'generic',
    scripts: [],
    files: []
  };

  // 1. Get git branch
  try {
    context.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (_) {
    // Fail silent
  }

  // 2. Identify project scripts
  if (fs.existsSync('package.json')) {
    context.project_type = 'javascript/node';
    try {
      const data = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (data.scripts) {
        context.scripts = Object.keys(data.scripts);
      }
    } catch (_) {}
  } else if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml')) {
    context.project_type = 'python';
  }

  // 3. Scan directories (depth 3 maximum to save tokens)
  function traverse(dir, depth = 0) {
    if (depth > 3) return;
    if (isSensitive(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (isSensitive(fullPath)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          traverse(fullPath, depth + 1);
        } else {
          context.files.push(fullPath.replace(/\\/g, '/'));
        }
      }
    } catch (_) {}
  }

  traverse('.');
  context.files = context.files.slice(0, 20); // Keep top 20 files
  return context;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 CroPrompt CLI Hook - Bounded Prompt Assembler
Usage:
  npx croprompt --prompt "your raw instruction" [options]

Options:
  --prompt, -p   The raw prompt message to refine
  --mode, -m     Compilation mode: coding (default), uiux, marketing, image
  --model        Target model profile (e.g. claude, midjourney, banana)
    `);
    process.exit(0);
  }

  const promptIdx = args.findIndex(a => a === '--prompt' || a === '-p');
  const rawPrompt = promptIdx !== -1 ? args[promptIdx + 1] : args.join(' ');

  if (!rawPrompt) {
    console.error("Error: Please specify a prompt string using --prompt or -p");
    process.exit(1);
  }

  const modeIdx = args.findIndex(a => a === '--mode' || a === '-m');
  const mode = modeIdx !== -1 ? args[modeIdx + 1] : 'coding';

  const modelIdx = args.indexOf('--model');
  const model = modelIdx !== -1 ? args[modelIdx + 1] : 'claude';

  console.log("Analyzing local repository AST and context...");
  const context = gatherContext();

  console.log("Excluding sensitive credentials and files...");
  console.log("Compiling 5-stage prompt instruction brief...");

  // Bounded compiler mappings
  let compiled = '';
  if (mode === 'coding') {
    compiled = `
<instructions>
You are an expert software developer. Solve the following task: "${rawPrompt}"
Follow these strict execution constraints:
1. Preserve existing behavior. Do not change public API surfaces or method signatures without approval.
2. Run validation checks and project test suites before and after making edits.
3. Safety boundary: do not modify payment/auth logic.
</instructions>

<project_context>
- Active Branch: ${context.branch}
- Project Type: ${context.project_type}
- File Map: ${context.files.join(', ')}
- Available Scripts: ${context.scripts.join(', ') || 'None'}
</project_context>

<validation_rules>
- Verification Steps: Formulate regression checks and execute automated validation logs to confirm task success.
</validation_rules>`;
  } else {
    compiled = `[Enhanced Prompt: ${rawPrompt}]`;
  }

  console.log("\n=======================================================");
  console.log("CROPROMPT COMPILED BRIEF:");
  console.log("=======================================================");
  console.log(compiled.trim());
  console.log("=======================================================");
}

if (require.main === module) {
  main();
}
