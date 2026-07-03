// prompt_vcs.js - Prompt Version Control System (VCS)
// Handles commits, version logging, and inline visual text diff highlighting.

export class PromptVCS {
  constructor(storageKey = 'ps:vcs') {
    this.storageKey = storageKey;
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}));
    }
  }

  getHistory(promptId) {
    const db = JSON.parse(localStorage.getItem(this.storageKey)) || {};
    return db[promptId] || [];
  }

  commit(promptId, content, message = "Update prompt") {
    const db = JSON.parse(localStorage.getItem(this.storageKey)) || {};
    if (!db[promptId]) {
      db[promptId] = [];
    }

    const version = db[promptId].length + 1;
    const entry = {
      version,
      timestamp: new Date().toLocaleString(),
      message,
      content
    };

    db[promptId].push(entry);
    localStorage.setItem(this.storageKey, JSON.stringify(db));
    return entry;
  }

  // Pure JS diffing algorithm (Line-by-line comparison with deletions & insertions highlights)
  diff(oldText, newText) {
    const oldLines = oldText ? oldText.split('\n') : [];
    const newLines = newText ? newText.split('\n') : [];
    let html = '';

    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length) {
        if (oldLines[i] === newLines[j]) {
          // Unchanged line
          html += `<div class="diff-line"><span class="diff-prefix">&nbsp;</span> ${this.escapeHtml(oldLines[i])}</div>`;
          i++;
          j++;
        } else {
          // Check ahead for matching lines to align
          let foundMatch = false;
          for (let look = 1; look < 5; look++) {
            if (i + look < oldLines.length && oldLines[i + look] === newLines[j]) {
              // Lines were deleted in new version
              for (let d = 0; d < look; d++) {
                html += `<div class="diff-line diff-del"><span class="diff-prefix">-</span> ${this.escapeHtml(oldLines[i + d])}</div>`;
              }
              i += look;
              foundMatch = true;
              break;
            }
            if (j + look < newLines.length && oldLines[i] === newLines[j + look]) {
              // Lines were inserted in new version
              for (let ins = 0; ins < look; ins++) {
                html += `<div class="diff-line diff-ins"><span class="diff-prefix">+</span> ${this.escapeHtml(newLines[j + ins])}</div>`;
              }
              j += look;
              foundMatch = true;
              break;
            }
          }

          if (!foundMatch) {
            // Direct replacement/mismatch
            html += `<div class="diff-line diff-del"><span class="diff-prefix">-</span> ${this.escapeHtml(oldLines[i])}</div>`;
            html += `<div class="diff-line diff-ins"><span class="diff-prefix">+</span> ${this.escapeHtml(newLines[j])}</div>`;
            i++;
            j++;
          }
        }
      } else if (i < oldLines.length) {
        // Remaining lines are deletions
        html += `<div class="diff-line diff-del"><span class="diff-prefix">-</span> ${this.escapeHtml(oldLines[i])}</div>`;
        i++;
      } else if (j < newLines.length) {
        // Remaining lines are insertions
        html += `<div class="diff-line diff-ins"><span class="diff-prefix">+</span> ${this.escapeHtml(newLines[j])}</div>`;
        j++;
      }
    }
    return html;
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
