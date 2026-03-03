# TypeArchy

**TypeArchy** is a free Adobe Illustrator script that generates modular type scales directly on your artboard — with named levels (H1–H5, XL, Base, Small), a local font browser, and optional CSS output.

Typography has hierarchy. TypeArchy makes it visual.

---

## Features

- **Named type levels** — XL, H1, H2, H3, H4, H5, Base, Small
- **Checkboxes** — include or exclude any level you need
- **Local font browser** — search and select from all fonts installed on your system
- **Per-level font override** — assign a different font to any individual level
- **Global heading & body fonts** — set defaults separately for headings and body text
- **8 scale presets** — Minor Second, Major Second, Minor Third, Major Third, Perfect Fourth, Augmented Fourth, Perfect Fifth, Golden Ratio
- **Custom ratio** — enter any ratio value to override the preset
- **Adjustable spacing** — control the gap between labels and type samples
- **3 layout modes** — Bars only, Text preview, Full (text + CSS)
- **CSS output** — generates a `:root {}` block with all CSS custom properties
- **Quick preview** — see calculated sizes before generating
- **Colored level badges** — each level gets a distinct color tag

---

## Requirements

- Adobe Illustrator CC (CS6 or later should also work)
- No plugins or extensions needed

---

## Installation

No installation required. Just download the `.jsx` file and run it when you need it.

1. Download `TypeArchy.jsx`
2. In Illustrator, go to **File → Scripts → Other Script...**
3. Select the downloaded file and click **Open**

> **Tip:** To make it permanently available in the Scripts menu, copy the file to:
> - **Mac:** `/Applications/Adobe Illustrator [version]/Presets/en_US/Scripts/`
> - **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [version]\Presets\en_US\Scripts\`
> Then restart Illustrator.

---

## How to Use

1. Run the script via **File → Scripts → Other Script...**
2. Configure your settings in the dialog:
   - Set your **base font size** and **scale ratio**
   - Choose your **body and heading fonts** (use Browse to pick from installed fonts)
   - Check or uncheck **levels** (XL, H1–H5, Base, Small)
   - Optionally assign a **per-level font override**
   - Set **spacing**, **layout mode**, and **display options**
3. Click **Preview Calculated Sizes** to review the scale
4. Click **Generate TypeScale** — the hierarchy is drawn on your active artboard

---

## Settings Reference

### Scale Settings
| Setting | Description |
|---|---|
| Base size (px) | The root font size, typically 16px |
| Preset ratio | Choose from 8 standard modular scale ratios |
| Custom ratio | Enter any value > 1 to override the preset |

### Type Levels
| Level | Default Step | Typical Use |
|---|---|---|
| XL | +7 | Display / hero text |
| H1 | +5 | Page title |
| H2 | +4 | Section heading |
| H3 | +3 | Sub-heading |
| H4 | +2 | Card title |
| H5 | +1 | Label / small heading |
| Base | 0 | Body text |
| Small | -1 | Captions / footnotes |

> Steps are editable — you can adjust the exponent for any level directly in the dialog.

### Layout Modes
| Mode | Description |
|---|---|
| Bars only | Visual size bars, no text |
| Text preview | Renders actual type samples at each size |
| Full (text + CSS) | Text samples + CSS custom properties block |

---

## CSS Output Example

When using **Full** layout mode, TypeArchy generates a CSS block like this:

```css
:root {
  /* TypeArchy: Perfect Fourth x1.333 */
  --font-size-base:       1.0000rem; /* 16.00px step 0 */
  --scale-ratio:          1.333;
  --font-body:            'Helvetica';
  --font-heading:         'Helvetica';
  --line-height-body:     1.5;
  --line-height-heading:  1.15;

  --font-size-xl:         6.3147rem; /* 101.04px step +7 */
  --font-size-h1:         3.5530rem; /* 56.85px step +5 */
  --font-size-h2:         2.6644rem; /* 42.63px step +4 */
  --font-size-h3:         1.9975rem; /* 31.96px step +3 */
  --font-size-h4:         1.4978rem; /* 23.96px step +2 */
  --font-size-h5:         1.1230rem; /* 17.97px step +1 */
  --font-size-base:       1.0000rem; /* 16.00px step 0 */
  --font-size-small:      0.7500rem; /* 12.00px step -1 */
}
```

---

## License

MIT — free to use, modify, and share. Attribution appreciated but not required.

---

## Contributing

Pull requests welcome. If you find a bug or have a feature idea, open an issue.

---

*TypeArchy — because great design has hierarchy.*
