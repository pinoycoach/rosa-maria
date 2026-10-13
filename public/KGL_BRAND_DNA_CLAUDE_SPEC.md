# KGL BRAND DNA & BESPOKE MERCHANDISE SPECIFICATION
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
| **Obsidian Void** | `#0A0A0C` | Primary Background / Case Chassis | Deep focus, infinite potential |
| **Solar Flare Gold** | `#F59E0B` | Primary Accent / Typography / Logo | High frequency, inner wealth |
| **Electric Cyan** | `#06B6D4` | Secondary Accent / Highlights | Lucid awareness, future tech |
| **Cyber Violet** | `#8B5CF6` | Gradient Mesh / Mystery | Alchemical transmutation |
| **Frosted Ceramic** | `#F8FAFC` | Alternative Print Substrate | Purity, clarity, minimalism |

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

```json
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
```

---
*Created by Inspire Engine for KGL (Keep Give Live).*
