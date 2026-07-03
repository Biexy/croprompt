// templates.js - CroPrompt Pro Database
// Contains a vast library of 24 highly structured prompt blueprints across 8 categories.

export const templates = [
  // ==================== CATEGORY: CODE ====================
  {
    id: "bug_fix",
    category: "code",
    name: "Bug Diagnostic & Fix Brief",
    desc: "Transforms general bug reports into bounded, target-aware code diagnostic briefs.",
    fields: [
      { id: "raw", type: "textarea", label: "Describe the bug/issue", placeholder: "e.g., payment routing endpoint drops authentication cookies" },
      { id: "boundaries", type: "text", label: "Strict Safety Boundaries", placeholder: "e.g., do not mutate session verification algorithms" }
    ],
    compiler: (raw, bounds, context) => {
      return `<instructions>
You are an expert software developer. Solve the following task: "${raw}"
Follow these strict execution constraints:
1. Preserve existing behavior. Do not change public API surfaces or method signatures without approval.
2. Run validation checks and project test suites before and after making edits.
3. Safety boundary rules to respect: ${bounds || 'None specified.'}
</instructions>

<project_context>
- Active Branch: ${context.branch || 'main'}
- Project Type: ${context.project_type || 'generic'}
- Files Map: ${context.files && context.files.length ? context.files.join(', ') : 'None'}
</project_context>

<validation_rules>
- Verification Steps: Formulate regression checks and execute automated validation logs to confirm task success.
</validation_rules>`;
    }
  },
  {
    id: "feature",
    category: "code",
    name: "Mini-Specification Spec",
    desc: "Auto-generates micro specifications with focus on edge cases and limits.",
    fields: [
      { id: "raw", type: "textarea", label: "Feature requirements", placeholder: "e.g., add CSV export to the user report logs panel" },
      { id: "limits", type: "text", label: "Volume / Scale Limits", placeholder: "e.g., maximum download limit 10MB per stream" }
    ],
    compiler: (raw, limits, context) => {
      return `<spec_brief>
Task: Implement the following feature specification: "${raw}"

Boundaries to enforce:
- Limit parameters: ${limits || 'None specified.'}
- Follow clean code practices and match existing structural styling patterns.
- Run tests to confirm there are no regression side effects.
</spec_brief>

<context>
- Directory: ${context.files && context.files.length ? context.files.join(', ') : 'None'}
</context>`;
    }
  },
  {
    id: "refactor",
    category: "code",
    name: "Behavior-Preserving Refactor",
    desc: "Cleans up logic modules while guaranteeing zero functionality mutations.",
    fields: [
      { id: "raw", type: "textarea", label: "Module to refactor", placeholder: "e.g., optimize SQL query index inside authManager.js" },
      { id: "lock", type: "text", label: "Locked Signatures / Contracts", placeholder: "e.g., keep verifyUserSession(id) function signature intact" }
    ],
    compiler: (raw, lock) => {
      return `<refactor_task>
Task: Clean up and refactor the following module logic: "${raw}"

Constraints:
- Strictly preserve existing code functionality.
- Do NOT alter these function contracts: ${lock || 'None.'}
- Run testing suite before and after refactoring steps.
</refactor_task>`;
    }
  },
  {
    id: "test_gen",
    category: "code",
    name: "Unit & Integration Test Suite",
    desc: "Generates high-coverage tests capturing boundary cases and failure conditions.",
    fields: [
      { id: "raw", type: "textarea", label: "Module to test", placeholder: "e.g. auth validation helper methods" },
      { id: "framework", type: "text", label: "Target framework & libraries", placeholder: "e.g. Jest with ts-jest and mock-fs" }
    ],
    compiler: (raw, framework) => {
      return `<instructions>
Generate unit tests for the following module: "${raw}"
Target framework: ${framework || 'Jest'}

Test specifications:
1. Cover standard happy path test flows.
2. Formulate test blocks for boundary conditions and error limits.
3. Utilize clean mock/spy fixtures to isolate external dependencies.
</instructions>`;
    }
  },

  // ==================== CATEGORY: DESIGN ====================
  {
    id: "dashboard",
    category: "design",
    name: "SaaS Dashboard Layout Spec",
    desc: "Generate premium, responsive, glassmorphic UI specs with theme tokens.",
    fields: [
      { id: "raw", type: "textarea", label: "Dashboard components layout", placeholder: "e.g., analytics dashboard with user registration details" },
      { id: "colors", type: "text", label: "Aesthetic Accents / Brand", placeholder: "e.g., glowing dark mode with neon blue border accents" }
    ],
    compiler: (raw, colors) => {
      return `<uiux_design_spec>
Task: Design and structure a high-fidelity visual layout for: "${raw}"

Aesthetic Rules (Theme variables: ${colors || 'Standard dark mode'}):
1. **Glassmorphism**: Use translucent surfaces with 'backdrop-filter: blur(12px)' and subtle border outlines.
2. **Typography**: Enforce clean modern type scales (e.g. Geist, Outfit) with standard weights.
3. **Responsiveness**: Implement horizontal flex layouts that wrap or snap-scroll on touch screens.
4. **Flash Prevention**: Mount inline dark mode variables in document head to prevent loading flicker.
</uiux_design_spec>`;
    }
  },
  {
    id: "component",
    category: "design",
    name: "Design System UI Component",
    desc: "Formulate specification grids for reusable components.",
    fields: [
      { id: "raw", type: "textarea", label: "Component parameters & states", placeholder: "e.g., custom dropdown selector with scroll fallback" }
    ],
    compiler: (raw) => {
      return `<ui_component_brief>
Task: Design a reusable UI component: "${raw}"
Detail all interactive states (hover, focus, active, disabled) and accessibility markers.
</ui_component_brief>`;
    }
  },
  {
    id: "landing_page",
    category: "design",
    name: "Conversion Landing Page Schema",
    desc: "Generates semantic sections structured to optimize customer registration flow.",
    fields: [
      { id: "raw", type: "textarea", label: "Value Proposition & Product", placeholder: "e.g. serverless visual prompt design workspace" }
    ],
    compiler: (raw) => {
      return `<landing_page_layout>
Target: Landing page for "${raw}"

Layout Sections:
1. Hero header (glowing CTA, minimal sign up input, active user count badge).
2. Features grid (three column semantic layout with icons).
3. The Mechanics loop (interactive simulator section mockup).
4. FAQ & Transparent pricing table.
</landing_page_layout>`;
    }
  },

  // ==================== CATEGORY: MARKETING ====================
  {
    id: "x_thread",
    category: "marketing",
    name: "Twitter/X Thread Campaign",
    desc: "Generates launch hooks, value assertions, and CTAs for campaigns.",
    fields: [
      { id: "raw", type: "textarea", label: "Campaign / Product details", placeholder: "e.g., launching our local offline prompt studio today" }
    ],
    compiler: (raw) => {
      return `Write an engaging, click-worthy 4-tweet launch thread for: "${raw}"

Structure constraints:
- Tweet 1: Strong hook pointing out a common developer pain point.
- Tweet 2: Introduce the solution and the core value wedge.
- Tweet 3: Detail how it operates (visual gif context placeholder).
- Tweet 4: Clean CTA and link reference. Keep within character bounds.`;
    }
  },
  {
    id: "seo_article",
    category: "marketing",
    name: "SEO Article Blueprint",
    desc: "Generates keyword-optimized article structures with headings hierarchy.",
    fields: [
      { id: "raw", type: "textarea", label: "Main topic & targeted keywords", placeholder: "e.g., prompt engineering for software engineers" }
    ],
    compiler: (raw) => {
      return `Draft a keyword-optimized SEO article blueprint for: "${raw}"
Include:
- Compelling title tag and meta description suggestions.
- Clear H1, H2, and H3 structure mapping.
- Semantic link anchors and context placement guides.`;
    }
  },

  // ==================== CATEGORY: IMAGE ====================
  {
    id: "midjourney",
    category: "image",
    name: "Midjourney v6 Photographer",
    desc: "Translates subject ideas into photorealistic prompt grids with camera tags.",
    fields: [
      { id: "raw", type: "textarea", label: "Subject details & environment", placeholder: "e.g., a retro astronaut holding a cat" },
      { id: "ar", type: "text", label: "Aspect Ratio", placeholder: "e.g., 16:9" }
    ],
    compiler: (raw, ar) => {
      const ratio = ar ? ` --ar ${ar}` : " --ar 16:9";
      return `${raw}, candid street photography, realistic lighting, 35mm lens, raw film grain, highly detailed, soft shadows${ratio} --style raw --v 6.0 --stylize 120`;
    }
  },
  {
    id: "banana",
    category: "image",
    name: "Google Nano Banana Pro Grid",
    desc: "Compiles spatial layouts optimized for Nano Banana's text/texture layers.",
    fields: [
      { id: "raw", type: "textarea", label: "Foreground & visual layout elements", placeholder: "e.g., a man sitting, eating a banana" },
      { id: "text", type: "text", label: "Sign Text (Optional)", placeholder: "e.g., write text 'NANO' on wall" }
    ],
    compiler: (raw, text) => {
      const textSection = text ? ` Text rendering containing '${text}' clearly visible on the main subject.` : "";
      return `A candid, highly detailed, realistic eye-level photograph.
[Foreground]: ${raw}.${textSection}
[Environment]: Standard natural layout casting soft shadows, 35mm lens, high-fidelity texture details, candid photo style.`;
    }
  },
  {
    id: "vector_logo",
    category: "image",
    name: "Flat Vector Minimalist Logo",
    desc: "Generates prompts optimized for creating clean geometric branding assets.",
    fields: [
      { id: "raw", type: "textarea", label: "Logo subject & symbols", placeholder: "e.g. geometric stylized phoenix bird logo" }
    ],
    compiler: (raw) => {
      return `Flat vector logo of a ${raw}, minimalist style, simple geometric lines, solid corporate color accents, flat design, clean white background, no gradients --v 6.0`;
    }
  }
];
