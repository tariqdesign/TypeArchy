// TypeArchy v08
// Type Scale Generator for Adobe Illustrator
// Created by Tariq Yosef — tariqdesign.com
//
// v08 improvements over v07:
// - ME Composer set programmatically for Arabic/RTL (fixes disconnected letters)
// - RTL paragraph direction set AFTER contents (ME Illustrator requirement)
// - leading guard uses !== undefined so leading=0 works correctly
// - Arabic Unicode built with split String.fromCharCode() chains (ES3 safe)
// - parseNumber preserves negative letter spacing values like -0.02
// - safeFont fallback: Arial -> Helvetica -> first available
// - Credit footer added to UI window bottom
// - Single self-contained file (no Part 1/2/3 split)
#target illustrator

var TypeArchy = (function () {
    "use strict";

    // ============================================
    // VERSION & CREDITS
    // ============================================
    var VERSION = "v08";
    var CREDIT  = "Created by Tariq Yosef \u2014 tariqdesign.com";

    // ============================================
    // CONSTANTS
    // ============================================
    var PRESETS = [
        { name: "Minor Second",     ratio: 1.067 },
        { name: "Major Second",     ratio: 1.125 },
        { name: "Minor Third",      ratio: 1.200 },
        { name: "Major Third",      ratio: 1.250 },
        { name: "Perfect Fourth",   ratio: 1.333 },
        { name: "Augmented Fourth", ratio: 1.414 },
        { name: "Perfect Fifth",    ratio: 1.500 },
        { name: "Golden Ratio",     ratio: 1.618 }
    ];

    var WEIGHT_LABELS = [
        "100 - Thin", "200 - Extra Light", "300 - Light", "400 - Regular",
        "500 - Medium", "600 - Semi Bold", "700 - Bold", "800 - Extra Bold", "900 - Black"
    ];
    var WEIGHT_VALUES = [100, 200, 300, 400, 500, 600, 700, 800, 900];

    var LEVELS = [
        { id: "xl",    label: "XL",    step:  7, isHeading: true  },
        { id: "h1",    label: "H1",    step:  5, isHeading: true  },
        { id: "h2",    label: "H2",    step:  4, isHeading: true  },
        { id: "h3",    label: "H3",    step:  3, isHeading: true  },
        { id: "h4",    label: "H4",    step:  2, isHeading: true  },
        { id: "h5",    label: "H5",    step:  1, isHeading: true  },
        { id: "base",  label: "Base",  step:  0, isHeading: false },
        { id: "small", label: "Small", step: -1, isHeading: false }
    ];

    var LEVEL_COLORS = {
        xl:    [0.38, 0.18, 0.72],
        h1:    [0.15, 0.35, 0.78],
        h2:    [0.18, 0.48, 0.80],
        h3:    [0.22, 0.58, 0.72],
        h4:    [0.25, 0.65, 0.58],
        h5:    [0.30, 0.68, 0.48],
        base:  [0.38, 0.38, 0.38],
        small: [0.58, 0.58, 0.58]
    };

    var SAMPLE_MODES = { LATIN: 0, ARABIC: 1, CUSTOM: 2, NONE: 3 };

    // Latin samples
    var SAMPLE_LATIN = {
        head: "The quick brown fox jumps over the lazy dog",
        body:  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia."
    };

    // Arabic samples — split String.fromCharCode() chains, ES3 safe
    var SAMPLE_ARABIC = {
        head: String.fromCharCode(1575,1604,1579,1593,1604,1576,32,1575,1604,1576,1606,1610,32,1575,1604,1587,1585,1610,1593,32) +
              String.fromCharCode(1610,1602,1601,1586,32,1601,1608,1602,32,1575,1604,1603,1604,1576,32,1575,1604,1603,1587,1608,1604),
        body:  String.fromCharCode(1604,1608,1585,1610,1605,32,1573,1610,1576,1587,1608,1605,32,1583,1608,1604,1575,1585,32,1587) +
               String.fromCharCode(1610,1578,32,1571,1605,1610,1578,1548,32,1603,1608,1606,1587,1610,1603,1578,1610,1578,1608,1585) +
               String.fromCharCode(32,1571,1583,1610,1576,1610,1587,1610,1606,1580,32,1573,1610,1604,1610,1578,46,32,1587,1610) +
               String.fromCharCode(1583,32,1583,1608,32,1573,1610,1608,1587,1605,1608,1583,32,1578,1610,1605,1576,1608,1585,32) +
               String.fromCharCode(1573,1606,1587,1610,1583,1610,1583,1608,1606,1578,32,1571,1608,1578,32,1604,1575,1576,1608,1585) +
               String.fromCharCode(1610,32,1573,1578,32,1583,1608,1604,1608,1585,1610,32,1605,1575,1580,1606,1575,46,32,1571) +
               String.fromCharCode(1608,1578,32,1573,1610,1606,1610,1605,32,1571,1583,32,1605,1610,1606,1610,1605,32,1601,1610) +
               String.fromCharCode(1606,1610,1575,1605,1548,32,1603,1610,1608,1610,1587,32,1606,1608,1587,1578,1585,1608,1583,32) +
               String.fromCharCode(1573,1603,1587,1610,1585,1587,1610,1578,1575,1578,1610,1608,1606,46)
    };

    // ============================================
    // UTILS MODULE
    // ============================================
    var Utils = (function () {
        return {
            // v06 fix: safe for negatives like -0.02
            parseNumber: function (str, fallback) {
                var v = parseFloat(str);
                return isNaN(v) ? fallback : v;
            },

            padRight: function (s, n) {
                s = String(s);
                while (s.length < n) s += " ";
                return s;
            },

            hexToRGB: function (hex) {
                if (!hex) return null;
                hex = hex.replace(/^#/, "");
                if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                if (hex.length !== 6) return null;
                var rr = parseInt(hex.substr(0,2), 16);
                var gg = parseInt(hex.substr(2,2), 16);
                var bb = parseInt(hex.substr(4,2), 16);
                if (isNaN(rr) || isNaN(gg) || isNaN(bb)) return null;
                return [rr/255, gg/255, bb/255];
            },

            makeRGB: function (r, g, b) {
                var c = new RGBColor();
                c.red   = r * 255;
                c.green = g * 255;
                c.blue  = b * 255;
                return c;
            },

            resolveRatio: function (presetIndex, customValue) {
                var cv = (customValue || "").replace(/\s/g, "");
                if (cv !== "") {
                    var rv = parseFloat(cv);
                    if (isNaN(rv) || rv <= 1) return null;
                    return rv;
                }
                return PRESETS[presetIndex || 4].ratio;
            },

            resolveRatioName: function (presetIndex, customValue) {
                var cv = (customValue || "").replace(/\s/g, "");
                if (cv !== "") return "Custom (" + cv + ")";
                return PRESETS[presetIndex || 4].name;
            },

            getPresetLabels: function () {
                var out = [];
                for (var i = 0; i < PRESETS.length; i++) {
                    out.push(PRESETS[i].ratio.toFixed(3) + " - " + PRESETS[i].name);
                }
                return out;
            }
        };
    })();

    // ============================================
    // COLOR MANAGER
    // ============================================
    var ColorManager = (function () {
        return {
            setFill: function (item, rgb) {
                item.fillColor = Utils.makeRGB(rgb[0], rgb[1], rgb[2]);
            },
            setStroke: function (item, rgb) {
                item.strokeColor = Utils.makeRGB(rgb[0], rgb[1], rgb[2]);
            },
            setTextColor: function (tf, rgb) {
                tf.textRange.characterAttributes.fillColor =
                    Utils.makeRGB(rgb[0], rgb[1], rgb[2]);
            },
            getLevelColor: function (levelId) {
                return LEVEL_COLORS[levelId] || [0.4, 0.4, 0.4];
            }
        };
    })();

    // ============================================
    // FONT MANAGER
    // ============================================
    var FontManager = (function () {
        var _cache = {};

        function _searchFont(familyName, targetWeight) {
            if (!familyName) return null;
            var nm = familyName.replace(/^\s+|\s+$/g, "");
            if (nm === "") return null;

            var candidates = [];
            var fi;
            for (fi = 0; fi < app.textFonts.length; fi++) {
                var ftf = app.textFonts[fi];
                if (ftf.family && ftf.family.toLowerCase() === nm.toLowerCase()) {
                    candidates.push(ftf);
                }
            }
            if (candidates.length === 0) return null;
            if (candidates.length === 1) return candidates[0];

            var wt = targetWeight || 400;
            var styleKeyword = wt >= 700 ? "bold" : (wt <= 300 ? "light" : "regular");
            var fj, fst;
            for (fj = 0; fj < candidates.length; fj++) {
                fst = (candidates[fj].style || "").toLowerCase();
                if (fst === styleKeyword) return candidates[fj];
            }
            for (fj = 0; fj < candidates.length; fj++) {
                fst = (candidates[fj].style || "").toLowerCase();
                if (fst.indexOf(styleKeyword) !== -1) return candidates[fj];
            }
            return candidates[0];
        }

        return {
            findFont: function (familyName, weight) {
                var key = (familyName || "") + ":" + (weight || 400);
                if (_cache[key] !== undefined) return _cache[key];
                var font = _searchFont(familyName, weight);
                _cache[key] = font;
                return font;
            },

            // v06 fix: Arial -> Helvetica -> first available (not silent Helvetica only)
            getSafeFont: function (familyName, weight) {
                var found = this.findFont(familyName, weight);
                if (found) return found;
                var arial = this.findFont("Arial", weight);
                if (arial) return arial;
                var helv = this.findFont("Helvetica", weight);
                if (helv) return helv;
                try { return app.textFonts[0]; } catch (e) { return null; }
            },

            fontExists: function (familyName, weight) {
                return this.findFont(familyName, weight) !== null;
            },

            getAllFamilies: function () {
                var families = [];
                var seen = {};
                for (var i = 0; i < app.textFonts.length; i++) {
                    var fam = app.textFonts[i].family;
                    if (fam && !seen[fam]) {
                        seen[fam] = true;
                        families.push(fam);
                    }
                }
                return families.sort();
            }
        };
    })();

    // ============================================
    // TEXT FACTORY
    // ============================================
    var TextFactory = (function () {
        return {
            createPointText: function (doc, text, size, font, color, left, top) {
                var tf = doc.textFrames.add();
                var ca = tf.textRange.characterAttributes;
                ca.size = size;
                if (font) ca.textFont = font;
                ColorManager.setTextColor(tf, color);
                tf.contents = text;
                tf.left = left;
                tf.top  = -top;
                return tf;
            },

            createAreaText: function (doc, text, size, font, color, left, top, width, height, leading, tracking) {
                var box = doc.pathItems.rectangle(-top, left, width, height);
                box.filled  = false;
                box.stroked = false;
                var tf = doc.textFrames.areaText(box);
                var ca = tf.textRange.characterAttributes;
                ca.size = size;
                if (font) ca.textFont = font;
                // v06 fix: !== undefined so leading=0 is honoured
                if (leading  !== undefined && leading  !== null) ca.leading  = leading;
                if (tracking !== undefined && tracking !== null) ca.tracking = tracking;
                ColorManager.setTextColor(tf, color);
                tf.contents = text;
                return tf;
            },

            // v08 fix: ME Composer + RTL direction set AFTER contents
            createAreaTextRTL: function (doc, text, size, font, color, left, top, width, height, leading, tracking, isRTL) {
                var box = doc.pathItems.rectangle(-top, left, width, height);
                box.filled  = false;
                box.stroked = false;
                var tf = doc.textFrames.areaText(box);
                var ca = tf.textRange.characterAttributes;
                ca.size = size;
                if (font) ca.textFont = font;
                // v06 fix: !== undefined guard
                if (leading  !== undefined && leading  !== null) ca.leading  = leading;
                if (tracking !== undefined && tracking !== null) ca.tracking = tracking;
                ColorManager.setTextColor(tf, color);

                // v06 fix: set contents BEFORE paragraph direction (ME Illustrator requirement)
                tf.contents = text;

                if (isRTL) {
                    try {
                        var pa = tf.textRange.paragraphAttributes;

                        // v08 fix: set ME composer so Arabic letters connect properly
                        if (typeof ParagraphComposer !== "undefined") {
                            try {
                                pa.composerEngine = ParagraphComposer.MIDDLEEASTERN_SINGLELINE;
                            } catch (ce) {
                                try {
                                    pa.composerEngine = 1; // numeric fallback
                                } catch (ce2) {}
                            }
                        }

                        // justification
                        pa.justification = Justification.RIGHT;

                        // paragraph direction
                        if (typeof ParagraphDirection !== "undefined") {
                            try {
                                pa.paragraphDirection = ParagraphDirection.RIGHT_TO_LEFT;
                            } catch (de) {}
                        }
                    } catch (e) {}
                }
                return tf;
            }
        };
    })();

    // ============================================
    // FONT BROWSER DIALOG
    // ============================================
    var FontBrowser = (function () {
        function createDialog(currentFont) {
            var families = FontManager.getAllFamilies();

            var win = new Window("dialog",
                "TypeArchy " + VERSION + " | Font Browser [" + families.length + " fonts]  \u2014  tariqdesign.com");
            win.orientation   = "column";
            win.alignChildren = ["fill", "top"];
            win.margins = 16;
            win.spacing = 10;

            var creditRow = win.add("group");
            creditRow.orientation = "row";
            creditRow.alignment   = "center";
            var cLabel = creditRow.add("statictext", undefined, CREDIT);
            cLabel.graphics.font = ScriptUI.newFont("dialog", "ITALIC", 9);

            win.add("statictext", undefined, "Search fonts, then click Use This Font.");

            var searchRow = win.add("group");
            searchRow.orientation   = "row";
            searchRow.alignChildren = ["left", "center"];
            searchRow.spacing = 8;
            searchRow.add("statictext", undefined, "Search:").preferredSize.width = 55;
            var searchField = searchRow.add("edittext", undefined, "");
            searchField.preferredSize.width = 340;

            var listBox = win.add("listbox", undefined, families, { multiselect: false });
            listBox.preferredSize = [440, 300];

            for (var i = 0; i < families.length; i++) {
                if (families[i].toLowerCase() === (currentFont || "").toLowerCase()) {
                    listBox.selection = i;
                    break;
                }
            }

            var selRow = win.add("group");
            selRow.orientation   = "row";
            selRow.alignChildren = ["left", "center"];
            selRow.spacing = 8;
            selRow.add("statictext", undefined, "Selected:").preferredSize.width = 65;
            var selectedLabel = selRow.add("statictext", undefined, currentFont || "(none)");
            selectedLabel.preferredSize.width = 355;

            listBox.onChange = function () {
                if (listBox.selection) selectedLabel.text = listBox.selection.text;
            };

            searchField.onChanging = function () {
                var query = searchField.text.toLowerCase();
                listBox.removeAll();
                for (var j = 0; j < families.length; j++) {
                    if (query === "" || families[j].toLowerCase().indexOf(query) !== -1) {
                        listBox.add("item", families[j]);
                    }
                }
                if (listBox.items.length > 0) {
                    listBox.selection = 0;
                    selectedLabel.text = listBox.items[0].text;
                }
            };

            var result = null;
            var btnRow = win.add("group");
            btnRow.alignment = "right";
            btnRow.spacing   = 10;
            btnRow.add("button", undefined, "Cancel", { name: "cancel" }).onClick = function () {
                win.close();
            };
            btnRow.add("button", undefined, "Use This Font", { name: "ok" }).onClick = function () {
                if (listBox.selection) result = listBox.selection.text;
                win.close();
            };

            return {
                show: function () { win.show(); return result; }
            };
        }

        return {
            browse: function (currentFont) {
                return createDialog(currentFont).show();
            }
        };
    })();

    // ============================================
    // UI FACTORY
    // ============================================
    var UIFactory = (function () {
        return {
            createWindow: function (title) {
                var win = new Window("dialog", title + "  \u2014  tariqdesign.com");
                win.orientation   = "column";
                win.alignChildren = ["fill", "top"];
                win.margins = 18;
                win.spacing = 10;
                return win;
            },
            createPanel: function (parent, title) {
                var p = parent.add("panel", undefined, title);
                p.orientation   = "column";
                p.alignChildren = ["fill", "top"];
                p.margins = 12;
                p.spacing = 7;
                return p;
            },
            createRow: function (parent) {
                var row = parent.add("group");
                row.orientation   = "row";
                row.alignChildren = ["left", "center"];
                row.spacing = 6;
                return row;
            },
            createLabel: function (parent, text, width) {
                var lbl = parent.add("statictext", undefined, text);
                if (width) lbl.preferredSize.width = width;
                return lbl;
            },
            createEdit: function (parent, defaultValue, width) {
                var edt = parent.add("edittext", undefined, String(defaultValue));
                if (width) edt.preferredSize.width = width;
                return edt;
            },
            createDropdown: function (parent, items, width) {
                var dd = parent.add("dropdownlist", undefined, items);
                if (width) dd.preferredSize.width = width;
                return dd;
            },
            createCheckbox: function (parent, text) {
                return parent.add("checkbox", undefined, text);
            },
            createButton: function (parent, text, width) {
                var btn = parent.add("button", undefined, text);
                if (width) btn.preferredSize.width = width;
                return btn;
            },
            createDivider: function (parent) {
                var dv = parent.add("panel", undefined, "");
                dv.preferredSize.height = 1;
                return dv;
            },
            createCreditLine: function (parent) {
                var row = this.createRow(parent);
                row.alignment = "center";
                var c = row.add("statictext", undefined, CREDIT);
                c.graphics.font = ScriptUI.newFont("dialog", "ITALIC", 9);
                return c;
            },
            createBrowseButton: function (parent, targetEdit) {
                var btn = this.createButton(parent, "Browse", 60);
                btn.onClick = function () {
                    var chosen = FontBrowser.browse(targetEdit.text || "");
                    if (chosen) targetEdit.text = chosen;
                };
                return btn;
            }
        };
    })();

    // ============================================
    // CONFIG MANAGER
    // ============================================
    var ConfigManager = (function () {
        function validateFonts(config) {
            var warnings = [];
            if (!FontManager.fontExists(config.body.family, config.body.weight)) {
                warnings.push("Body font \"" + config.body.family + "\" not found.");
            }
            if (!config.heading.useBodySettings) {
                if (!FontManager.fontExists(config.heading.family, config.heading.weight)) {
                    warnings.push("Heading font \"" + config.heading.family + "\" not found.");
                }
            }
            for (var i = 0; i < config.levels.length; i++) {
                var lvl = config.levels[i];
                if (lvl.overrideFont && !FontManager.fontExists(lvl.overrideFont, lvl.overrideWeight || 400)) {
                    warnings.push("Override font \"" + lvl.overrideFont + "\" for " + lvl.label + " not found.");
                }
            }
            return warnings;
        }

        function resolveSampleText(mode, customText, isHeading) {
            if (mode === SAMPLE_MODES.LATIN)  return isHeading ? SAMPLE_LATIN.head  : SAMPLE_LATIN.body;
            if (mode === SAMPLE_MODES.ARABIC) return isHeading ? SAMPLE_ARABIC.head : SAMPLE_ARABIC.body;
            if (mode === SAMPLE_MODES.CUSTOM) {
                var ct = (customText || "").replace(/^\s+|\s+$/g, "");
                return ct || (isHeading ? SAMPLE_LATIN.head : SAMPLE_LATIN.body);
            }
            return "";
        }

        return {
            createFromUI: function (ui) {
                var baseSize = Utils.parseNumber(ui.base.text, 0);
                if (baseSize <= 0) throw new Error("Base Font Size must be a positive number.");

                var presetIndex = ui.preset.selection ? ui.preset.selection.index : 4;
                var ratio = Utils.resolveRatio(presetIndex, ui.customRatio.text);
                if (!ratio) throw new Error("Custom Ratio must be greater than 1 (e.g. 1.333).");

                var levels = [];
                for (var i = 0; i < ui.levelRefs.length; i++) {
                    var lv = ui.levelRefs[i];
                    if (!lv.cb.value) continue;
                    var px = baseSize * Math.pow(ratio, lv.stepVal);
                    var overrideFont = (lv.fontEdit.text || "").replace(/^\s+|\s+$/g, "");
                    var overrideWeight = null;
                    if (lv.wtDD.selection && lv.wtDD.selection.index > 0) {
                        overrideWeight = WEIGHT_VALUES[lv.wtDD.selection.index - 1];
                    }
                    levels.push({
                        id:            lv.id,
                        label:         lv.label,
                        isHeading:     lv.isHeading,
                        step:          lv.stepVal,
                        px:            px,
                        rem:           px / 16,
                        overrideFont:  overrideFont || null,
                        overrideWeight: overrideWeight
                    });
                }
                if (levels.length === 0) throw new Error("Please select at least one type level.");

                var headMode = ui.sampleHeadMode.selection ? ui.sampleHeadMode.selection.index : 0;
                var bodyMode = ui.sampleBodyMode.selection ? ui.sampleBodyMode.selection.index : 0;

                var config = {
                    version:   VERSION,
                    credit:    CREDIT,
                    base:      baseSize,
                    ratio:     ratio,
                    scaleName: Utils.resolveRatioName(presetIndex, ui.customRatio.text),

                    artboard: {
                        width:        Utils.parseNumber(ui.artWidth.text, 800),
                        margin:       Utils.parseNumber(ui.margin.text, 60),
                        gap:          Utils.parseNumber(ui.gap.text, 32),
                        labelSpacing: Utils.parseNumber(ui.labelSpacing.text, 14),
                        bgColor:      Utils.hexToRGB(ui.bgColor.text) || [1, 1, 1]
                    },

                    layout: ui.layout.selection ? ui.layout.selection.index : 1,

                    body: {
                        family:        (ui.bodyFont.text || "").replace(/^\s+|\s+$/g, "") || "Helvetica",
                        weight:        WEIGHT_VALUES[ui.bodyWeight.selection ? ui.bodyWeight.selection.index : 3],
                        lineHeight:    Utils.parseNumber(ui.bodyLineHeight.text, 1.5),
                        letterSpacing: Utils.parseNumber(ui.bodyLetterSpacing.text, 0),
                        color:         Utils.hexToRGB(ui.bodyColor.text) || [0.1, 0.1, 0.1]
                    },

                    heading: {
                        useBodySettings: ui.useBodyFont.value,
                        family:          (ui.headFont.text || "").replace(/^\s+|\s+$/g, "") || "Helvetica",
                        weight:          WEIGHT_VALUES[ui.headWeight.selection ? ui.headWeight.selection.index : 6],
                        lineHeight:      Utils.parseNumber(ui.headLineHeight.text, 1.15),
                        letterSpacing:   Utils.parseNumber(ui.headLetterSpacing.text, -0.02),
                        color:           Utils.hexToRGB(ui.headColor.text) || [0.067, 0.067, 0.067]
                    },

                    samples: {
                        head: resolveSampleText(headMode, ui.sampleHeadCustom.text, true),
                        body: resolveSampleText(bodyMode, ui.sampleBodyCustom.text, false),
                        rtl:  ui.rtl.value
                    },

                    display: {
                        badge:  ui.showBadge.value,
                        px:     ui.showPx.value,
                        rem:    ui.showRem.value,
                        step:   ui.showStep.value,
                        header: ui.showHeader.value
                    },

                    levels: levels
                };

                if (config.heading.useBodySettings) {
                    config.heading.family        = config.body.family;
                    config.heading.weight        = config.body.weight;
                    config.heading.lineHeight    = config.body.lineHeight;
                    config.heading.letterSpacing = config.body.letterSpacing;
                    config.heading.color         = config.body.color;
                }

                var warnings = validateFonts(config);
                if (warnings.length > 0) {
                    var msg = "Font warnings:\n- " + warnings.join("\n- ") +
                              "\n\nContinue with fallback fonts?";
                    if (!confirm(msg)) throw new Error("Cancelled by user.");
                }

                return config;
            }
        };
    })();

    // ============================================
    // GENERATOR MODULE
    // ============================================
    var Generator = (function () {

        function estimateHeight(config) {
            var h        = config.artboard.margin * 2;
            var safeW    = config.artboard.width - config.artboard.margin * 2;
            var infoW    = (config.display.badge || config.display.px ||
                            config.display.rem   || config.display.step) ? 130 : 0;
            var textW    = safeW - infoW;
            var charW    = config.samples.rtl ? 0.65 : 0.52;

            if (config.display.header) h += 90;

            for (var i = 0; i < config.levels.length; i++) {
                var lvl    = config.levels[i];
                var fz     = Math.max(0.5, Math.min(lvl.px, 300));
                var lh     = lvl.isHeading ? config.heading.lineHeight : config.body.lineHeight;
                var smp    = lvl.isHeading ? config.samples.head : config.samples.body;
                var lines  = 2;
                if (smp && smp.length > 0) {
                    var cpl = Math.max(1, Math.floor(textW / (fz * charW)));
                    lines   = Math.ceil(smp.length / cpl) + 2;
                }
                h += fz * lh * lines + config.artboard.labelSpacing * 2 + 20 + config.artboard.gap;
            }
            if (config.layout === 2) h += 350;
            return h + 120;
        }

        function renderHeader(doc, config, y) {
            var x = config.artboard.margin;
            TextFactory.createPointText(doc, "TYPEARCHY", 9,
                FontManager.getSafeFont("Arial", 400), [0.55,0.55,0.55], x, y);
            y += 16;
            TextFactory.createPointText(doc,
                config.ratio.toFixed(3) + "  \u2014  " + config.scaleName, 28,
                FontManager.getSafeFont(config.heading.family, config.heading.weight),
                [0.08,0.08,0.08], x, y);
            y += 38;

            var levelNames = [];
            for (var i = 0; i < config.levels.length; i++) levelNames.push(config.levels[i].label);

            var meta = "Base: " + config.base + "px  |  Levels: " + levelNames.join(", ") +
                       "  |  Body: " + config.body.family +
                       "  |  Headings: " + config.heading.family +
                       "  |  " + config.credit;

            TextFactory.createAreaText(doc, meta, 10,
                FontManager.getSafeFont("Arial", 400), [0.5,0.5,0.5],
                x, y, config.artboard.width - x * 2, 24, 14, 0);
            return y + 20;
        }

        function renderLevel(doc, config, level, y) {
            var isRTL    = config.samples.rtl;
            var mg       = config.artboard.margin;
            var hasInfo  = config.display.badge || config.display.px ||
                           config.display.rem   || config.display.step;
            var infoW    = hasInfo ? 130 : 0;
            var safeW    = config.artboard.width - mg * 2;
            var textW    = safeW - infoW;
            var textX    = isRTL ? mg              : mg + infoW;
            var infoX    = isRTL ? (config.artboard.width - mg - infoW) : mg;

            var isH      = level.isHeading;
            var fz       = Math.max(0.5, Math.min(level.px, 1296));
            var useFamily = level.overrideFont  || (isH ? config.heading.family : config.body.family);
            var useWeight = level.overrideWeight || (isH ? config.heading.weight : config.body.weight);
            var font      = FontManager.getSafeFont(useFamily, useWeight);
            var lh        = isH ? config.heading.lineHeight    : config.body.lineHeight;
            var ls        = isH ? config.heading.letterSpacing : config.body.letterSpacing;
            var color     = isH ? config.heading.color         : config.body.color;
            var rowTop    = y;

            // Info column
            if (hasInfo) {
                var iy = y;
                if (config.display.badge) {
                    var badge = doc.pathItems.rectangle(-iy, infoX, 36, 17);
                    badge.filled  = true;
                    badge.stroked = false;
                    ColorManager.setFill(badge, ColorManager.getLevelColor(level.id));
                    TextFactory.createPointText(doc, level.label, 9,
                        FontManager.getSafeFont("Arial", 700), [1,1,1], infoX + 5, iy + 3);
                    iy += 22;
                }
                if (config.display.px) {
                    TextFactory.createPointText(doc, level.px.toFixed(2) + "px", 10,
                        FontManager.getSafeFont("Courier New", 400), [0.22,0.22,0.22], infoX, iy);
                    iy += 14;
                }
                if (config.display.rem) {
                    TextFactory.createPointText(doc, level.rem.toFixed(4) + "rem", 9,
                        FontManager.getSafeFont("Courier New", 400), [0.52,0.52,0.52], infoX, iy);
                    iy += 13;
                }
                if (config.display.step) {
                    var sp = level.step >= 0 ? "+" : "";
                    TextFactory.createPointText(doc, "step " + sp + level.step, 8,
                        FontManager.getSafeFont("Courier New", 400), [0.68,0.68,0.68], infoX, iy);
                    iy += 11;
                }
                TextFactory.createPointText(doc, useFamily + (level.overrideFont ? " *" : ""), 7,
                    FontManager.getSafeFont("Arial", 400), [0.72,0.72,0.72], infoX, iy);
            }

            var textY   = rowTop + config.artboard.labelSpacing;
            var smpTxt  = isH ? config.samples.head : config.samples.body;

            if (config.layout === 0) {
                // Size bars
                var barW = Math.max(4, Math.min(textW, (level.px / config.base) * 55));
                var barX = isRTL ? (config.artboard.width - mg - barW) : textX;
                var bar  = doc.pathItems.rectangle(-(textY+6), barX, barW, 10);
                bar.filled  = true;
                bar.stroked = false;
                ColorManager.setFill(bar, ColorManager.getLevelColor(level.id));
                var lblX = isRTL ? (barX - 50) : (barX + barW + 8);
                TextFactory.createPointText(doc, level.px.toFixed(1) + "px", 9,
                    FontManager.getSafeFont("Arial", 400), [0.4,0.4,0.4], lblX, textY + 3);
                y = Math.max(y, textY + 24);
            } else {
                if (!smpTxt || smpTxt === "") {
                    y = textY + fz * lh + config.artboard.labelSpacing;
                } else {
                    var avgCW   = isRTL ? 0.65 : 0.52;
                    var cpl     = Math.max(1, Math.floor(textW / (fz * avgCW)));
                    var nLines  = Math.ceil(smpTxt.length / cpl) + 2;
                    var tfH     = fz * lh * nLines;

                    TextFactory.createAreaTextRTL(doc, smpTxt, fz, font, color,
                        textX, textY, textW, tfH,
                        fz * lh, Math.round(ls * 1000), isRTL);

                    y = textY + tfH + config.artboard.labelSpacing;

                    // Body paragraph below base in CSS layout
                    if (config.layout === 2 && level.id === "base" &&
                        config.samples.body && config.samples.body !== "") {
                        var bSz  = Math.max(0.5, Math.min(config.base, 1296));
                        var bCPL = Math.max(1, Math.floor(textW / (bSz * avgCW)));
                        var bNL  = Math.ceil(config.samples.body.length / bCPL) + 2;
                        var bH   = bSz * config.body.lineHeight * bNL;
                        TextFactory.createAreaTextRTL(doc, config.samples.body, bSz,
                            FontManager.getSafeFont(config.body.family, config.body.weight),
                            config.body.color, textX, y, textW, bH,
                            bSz * config.body.lineHeight,
                            Math.round(config.body.letterSpacing * 1000), isRTL);
                        y += bH + 8;
                    }
                }
            }

            // Separator
            var sep = doc.pathItems.add();
            sep.setEntirePath([[mg, -(y+5)], [config.artboard.width - mg, -(y+5)]]);
            sep.stroked     = true;
            sep.filled      = false;
            sep.strokeWidth = 0.5;
            ColorManager.setStroke(sep, [0.91, 0.91, 0.91]);
            y += 10;
            return y;
        }

        function renderRule(doc, config, y, w, rgb) {
            var ln = doc.pathItems.add();
            ln.setEntirePath([[config.artboard.margin, -y],
                              [config.artboard.width - config.artboard.margin, -y]]);
            ln.stroked     = true;
            ln.filled      = false;
            ln.strokeWidth = w;
            ColorManager.setStroke(ln, rgb);
            return y + 1;
        }

        function renderCSS(doc, config, y) {
            var x = config.artboard.margin;
            TextFactory.createPointText(doc, "CSS CUSTOM PROPERTIES", 9,
                FontManager.getSafeFont("Arial", 700), [0.4,0.4,0.4], x, y);
            y += 20;

            var lines = [];
            lines.push(":root {");
            lines.push("  /* TypeArchy " + config.version + ": " + config.scaleName +
                        " x" + config.ratio.toFixed(3) + " */");
            lines.push("  /* " + config.credit + " */");
            lines.push("  --font-size-base:       " + config.base + "px;");
            lines.push("  --scale-ratio:          " + config.ratio.toFixed(3) + ";");
            lines.push("  --font-body:            '" + config.body.family + "';");
            lines.push("  --font-heading:         '" + config.heading.family + "';");
            lines.push("  --line-height-body:     " + config.body.lineHeight + ";");
            lines.push("  --line-height-heading:  " + config.heading.lineHeight + ";");
            lines.push("");
            for (var i = 0; i < config.levels.length; i++) {
                var lv  = config.levels[i];
                var pfx = lv.step >= 0 ? "+" : "";
                lines.push("  " + Utils.padRight("--font-size-" + lv.label.toLowerCase() + ":", 28) +
                    lv.rem.toFixed(4) + "rem; /* " + lv.px.toFixed(2) + "px step " + pfx + lv.step + " */");
            }
            lines.push("}");

            var lh      = 13.5;
            var pad     = 20;
            var boxH    = lines.length * lh + pad * 2;
            var boxW    = config.artboard.width - config.artboard.margin * 2;

            var cssBox  = doc.pathItems.rectangle(-y, x, boxW, boxH);
            cssBox.filled      = true;
            cssBox.stroked     = true;
            cssBox.strokeWidth = 0.5;
            ColorManager.setFill(cssBox,   [0.955, 0.965, 0.98]);
            ColorManager.setStroke(cssBox, [0.82,  0.86,  0.92]);

            TextFactory.createAreaText(doc, lines.join("\n"), 10,
                FontManager.getSafeFont("Courier New", 400), [0.1, 0.3, 0.6],
                x + 14, y + pad, boxW - 28, boxH - pad, lh, 0);

            return y + boxH + 16;
        }

        return {
            generate: function (config) {
                try {
                    var doc = app.documents.length > 0
                        ? app.activeDocument
                        : app.documents.add(DocumentColorSpace.RGB);

                    var estH = estimateHeight(config);
                    doc.artboards[0].artboardRect = [0, 0, config.artboard.width, -estH];

                    var bg = doc.pathItems.rectangle(0, 0, config.artboard.width, estH);
                    bg.filled  = true;
                    bg.stroked = false;
                    ColorManager.setFill(bg, config.artboard.bgColor);
                    bg.name = "_TA_bg";

                    var y = config.artboard.margin;

                    if (config.display.header) {
                        y = renderHeader(doc, config, y);
                        y += config.artboard.gap;
                        y = renderRule(doc, config, y, 0.75, [0.85, 0.85, 0.85]);
                        y += config.artboard.gap;
                    }

                    for (var i = 0; i < config.levels.length; i++) {
                        y = renderLevel(doc, config, config.levels[i], y);
                        y += config.artboard.gap;
                    }

                    if (config.layout === 2) {
                        y += config.artboard.gap;
                        y = renderRule(doc, config, y, 0.75, [0.85, 0.85, 0.85]);
                        y += config.artboard.gap;
                        y = renderCSS(doc, config, y);
                    }

                    var finalH = y + config.artboard.margin;
                    doc.artboards[0].artboardRect = [0, 0, config.artboard.width, -finalH];
                    bg.top    = 0;
                    bg.left   = 0;
                    bg.width  = config.artboard.width;
                    bg.height = finalH;

                    alert("TypeArchy " + VERSION + " \u2014 Done!\n\n" +
                          "Scale: "    + config.scaleName + "  (" + config.ratio.toFixed(3) + ")\n" +
                          "Base: "     + config.base + "px\n" +
                          "Levels: "   + config.levels.length + "\n" +
                          "Artboard: " + Math.round(config.artboard.width) +
                          " \xD7 "     + Math.round(finalH) + "px\n\n" +
                          config.credit);

                } catch (e) {
                    alert("Generation Error: " + e.message + "\nLine: " + e.line);
                }
            }
        };
    })();

    // ============================================
    // MAIN UI
    // ============================================
    function showUI() {
        var win = UIFactory.createWindow("TypeArchy " + VERSION + " | Type Scale Generator");

        // Header
        var hdrRow   = UIFactory.createRow(win);
        var hdrTitle = hdrRow.add("statictext", undefined, "TypeArchy");
        hdrTitle.graphics.font = ScriptUI.newFont("dialog", "BOLD", 15);
        var hdrVer = hdrRow.add("statictext", undefined, VERSION);
        hdrVer.graphics.font   = ScriptUI.newFont("dialog", "REGULAR", 9);
        UIFactory.createDivider(win);

        // Three columns
        var colsRow = UIFactory.createRow(win);
        colsRow.spacing = 14;
        var col1 = colsRow.add("group"); col1.orientation = "column"; col1.preferredSize.width = 245;
        var col2 = colsRow.add("group"); col2.orientation = "column"; col2.preferredSize.width = 260;
        var col3 = colsRow.add("group"); col3.orientation = "column"; col3.preferredSize.width = 320;

        // ---- COLUMN 1 ----
        var scalePanel = UIFactory.createPanel(col1, "Scale");
        var row1 = UIFactory.createRow(scalePanel);
        UIFactory.createLabel(row1, "Base Font Size (px):", 158);
        var eBase = UIFactory.createEdit(row1, "16", 50);

        var row2 = UIFactory.createRow(scalePanel);
        UIFactory.createLabel(row2, "Scale Ratio:", 158);
        var ePreset = UIFactory.createDropdown(row2, Utils.getPresetLabels(), 158);
        ePreset.selection = 4;

        var row3 = UIFactory.createRow(scalePanel);
        UIFactory.createLabel(row3, "Custom Ratio:", 158);
        var eCustom = UIFactory.createEdit(row3, "", 52);
        UIFactory.createLabel(row3, "overrides above", 98);

        var canvasPanel = UIFactory.createPanel(col1, "Artboard");
        var row4 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row4, "Width (px):", 158);
        var eArtW = UIFactory.createEdit(row4, "800", 50);

        var row5 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row5, "Margin (px):", 158);
        var eMargin = UIFactory.createEdit(row5, "60", 50);

        var row6 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row6, "Gap Between Rows (px):", 158);
        var eGap = UIFactory.createEdit(row6, "32", 50);

        var row7 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row7, "Info to Type Spacing (px):", 158);
        var eLblSp = UIFactory.createEdit(row7, "14", 50);

        var row8 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row8, "Background Color:", 158);
        var eBg = UIFactory.createEdit(row8, "#ffffff", 70);

        var row9 = UIFactory.createRow(canvasPanel);
        UIFactory.createLabel(row9, "Output Layout:", 158);
        var eLayout = UIFactory.createDropdown(row9,
            ["Size bars only", "Type samples", "Type samples + CSS"], 158);
        eLayout.selection = 1;

        var dispPanel = UIFactory.createPanel(col1, "Show on Artboard");
        var eShowBadge = UIFactory.createCheckbox(dispPanel, "Level badge (H1, H2, Base...)"); eShowBadge.value = true;
        var eShowPx    = UIFactory.createCheckbox(dispPanel, "Size in px");                    eShowPx.value    = true;
        var eShowRem   = UIFactory.createCheckbox(dispPanel, "Size in rem");                   eShowRem.value   = true;
        var eShowHdr   = UIFactory.createCheckbox(dispPanel, "Scale header block");            eShowHdr.value   = true;
        var eShowStep  = UIFactory.createCheckbox(dispPanel, "Step number (advanced)");        eShowStep.value  = false;

        // ---- COLUMN 2 ----
        var bodyPanel = UIFactory.createPanel(col2, "Body Font \u2014 Base and Small levels");
        var row10 = UIFactory.createRow(bodyPanel);
        UIFactory.createLabel(row10, "Font:", 80);
        var eBodyFont = UIFactory.createEdit(row10, "Helvetica", 130);
        UIFactory.createBrowseButton(row10, eBodyFont);

        var row11 = UIFactory.createRow(bodyPanel);
        UIFactory.createLabel(row11, "Weight:", 80);
        var eBodyWt = UIFactory.createDropdown(row11, WEIGHT_LABELS, 168);
        eBodyWt.selection = 3;

        var row12 = UIFactory.createRow(bodyPanel);
        UIFactory.createLabel(row12, "Line Height:", 80);
        var eBodyLh = UIFactory.createEdit(row12, "1.5", 52);

        var row13 = UIFactory.createRow(bodyPanel);
        UIFactory.createLabel(row13, "Letter Spacing (em):", 80);
        var eBodyLs = UIFactory.createEdit(row13, "0", 52);

        var row14 = UIFactory.createRow(bodyPanel);
        UIFactory.createLabel(row14, "Color:", 80);
        var eBodyCol = UIFactory.createEdit(row14, "#1a1a1a", 72);

        var headPanel = UIFactory.createPanel(col2, "Heading Font \u2014 XL and H1 to H5");
        var eSameFont = UIFactory.createCheckbox(headPanel, "Use same settings as Body font");
        eSameFont.value = false;

        var row15 = UIFactory.createRow(headPanel);
        UIFactory.createLabel(row15, "Font:", 80);
        var eHeadFont = UIFactory.createEdit(row15, "Helvetica", 130);
        var headBrowseBtn = UIFactory.createBrowseButton(row15, eHeadFont);

        var row16 = UIFactory.createRow(headPanel);
        UIFactory.createLabel(row16, "Weight:", 80);
        var eHeadWt = UIFactory.createDropdown(row16, WEIGHT_LABELS, 168);
        eHeadWt.selection = 6;

        var row17 = UIFactory.createRow(headPanel);
        UIFactory.createLabel(row17, "Line Height:", 80);
        var eHeadLh = UIFactory.createEdit(row17, "1.15", 52);

        var row18 = UIFactory.createRow(headPanel);
        UIFactory.createLabel(row18, "Letter Spacing (em):", 80);
        var eHeadLs = UIFactory.createEdit(row18, "-0.02", 52);

        var row19 = UIFactory.createRow(headPanel);
        UIFactory.createLabel(row19, "Color:", 80);
        var eHeadCol = UIFactory.createEdit(row19, "#111111", 72);

        eSameFont.onClick = function () {
            var on = !eSameFont.value;
            eHeadFont.enabled     = on;
            headBrowseBtn.enabled = on;
            eHeadWt.enabled       = on;
            eHeadLh.enabled       = on;
            eHeadLs.enabled       = on;
            eHeadCol.enabled      = on;
        };

        var samplePanel = UIFactory.createPanel(col2, "Sample Text");
        // v06 fix: declare eRTL BEFORE dropdowns that reference it
        var eRTL = UIFactory.createCheckbox(samplePanel, "RTL Mode (Arabic / Hebrew)");
        eRTL.value = false;
        UIFactory.createDivider(samplePanel);

        UIFactory.createLabel(samplePanel, "Heading text:");
        var row20 = UIFactory.createRow(samplePanel);
        var eSmpHMode = UIFactory.createDropdown(row20,
            ["Latin Lorem Ipsum", "Arabic Lorem Ipsum", "Custom text", "None"], 200);
        eSmpHMode.selection = 0;
        var eSmpHCustom = UIFactory.createEdit(samplePanel, "Your heading here...", 242);
        eSmpHCustom.visible = false;

        UIFactory.createLabel(samplePanel, "Body text:");
        var row21 = UIFactory.createRow(samplePanel);
        var eSmpBMode = UIFactory.createDropdown(row21,
            ["Latin Lorem Ipsum", "Arabic Lorem Ipsum", "Custom text", "None"], 200);
        eSmpBMode.selection = 0;
        var eSmpBCustom = UIFactory.createEdit(samplePanel, "Your body paragraph here...", 242);
        eSmpBCustom.visible = false;

        eSmpHMode.onChange = function () {
            var idx = eSmpHMode.selection ? eSmpHMode.selection.index : 0;
            eSmpHCustom.visible = (idx === SAMPLE_MODES.CUSTOM);
            if (idx === SAMPLE_MODES.ARABIC) eRTL.value = true;
        };
        eSmpBMode.onChange = function () {
            var idx = eSmpBMode.selection ? eSmpBMode.selection.index : 0;
            eSmpBCustom.visible = (idx === SAMPLE_MODES.CUSTOM);
            if (idx === SAMPLE_MODES.ARABIC) eRTL.value = true;
        };

        // ---- COLUMN 3 ----
        var lvPanel = UIFactory.createPanel(col3, "Type Levels \u2014 check to include in output");
        lvPanel.spacing = 5;

        var lvHdr = UIFactory.createRow(lvPanel);
        UIFactory.createLabel(lvHdr, "", 22);
        UIFactory.createLabel(lvHdr, "Level", 44);
        UIFactory.createLabel(lvHdr, "Override Font (blank = use global)", 190);
        UIFactory.createLabel(lvHdr, "Weight", 58);

        var levelRefs = [];
        for (var li = 0; li < LEVELS.length; li++) {
            (function (levelDef) {
                var lvRow    = UIFactory.createRow(lvPanel);
                var lvCb     = lvRow.add("checkbox", undefined, "");
                lvCb.value   = true;
                lvCb.preferredSize.width = 20;
                UIFactory.createLabel(lvRow, levelDef.label, 42);
                var lvFontEdit = UIFactory.createEdit(lvRow, "", 130);
                var lvBrowse   = lvRow.add("button", undefined, "Browse");
                lvBrowse.preferredSize.width = 52;
                lvBrowse.onClick = function () {
                    var chosen = FontBrowser.browse(lvFontEdit.text || "");
                    if (chosen) lvFontEdit.text = chosen;
                };
                var lvWtDD = UIFactory.createDropdown(lvRow,
                    ["-- global","100","200","300","400","500","600","700","800","900"], 68);
                lvWtDD.selection = 0;

                levelRefs.push({
                    id:        levelDef.id,
                    label:     levelDef.label,
                    isHeading: levelDef.isHeading,
                    stepVal:   levelDef.step,
                    cb:        lvCb,
                    fontEdit:  lvFontEdit,
                    wtDD:      lvWtDD
                });
            })(LEVELS[li]);
        }

        var lvBtnRow = UIFactory.createRow(lvPanel);
        var allBtn   = UIFactory.createButton(lvBtnRow, "+ Select All", 120);
        var noneBtn  = UIFactory.createButton(lvBtnRow, "\u2212 Clear All",  120);
        allBtn.onClick  = function () { for (var ai = 0; ai < levelRefs.length; ai++) levelRefs[ai].cb.value = true;  };
        noneBtn.onClick = function () { for (var ni = 0; ni < levelRefs.length; ni++) levelRefs[ni].cb.value = false; };

        // Preview
        var previewPanel = UIFactory.createPanel(col3, "Preview");
        var previewBtn   = UIFactory.createButton(previewPanel, "Calculate and Preview Sizes", 280);
        previewBtn.onClick = function () {
            var baseVal = Utils.parseNumber(eBase.text, 0);
            if (baseVal <= 0) { alert("Enter a valid base size first."); return; }
            var presetIdx = ePreset.selection ? ePreset.selection.index : 4;
            var ratioVal  = Utils.resolveRatio(presetIdx, eCustom.text);
            if (!ratioVal) { alert("Custom Ratio must be greater than 1 (e.g. 1.333)."); return; }

            var msg = "TypeArchy " + VERSION + "\n";
            msg += Utils.resolveRatioName(presetIdx, eCustom.text) +
                   "  x" + ratioVal.toFixed(3) + "  |  Base: " + baseVal + "px\n";
            msg += "-------------------------------------------\n";
            for (var pi = 0; pi < levelRefs.length; pi++) {
                var plv = levelRefs[pi];
                if (!plv.cb.value) { msg += "  [off]    " + plv.label + "\n"; continue; }
                var ppx = baseVal * Math.pow(ratioVal, plv.stepVal);
                msg += Utils.padRight(plv.label, 8) + ppx.toFixed(2) +
                       "px    " + (ppx/16).toFixed(4) + "rem\n";
            }
            alert(msg, "TypeArchy " + VERSION + " Preview");
        };

        // Divider before buttons
        UIFactory.createDivider(win);

        // Action buttons
        var btnRow = UIFactory.createRow(win);
        btnRow.alignment = "right";
        btnRow.spacing   = 10;
        var cancelBtn   = UIFactory.createButton(btnRow, "Cancel", 100);
        cancelBtn.onClick = function () { win.close(); };
        var generateBtn = UIFactory.createButton(btnRow, "Generate Type Scale", 155);
        generateBtn.onClick = function () {
            try {
                var uiRefs = {
                    base:            eBase,
                    preset:          ePreset,
                    customRatio:     eCustom,
                    artWidth:        eArtW,
                    margin:          eMargin,
                    gap:             eGap,
                    labelSpacing:    eLblSp,
                    bgColor:         eBg,
                    layout:          eLayout,
                    showBadge:       eShowBadge,
                    showPx:          eShowPx,
                    showRem:         eShowRem,
                    showStep:        eShowStep,
                    showHeader:      eShowHdr,
                    bodyFont:        eBodyFont,
                    bodyWeight:      eBodyWt,
                    bodyLineHeight:  eBodyLh,
                    bodyLetterSpacing: eBodyLs,
                    bodyColor:       eBodyCol,
                    headFont:        eHeadFont,
                    headWeight:      eHeadWt,
                    headLineHeight:  eHeadLh,
                    headLetterSpacing: eHeadLs,
                    headColor:       eHeadCol,
                    useBodyFont:     eSameFont,
                    sampleHeadMode:  eSmpHMode,
                    sampleHeadCustom: eSmpHCustom,
                    sampleBodyMode:  eSmpBMode,
                    sampleBodyCustom: eSmpBCustom,
                    rtl:             eRTL,
                    levelRefs:       levelRefs
                };
                var config = ConfigManager.createFromUI(uiRefs);
                win.close();
                Generator.generate(config);
            } catch (err) {
                alert("TypeArchy Error: " + err.message);
            }
        };

        // ============================================
        // FOOTER CREDIT — bottom of window
        // ============================================
        UIFactory.createDivider(win);
        var footerRow = win.add("group");
        footerRow.orientation   = "row";
        footerRow.alignChildren = ["center", "center"];
        footerRow.alignment     = "center";
        footerRow.spacing = 4;

        var footerLabel = footerRow.add("statictext", undefined,
            "Built by Tariq Yosef  \u2014  tariqdesign.com");
        footerLabel.graphics.font = ScriptUI.newFont("dialog", "ITALIC", 9);
        // ============================================

        win.show();
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        run: function () {
            try {
                showUI();
            } catch (e) {
                alert("TypeArchy " + VERSION + "\n\nError: " + e.message +
                      "\nLine: " + e.line +
                      "\n\nBuilt by Tariq Yosef \u2014 tariqdesign.com");
            }
        }
    };

})();

TypeArchy.run();
