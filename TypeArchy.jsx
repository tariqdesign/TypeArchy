// ============================================================
//  TypeScale Generator v2 for Adobe Illustrator
//  Levels: XL H1 H2 H3 H4 H5 Base Small (checkboxes)
//  Local font browser | Per-level font override
//  Custom label-to-text spacing
//  Run via: File > Scripts > Other Script
// ============================================================
#target illustrator

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

var WT_LBL = ["100","200","300","400 - Regular","500 - Medium","600","700 - Bold","800","900"];
var WT_VAL = [100,200,300,400,500,600,700,800,900];

var LEVELS = [
    { id:"xl",    label:"XL",    step:7,  isHeading:true  },
    { id:"h1",    label:"H1",    step:5,  isHeading:true  },
    { id:"h2",    label:"H2",    step:4,  isHeading:true  },
    { id:"h3",    label:"H3",    step:3,  isHeading:true  },
    { id:"h4",    label:"H4",    step:2,  isHeading:true  },
    { id:"h5",    label:"H5",    step:1,  isHeading:true  },
    { id:"base",  label:"Base",  step:0,  isHeading:false },
    { id:"small", label:"Small", step:-1, isHeading:false }
];

// ── Level badge colors ────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════
//  COLOR HELPERS
// ════════════════════════════════════════════════════════════
function makeRGB(r, g, b) {
    var c = new RGBColor();
    c.red = r * 255; c.green = g * 255; c.blue = b * 255;
    return c;
}
function setFill(item, rgb) { item.fillColor = makeRGB(rgb[0], rgb[1], rgb[2]); }
function setStroke(item, rgb) { item.strokeColor = makeRGB(rgb[0], rgb[1], rgb[2]); }
function setTextColor(tf, rgb) { tf.textRange.characterAttributes.fillColor = makeRGB(rgb[0], rgb[1], rgb[2]); }

function hexToRGB(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6) return null;
    var r = parseInt(hex.substr(0,2),16);
    var g = parseInt(hex.substr(2,2),16);
    var b = parseInt(hex.substr(4,2),16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r/255, g/255, b/255];
}

// ════════════════════════════════════════════════════════════
//  FONT HELPERS
// ════════════════════════════════════════════════════════════
function findFont(name, bold) {
    var tries = bold
        ? [name+"-Bold", name+" Bold", name+"-700", name, "Helvetica-Bold", "Helvetica", "ArialMT"]
        : [name, name+"-Regular", name+" Regular", "Helvetica", "ArialMT"];
    for (var i = 0; i < tries.length; i++) {
        try {
            var f = app.textFonts.getByName(tries[i]);
            if (f) return f;
        } catch (e) {}
    }
    try { return app.textFonts[0]; } catch (e) { return null; }
}

// ════════════════════════════════════════════════════════════
//  TEXT FRAME HELPERS
//  - pointText()  : single short label, NO textPath resize
//  - areaText()   : wrapping text, bounding path created first
// ════════════════════════════════════════════════════════════
function makePointText(doc, txt, sz, fnt, rgb, left, top) {
    var tf = doc.textFrames.add();
    var ca = tf.textRange.characterAttributes;
    ca.size = sz;
    if (fnt) ca.textFont = fnt;
    setTextColor(tf, rgb);
    tf.contents = txt;
    tf.left = left;
    tf.top  = -top;
    return tf;
}

function makeAreaText(doc, txt, sz, fnt, rgb, left, top, w, h, leading, tracking) {
    // Key: create bounding rectangle FIRST, then areaText(), set contents LAST
    var box = doc.pathItems.rectangle(-top, left, w, h);
    box.filled  = false;
    box.stroked = false;
    var tf = doc.textFrames.areaText(box);
    var ca = tf.textRange.characterAttributes;
    ca.size = sz;
    if (fnt)     ca.textFont = fnt;
    if (leading) ca.leading  = leading;
    if (tracking !== undefined) ca.tracking = tracking;
    setTextColor(tf, rgb);
    tf.contents = txt;
    return tf;
}

// ════════════════════════════════════════════════════════════
//  FONT BROWSER DIALOG
// ════════════════════════════════════════════════════════════
function openFontBrowser(current) {
    var families = [];
    var seen = {};
    for (var i = 0; i < app.textFonts.length; i++) {
        var fam = app.textFonts[i].family;
        if (fam && !seen[fam]) { seen[fam] = true; families.push(fam); }
    }
    families.sort();

    var win = new Window("dialog", "Font Browser  [" + families.length + " fonts installed]");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.margins = 14;
    win.spacing = 8;

    win.add("statictext", undefined, "Type to search then click Use Font:");

    var gr = win.add("group"); gr.orientation = "row"; gr.alignChildren = ["left","center"];
    gr.add("statictext", undefined, "Search:").preferredSize.width = 48;
    var searchBox = gr.add("edittext", undefined, "");
    searchBox.preferredSize.width = 320;

    var listBox = win.add("listbox", undefined, families, {multiselect: false});
    listBox.preferredSize = [420, 300];

    // Pre-select current font
    for (var j = 0; j < families.length; j++) {
        if (families[j].toLowerCase() === (current || "").toLowerCase()) {
            listBox.selection = j;
            break;
        }
    }

    var selGr = win.add("group"); selGr.orientation = "row"; selGr.alignChildren = ["left","center"];
    selGr.add("statictext", undefined, "Selected:").preferredSize.width = 55;
    var selLabel = selGr.add("statictext", undefined, current || "(none)");
    selLabel.preferredSize.width = 360;

    listBox.onChange = function () {
        if (listBox.selection) selLabel.text = listBox.selection.text;
    };

    searchBox.onChanging = function () {
        var q = searchBox.text.toLowerCase();
        listBox.removeAll();
        for (var k = 0; k < families.length; k++) {
            if (q === "" || families[k].toLowerCase().indexOf(q) !== -1) {
                listBox.add("item", families[k]);
            }
        }
        if (listBox.items.length > 0) {
            listBox.selection = 0;
            selLabel.text = listBox.items[0].text;
        }
    };

    var chosen = null;
    var btns = win.add("group"); btns.alignment = "right"; btns.spacing = 8;
    btns.add("button", undefined, "Cancel", {name:"cancel"}).onClick = function () { win.close(); };
    btns.add("button", undefined, "Use Font", {name:"ok"}).onClick = function () {
        if (listBox.selection) chosen = listBox.selection.text;
        win.close();
    };

    win.show();
    return chosen;
}

// ════════════════════════════════════════════════════════════
//  SCRIPTUI HELPERS
// ════════════════════════════════════════════════════════════
function uiPanel(parent, title) {
    var p = parent.add("panel", undefined, title);
    p.orientation = "column";
    p.alignChildren = ["fill", "top"];
    p.margins = 10;
    p.spacing = 6;
    return p;
}
function uiRow(parent) {
    var g = parent.add("group");
    g.orientation = "row";
    g.alignChildren = ["left", "center"];
    g.spacing = 5;
    return g;
}
function uiLabel(parent, text, width) {
    var l = parent.add("statictext", undefined, text);
    if (width) l.preferredSize.width = width;
    return l;
}
function uiEdit(parent, defval, width) {
    var e = parent.add("edittext", undefined, defval);
    if (width) e.preferredSize.width = width;
    return e;
}
function uiDropdown(parent, items, width) {
    var dd = parent.add("dropdownlist", undefined, items);
    if (width) dd.preferredSize.width = width;
    return dd;
}
function uiDivider(parent) {
    var x = parent.add("panel", undefined, "");
    x.preferredSize.height = 1;
    return x;
}

// ════════════════════════════════════════════════════════════
//  MAIN UI
// ════════════════════════════════════════════════════════════
function showUI() {
    var dlg = new Window("dialog", "TypeScale Generator v2");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.margins = 18;
    dlg.spacing = 10;

    var hdr = dlg.add("statictext", undefined, "TypeScale Generator  v2");
    hdr.graphics.font = ScriptUI.newFont("dialog", "BOLD", 14);
    dlg.add("statictext", undefined, "XL, H1-H5, Base, Small  |  Local font browser  |  Custom spacing");
    uiDivider(dlg);

    // Three-column layout
    var cols = dlg.add("group");
    cols.orientation = "row";
    cols.alignChildren = ["fill", "top"];
    cols.spacing = 14;

    var C1 = cols.add("group"); C1.orientation="column"; C1.alignChildren=["fill","top"]; C1.preferredSize.width=240; C1.spacing=8;
    var C2 = cols.add("group"); C2.orientation="column"; C2.alignChildren=["fill","top"]; C2.preferredSize.width=250; C2.spacing=8;
    var C3 = cols.add("group"); C3.orientation="column"; C3.alignChildren=["fill","top"]; C3.preferredSize.width=310; C3.spacing=8;

    // ── C1: Scale + Canvas ────────────────────────────────────
    var scalePanel = uiPanel(C1, "Scale Settings");
    var r; // reuse row variable
    r = uiRow(scalePanel); uiLabel(r,"Base size (px):",148); var eBase = uiEdit(r,"16",52);
    r = uiRow(scalePanel); uiLabel(r,"Preset ratio:",148);
    var ePreset = uiDropdown(r, presetLabels(), 155); ePreset.selection = 4;
    r = uiRow(scalePanel); uiLabel(r,"Custom ratio:",148); var eCustom = uiEdit(r,"",55); uiLabel(r,"(overrides)",70);

    var canvasPanel = uiPanel(C1, "Canvas");
    r = uiRow(canvasPanel); uiLabel(r,"Artboard width (px):",148); var eArtW = uiEdit(r,"800",52);
    r = uiRow(canvasPanel); uiLabel(r,"Margin (px):",148); var eMargin = uiEdit(r,"60",52);
    r = uiRow(canvasPanel); uiLabel(r,"Row gap (px):",148); var eGap = uiEdit(r,"32",52);
    r = uiRow(canvasPanel); uiLabel(r,"Label-to-text space (px):",148); var eLblSp = uiEdit(r,"14",52);
    r = uiRow(canvasPanel); uiLabel(r,"Background:",148); var eBg = uiEdit(r,"#ffffff",72);
    r = uiRow(canvasPanel); uiLabel(r,"Layout:",148);
    var eLayout = uiDropdown(r,["Bars only","Text preview","Full (text+CSS)"],148); eLayout.selection=1;

    // ── C2: Fonts + sample text + display options ─────────────
    var bodyPanel = uiPanel(C2, "Global Body Font  (Base & Small)");
    r = uiRow(bodyPanel); uiLabel(r,"Font:",52); var eBodyFont = uiEdit(r,"Helvetica",128);
    var bodyBrowse = r.add("button",undefined,"Browse"); bodyBrowse.preferredSize.width=58;
    bodyBrowse.onClick = function(){ var f=openFontBrowser(eBodyFont.text); if(f) eBodyFont.text=f; };
    r = uiRow(bodyPanel); uiLabel(r,"Weight:",52); var eBodyWt = uiDropdown(r,WT_LBL,158); eBodyWt.selection=3;
    r = uiRow(bodyPanel); uiLabel(r,"Line height:",52); var eBodyLh = uiEdit(r,"1.5",52);
    r = uiRow(bodyPanel); uiLabel(r,"Letter sp (em):",52); var eBodyLs = uiEdit(r,"0",52);
    r = uiRow(bodyPanel); uiLabel(r,"Color:",52); var eBodyCol = uiEdit(r,"#1a1a1a",72);

    var headPanel = uiPanel(C2, "Global Heading Font  (XL, H1-H5)");
    var eSameFont = headPanel.add("checkbox",undefined,"Same as body font"); eSameFont.value=false;
    r = uiRow(headPanel); uiLabel(r,"Font:",52); var eHeadFont = uiEdit(r,"Helvetica",128);
    var headBrowse = r.add("button",undefined,"Browse"); headBrowse.preferredSize.width=58;
    headBrowse.onClick = function(){ var f=openFontBrowser(eHeadFont.text); if(f) eHeadFont.text=f; };
    r = uiRow(headPanel); uiLabel(r,"Weight:",52); var eHeadWt = uiDropdown(r,WT_LBL,158); eHeadWt.selection=6;
    r = uiRow(headPanel); uiLabel(r,"Line height:",52); var eHeadLh = uiEdit(r,"1.15",52);
    r = uiRow(headPanel); uiLabel(r,"Letter sp (em):",52); var eHeadLs = uiEdit(r,"-0.02",52);
    r = uiRow(headPanel); uiLabel(r,"Color:",52); var eHeadCol = uiEdit(r,"#111111",72);

    // Disable heading rows when "same as body" is checked
    var headRow1, headRow2, headRow3, headRow4, headRow5;
    eSameFont.onClick = function() {
        var on = !eSameFont.value;
        // Re-enable/disable the heading font controls
        eHeadFont.enabled = on; headBrowse.enabled = on;
        eHeadWt.enabled = on; eHeadLh.enabled = on;
        eHeadLs.enabled = on; eHeadCol.enabled = on;
    };

    var samplePanel = uiPanel(C2, "Sample Text");
    r = uiRow(samplePanel); uiLabel(r,"Heading:",70); var eSmpH = uiEdit(r,"The quick brown fox",165);
    r = uiRow(samplePanel); uiLabel(r,"Body:",70); var eSmpB = uiEdit(r,"The quick brown fox jumps over the lazy dog.",165);

    var dispPanel = uiPanel(C2, "Display Options");
    var dName = dispPanel.add("checkbox",undefined,"Show level badge (H1, H2, Base...)"); dName.value=true;
    var dPx   = dispPanel.add("checkbox",undefined,"Show size in px"); dPx.value=true;
    var dRem  = dispPanel.add("checkbox",undefined,"Show size in rem"); dRem.value=true;
    var dStep = dispPanel.add("checkbox",undefined,"Show step number"); dStep.value=false;
    var dHdr  = dispPanel.add("checkbox",undefined,"Show scale header block"); dHdr.value=true;

    // ── C3: Level checkboxes + per-level font override ─────────
    var lvPanel = uiPanel(C3, "Type Levels  (check = include)");
    lvPanel.spacing = 4;

    // Header row
    var lhdr = uiRow(lvPanel);
    uiLabel(lhdr,"",22); uiLabel(lhdr,"Level",44); uiLabel(lhdr,"Step",36);
    uiLabel(lhdr,"Override Font  (blank = global)",156); uiLabel(lhdr,"Wt",44);

    var lvRefs = [];
    for (var li = 0; li < LEVELS.length; li++) {
        (function(lv) {
            var row = uiRow(lvPanel);
            var cb = row.add("checkbox",undefined,""); cb.value=true; cb.preferredSize.width=20;
            uiLabel(row, lv.label, 42);
            var stepEdit  = uiEdit(row, String(lv.step), 34);
            var fontEdit  = uiEdit(row, "", 114);
            var browseBtn = row.add("button",undefined,"..."); browseBtn.preferredSize.width=24;
            (function(fe) {
                browseBtn.onClick = function() {
                    var f = openFontBrowser(fe.text || "Helvetica");
                    if (f) fe.text = f;
                };
            })(fontEdit);
            var wtDD = uiDropdown(row, ["\u2014","100","200","300","400","500","600","700","800","900"], 48);
            wtDD.selection = 0;
            lvRefs.push({ id:lv.id, label:lv.label, isHeading:lv.isHeading,
                cb:cb, stepEdit:stepEdit, fontEdit:fontEdit, wtDD:wtDD });
        })(LEVELS[li]);
    }

    // Select all / none
    var selRow = uiRow(lvPanel);
    var allBtn  = selRow.add("button",undefined,"All On");  allBtn.preferredSize.width=72;
    var noneBtn = selRow.add("button",undefined,"All Off"); noneBtn.preferredSize.width=72;
    allBtn.onClick  = function() { for(var i=0;i<lvRefs.length;i++) lvRefs[i].cb.value=true; };
    noneBtn.onClick = function() { for(var i=0;i<lvRefs.length;i++) lvRefs[i].cb.value=false; };

    // Preview panel
    var pvPanel = uiPanel(C3, "Quick Preview");
    var pvBtn = pvPanel.add("button",undefined,"Preview Calculated Sizes");
    pvBtn.onClick = function() {
        var base = parseFloat(eBase.text);
        if (isNaN(base) || base <= 0) { alert("Invalid base size."); return; }
        var ratio = resolveRatio(ePreset, eCustom); if (!ratio) return;
        var msg = "TYPESCALE  |  " + resolveRatioName(ePreset,eCustom) + "  x" + ratio.toFixed(3) + "\nBase: " + base + "px\n";
        msg += "-----------------------------------\n";
        for (var i = 0; i < lvRefs.length; i++) {
            var lv = lvRefs[i];
            if (!lv.cb.value) { msg += "  [off]  " + lv.label + "\n"; continue; }
            var step = parseInt(lv.stepEdit.text) || 0;
            var px = base * Math.pow(ratio, step);
            msg += padRight(lv.label, 8) + px.toFixed(2) + "px   " + (px/16).toFixed(4) + "rem\n";
        }
        alert(msg, "TypeScale Preview");
    };

    // Action buttons
    uiDivider(dlg);
    var btnRow = dlg.add("group"); btnRow.alignment = "right"; btnRow.spacing = 8;
    btnRow.add("button",undefined,"Cancel",{name:"cancel"}).onClick = function() { dlg.close(); };
    var genBtn = btnRow.add("button",undefined,"Generate TypeScale",{name:"ok"});

    genBtn.onClick = function() {
        var base = parseFloat(eBase.text);
        if (isNaN(base) || base <= 0) { alert("Base size must be a positive number."); return; }
        var ratio = resolveRatio(ePreset, eCustom); if (!ratio) return;

        var artW   = parseFloat(eArtW.text)   || 800;
        var margin = parseFloat(eMargin.text)  || 60;
        var gap    = parseFloat(eGap.text)     || 32;
        var lblSp  = parseFloat(eLblSp.text)   || 14;
        var bgCol  = hexToRGB(eBg.text)        || [1,1,1];
        var layout = eLayout.selection ? eLayout.selection.index : 1;

        var bFont = (eBodyFont.text||"Helvetica").replace(/^\s+|\s+$/g,"") || "Helvetica";
        var bWt   = WT_VAL[eBodyWt.selection ? eBodyWt.selection.index : 3];
        var bLh   = parseFloat(eBodyLh.text) || 1.5;
        var bLs   = parseFloat(eBodyLs.text) || 0;
        var bCol  = hexToRGB(eBodyCol.text)  || [0.1,0.1,0.1];

        var same  = eSameFont.value;
        var hFont = same ? bFont : ((eHeadFont.text||"Helvetica").replace(/^\s+|\s+$/g,"")||"Helvetica");
        var hWt   = same ? bWt   : WT_VAL[eHeadWt.selection ? eHeadWt.selection.index : 6];
        var hLh   = same ? bLh   : (parseFloat(eHeadLh.text) || 1.15);
        var hLs   = same ? bLs   : (parseFloat(eHeadLs.text) || -0.02);
        var hCol  = same ? bCol  : (hexToRGB(eHeadCol.text)  || [0.067,0.067,0.067]);

        var levels = [];
        for (var i = 0; i < lvRefs.length; i++) {
            var lv = lvRefs[i]; if (!lv.cb.value) continue;
            var step  = parseInt(lv.stepEdit.text) || 0;
            var px    = base * Math.pow(ratio, step);
            var ovF   = lv.fontEdit.text.replace(/^\s+|\s+$/g,"");
            var ovWtI = lv.wtDD.selection ? lv.wtDD.selection.index : 0;
            var ovWt  = ovWtI > 0 ? [100,200,300,400,500,600,700,800,900][ovWtI-1] : null;
            levels.push({ id:lv.id, label:lv.label, isHeading:lv.isHeading,
                step:step, px:px, rem:px/16, ovFont:ovF||null, ovWt:ovWt });
        }
        if (levels.length === 0) { alert("Check at least one level."); return; }

        var cfg = {
            base:base, ratio:ratio, scaleName:resolveRatioName(ePreset,eCustom),
            artW:artW, margin:margin, gap:gap, lblSp:lblSp,
            bgCol:bgCol, layout:layout,
            bFont:bFont, bWt:bWt, bLh:bLh, bLs:bLs, bCol:bCol,
            hFont:hFont, hWt:hWt, hLh:hLh, hLs:hLs, hCol:hCol,
            smpH:eSmpH.text || "The quick brown fox",
            smpB:eSmpB.text || "The quick brown fox jumps over the lazy dog.",
            showBadge:dName.value, showPx:dPx.value, showRem:dRem.value,
            showStep:dStep.value, showHdr:dHdr.value,
            levels:levels
        };
        dlg.close();
        generate(cfg);
    };

    dlg.show();
}

// ════════════════════════════════════════════════════════════
//  GENERATE
// ════════════════════════════════════════════════════════════
function generate(cfg) {
    var doc = app.documents.length > 0 ? app.activeDocument : app.documents.add(DocumentColorSpace.RGB);
    var estH = estimateHeight(cfg);
    doc.artboards[0].artboardRect = [0, 0, cfg.artW, -estH];

    // Background
    var bg = doc.pathItems.rectangle(0, 0, cfg.artW, estH);
    bg.filled = true; bg.stroked = false;
    setFill(bg, cfg.bgCol); bg.name = "_TS_bg";

    var y = cfg.margin;

    if (cfg.showHdr) {
        y = renderHeader(doc, cfg, y);
        y += cfg.gap;
        y = renderRule(doc, cfg, y, 0.75, [0.85,0.85,0.85]);
        y += cfg.gap;
    }

    for (var i = 0; i < cfg.levels.length; i++) {
        y = renderLevel(doc, cfg, cfg.levels[i], y);
        y += cfg.gap;
    }

    if (cfg.layout === 2) {
        y += cfg.gap;
        y = renderRule(doc, cfg, y, 0.75, [0.85,0.85,0.85]);
        y += cfg.gap;
        y = renderCSS(doc, cfg, y);
    }

    // Resize artboard and background to actual content height
    var finalH = y + cfg.margin;
    doc.artboards[0].artboardRect = [0, 0, cfg.artW, -finalH];
    bg.top = 0; bg.left = 0; bg.width = cfg.artW; bg.height = finalH;

    alert("TypeScale generated!\n\nScale: " + cfg.scaleName + "  (" + cfg.ratio.toFixed(3) + ")\nBase: " + cfg.base + "px\nLevels: " + cfg.levels.length + "\nArtboard: " + Math.round(cfg.artW) + " x " + Math.round(finalH) + "px");
}

// ════════════════════════════════════════════════════════════
//  RENDER HEADER
// ════════════════════════════════════════════════════════════
function renderHeader(doc, cfg, y) {
    var x = cfg.margin;

    // "TYPESCALE" — short point text, no wrapping
    makePointText(doc, "TYPESCALE", 9, findFont(cfg.hFont,false), [0.55,0.55,0.55], x, y);
    y += 16;

    // Scale name — short point text
    makePointText(doc, cfg.ratio.toFixed(3) + "  -  " + cfg.scaleName, 28, findFont(cfg.hFont,true), [0.08,0.08,0.08], x, y);
    y += 38;

    // Meta info — long string, use area text so it wraps safely
    var names = [];
    for (var i = 0; i < cfg.levels.length; i++) names.push(cfg.levels[i].label);
    var meta = "Base: " + cfg.base + "px  |  " + cfg.levels.length + " levels: " + names.join(", ") + "  |  Body: " + cfg.bFont + "  |  Headings: " + cfg.hFont;
    makeAreaText(doc, meta, 10, findFont("Helvetica",false), [0.5,0.5,0.5], x, y, cfg.artW - x*2, 22);
    y += 18;

    return y;
}

// ════════════════════════════════════════════════════════════
//  RENDER LEVEL ROW
// ════════════════════════════════════════════════════════════
function renderLevel(doc, cfg, lv, y) {
    var x      = cfg.margin;
    var hasInfo = cfg.showBadge || cfg.showPx || cfg.showRem || cfg.showStep;
    var infoW  = hasInfo ? 132 : 0;
    var textX  = x + infoW;
    var textW  = cfg.artW - textX - cfg.margin;

    var fz     = Math.max(0.5, Math.min(lv.px, 1296));
    var isH    = lv.isHeading;

    // Font resolution: per-level override wins, then global heading/body
    var font   = findFont(lv.ovFont || (isH ? cfg.hFont : cfg.bFont), (lv.ovWt || (isH ? cfg.hWt : cfg.bWt)) >= 600);
    var lineH  = isH ? cfg.hLh : cfg.bLh;
    var ls     = isH ? cfg.hLs : cfg.bLs;
    var col    = isH ? cfg.hCol : cfg.bCol;

    var rowTop = y;

    // ── INFO COLUMN (all short point text) ───────────────────
    if (hasInfo) {
        var iy = y;

        if (cfg.showBadge) {
            var bW = 36, bH = 17;
            var badge = doc.pathItems.rectangle(-iy, x, bW, bH);
            badge.filled = true; badge.stroked = false;
            setFill(badge, LEVEL_COLORS[lv.id] || [0.4,0.4,0.4]);
            makePointText(doc, lv.label, 9, findFont("Helvetica",true), [1,1,1], x+5, iy+3);
            iy += 22;
        }
        if (cfg.showPx) {
            makePointText(doc, lv.px.toFixed(2)+"px", 10, findFont("Courier New",false), [0.22,0.22,0.22], x, iy);
            iy += 14;
        }
        if (cfg.showRem) {
            makePointText(doc, lv.rem.toFixed(4)+"rem", 9, findFont("Courier New",false), [0.52,0.52,0.52], x, iy);
            iy += 13;
        }
        if (cfg.showStep) {
            var ss = lv.step >= 0 ? "+" : "";
            makePointText(doc, "step "+ss+lv.step, 8, findFont("Courier New",false), [0.68,0.68,0.68], x, iy);
            iy += 11;
        }
        // Font name hint
        var hint = (lv.ovFont || (isH ? cfg.hFont : cfg.bFont)) + (lv.ovFont ? " *" : "");
        makePointText(doc, hint, 7, findFont("Helvetica",false), [0.72,0.72,0.72], x, iy);
    }

    // ── TEXT COLUMN ──────────────────────────────────────────
    // cfg.lblSp = vertical space between top-of-row and text baseline
    var textY = rowTop + cfg.lblSp;

    if (cfg.layout === 0) {
        // BARS
        var bw = Math.max(4, Math.min(textW, (lv.px / cfg.base) * 55));
        var bar = doc.pathItems.rectangle(-(textY+6), textX, bw, 10);
        bar.filled = true; bar.stroked = false;
        setFill(bar, LEVEL_COLORS[lv.id] || [0.4,0.4,0.4]);
        makePointText(doc, lv.px.toFixed(1)+"px", 9, findFont("Helvetica",false), [0.4,0.4,0.4], textX+bw+8, textY+3);
        y = Math.max(y, textY + 24);

    } else {
        // TEXT — area text (bounding path created inside makeAreaText, contents set last)
        var tfH = fz * lineH * 2.5;
        makeAreaText(doc, isH ? cfg.smpH : cfg.smpB,
            fz, font, col, textX, textY, textW, tfH,
            fz * lineH, Math.round(ls * 1000));

        y = textY + fz * lineH + cfg.lblSp;

        // Full layout: extra paragraph below Base level
        if (cfg.layout === 2 && lv.id === "base") {
            var bSz  = Math.max(0.5, Math.min(cfg.base, 1296));
            var bTfH = bSz * cfg.bLh * 5;
            makeAreaText(doc, cfg.smpB,
                bSz, findFont(cfg.bFont,false), cfg.bCol, textX, y, textW, bTfH,
                bSz * cfg.bLh, Math.round(cfg.bLs * 1000));
            y += bSz * cfg.bLh * 2 + 8;
        }
    }

    // Thin separator line
    var sep = doc.pathItems.add();
    sep.setEntirePath([[cfg.margin, -(y+5)], [cfg.artW - cfg.margin, -(y+5)]]);
    sep.stroked = true; sep.filled = false; sep.strokeWidth = 0.5;
    setStroke(sep, [0.91,0.91,0.91]);
    y += 10;
    return y;
}

// ════════════════════════════════════════════════════════════
//  RENDER CSS BLOCK
// ════════════════════════════════════════════════════════════
function renderCSS(doc, cfg, y) {
    var x = cfg.margin;
    makePointText(doc, "CSS CUSTOM PROPERTIES", 9, findFont("Helvetica",true), [0.4,0.4,0.4], x, y);
    y += 18;

    var L = [];
    L.push(":root {");
    L.push("  /* TypeScale: " + cfg.scaleName + " x" + cfg.ratio.toFixed(3) + " */");
    L.push("  --font-size-base:       " + cfg.base + "px;");
    L.push("  --scale-ratio:          " + cfg.ratio.toFixed(3) + ";");
    L.push("  --font-body:            '" + cfg.bFont + "';");
    L.push("  --font-heading:         '" + cfg.hFont + "';");
    L.push("  --line-height-body:     " + cfg.bLh + ";");
    L.push("  --line-height-heading:  " + cfg.hLh + ";");
    L.push("");
    for (var i = 0; i < cfg.levels.length; i++) {
        var lv = cfg.levels[i];
        var ss = lv.step >= 0 ? "+" : "";
        L.push("  " + padRight("--font-size-"+lv.label.toLowerCase()+":", 26) + lv.rem.toFixed(4) + "rem; /* " + lv.px.toFixed(2) + "px step " + ss + lv.step + " */");
    }
    L.push("}");

    var css  = L.join("\n");
    var boxH = L.length * 13.5 + 28;
    var boxW = cfg.artW - cfg.margin * 2;

    // Background box
    var bgBox = doc.pathItems.rectangle(-y, x, boxW, boxH);
    bgBox.filled = true; bgBox.stroked = true; bgBox.strokeWidth = 0.5;
    setFill(bgBox, [0.955, 0.965, 0.98]); setStroke(bgBox, [0.82, 0.86, 0.92]);

    // CSS text — area text (bounding path first, contents last)
    makeAreaText(doc, css, 10, findFont("Courier New",false), [0.1,0.3,0.6],
        x+14, y+14, boxW-28, boxH, 13.5, 0);

    y += boxH + 16;
    return y;
}

// ════════════════════════════════════════════════════════════
//  RENDER RULE LINE
// ════════════════════════════════════════════════════════════
function renderRule(doc, cfg, y, w, rgb) {
    var ln = doc.pathItems.add();
    ln.setEntirePath([[cfg.margin, -y], [cfg.artW - cfg.margin, -y]]);
    ln.stroked = true; ln.filled = false; ln.strokeWidth = w;
    setStroke(ln, rgb);
    return y + 1;
}

// ════════════════════════════════════════════════════════════
//  MISC UTILITIES
// ════════════════════════════════════════════════════════════
function estimateHeight(cfg) {
    var h = cfg.margin * 2;
    if (cfg.showHdr) h += 100;
    for (var i = 0; i < cfg.levels.length; i++) {
        var sz = Math.max(0.5, Math.min(cfg.levels[i].px, 300));
        var lh = cfg.levels[i].isHeading ? cfg.hLh : cfg.bLh;
        h += sz * lh + cfg.lblSp * 2 + 40 + cfg.gap;
    }
    if (cfg.layout === 2) h += 350;
    return h + 100;
}

function resolveRatio(ePreset, eCustom) {
    var cv = (eCustom.text || "").replace(/\s/g, "");
    if (cv !== "") {
        var rv = parseFloat(cv);
        if (isNaN(rv) || rv <= 1) { alert("Custom ratio must be greater than 1 (e.g. 1.333)."); return null; }
        return rv;
    }
    return PRESETS[ePreset.selection ? ePreset.selection.index : 4].ratio;
}

function resolveRatioName(ePreset, eCustom) {
    var cv = (eCustom.text || "").replace(/\s/g, "");
    if (cv !== "") return "Custom (" + cv + ")";
    return PRESETS[ePreset.selection ? ePreset.selection.index : 4].name;
}

function presetLabels() {
    var out = [];
    for (var i = 0; i < PRESETS.length; i++) out.push(PRESETS[i].ratio.toFixed(3) + " - " + PRESETS[i].name);
    return out;
}

function padRight(s, n) { while (s.length < n) s += " "; return s; }

// ════════════════════════════════════════════════════════════
//  ENTRY
// ════════════════════════════════════════════════════════════
try {
    showUI();
} catch (err) {
    alert("TypeScale Generator v2\n\nError: " + err.message + "\nLine: " + err.line);
}
