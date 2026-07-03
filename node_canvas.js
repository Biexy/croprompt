// node_canvas.js - CroPrompt Pro Interactive Visual Node Editor
// Zero-dependency HTML5 Canvas nodes controller for drag-and-drop prompt pipeline building.

export class NodeGraphCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.draggingNode = null;
    this.connectingPort = null;
    this.dragOffset = { x: 0, y: 0 };
    
    // Canvas sizing
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Bind event handlers
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    
    // Add default starter nodes
    this.initializeDefaultGraph();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = 450;
    this.draw();
  }

  initializeDefaultGraph() {
    this.addNode("Raw Input", 40, 150, ["Prompt Text"], ["Raw Value"]);
    this.addNode("AST Analyzer", 280, 100, ["Folder Data", "Raw Value"], ["Ast Index", "Metadata"]);
    this.addNode("Key Guard", 540, 120, ["Ast Index"], ["Safe Context"]);
    this.addNode("LLM Compiler", 780, 160, ["Safe Context", "Metadata"], ["Compiled Brief"]);
    
    // Default connections
    this.addConnection(0, 0, 1, 1); // Raw Value to AST Analyzer (Raw Value)
    this.addConnection(1, 0, 2, 0); // AST Index to Key Guard
    this.addConnection(2, 0, 3, 0); // Safe Context to LLM Compiler
  }

  addNode(title, x, y, inputs = [], outputs = []) {
    const id = this.nodes.length;
    const width = 180;
    const headerHeight = 36;
    const portGap = 24;
    const height = Math.max(inputs.length, outputs.length) * portGap + headerHeight + 16;

    const node = {
      id, title, x, y, width, height, headerHeight,
      inputs: inputs.map((name, i) => ({ name, y: headerHeight + 16 + i * portGap })),
      outputs: outputs.map((name, i) => ({ name, y: headerHeight + 16 + i * portGap })),
      status: 'idle' // idle, active, done, error
    };
    this.nodes.push(node);
    this.draw();
  }

  addConnection(fromNodeId, fromPortIdx, toNodeId, toPortIdx) {
    // Avoid duplicates
    const exists = this.connections.some(c => 
      c.fromNode === fromNodeId && c.fromPort === fromPortIdx &&
      c.toNode === toNodeId && c.toPort === toPortIdx
    );
    if (!exists) {
      this.connections.push({
        fromNode: fromNodeId,
        fromPort: fromPortIdx,
        toNode: toNodeId,
        toPort: toPortIdx,
        pulseProgress: 0 // animation parameter
      });
    }
    this.draw();
  }

  // Event handlers
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // 1. Check ports click for linking
    for (let node of this.nodes) {
      // Check outputs ports
      for (let i = 0; i < node.outputs.length; i++) {
        const px = node.x + node.width;
        const py = node.y + node.outputs[i].y;
        if (Math.hypot(mx - px, my - py) < 10) {
          this.connectingPort = { node: node.id, port: i, type: 'output', startX: px, startY: py, curX: mx, curY: my };
          return;
        }
      }
      // Check input ports
      for (let i = 0; i < node.inputs.length; i++) {
        const px = node.x;
        const py = node.y + node.inputs[i].y;
        if (Math.hypot(mx - px, my - py) < 10) {
          this.connectingPort = { node: node.id, port: i, type: 'input', startX: px, startY: py, curX: mx, curY: my };
          return;
        }
      }
    }

    // 2. Check header click for drag node
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      let node = this.nodes[i];
      if (mx >= node.x && mx <= node.x + node.width &&
          my >= node.y && my <= node.y + node.height) {
        this.draggingNode = node;
        this.dragOffset.x = mx - node.x;
        this.dragOffset.y = my - node.y;
        
        // Bring to front
        this.nodes.push(this.nodes.splice(i, 1)[0]);
        this.draw();
        return;
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.draggingNode) {
      this.draggingNode.x = mx - this.dragOffset.x;
      this.draggingNode.y = my - this.dragOffset.y;
      this.draw();
    } else if (this.connectingPort) {
      this.connectingPort.curX = mx;
      this.connectingPort.curY = my;
      this.draw();
    }
  }

  onMouseUp(e) {
    if (this.connectingPort) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Find matching port
      for (let node of this.nodes) {
        if (node.id === this.connectingPort.node) continue;

        if (this.connectingPort.type === 'output') {
          // Look for input port
          for (let i = 0; i < node.inputs.length; i++) {
            const px = node.x;
            const py = node.y + node.inputs[i].y;
            if (Math.hypot(mx - px, my - py) < 14) {
              this.addConnection(this.connectingPort.node, this.connectingPort.port, node.id, i);
              break;
            }
          }
        } else {
          // Look for output port
          for (let i = 0; i < node.outputs.length; i++) {
            const px = node.x + node.width;
            const py = node.y + node.outputs[i].y;
            if (Math.hypot(mx - px, my - py) < 14) {
              this.addConnection(node.id, i, this.connectingPort.node, this.connectingPort.port);
              break;
            }
          }
        }
      }
      this.connectingPort = null;
      this.draw();
    }
    this.draggingNode = null;
  }

  // Draw Loops
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid Backdrop
    this.ctx.strokeStyle = document.documentElement.classList.contains('light-mode') ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)';
    this.ctx.lineWidth = 1;
    const gridGap = 20;
    for (let x = 0; x < this.canvas.width; x += gridGap) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridGap) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Draw links
    this.connections.forEach(conn => {
      const fromNode = this.nodes.find(n => n.id === conn.fromNode);
      const toNode = this.nodes.find(n => n.id === conn.toNode);
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + fromNode.width;
      const y1 = fromNode.y + fromNode.outputs[conn.fromPort].y;
      const x2 = toNode.x;
      const y2 = toNode.y + toNode.inputs[conn.toPort].y;

      this.drawBezierLink(x1, y1, x2, y2, conn.pulseProgress);
    });

    // Draw active drawing link wire
    if (this.connectingPort) {
      this.ctx.strokeStyle = '#0099ff';
      this.ctx.lineWidth = 2.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.connectingPort.startX, this.connectingPort.startY);
      this.ctx.bezierCurveTo(
        this.connectingPort.startX + 60, this.connectingPort.startY,
        this.connectingPort.curX - 60, this.connectingPort.curY,
        this.connectingPort.curX, this.connectingPort.curY
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw nodes
    this.nodes.forEach(node => {
      // Body Shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      this.ctx.shadowBlur = 16;
      this.ctx.shadowOffsetY = 6;

      // Status indicator coloring
      let statusColor = 'rgba(255,255,255,0.08)';
      if (node.status === 'active') statusColor = 'rgba(0, 153, 255, 0.2)';
      else if (node.status === 'done') statusColor = 'rgba(16, 185, 129, 0.15)';
      else if (node.status === 'error') statusColor = 'rgba(239, 68, 68, 0.15)';

      this.ctx.fillStyle = document.documentElement.classList.contains('light-mode') ? '#ffffff' : '#0f172a';
      this.ctx.strokeStyle = node.status === 'active' ? '#0099ff' : (node.status === 'done' ? '#10b981' : 'rgba(255,255,255,0.12)');
      this.ctx.lineWidth = node.status === 'active' ? 2 : 1;
      
      this.ctx.beginPath();
      this.roundRect(node.x, node.y, node.width, node.height, 12);
      this.ctx.fill();
      this.ctx.stroke();

      // Clear Shadow
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;

      // Header background
      this.ctx.fillStyle = node.status === 'active' ? 'rgba(0,153,255,0.15)' : 'rgba(255,255,255,0.03)';
      this.ctx.beginPath();
      this.roundRect(node.x, node.y, node.width, node.headerHeight, {tl: 12, tr: 12, bl: 0, br: 0});
      this.ctx.fill();

      // Header bottom border line
      this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      this.ctx.beginPath();
      this.ctx.moveTo(node.x, node.y + node.headerHeight);
      this.ctx.lineTo(node.x + node.width, node.y + node.headerHeight);
      this.ctx.stroke();

      // Title Text
      this.ctx.fillStyle = document.documentElement.classList.contains('light-mode') ? '#0f172a' : '#ffffff';
      this.ctx.font = '600 13px Geist';
      this.ctx.fillText(node.title, node.x + 14, node.y + 22);

      // Draw input ports dots & text
      node.inputs.forEach(input => {
        const px = node.x;
        const py = node.y + input.y;
        
        // Port dot
        this.ctx.fillStyle = '#64748b';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '400 11px Geist Mono';
        this.ctx.fillText(input.name, node.x + 12, py + 4);
      });

      // Draw output ports dots & text
      node.outputs.forEach(output => {
        const px = node.x + node.width;
        const py = node.y + output.y;

        this.ctx.fillStyle = '#0099ff';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '400 11px Geist Mono';
        const txtWidth = this.ctx.measureText(output.name).width;
        this.ctx.fillText(output.name, px - 12 - txtWidth, py + 4);
      });
    });
  }

  drawBezierLink(x1, y1, x2, y2, progress = 0) {
    this.ctx.strokeStyle = progress > 0 ? '#0099ff' : 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = progress > 0 ? 3 : 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.bezierCurveTo(x1 + 60, y1, x2 - 60, y2, x2, y2);
    this.ctx.stroke();

    // Pulse signal animation bubble
    if (progress > 0 && progress < 1) {
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.shadowColor = '#0099ff';
      this.ctx.shadowBlur = 8;
      
      const t = progress;
      const cx = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * (x1 + 60) + 3 * (1 - t) * t ** 2 * (x2 - 60) + t ** 3 * x2;
      const cy = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3 * y2;
      
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  // Draw rounded rect utility
  roundRect(x, y, w, h, r) {
    if (typeof r === 'number') {
      r = {tl: r, tr: r, bl: r, br: r};
    }
    this.ctx.moveTo(x + r.tl, y);
    this.ctx.lineTo(x + w - r.tr, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.ctx.lineTo(x + w, y + h - r.br);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.ctx.lineTo(x + r.bl, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.ctx.lineTo(x, y + r.tl);
    this.ctx.quadraticCurveTo(x, y, x + r.tl, y);
  }

  // Execute Graph Animation Loop
  async runGraphPipeline(onComplete) {
    const stepsCount = this.nodes.length;
    for (let i = 0; i < stepsCount; i++) {
      this.nodes[i].status = 'active';
      this.draw();
      
      // Animate signal pulses on connections stemming from this node
      const outputsConns = this.connections.filter(c => c.fromNode === this.nodes[i].id);
      if (outputsConns.length > 0) {
        await this.animatePulses(outputsConns);
      } else {
        await new Promise(r => setTimeout(r, 600));
      }
      
      this.nodes[i].status = 'done';
      this.draw();
    }
    if (onComplete) onComplete();
  }

  animatePulses(conns) {
    return new Promise(resolve => {
      let start = null;
      const duration = 800; // ms
      
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        conns.forEach(c => { c.pulseProgress = progress; });
        this.draw();
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          conns.forEach(c => { c.pulseProgress = 0; }); // reset
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}
