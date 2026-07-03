# 🚀 CroPrompt - Bounded Prompt Engineering Engine

**CroPrompt** is a production-grade, serverless prompt engineering studio designed to construct context-bounded task briefs optimized for AI coding agents, design workflows, and chatbots. It operates entirely as a client-side Single-Page Application (SPA), allowing developers to build, test, version-control, and automate prompts locally or host the workspace 100% free on GitHub Pages.

### Why CroPrompt?
AI coding agents are highly sensitive to prompt structuring and context limits. Raw, unbounded prompts lead to token waste, context dilution, and potential credential leaks. CroPrompt solves this by assembling structured briefs bound by active git branch details, project framework configurations, and focus file maps, while automatically sweeping code files to block private key and token leaks.

---

## ✨ Pro Features
1. **Interactive Visual Node Graph (ComfyUI Style)**: A fully functional canvas workspace. Drag, position, and connect logical prompt modules (e.g. Scraper, Key Guard, Compiler) with bezier wires. Execute workflows visually.
2. **Client-Side AST Repo Scraper**: Uses the browser's **File System Access API** to mount local directories client-side, recursing folder structures and analyzing configurations safely.
3. **Regex Key Sweeper (Credential Blocker)**: Protects against data leaks. Sweeps code files for secrets, tokens, or private key signatures, redacting them before they leave the browser.
4. **Prompt Version Control (VCS)**: Git-like prompt version commit engine. Save revisions and compare versions side-by-side using an inline visual text diff highlights compiler (green/red lines additions).
5. **Split-Screen Sandbox Arena**: Compare prompt execution outputs side-by-side. Includes real-time token count estimation and API pricing calculators (Gemini, Claude, GPT-4).
6. **Live API Key Connector**: Save Google Gemini API Keys directly in `localStorage` to run live content refiner requests.
7. **Dynamic CSS Theme Designer**: Edit visual variables (accents, curve shapes, glows) directly in the UI and export custom stylesheet variables instantly.
8. **Node CLI Integration Hook (`cli_hook.js`)**: A terminal automation script allowing developers to compile briefs offline from their command line.

---

## 💻 Local Setup

Run the developer static server locally using Node:

1. Install static server dev tools:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```
This launches a local server at `http://localhost:8080` and opens the browser automatically.

---

## 🌐 Deploy to GitHub Pages (100% Free Hosting)
Since CroPrompt Pro Studio runs as a client-side SPA, you can host it for free on GitHub:
1. Create a new repository on your GitHub account.
2. Commit and push the workspace root contents to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initialize CroPrompt Pro Studio MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. In your GitHub repository settings, go to **Settings** → **Pages**.
4. Set Source to **Deploy from a branch**, select the `main` branch, and click **Save**.
5. Your live link (e.g., `https://username.github.io/repo/`) will be generated.
