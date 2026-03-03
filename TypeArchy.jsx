// TypeArchy v06
// tariqdesign.com    tariq yosef 
// Type Scale Generator for Adobe Illustrator  
// Run via: File > Scripts > Other Script
// https://github.com/tariqdesign/TypeArchy
//
// v06 fixes from v05:
// - All non-ASCII characters removed from file (ES3 safe)
// - No duplicate var declarations (ES3 safe)
// - findFont now searches by family name - font changes work correctly
// - Font not found shows a warning instead of silent Helvetica fallback
// - RTL paragraph direction set after contents (ME Illustrator requirement)
// - RTL info column correctly positioned on right side
// - Arabic Unicode escapes only (ES3 safe, letters connect with Arabic font)
// - leading guard uses !== undefined so leading=0 works correctly
// - estimateHeight accounts for multi-line body text
// - CSS block has proper height for all lines
// - parseNum helper preserves negative letter spacing values like -0.02
// - eRTL checkbox declared before dropdowns that reference it
#target illustrator

var VERSION = "v06";

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

var WT_LBL = [
    "100 - Thin", "200 - Extra Light", "300 - Light", "400 - Regular",
    "500 - Medium", "600 - Semi Bold", "700 - Bold", "800 - Extra Bold", "900 - Black"
];
var WT_VAL = [100, 200, 300, 400, 500, 600, 700, 800, 900];

var LEVELS = [
    { id: "xl",    label: "XL",    step: 7,  isHeading: true  },
    { id: "h1",    label: "H1",    step: 5,  isHeading: true  },
    { id: "h2",    label: "H2",    step: 4,  isHeading: true  },
    { id: "h3",    label: "H3",    step: 3,  isHeading: true  },
    { id: "h4",    label: "H4",    step: 2,  isHeading: true  },
    { id: "h5",    label: "H5",    step: 1,  isHeading: true  },
    { id: "base",  label: "Base",  step: 0,  isHeading: false },
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

// Latin sample text
var LOREM_LATIN_HEAD = "The quick brown fox jumps over the lazy dog";
var LOREM_LATIN_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.";

// Arabic sample text built with String.fromCharCode() - fully ES3 safe
// Letters connect correctly when an Arabic font is selected
// such as Adobe Arabic, Cairo, or Noto Naskh Arabic
var LOREM_ARABIC_HEAD =
    String.fromCharCode(1575,1604,1579,1593,1604,1576,32,1575,1604,1576,1606,1610,32,1575,1604,1587,1585,1610,1593,32) +
    String.fromCharCode(1610,1602,1601,1586,32,1601,1608,1602,32,1575,1604,1603,1604,1576,32,1575,1604,1603,1587,1608) +
    String.fromCharCode(1604);
var LOREM_ARABIC_BODY =
    String.fromCharCode(1604,1608,1585,1610,1605,32,1573,1610,1576,1587,1608,1605,32,1583,1608,1604,1575,1585,32,1587) +
    String.fromCharCode(1610,1578,32,1571,1605,1610,1578,1548,32,1603,1608,1606,1587,1610,1603,1578,1610,1578,1608,1585) +
    String.fromCharCode(32,1571,1583,1610,1576,1610,1587,1610,1606,1580,32,1573,1610,1604,1610,1578,46,32,1587,1610) +
    String.fromCharCode(1583,32,1583,1608,32,1573,1610,1608,1587,1605,1608,1583,32,1578,1610,1605,1576,1608,1585,32) +
    String.fromCharCode(1573,1606,1587,1610,1583,1610,1583,1608,1606,1578,32,1571,1608,1578,32,1604,1575,1576,1608,1585) +
    String.fromCharCode(1610,32,1573,1578,32,1583,1608,1604,1608,1585,1610,32,1605,1575,1580,1606,1575,46,32,1571) +
    String.fromCharCode(1608,1578,32,1573,1610,1606,1610,1605,32,1571,1583,32,1605,1610,1606,1610,1605,32,1601,1610) +
    String.fromCharCode(1606,1610,1575,1605,1548,32,1603,1610,1608,1610,1587,32,1606,1608,1587,1578,1585,1608,1583,32) +
    String.fromCharCode(1573,1603,1587,1610,1585,1587,1610,1578,1575,1578,1610,1608,1606,46,32,1583,1608,1610,1587,32) +
    String.fromCharCode(1571,1608,1578,1610,32,1573,1610,1585,1608,1585,1610,32,1583,1608,1604,1608,1585,32,1573,1606) +
    String.fromCharCode(32,1585,1610,1576,1585,1610,1607,1610,1606,1583,1610,1585,1610,1578,46,32,1573,1603,1587,1610) +
    String.fromCharCode(1576,1578,1610,1608,1585,32,1587,1610,1606,1578,32,1571,1608,1603,1575,1610,1610,1603,1575,1578) +
    String.fromCharCode(32,1603,1610,1608,1576,1610,1583,1575,1578,1575,1578,32,1606,1608,1606,32,1576,1585,1608,1610) +
    String.fromCharCode(1583,1610,1606,1578,46);

var SMP_LATIN  = 0;
var SMP_ARABIC = 1;
var SMP_CUSTOM = 2;
var SMP_NONE   = 3;

// ============================================================
// COLOR HELPERS
// ============================================================
function makeRGB(r, g, b) {
    var c = new RGBColor();
    c.red = r * 255; c.green = g * 255; c.blue = b * 255;
    return c;
}
function setFill(item, rgb)    { item.fillColor   = makeRGB(rgb[0], rgb[1], rgb[2]); }
function setStroke(item, rgb)  { item.strokeColor  = makeRGB(rgb[0], rgb[1], rgb[2]); }
function setTxtColor(tf, rgb)  { tf.textRange.characterAttributes.fillColor = makeRGB(rgb[0], rgb[1], rgb[2]); }

function hexToRGB(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6) return null;
    var rr = parseInt(hex.substr(0,2), 16);
    var gg = parseInt(hex.substr(2,2), 16);
    var bb = parseInt(hex.substr(4,2), 16);
    if (isNaN(rr) || isNaN(gg) || isNaN(bb)) return null;
    return [rr/255, gg/255, bb/255];
}

// ============================================================
// NUMBER PARSE - safe for negatives like -0.02
// ============================================================
function parseNum(str, fallback) {
    var v = parseFloat(str);
    return isNaN(v) ? fallback : v;
}

// ============================================================
// FONT HELPERS - search by family name, not PostScript name
// ============================================================
function findFontByFamily(familyName, targetWeight) {
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

function safeFont(familyName, weight) {
    var found = findFontByFamily(familyName, weight);
    if (found) return found;
    var fb = findFontByFamily("Arial", weight) || findFontByFamily("Helvetica", weight);
    if (fb) return fb;
    try { return app.textFonts[0]; } catch(e2) { return null; }
}

// ============================================================
// TEXT FRAME HELPERS
// ============================================================
function makePointText(doc, txt, sz, fnt, rgb, left, top) {
    var ptf = doc.textFrames.add();
    var pca = ptf.textRange.characterAttributes;
    pca.size = sz;
    if (fnt) pca.textFont = fnt;
    setTxtColor(ptf, rgb);
    ptf.contents = txt;
    ptf.left = left;
    ptf.top  = -top;
    return ptf;
}

function makeAreaText(doc, txt, sz, fnt, rgb, left, top, w, h, leading, tracking) {
    var abox = doc.pathItems.rectangle(-top, left, w, h);
    abox.filled = false; abox.stroked = false;
    var atf = doc.textFrames.areaText(abox);
    var aca = atf.textRange.characterAttributes;
    aca.size = sz;
    if (fnt) aca.textFont = fnt;
    if (leading  !== undefined && leading  !== null) aca.leading  = leading;
    if (tracking !== undefined && tracking !== null) aca.tracking = tracking;
    setTxtColor(atf, rgb);
    atf.contents = txt;
    return atf;
}

function makeAreaTextRTL(doc, txt, sz, fnt, rgb, left, top, w, h, leading, tracking, rtl) {
    var rbox = doc.pathItems.rectangle(-top, left, w, h);
    rbox.filled = false; rbox.stroked = false;
    var rtf = doc.textFrames.areaText(rbox);
    var rca = rtf.textRange.characterAttributes;
    rca.size = sz;
    if (fnt) rca.textFont = fnt;
    if (leading  !== undefined && leading  !== null) rca.leading  = leading;
    if (tracking !== undefined && tracking !== null) rca.tracking = tracking;
    setTxtColor(rtf, rgb);
    rtf.contents = txt;
    if (rtl) {
        try {
            var rpa = rtf.textRange.paragraphAttributes;
            rpa.justification = Justification.RIGHT;
            if (typeof ParagraphDirection !== "undefined") {
                rpa.paragraphDirection = ParagraphDirection.RIGHT_TO_LEFT;
            }
        } catch(rtlErr) {}
    }
    return rtf;
}

// ============================================================
// FONT BROWSER DIALOG
// ============================================================
function openFontBrowser(current) {
    var fbFamilies = [];
    var fbSeen = {};
    var fbi;
    for (fbi = 0; fbi < app.textFonts.length; fbi++) {
        var fbFam = app.textFonts[fbi].family;
        if (fbFam && !fbSeen[fbFam]) { fbSeen[fbFam] = true; fbFamilies.push(fbFam); }
    }
    fbFamilies.sort();

    var fbWin = new Window("dialog", "TypeArchy | Font Browser [" + fbFamilies.length + " fonts]");
    fbWin.orientation = "column";
    fbWin.alignChildren = ["fill","top"];
    fbWin.margins = 16; fbWin.spacing = 10;

    fbWin.add("statictext", undefined, "Search fonts below then click Use This Font.");

    var fbSRow = fbWin.add("group");
    fbSRow.orientation = "row"; fbSRow.alignChildren = ["left","center"]; fbSRow.spacing = 8;
    fbSRow.add("statictext", undefined, "Search:").preferredSize.width = 55;
    var fbSearch = fbSRow.add("edittext", undefined, "");
    fbSearch.preferredSize.width = 340;

    var fbList = fbWin.add("listbox", undefined, fbFamilies, {multiselect: false});
    fbList.preferredSize = [440, 300];

    var fbj;
    for (fbj = 0; fbj < fbFamilies.length; fbj++) {
        if (fbFamilies[fbj].toLowerCase() === (current || "").toLowerCase()) {
            fbList.selection = fbj; break;
        }
    }

    var fbSelRow = fbWin.add("group");
    fbSelRow.orientation = "row"; fbSelRow.alignChildren = ["left","center"]; fbSelRow.spacing = 8;
    fbSelRow.add("statictext", undefined, "Selected:").preferredSize.width = 65;
    var fbSelLbl = fbSelRow.add("statictext", undefined, current || "(none)");
    fbSelLbl.preferredSize.width = 355;

    fbList.onChange = function() {
        if (fbList.selection) fbSelLbl.text = fbList.selection.text;
    };

    fbSearch.onChanging = function() {
        var fbq = fbSearch.text.toLowerCase();
        fbList.removeAll();
        var fbk;
        for (fbk = 0; fbk < fbFamilies.length; fbk++) {
            if (fbq === "" || fbFamilies[fbk].toLowerCase().indexOf(fbq) !== -1) {
                fbList.add("item", fbFamilies[fbk]);
            }
        }
        if (fbList.items.length > 0) {
            fbList.selection = 0;
            fbSelLbl.text = fbList.items[0].text;
        }
    };

    var fbChosen = null;
    var fbBtns = fbWin.add("group"); fbBtns.alignment = "right"; fbBtns.spacing = 10;
    fbBtns.add("button", undefined, "Cancel", {name:"cancel"}).onClick = function() { fbWin.close(); };
    fbBtns.add("button", undefined, "Use This Font", {name:"ok"}).onClick = function() {
        if (fbList.selection) fbChosen = fbList.selection.text;
        fbWin.close();
    };

    fbWin.show();
    return fbChosen;
}

// ============================================================
// SCRIPTUI HELPERS
// ============================================================
function uiPanel(parent, title) {
    var p = parent.add("panel", undefined, title);
    p.orientation = "column"; p.alignChildren = ["fill","top"]; p.margins = 12; p.spacing = 7;
    return p;
}
function uiRow(parent) {
    var grp = parent.add("group");
    grp.orientation = "row"; grp.alignChildren = ["left","center"]; grp.spacing = 6;
    return grp;
}
function uiLabel(parent, text, width) {
    var lbl = parent.add("statictext", undefined, text);
    if (width) lbl.preferredSize.width = width;
    return lbl;
}
function uiEdit(parent, defval, width) {
    var edt = parent.add("edittext", undefined, String(defval));
    if (width) edt.preferredSize.width = width;
    return edt;
}
function uiDropdown(parent, items, width) {
    var dd = parent.add("dropdownlist", undefined, items);
    if (width) dd.preferredSize.width = width;
    return dd;
}
function uiDivider(parent) {
    var dv = parent.add("panel", undefined, ""); dv.preferredSize.height = 1; return dv;
}
function uiBrowseBtn(parent, targetEdit) {
    var btn = parent.add("button", undefined, "Browse Font");
    btn.preferredSize.width = 82;
    btn.onClick = function() {
        var chosen = openFontBrowser(targetEdit.text || "");
        if (chosen) targetEdit.text = chosen;
    };
    return btn;
}

// ============================================================
// MAIN UI
// ============================================================
function showUI() {
    var dlg = new Window("dialog", "TypeArchy " + VERSION + " | Type Scale Generator");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill","top"];
    dlg.margins = 18; dlg.spacing = 10;

    var hdrGrp = dlg.add("group");
    hdrGrp.orientation = "row"; hdrGrp.alignChildren = ["left","center"]; hdrGrp.spacing = 10;
    var hdrTitle = hdrGrp.add("statictext", undefined, "TypeArchy");
    hdrTitle.graphics.font = ScriptUI.newFont("dialog", "BOLD", 15);
    var hdrVer = hdrGrp.add("statictext", undefined, VERSION);
    hdrVer.graphics.font = ScriptUI.newFont("dialog", "REGULAR", 9);
    uiDivider(dlg);

    var colsGrp = dlg.add("group");
    colsGrp.orientation = "row"; colsGrp.alignChildren = ["fill","top"]; colsGrp.spacing = 14;
    var C1 = colsGrp.add("group"); C1.orientation="column"; C1.alignChildren=["fill","top"]; C1.preferredSize.width=245; C1.spacing=8;
    var C2 = colsGrp.add("group"); C2.orientation="column"; C2.alignChildren=["fill","top"]; C2.preferredSize.width=260; C2.spacing=8;
    var C3 = colsGrp.add("group"); C3.orientation="column"; C3.alignChildren=["fill","top"]; C3.preferredSize.width=315; C3.spacing=8;

    // COLUMN 1
    var scalePanel = uiPanel(C1, "Scale");
    var scRow1 = uiRow(scalePanel); uiLabel(scRow1, "Base Font Size (px):", 158); var eBase = uiEdit(scRow1, "16", 50);
    var scRow2 = uiRow(scalePanel); uiLabel(scRow2, "Scale Ratio:", 158);
    var ePreset = uiDropdown(scRow2, presetLabels(), 158); ePreset.selection = 4;
    var scRow3 = uiRow(scalePanel); uiLabel(scRow3, "Custom Ratio:", 158); var eCustom = uiEdit(scRow3, "", 52);
    uiLabel(scRow3, "overrides above", 98);

    var canvasPanel = uiPanel(C1, "Artboard");
    var cvRow1 = uiRow(canvasPanel); uiLabel(cvRow1, "Width (px):",                158); var eArtW   = uiEdit(cvRow1, "800",     50);
    var cvRow2 = uiRow(canvasPanel); uiLabel(cvRow2, "Margin (px):",               158); var eMargin = uiEdit(cvRow2,  "60",     50);
    var cvRow3 = uiRow(canvasPanel); uiLabel(cvRow3, "Gap Between Rows (px):",     158); var eGap    = uiEdit(cvRow3,  "32",     50);
    var cvRow4 = uiRow(canvasPanel); uiLabel(cvRow4, "Info to Type Spacing (px):", 158); var eLblSp  = uiEdit(cvRow4,  "14",     50);
    var cvRow5 = uiRow(canvasPanel); uiLabel(cvRow5, "Background Color:",          158); var eBg     = uiEdit(cvRow5, "#ffffff", 70);
    var cvRow6 = uiRow(canvasPanel); uiLabel(cvRow6, "Output Layout:", 158);
    var eLayout = uiDropdown(cvRow6, ["Size bars only", "Type samples", "Type samples + CSS"], 158);
    eLayout.selection = 1;

    var dispPanel = uiPanel(C1, "Show on Artboard");
    var dBadge = dispPanel.add("checkbox", undefined, "Level badge  (H1, H2, Base...)"); dBadge.value = true;
    var dPx    = dispPanel.add("checkbox", undefined, "Size in px");                     dPx.value   = true;
    var dRem   = dispPanel.add("checkbox", undefined, "Size in rem");                    dRem.value  = true;
    var dHdr   = dispPanel.add("checkbox", undefined, "Scale header block");             dHdr.value  = true;
    var dStep  = dispPanel.add("checkbox", undefined, "Step number (advanced)");         dStep.value = false;

    // COLUMN 2
    var bodyPanel = uiPanel(C2, "Body Font  -  Base and Small levels");
    var bfRow1 = uiRow(bodyPanel); uiLabel(bfRow1, "Font:", 80); var eBodyFont = uiEdit(bfRow1, "Helvetica", 148); uiBrowseBtn(bfRow1, eBodyFont);
    var bfRow2 = uiRow(bodyPanel); uiLabel(bfRow2, "Weight:", 80); var eBodyWt = uiDropdown(bfRow2, WT_LBL, 218); eBodyWt.selection = 3;
    var bfRow3 = uiRow(bodyPanel); uiLabel(bfRow3, "Line Height:", 80); var eBodyLh = uiEdit(bfRow3, "1.5", 52);
    var bfRow4 = uiRow(bodyPanel); uiLabel(bfRow4, "Letter Spacing (em):", 80); var eBodyLs = uiEdit(bfRow4, "0", 52);
    var bfRow5 = uiRow(bodyPanel); uiLabel(bfRow5, "Color:", 80); var eBodyCol = uiEdit(bfRow5, "#1a1a1a", 72);

    var headPanel = uiPanel(C2, "Heading Font  -  XL and H1 to H5");
    var eSameFont = headPanel.add("checkbox", undefined, "Use same settings as Body font"); eSameFont.value = false;
    var hfRow1 = uiRow(headPanel); uiLabel(hfRow1, "Font:", 80); var eHeadFont = uiEdit(hfRow1, "Helvetica", 148);
    var headBrowseBtn = uiBrowseBtn(hfRow1, eHeadFont);
    var hfRow2 = uiRow(headPanel); uiLabel(hfRow2, "Weight:", 80); var eHeadWt = uiDropdown(hfRow2, WT_LBL, 218); eHeadWt.selection = 6;
    var hfRow3 = uiRow(headPanel); uiLabel(hfRow3, "Line Height:", 80); var eHeadLh = uiEdit(hfRow3, "1.15", 52);
    var hfRow4 = uiRow(headPanel); uiLabel(hfRow4, "Letter Spacing (em):", 80); var eHeadLs = uiEdit(hfRow4, "-0.02", 52);
    var hfRow5 = uiRow(headPanel); uiLabel(hfRow5, "Color:", 80); var eHeadCol = uiEdit(hfRow5, "#111111", 72);

    eSameFont.onClick = function() {
        var isOn = !eSameFont.value;
        eHeadFont.enabled = isOn; headBrowseBtn.enabled = isOn;
        eHeadWt.enabled = isOn; eHeadLh.enabled = isOn;
        eHeadLs.enabled = isOn; eHeadCol.enabled = isOn;
    };

    var samplePanel = uiPanel(C2, "Sample Text");

    // RTL declared FIRST - dropdowns below reference it
    var eRTL = samplePanel.add("checkbox", undefined, "RTL Mode  (Arabic/Hebrew - ME Illustrator)");
    eRTL.value = false;
    uiDivider(samplePanel);

    uiLabel(samplePanel, "Heading text:");
    var smpHRow = uiRow(samplePanel);
    var eSmpHMode = uiDropdown(smpHRow, ["Latin Lorem Ipsum", "Arabic Lorem Ipsum", "Custom text", "None"], 200);
    eSmpHMode.selection = 0;
    var eSmpHCustom = uiEdit(samplePanel, "Your heading here...", 242);
    eSmpHCustom.visible = false;
    eSmpHMode.onChange = function() {
        var hidx = eSmpHMode.selection ? eSmpHMode.selection.index : 0;
        eSmpHCustom.visible = (hidx === SMP_CUSTOM);
        if (hidx === SMP_ARABIC) eRTL.value = true;
    };

    uiLabel(samplePanel, "Body text:");
    var smpBRow = uiRow(samplePanel);
    var eSmpBMode = uiDropdown(smpBRow, ["Latin Lorem Ipsum", "Arabic Lorem Ipsum", "Custom text", "None"], 200);
    eSmpBMode.selection = 0;
    var eSmpBCustom = uiEdit(samplePanel, "Your body paragraph here...", 242);
    eSmpBCustom.visible = false;
    eSmpBMode.onChange = function() {
        var bidx = eSmpBMode.selection ? eSmpBMode.selection.index : 0;
        eSmpBCustom.visible = (bidx === SMP_CUSTOM);
        if (bidx === SMP_ARABIC) eRTL.value = true;
    };

    // COLUMN 3
    var lvPanel = uiPanel(C3, "Type Levels  -  check to include in output");
    lvPanel.spacing = 5;

    var lvHdr = uiRow(lvPanel);
    uiLabel(lvHdr, "",      22);
    uiLabel(lvHdr, "Level", 44);
    uiLabel(lvHdr, "Override Font  (blank = use global font)", 200);
    uiLabel(lvHdr, "Weight", 58);

    var lvRefs = [];
    var li;
    for (li = 0; li < LEVELS.length; li++) {
        (function(lvDef) {
            var lvRow      = uiRow(lvPanel);
            var lvCb       = lvRow.add("checkbox", undefined, ""); lvCb.value = true; lvCb.preferredSize.width = 20;
            uiLabel(lvRow, lvDef.label, 42);
            var lvFontEdit = uiEdit(lvRow, "", 148);
            var lvBrowse   = lvRow.add("button", undefined, "Browse"); lvBrowse.preferredSize.width = 52;
            (function(fe) {
                lvBrowse.onClick = function() {
                    var fc = openFontBrowser(fe.text || ""); if (fc) fe.text = fc;
                };
            })(lvFontEdit);
            var lvWtDD = uiDropdown(lvRow, ["--  global","100","200","300","400","500","600","700","800","900"], 62);
            lvWtDD.selection = 0;
            lvRefs.push({ id: lvDef.id, label: lvDef.label, isHeading: lvDef.isHeading,
                stepVal: lvDef.step, cb: lvCb, fontEdit: lvFontEdit, wtDD: lvWtDD });
        })(LEVELS[li]);
    }

    var lvSelRow = uiRow(lvPanel);
    var allBtn  = lvSelRow.add("button", undefined, "+ Select All");  allBtn.preferredSize.width  = 120;
    var noneBtn = lvSelRow.add("button", undefined, "- Clear All");   noneBtn.preferredSize.width = 120;
    allBtn.onClick  = function() { var ai; for (ai=0;ai<lvRefs.length;ai++) lvRefs[ai].cb.value=true;  };
    noneBtn.onClick = function() { var ni; for (ni=0;ni<lvRefs.length;ni++) lvRefs[ni].cb.value=false; };

    var pvPanel = uiPanel(C3, "Preview Sizes");
    var pvBtn = pvPanel.add("button", undefined, "Calculate and Preview Sizes");
    pvBtn.preferredSize.width = 280;
    pvBtn.onClick = function() {
        var pvBase  = parseNum(eBase.text, 0);
        if (pvBase <= 0) { alert("Enter a valid base size first."); return; }
        var pvRatio = resolveRatio(ePreset, eCustom); if (!pvRatio) return;
        var pvMsg = "TypeArchy " + VERSION + "\n";
        pvMsg += resolveRatioName(ePreset, eCustom) + "  x" + pvRatio.toFixed(3) + "  |  Base: " + pvBase + "px\n";
        pvMsg += "-------------------------------------------\n";
        var pvi;
        for (pvi = 0; pvi < lvRefs.length; pvi++) {
            var pvlv = lvRefs[pvi];
            if (!pvlv.cb.value) { pvMsg += "  [off]    " + pvlv.label + "\n"; continue; }
            var pvpx = pvBase * Math.pow(pvRatio, pvlv.stepVal);
            pvMsg += padRight(pvlv.label, 8) + pvpx.toFixed(2) + "px    " + (pvpx/16).toFixed(4) + "rem\n";
        }
        alert(pvMsg, "TypeArchy Preview");
    };

    uiDivider(dlg);
    var btnGrp = dlg.add("group"); btnGrp.alignment = "right"; btnGrp.spacing = 10;
    btnGrp.add("button", undefined, "Cancel", {name:"cancel"}).onClick = function() { dlg.close(); };
    var genBtn = btnGrp.add("button", undefined, "Generate Type Scale", {name:"ok"});
    genBtn.preferredSize.width = 155;

    genBtn.onClick = function() {
        var cfgBase = parseNum(eBase.text, 0);
        if (cfgBase <= 0) { alert("Base Font Size must be a positive number (e.g. 16)."); return; }
        var cfgRatio = resolveRatio(ePreset, eCustom); if (!cfgRatio) return;

        var cfgArtW   = parseNum(eArtW.text,   800);
        var cfgMargin = parseNum(eMargin.text,   60);
        var cfgGap    = parseNum(eGap.text,      32);
        var cfgLblSp  = parseNum(eLblSp.text,    14);
        var cfgBgCol  = hexToRGB(eBg.text)      || [1, 1, 1];
        var cfgLayout = eLayout.selection ? eLayout.selection.index : 1;

        var cfgBFamily = (eBodyFont.text || "").replace(/^\s+|\s+$/g, "") || "Helvetica";
        var cfgBWt     = WT_VAL[eBodyWt.selection ? eBodyWt.selection.index : 3];
        var cfgBLh     = parseNum(eBodyLh.text, 1.5);
        var cfgBLs     = parseNum(eBodyLs.text, 0);
        var cfgBCol    = hexToRGB(eBodyCol.text) || [0.1, 0.1, 0.1];
        if (!findFontByFamily(cfgBFamily, cfgBWt)) {
            if (!confirm("Body font \"" + cfgBFamily + "\" not found. Continue with fallback font?")) return;
        }

        var cfgSame = eSameFont.value;
        var cfgHFamily, cfgHWt, cfgHLh, cfgHLs, cfgHCol;
        if (cfgSame) {
            cfgHFamily = cfgBFamily; cfgHWt = cfgBWt; cfgHLh = cfgBLh; cfgHLs = cfgBLs; cfgHCol = cfgBCol;
        } else {
            cfgHFamily = ((eHeadFont.text || "").replace(/^\s+|\s+$/g,"")) || "Helvetica";
            cfgHWt     = WT_VAL[eHeadWt.selection ? eHeadWt.selection.index : 6];
            cfgHLh     = parseNum(eHeadLh.text, 1.15);
            cfgHLs     = parseNum(eHeadLs.text, -0.02);
            cfgHCol    = hexToRGB(eHeadCol.text) || [0.067, 0.067, 0.067];
            if (!findFontByFamily(cfgHFamily, cfgHWt)) {
                if (!confirm("Heading font \"" + cfgHFamily + "\" not found. Continue with fallback font?")) return;
            }
        }

        var cfgLevels = [];
        var gi;
        for (gi = 0; gi < lvRefs.length; gi++) {
            var glv = lvRefs[gi]; if (!glv.cb.value) continue;
            var gpx    = cfgBase * Math.pow(cfgRatio, glv.stepVal);
            var govF   = (glv.fontEdit.text || "").replace(/^\s+|\s+$/g, "");
            var govWtI = glv.wtDD.selection ? glv.wtDD.selection.index : 0;
            var govWt  = govWtI > 0 ? WT_VAL[govWtI - 1] : null;
            if (govF && !findFontByFamily(govF, govWt || 400)) {
                if (!confirm("Override font \"" + govF + "\" for " + glv.label + " not found. Use global font instead?")) return;
                govF = "";
            }
            cfgLevels.push({ id: glv.id, label: glv.label, isHeading: glv.isHeading,
                step: glv.stepVal, px: gpx, rem: gpx/16, ovFont: govF || null, ovWt: govWt });
        }
        if (cfgLevels.length === 0) { alert("Please check at least one type level."); return; }

        var smpHIdx = eSmpHMode.selection ? eSmpHMode.selection.index : SMP_LATIN;
        var smpBIdx = eSmpBMode.selection ? eSmpBMode.selection.index : SMP_LATIN;
        var cfgSmpH = resolveSampleText(smpHIdx, eSmpHCustom.text, true);
        var cfgSmpB = resolveSampleText(smpBIdx, eSmpBCustom.text, false);
        var cfgRTL  = eRTL.value;

        var cfg = {
            base: cfgBase, ratio: cfgRatio, scaleName: resolveRatioName(ePreset, eCustom),
            artW: cfgArtW, margin: cfgMargin, gap: cfgGap, lblSp: cfgLblSp,
            bgCol: cfgBgCol, layout: cfgLayout,
            bFamily: cfgBFamily, bWt: cfgBWt, bLh: cfgBLh, bLs: cfgBLs, bCol: cfgBCol,
            hFamily: cfgHFamily, hWt: cfgHWt, hLh: cfgHLh, hLs: cfgHLs, hCol: cfgHCol,
            smpH: cfgSmpH, smpB: cfgSmpB, rtl: cfgRTL,
            showBadge: dBadge.value, showPx: dPx.value, showRem: dRem.value,
            showStep: dStep.value, showHdr: dHdr.value,
            levels: cfgLevels
        };
        dlg.close();
        generate(cfg);
    };

    dlg.show();
}

// ============================================================
// SAMPLE TEXT RESOLVER
// ============================================================
function resolveSampleText(idx, customText, isHeading) {
    if (idx === SMP_LATIN)  return isHeading ? LOREM_LATIN_HEAD  : LOREM_LATIN_BODY;
    if (idx === SMP_ARABIC) return isHeading ? LOREM_ARABIC_HEAD : LOREM_ARABIC_BODY;
    if (idx === SMP_CUSTOM) {
        var ct = (customText || "").replace(/^\s+|\s+$/g, "");
        return ct || (isHeading ? LOREM_LATIN_HEAD : LOREM_LATIN_BODY);
    }
    return "";
}

// ============================================================
// GENERATE
// ============================================================
function generate(cfg) {
    var doc = app.documents.length > 0
        ? app.activeDocument
        : app.documents.add(DocumentColorSpace.RGB);

    var estH = estimateHeight(cfg);
    doc.artboards[0].artboardRect = [0, 0, cfg.artW, -estH];

    var bgRect = doc.pathItems.rectangle(0, 0, cfg.artW, estH);
    bgRect.filled = true; bgRect.stroked = false;
    setFill(bgRect, cfg.bgCol);
    bgRect.name = "_TA_bg";

    var cy = cfg.margin;
    if (cfg.showHdr) {
        cy = renderHeader(doc, cfg, cy);
        cy += cfg.gap;
        cy = renderRule(doc, cfg, cy, 0.75, [0.85, 0.85, 0.85]);
        cy += cfg.gap;
    }

    var geni;
    for (geni = 0; geni < cfg.levels.length; geni++) {
        cy = renderLevel(doc, cfg, cfg.levels[geni], cy);
        cy += cfg.gap;
    }

    if (cfg.layout === 2) {
        cy += cfg.gap;
        cy = renderRule(doc, cfg, cy, 0.75, [0.85, 0.85, 0.85]);
        cy += cfg.gap;
        cy = renderCSS(doc, cfg, cy);
    }

    var finalH = cy + cfg.margin;
    doc.artboards[0].artboardRect = [0, 0, cfg.artW, -finalH];
    bgRect.top = 0; bgRect.left = 0; bgRect.width = cfg.artW; bgRect.height = finalH;

    alert("TypeArchy " + VERSION + " - Done!\n\n" +
          "Scale: " + cfg.scaleName + "  (" + cfg.ratio.toFixed(3) + ")\n" +
          "Base: " + cfg.base + "px\n" +
          "Levels: " + cfg.levels.length + "\n" +
          "Artboard: " + Math.round(cfg.artW) + " x " + Math.round(finalH) + "px");
}

// ============================================================
// RENDER HEADER
// ============================================================
function renderHeader(doc, cfg, cy) {
    var hx = cfg.margin;
    makePointText(doc, "TYPEARCHY", 9, safeFont(cfg.hFamily, 400), [0.55,0.55,0.55], hx, cy);
    cy += 16;
    makePointText(doc, cfg.ratio.toFixed(3) + "  -  " + cfg.scaleName, 28, safeFont(cfg.hFamily, cfg.hWt), [0.08,0.08,0.08], hx, cy);
    cy += 38;
    var hnames = []; var hni;
    for (hni = 0; hni < cfg.levels.length; hni++) hnames.push(cfg.levels[hni].label);
    var hmeta = "Base: " + cfg.base + "px  |  Levels: " + hnames.join(", ") +
                "  |  Body: " + cfg.bFamily + "  |  Headings: " + cfg.hFamily;
    makeAreaText(doc, hmeta, 10, safeFont("Arial", 400), [0.5,0.5,0.5], hx, cy, cfg.artW - hx*2, 24, 14, 0);
    cy += 20;
    return cy;
}

// ============================================================
// RENDER LEVEL ROW
// ============================================================
function renderLevel(doc, cfg, lv, cy) {
    var isRTL   = cfg.rtl;
    var mg      = cfg.margin;
    var hasInfo = cfg.showBadge || cfg.showPx || cfg.showRem || cfg.showStep;
    var infoW   = hasInfo ? 130 : 0;
    var safeW   = cfg.artW - mg * 2;
    var lvTW    = safeW - infoW;
    var lvTX    = isRTL ? mg               : mg + infoW;
    var lvIX    = isRTL ? cfg.artW - mg - infoW : mg;

    var fz      = Math.max(0.5, Math.min(lv.px, 1296));
    var isH     = lv.isHeading;
    var lvOvF   = lv.ovFont;
    var lvOvW   = lv.ovWt;
    var useFam  = lvOvF || (isH ? cfg.hFamily : cfg.bFamily);
    var useWt   = lvOvW || (isH ? cfg.hWt     : cfg.bWt);
    var lvFont  = safeFont(useFam, useWt);
    var lvLH    = isH ? cfg.hLh : cfg.bLh;
    var lvLS    = isH ? cfg.hLs : cfg.bLs;
    var lvCol   = isH ? cfg.hCol : cfg.bCol;
    var rowTop  = cy;

    if (hasInfo) {
        var iy = cy;
        if (cfg.showBadge) {
            var badge = doc.pathItems.rectangle(-iy, lvIX, 36, 17);
            badge.filled = true; badge.stroked = false;
            setFill(badge, LEVEL_COLORS[lv.id] || [0.4,0.4,0.4]);
            makePointText(doc, lv.label, 9, safeFont("Arial", 700), [1,1,1], lvIX+5, iy+3);
            iy += 22;
        }
        if (cfg.showPx) {
            makePointText(doc, lv.px.toFixed(2)+"px", 10, safeFont("Courier New", 400), [0.22,0.22,0.22], lvIX, iy);
            iy += 14;
        }
        if (cfg.showRem) {
            makePointText(doc, lv.rem.toFixed(4)+"rem", 9, safeFont("Courier New", 400), [0.52,0.52,0.52], lvIX, iy);
            iy += 13;
        }
        if (cfg.showStep) {
            var stepPfx = lv.step >= 0 ? "+" : "";
            makePointText(doc, "step "+stepPfx+lv.step, 8, safeFont("Courier New", 400), [0.68,0.68,0.68], lvIX, iy);
            iy += 11;
        }
        makePointText(doc, useFam + (lvOvF ? " *" : ""), 7, safeFont("Arial", 400), [0.72,0.72,0.72], lvIX, iy);
    }

    var textY  = rowTop + cfg.lblSp;
    var smpTxt = isH ? cfg.smpH : cfg.smpB;

    if (cfg.layout === 0) {
        var barW   = Math.max(4, Math.min(lvTW, (lv.px / cfg.base) * 55));
        var barX   = isRTL ? (cfg.artW - mg - barW) : lvTX;
        var barEl  = doc.pathItems.rectangle(-(textY+6), barX, barW, 10);
        barEl.filled = true; barEl.stroked = false;
        setFill(barEl, LEVEL_COLORS[lv.id] || [0.4,0.4,0.4]);
        var barLX  = isRTL ? (barX - 50) : (barX + barW + 8);
        makePointText(doc, lv.px.toFixed(1)+"px", 9, safeFont("Arial", 400), [0.4,0.4,0.4], barLX, textY+3);
        cy = Math.max(cy, textY + 24);
    } else {
        if (!smpTxt || smpTxt === "") {
            cy = textY + fz * lvLH + cfg.lblSp;
        } else {
            var cwF      = isRTL ? 0.65 : 0.52;
            var avgCW    = fz * cwF;
            var cpl      = Math.max(1, Math.floor(lvTW / avgCW));
            var nLines   = Math.ceil(smpTxt.length / cpl) + 2;
            var sTfH     = fz * lvLH * nLines;

            makeAreaTextRTL(doc, smpTxt, fz, lvFont, lvCol,
                lvTX, textY, lvTW, sTfH, fz * lvLH, Math.round(lvLS * 1000), isRTL);

            cy = textY + sTfH + cfg.lblSp;

            if (cfg.layout === 2 && lv.id === "base" && cfg.smpB && cfg.smpB !== "") {
                var bSz   = Math.max(0.5, Math.min(cfg.base, 1296));
                var bCPL  = Math.max(1, Math.floor(lvTW / (bSz * cwF)));
                var bNL   = Math.ceil(cfg.smpB.length / bCPL) + 2;
                var bTfH  = bSz * cfg.bLh * bNL;
                makeAreaTextRTL(doc, cfg.smpB, bSz, safeFont(cfg.bFamily, cfg.bWt), cfg.bCol,
                    lvTX, cy, lvTW, bTfH, bSz * cfg.bLh, Math.round(cfg.bLs * 1000), isRTL);
                cy += bTfH + 8;
            }
        }
    }

    var sep = doc.pathItems.add();
    sep.setEntirePath([[mg, -(cy+5)], [cfg.artW-mg, -(cy+5)]]);
    sep.stroked = true; sep.filled = false; sep.strokeWidth = 0.5;
    setStroke(sep, [0.91, 0.91, 0.91]);
    cy += 10;
    return cy;
}

// ============================================================
// RENDER CSS BLOCK
// ============================================================
function renderCSS(doc, cfg, cy) {
    var cx = cfg.margin;
    makePointText(doc, "CSS CUSTOM PROPERTIES", 9, safeFont("Arial", 700), [0.4,0.4,0.4], cx, cy);
    cy += 20;

    var cssL = [];
    cssL.push(":root {");
    cssL.push("  /* TypeArchy " + VERSION + ": " + cfg.scaleName + " x" + cfg.ratio.toFixed(3) + " */");
    cssL.push("  --font-size-base:       " + cfg.base + "px;");
    cssL.push("  --scale-ratio:          " + cfg.ratio.toFixed(3) + ";");
    cssL.push("  --font-body:            '" + cfg.bFamily + "';");
    cssL.push("  --font-heading:         '" + cfg.hFamily + "';");
    cssL.push("  --line-height-body:     " + cfg.bLh + ";");
    cssL.push("  --line-height-heading:  " + cfg.hLh + ";");
    cssL.push("");
    var ci;
    for (ci = 0; ci < cfg.levels.length; ci++) {
        var clv = cfg.levels[ci];
        var css_ss = clv.step >= 0 ? "+" : "";
        cssL.push("  " + padRight("--font-size-" + clv.label.toLowerCase() + ":", 26) +
               clv.rem.toFixed(4) + "rem; /* " + clv.px.toFixed(2) + "px step " + css_ss + clv.step + " */");
    }
    cssL.push("}");

    var cssLH   = 13.5;
    var cssPad  = 20;
    var cssBoxH = cssL.length * cssLH + cssPad * 2;
    var cssTfH  = cssBoxH - cssPad;
    var cssBoxW = cfg.artW - cfg.margin * 2;

    var cssBox = doc.pathItems.rectangle(-cy, cx, cssBoxW, cssBoxH);
    cssBox.filled = true; cssBox.stroked = true; cssBox.strokeWidth = 0.5;
    setFill(cssBox,   [0.955, 0.965, 0.98]);
    setStroke(cssBox, [0.82,  0.86,  0.92]);

    makeAreaText(doc, cssL.join("\n"), 10, safeFont("Courier New", 400), [0.1, 0.3, 0.6],
        cx + 14, cy + cssPad, cssBoxW - 28, cssTfH, cssLH, 0);

    cy += cssBoxH + 16;
    return cy;
}

// ============================================================
// RENDER RULE LINE
// ============================================================
function renderRule(doc, cfg, cy, w, rgb) {
    var rln = doc.pathItems.add();
    rln.setEntirePath([[cfg.margin, -cy], [cfg.artW - cfg.margin, -cy]]);
    rln.stroked = true; rln.filled = false; rln.strokeWidth = w;
    setStroke(rln, rgb);
    return cy + 1;
}

// ============================================================
// ESTIMATE HEIGHT
// ============================================================
function estimateHeight(cfg) {
    var eh    = cfg.margin * 2;
    var safeW = cfg.artW - cfg.margin * 2;
    var infoW = (cfg.showBadge || cfg.showPx || cfg.showRem || cfg.showStep) ? 130 : 0;
    var eTW   = safeW - infoW;
    var ecw   = cfg.rtl ? 0.65 : 0.52;
    var ei;
    if (cfg.showHdr) eh += 90;
    for (ei = 0; ei < cfg.levels.length; ei++) {
        var elv   = cfg.levels[ei];
        var efz   = Math.max(0.5, Math.min(elv.px, 300));
        var eLH   = elv.isHeading ? cfg.hLh : cfg.bLh;
        var etxt  = elv.isHeading ? cfg.smpH : cfg.smpB;
        var eLns  = 2;
        if (etxt && etxt.length > 0) {
            var ecpl = Math.max(1, Math.floor(eTW / (efz * ecw)));
            eLns = Math.ceil(etxt.length / ecpl) + 2;
        }
        eh += efz * eLH * eLns + cfg.lblSp * 2 + 20 + cfg.gap;
    }
    if (cfg.layout === 2) eh += 350;
    return eh + 120;
}

// ============================================================
// UTILITIES
// ============================================================
function resolveRatio(ePreset, eCustom) {
    var rcv = (eCustom.text || "").replace(/\s/g, "");
    if (rcv !== "") {
        var rrv = parseFloat(rcv);
        if (isNaN(rrv) || rrv <= 1) { alert("Custom Ratio must be greater than 1  (e.g. 1.333)."); return null; }
        return rrv;
    }
    var ridx = ePreset.selection ? ePreset.selection.index : 4;
    return PRESETS[ridx].ratio;
}

function resolveRatioName(ePreset, eCustom) {
    var ncv = (eCustom.text || "").replace(/\s/g, "");
    if (ncv !== "") return "Custom (" + ncv + ")";
    var nidx = ePreset.selection ? ePreset.selection.index : 4;
    return PRESETS[nidx].name;
}

function presetLabels() {
    var out = []; var pi;
    for (pi = 0; pi < PRESETS.length; pi++) {
        out.push(PRESETS[pi].ratio.toFixed(3) + " - " + PRESETS[pi].name);
    }
    return out;
}

function padRight(s, n) { while (s.length < n) s += " "; return s; }

// ============================================================
// ENTRY
// ============================================================
try {
    showUI();
} catch(mainErr) {
    alert("TypeArchy " + VERSION + "\n\nError: " + mainErr.message +
          "\nLine: " + mainErr.line +
          "\n\nPlease report at github.com/tariqdesign/TypeArchy");
}
