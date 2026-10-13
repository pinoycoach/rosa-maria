export interface KglPhoneModel {
  id: string;
  name: string;
  brand: 'Apple' | 'Samsung' | 'Google';
  dimensionsMm: string;
  cameraLayout: 'triple_triangle' | 'triple_vertical' | 'visor';
  canvasRatio: string;
}

export const KGL_PHONE_MODELS: KglPhoneModel[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    dimensionsMm: '163.0 x 77.6 x 8.25 mm',
    cameraLayout: 'triple_triangle',
    canvasRatio: 'aspect-[9/19]',
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    dimensionsMm: '149.6 x 71.5 x 8.25 mm',
    cameraLayout: 'triple_triangle',
    canvasRatio: 'aspect-[9/19]',
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    brand: 'Apple',
    dimensionsMm: '146.6 x 70.6 x 8.25 mm',
    cameraLayout: 'triple_triangle',
    canvasRatio: 'aspect-[9/19]',
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    dimensionsMm: '162.3 x 79.0 x 8.6 mm',
    cameraLayout: 'triple_vertical',
    canvasRatio: 'aspect-[9/19]',
  },
  {
    id: 'pixel-9-pro',
    name: 'Pixel 9 Pro XL',
    brand: 'Google',
    dimensionsMm: '162.8 x 76.6 x 8.5 mm',
    cameraLayout: 'visor',
    canvasRatio: 'aspect-[9/19]',
  },
];

export interface KglFinishOption {
  id: string;
  name: string;
  badge: string;
  bgGradient: string;
  textColor: string;
  accentBorder: string;
  finishType: 'Matte' | 'Holographic' | 'Titanium' | 'Gloss';
}

export const KGL_FINISHES: KglFinishOption[] = [
  {
    id: 'obsidian-stealth',
    name: 'Obsidian Stealth',
    badge: 'Signature',
    bgGradient: 'from-gray-950 via-black to-gray-900',
    textColor: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    finishType: 'Matte',
  },
  {
    id: 'cyber-aurora',
    name: 'Cyberpunk Aurora',
    badge: 'Holographic',
    bgGradient: 'from-purple-950 via-indigo-950 to-pink-950',
    textColor: 'text-cyan-300',
    accentBorder: 'border-cyan-400/50',
    finishType: 'Holographic',
  },
  {
    id: 'liquid-gold',
    name: 'Sovereign Aura Gold',
    badge: 'Metallic',
    bgGradient: 'from-amber-950 via-yellow-950 to-stone-900',
    textColor: 'text-yellow-300',
    accentBorder: 'border-yellow-400/60',
    finishType: 'Titanium',
  },
  {
    id: 'frost-titanium',
    name: 'Frosted Ceramic White',
    badge: 'Minimalist',
    bgGradient: 'from-slate-100 via-gray-200 to-slate-300',
    textColor: 'text-slate-900',
    accentBorder: 'border-slate-400',
    finishType: 'Matte',
  },
];

export const KGL_DEFAULT_AFFIRMATIONS = [
  {
    label: 'KGL Core Trilogy',
    text: 'KEEP your sovereign peace.\nGIVE unconditional value.\nLIVE without hesitation.',
  },
  {
    label: 'Radical Presence',
    text: 'Quiet mind. Relentless craft. Sovereign wealth.',
  },
  {
    label: 'Reality Architect',
    text: 'Reality bends to unwavering focus.',
  },
  {
    label: 'Zero Churn Mindset',
    text: 'Build calm. Ship fast. Never compromise peace.',
  },
  {
    label: 'Abundance Vector',
    text: 'The more you give to the tribe, the more the universe clears the path.',
  },
];

// Raw Markdown file content generated for Claude download
export const GENERATE_KGL_CLAUDE_MARKDOWN = (): string => `# KGL BRAND DNA & BESPOKE MERCHANDISE SPECIFICATION
**Version:** 1.0.0 (Production Blueprint)
**Brand Identity:** KGL (Keep • Give • Live)
**Target Platform:** Claude Projects, Anthropic Claude, Cursor, MCP Server, Print-On-Demand dropship

---

## 1. BRAND MANIFESTO & CORE PHILOSOPHY

### The KGL Triad:
* **KEEP (Self-Mastery & Sovereign Energy):**
  - Guard your attention like sacred territory.
  - Keep your inner calm in a noisy world.
  - Zero tolerance for mental clutter, rage bait, and parasitic obligations.
  - Protect your creative vortex and build deep assets.

* **GIVE (Abundance & Tribal Value):**
  - Give unreservedly to the world before expecting anything back.
  - Generous distribution of wisdom, tools, and uplifting energy.
  - Radical hospitality, open-source spirit, compounding karmic loops.

* **LIVE (Present Execution & Sovereign Joy):**
  - Do not defer happiness to an imagined retirement.
  - Live fully today: create, explore, manifest, and taste the fruits of your labor now.
  - Unapologetic individuality, aesthetic presence, physical vibrancy.

---

## 2. VISUAL IDENTITY & COLOR TOKENS

| Token Name | Hex Code | Usage | Meaning |
| :--- | :--- | :--- | :--- |
| **Obsidian Void** | \`#0A0A0C\` | Primary Background / Case Chassis | Deep focus, infinite potential |
| **Solar Flare Gold** | \`#F59E0B\` | Primary Accent / Typography / Logo | High frequency, inner wealth |
| **Electric Cyan** | \`#06B6D4\` | Secondary Accent / Highlights | Lucid awareness, future tech |
| **Cyber Violet** | \`#8B5CF6\` | Gradient Mesh / Mystery | Alchemical transmutation |
| **Frosted Ceramic** | \`#F8FAFC\` | Alternative Print Substrate | Purity, clarity, minimalism |

### Typography Guidelines:
* **Display / Slogans:** Space Grotesk, Syne, or Anton (Bold, all-caps, tracking-widest +0.15em).
* **Affirmations / Quotes:** Editorial serif or crisp modern sans (Inter / Playfair / Outfit).
* **Monogram Insignia:** Geometric KGL interlocking triangle / sovereign shield.

---

## 3. PHYSICAL MERCHANDISE SPECIFICATIONS (PHONE CASES)

### On-Demand Manufacturing Model:
1. **User Customization:** Customers pick or craft their favorite affirmation, choose phone model, select colorway finish, and preview in real-time.
2. **Manufacturing Pipeline:** Direct-to-object UV Sublimation printing on 2mm shockproof polycarbonate hardshell with raised TPU shock absorption bumpers (1.5mm raised lip around screen & camera lenses).
3. **Print Parameters:**
   - **Resolution:** 300 DPI vector rasterization (minimum 2400 x 4800 px).
   - **Color Profile:** CMYK US Web Coated (SWOP) v2 / Adobe RGB.
   - **Bleed Zone:** 3.0 mm full wrap around curved edge radii.
   - **Safe Text Zone:** 8.0 mm inward from camera island cutout and edge bezels.

### Supported Device Profiles:
* Apple iPhone 16 Pro Max / 16 Pro / 15 Pro / 15 / 14
* Samsung Galaxy S24 Ultra / S24+ / S23 Ultra
* Google Pixel 9 Pro XL / 9 Pro / 8 Pro

---

## 4. CLAUDE SYSTEM PROMPT & BESPOKE DESIGN AGENT INSTRUCTIONS

When Claude receives this specification, Claude operates as the **KGL Lead Design Architect**:

### Claude Persona & Behavior:
1. **Intake Customer Intent:** Ask the user what virtue or breakthrough they are cultivating (e.g. calm focus, aggressive shipping, gratitude, abundance).
2. **Generate Bespoke Affirmation:** Compose 3 tailored, punchy KGL slogans (Short, Poetic, Impactful).
3. **Format Phone Case Layout:**
   - Recommend the exact Finish (e.g., Obsidian Stealth vs. Cyberpunk Aurora).
   - Output structured CSS/SVG preview or ASCII mockups.
   - Provide high-resolution vector code (SVG) ready for print manufacturer APIs (e.g. Printful, Prodigi, Gelato).
4. **Export Manifest:** Deliver production order JSON with item SKU, quote text, font pairing, and color hex values.

---

## 5. EXAMPLE MANUFACTURING ORDER PAYLOAD (JSON)

\`\`\`json
{
  "brand": "KGL",
  "product": "phone_case",
  "sku": "KGL-CASE-IPHONE16PROMAX-OBSIDIAN",
  "device": "iPhone 16 Pro Max",
  "finish": "Matte Obsidian",
  "artwork": {
    "primaryQuote": "KEEP your sovereign peace. GIVE your craft. LIVE without hesitation.",
    "monogram": "KGL_SHIELD_V1",
    "primaryColor": "#F59E0B",
    "substrateColor": "#0A0A0C",
    "typography": "Space Grotesk Bold",
    "resolutionDpi": 300
  },
  "pricing": {
    "retailUsd": 29.00,
    "productionCostUsd": 8.50,
    "grossMarginPercent": 70.7
  }
}
\`\`\`

---
*Created by Inspire Engine for KGL (Keep Give Live).*
`;

// JSON manifest for MCP or automation
export const GENERATE_KGL_MCP_JSON = (): string => JSON.stringify(
  {
    name: 'kgl-brand-merchandise-mcp',
    version: '1.0.0',
    description: 'Model Context Protocol (MCP) server for KGL (Keep Give Live) brand design and custom phone case manufacturing.',
    brand: {
      name: 'KGL',
      motto: 'Keep • Give • Live',
      pillars: [
        { name: 'KEEP', meaning: 'Preserve sovereign energy and mental peace' },
        { name: 'GIVE', meaning: 'Unconditional value, teaching, and kindness' },
        { name: 'LIVE', meaning: 'Radical presence, action, and celebration of the now' },
      ],
      palette: {
        obsidian: '#0A0A0C',
        flareGold: '#F59E0B',
        electricCyan: '#06B6D4',
        cyberViolet: '#8B5CF6',
        frostedWhite: '#F8FAFC',
      },
    },
    tools: [
      {
        name: 'generate_kgl_affirmation',
        description: 'Generates 3 punchy, sovereign KGL affirmations based on user intent.',
        parameters: {
          intent: { type: 'string', description: 'User current struggle or goal' },
          vibe: { type: 'string', enum: ['stoic', 'abundance', 'solopreneur', 'peace'] },
        },
      },
      {
        name: 'render_phone_case_svg',
        description: 'Produces production-ready 300 DPI vector SVG for on-demand phone case printing.',
        parameters: {
          phoneModel: { type: 'string', enum: ['iphone-16-pro-max', 'iphone-16-pro', 'galaxy-s24-ultra', 'pixel-9-pro'] },
          finishId: { type: 'string', enum: ['obsidian-stealth', 'cyber-aurora', 'liquid-gold', 'frost-titanium'] },
          quoteText: { type: 'string' },
          includeMonogram: { type: 'boolean' },
        },
      },
      {
        name: 'create_print_order_manifest',
        description: 'Packages the custom design into a print-on-demand fulfillment JSON payload.',
        parameters: {
          customerName: { type: 'string' },
          shippingAddress: { type: 'object' },
          caseSpec: { type: 'object' },
        },
      },
    ],
  },
  null,
  2
);
