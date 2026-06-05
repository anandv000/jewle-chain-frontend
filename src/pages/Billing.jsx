import React, { useState, useEffect } from "react";
import { theme } from "../theme";
import { invoiceAPI, customerAPI, orderAPI } from "../services/api";
import Icon from "../components/Icon";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt    = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const fmtPDF = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "";
const n2     = (v) => (parseFloat(v) || 0).toFixed(2);
const n3     = (v) => (parseFloat(v) || 0).toFixed(3);
const n4     = (v) => (parseFloat(v) || 0).toFixed(4);

const KARAT_OPTIONS = [
  { label:"24K (99.9%)",  value:"24",   pct:99.9 },
  { label:"22K (91.6%)",  value:"22",   pct:91.6 },
  { label:"18K (75.0%)",  value:"18",   pct:75.0 },
  { label:"14K (58.3%)",  value:"14",   pct:58.3 },
  { label:"S999 (99.9%)", value:"S999", pct:99.9 },
  { label:"S925 (92.5%)", value:"S925", pct:92.5 },
  { label:"S800 (80.0%)", value:"S800", pct:80.0 },
];
const karatPct = (k) => (KARAT_OPTIONS.find(o=>o.value===k)?.pct || 0);

const STATUS_COLORS = {
  draft: "#8A7A5A", sent: "#4F8EF7", paid: "#4CC97A",
};

// ── Empty item template ───────────────────────────────────────────────────────
// ── Empty item template — orderId must be null not "" to avoid ObjectId cast ──
const emptyItem = () => ({
  orderId:null, bagId:"", design:"", category:"", image:"", qty:1,
  karat:"18", finePercent:75, grossWt:0,
  diamondWt:0, stoneWt:0, meenaWt:0,   // non-gold weights subtracted to get Net
  netWt:0,
  fineBasis:"net", fineWt:0,
  metalBasis:"net", metalRate:0, metalAmt:0,
  labourBasis:"net", labourRate:0, labourAmt:0,
  diamonds:[], stones:[], otherDescr:"", otherAmt:0, lineTotal:0,
});

// Net weight = Gross − non-gold parts (pure metal only).
// Diamonds & stones are in carats (1 g = 5 ct → grams = ct ÷ 5); meena/Bhina in grams.
const computeNetWt = (it) => {
  const gross = parseFloat(it.grossWt)   || 0;
  const dCt   = parseFloat(it.diamondWt) || 0;
  const sCt   = parseFloat(it.stoneWt)   || 0;
  const mG    = parseFloat(it.meenaWt)   || 0;
  return parseFloat(Math.max(0, gross - dCt / 5 - sCt / 5 - mG).toFixed(3));
};
// Pick the weight a basis ("gross" | "net" | "fine") refers to.
const wtForBasis = (it, basis) =>
  basis === "gross" ? (it.grossWt || 0)
  : basis === "fine" ? (it.fineWt || 0)
  : (it.netWt || 0);
// Line total from current amounts.
const lineTotalOf = (it) => {
  const dAmt = (it.diamonds||[]).reduce((s,d)=>s+(d.amt||0),0);
  const sAmt = (it.stones||[]).reduce((s,st)=>s+(st.amt||0),0);
  return parseFloat(((it.metalAmt||0)+(it.labourAmt||0)+dAmt+sAmt+(it.otherAmt||0)).toFixed(2));
};

// ── Compute derived fields for an item ───────────────────────────────────────
// Recomputes only the purely-derived fields (fineWt, lineTotal). metalAmt and
// labourAmt are kept as-is so manual overrides survive — they are recalculated
// in ItemEditor.updateField when their own inputs change.
const enrichItem = (it) => {
  const fp     = it.finePercent || karatPct(it.karat) || 0;
  const fineWt = parseFloat((wtForBasis(it, it.fineBasis || "net") * fp / 100).toFixed(3));
  return { ...it, finePercent:fp, fineWt, lineTotal:lineTotalOf(it) };
};

// ─────────────────────────────────────────────────────────────────────────────
//  PDF GENERATION — matches J.BHAGVAN JEWELS invoice format exactly
// ─────────────────────────────────────────────────────────────────────────────
const openInvoicePDF = (inv) => {
  const typeLabel = { estimate:"Estimate Invoice", tax:"Tax Invoice", proforma:"Proforma Invoice" }[inv.invoiceType] || "Invoice";
  // Logo served from the app's own domain (public/laher-logo.png). Absolute URL so it
  // loads inside the printed blob document. Hidden gracefully if the file is missing.
  const logoUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/laher-logo.jpeg";
  const B  = "border:1px solid #000;";
  const TD = `${B}padding:3px 5px;font-size:8px;`;
  const TH = `${B}padding:3px 4px;font-size:8px;font-weight:bold;background:#f0f0f0;text-align:center;`;

  // Build item rows
  const itemRows = (inv.items || []).map((it, i) => {
    const diaCell = it.diamonds?.length
      ? it.diamonds.map(d=>`${d.shape}${d.size?" "+d.size:""}`).join(", ")
      : "";
    const diaPcs  = it.diamonds?.reduce((s,d)=>s+(d.pcs||0),0) || "";
    const diaWt   = it.diamonds?.reduce((s,d)=>s+(d.wt||0),0)  || "";
    const diaAmt  = it.diamonds?.reduce((s,d)=>s+(d.amt||0),0) || "";
    const stoneName  = it.stones?.length ? it.stones.map(s=>s.shape).join(", ") : "";
    const stonePcs   = it.stones?.reduce((s,st)=>s+(st.pcs||0),0) || "";
    const stoneWt    = it.stones?.reduce((s,st)=>s+(st.wt||0),0)  || "";
    const stoneAmt   = it.stones?.reduce((s,st)=>s+(st.amt||0),0) || "";

    return `
<tr>
  <td style="${TD}text-align:center;">${i+1}</td>
  <td style="${TD}">
    <div style="display:flex;align-items:center;gap:5px;">
      ${it.image ? `<img src="${it.image}" style="width:34px;height:34px;object-fit:contain;border:1px solid #ccc;flex-shrink:0;background:#fafafa;" onerror="this.style.display='none'"/>` : ""}
      <div>
        <div style="font-weight:bold;font-size:8px;">${it.bagId||"—"}</div>
        <div style="font-size:7px;color:#555;">${it.design||""}</div>
        <div style="font-size:7px;color:#555;">${it.category||""}</div>
      </div>
    </div>
  </td>
  <td style="${TD}text-align:center;">${it.qty||1}</td>
  <td style="${TD}text-align:center;">${it.karat||""}</td>
  <td style="${TD}text-align:right;">${n3(it.grossWt)}</td>
  <td style="${TD}text-align:right;">${n3(it.netWt)}</td>
  <td style="${TD}text-align:right;">${n3(it.fineWt)}</td>
  <td style="${TD}text-align:right;">${it.metalRate||""}</td>
  <td style="${TD}text-align:right;">${it.metalAmt||""}</td>
  <td style="${TD}text-align:right;">${it.labourRate||""}</td>
  <td style="${TD}text-align:right;">${it.labourAmt||""}</td>
  <td style="${TD}">${diaCell}</td>
  <td style="${TD}text-align:center;">${diaPcs}</td>
  <td style="${TD}text-align:right;">${diaWt||""}</td>
  <td style="${TD}text-align:right;">${diaAmt||""}</td>
  <td style="${TD}">${stoneName}</td>
  <td style="${TD}text-align:center;">${stonePcs}</td>
  <td style="${TD}text-align:right;">${stoneWt||""}</td>
  <td style="${TD}text-align:right;">${stoneAmt||""}</td>
  <td style="${TD}">${it.otherDescr||""}</td>
  <td style="${TD}text-align:right;">${it.otherAmt||""}</td>
  <td style="${TD}text-align:right;font-weight:bold;">${n2(it.lineTotal)}</td>
</tr>`;
  }).join("");

  // Summary row
  const sumRow = `
<tr style="font-weight:bold;background:#f7f7f7;">
  <td style="${TD}" colspan="4"></td>
  <td style="${TD}text-align:right;">${n3(inv.totalGrossWt)}</td>
  <td style="${TD}text-align:right;">${n3(inv.totalNetWt)}</td>
  <td style="${TD}text-align:right;">${n3(inv.totalFineWt)}</td>
  <td style="${TD}"></td>
  <td style="${TD}text-align:right;">${n2(inv.totalMetalAmt)}</td>
  <td style="${TD}"></td>
  <td style="${TD}text-align:right;">${n2(inv.totalLabourAmt)}</td>
  <td style="${TD}" colspan="3"></td>
  <td style="${TD}text-align:right;">${n2(inv.totalDiamondAmt)}</td>
  <td style="${TD}" colspan="3"></td>
  <td style="${TD}text-align:right;">${n2(inv.totalStoneAmt)}</td>
  <td style="${TD}"></td>
  <td style="${TD}text-align:right;">${n2(inv.totalOtherAmt)}</td>
  <td style="${TD}text-align:right;">${n2(inv.grandTotal)}</td>
</tr>`;

  const extra = inv.otherCharges || {};
  const extraTotal = (extra.hallMarking||0)+(extra.certy||0)+(extra.shipping||0)+(extra.addLess||0);

  // Category summary
  const catMap = {};
  (inv.items||[]).forEach(it => {
    const cat = it.category || "Other";
    catMap[cat] = (catMap[cat]||0) + (it.qty||1);
  });
  const catRows = Object.entries(catMap).map(([g,q])=>
    `<tr><td style="${TD}">${g}</td><td style="${TD}text-align:center;">${q}</td></tr>`
  ).join("");
  const catTotal = Object.values(catMap).reduce((s,v)=>s+v,0);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Invoice ${inv.invoiceNo}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#000;background:#fff;padding:12px;}
  .page{max-width:1050px;margin:0 auto;}
  @media print{body{padding:0;}@page{margin:8mm;size:A4 landscape;}}
</style>
</head><body><div class="page">

<!-- ═══ HEADER ═══════════════════════════════════════════════════════════════ -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;border-bottom:2px solid #000;padding-bottom:8px;">
  <div>
    <div style="font-size:11px;font-weight:bold;">${inv.customerName||"—"}</div>
    <div style="font-size:9px;color:#555;margin-top:3px;">DATE : ${fmtPDF(inv.date)}</div>
  </div>
  <div style="text-align:center;flex:1;padding:0 20px;">
    <img src="${logoUrl}" alt="Laher Jewels" style="height:54px;object-fit:contain;display:block;margin:0 auto 3px;" onerror="this.style.display='none'"/>
    <div style="font-size:16px;font-weight:bold;letter-spacing:1px;">LAHER JEWELS</div>
    <div style="font-size:11px;margin-top:3px;">${typeLabel}</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:9px;">BILL NO : <strong>${inv.invoiceNo||"—"}</strong></div>
    <div style="font-size:9px;margin-top:3px;">DATE : ${fmtPDF(inv.date)}</div>
  </div>
</div>

<!-- ═══ MAIN TABLE ═══════════════════════════════════════════════════════════ -->
<table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
  <thead>
    <!-- Row 1: Group headers -->
    <tr style="background:#e0e0e0;">
      <th style="${TH}" rowspan="2">Sr.</th>
      <th style="${TH}" rowspan="2">Item / Design</th>
      <th style="${TH}" rowspan="2">Qty</th>
      <th style="${TH}" colspan="7">Metal</th>
      <th style="${TH}" colspan="2">Labour</th>
      <th style="${TH}" colspan="4">Diamond</th>
      <th style="${TH}" colspan="4">Stone</th>
      <th style="${TH}" colspan="2">Other</th>
      <th style="${TH}" rowspan="2">AMT</th>
    </tr>
    <!-- Row 2: Sub-headers -->
    <tr style="background:#ebebeb;">
      <th style="${TH}">KT</th>
      <th style="${TH}">G.wt</th>
      <th style="${TH}">N.wt</th>
      <th style="${TH}">Fine</th>
      <th style="${TH}">Rate</th>
      <th style="${TH}" colspan="2">Amt</th>
      <th style="${TH}">Rate</th>
      <th style="${TH}">Amt</th>
      <th style="${TH}">Shape</th>
      <th style="${TH}">Pcs</th>
      <th style="${TH}">Wt</th>
      <th style="${TH}">Amt</th>
      <th style="${TH}">Shape</th>
      <th style="${TH}">Pcs</th>
      <th style="${TH}">Wt</th>
      <th style="${TH}">Amt</th>
      <th style="${TH}">Descr</th>
      <th style="${TH}">Amt</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<!-- ═══ SUMMARY TABLE ════════════════════════════════════════════════════════ -->
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
  <thead>
    <tr style="background:#e0e0e0;">
      <th style="${TH}" rowspan="2">Sr.</th>
      <th style="${TH}" rowspan="2">Item / Design</th>
      <th style="${TH}" rowspan="2">Qty</th>
      <th style="${TH}" colspan="5">Metal</th>
      <th style="${TH}">Labour</th>
      <th style="${TH}" colspan="3">Diamond</th>
      <th style="${TH}" colspan="3">Stone</th>
      <th style="${TH}">Other</th>
      <th style="${TH}">AMT</th>
    </tr>
    <tr style="background:#ebebeb;">
      <th style="${TH}">KT</th><th style="${TH}">G.wt</th><th style="${TH}">N.wt</th>
      <th style="${TH}">Fine</th><th style="${TH}">Amount</th>
      <th style="${TH}">Amount</th>
      <th style="${TH}">Shape</th><th style="${TH}">Pcs</th><th style="${TH}">Wt</th>
      <th style="${TH}">Amount</th>
      <th style="${TH}">Shape</th><th style="${TH}">Pcs</th><th style="${TH}">Wt</th>
      <th style="${TH}">Amount</th>
      <th style="${TH}">Amount</th>
    </tr>
  </thead>
  <tbody>${sumRow}</tbody>
</table>

<!-- ═══ BOTTOM 3 PANELS ══════════════════════════════════════════════════════ -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px;">

  <!-- Invoice Summary -->
  <div style="border:1px solid #000;padding:0;">
    <div style="background:#d8d8d8;font-weight:bold;padding:4px 8px;font-size:8.5px;border-bottom:1px solid #000;">Invoice Summary</div>
    <table style="width:100%;border-collapse:collapse;">
      ${[
        ["Gross Wt", n3(inv.totalGrossWt)+" gms", "Metal"],
        ["Net Wt",   n3(inv.totalNetWt)+" gms",   "Diamond"],
        ["Fine Wt",  n3(inv.totalFineWt)+" gms",  "Stone"],
        ["Diamond Wt", `${inv.totalDiamondPcs||0} / ${n4(inv.totalDiamondWt)}`, "Making"],
        ["Stone Wt",   `${inv.totalStonePcs||0} / ${n4(inv.totalStoneWt)}`,     "Other"],
      ].map(([l,v,cat])=>`
        <tr>
          <td style="padding:3px 8px;font-weight:bold;font-size:8px;border-bottom:1px solid #eee;width:45%;">${l}</td>
          <td style="padding:3px 8px;font-size:8px;border-bottom:1px solid #eee;">${v}</td>
          <td style="padding:3px 8px;font-weight:bold;font-size:8px;border-bottom:1px solid #eee;">${cat}</td>
        </tr>`).join("")}
      <tr>
        <td style="padding:3px 8px;font-size:8px;" colspan="2"></td>
        <td style="padding:3px 8px;font-size:8px;font-weight:bold;text-align:right;">${n2(inv.making||inv.totalLabourAmt)}</td>
      </tr>
      <tr style="background:#f5f5f5;">
        <td style="padding:4px 8px;font-weight:bold;font-size:8.5px;" colspan="2">TOTAL</td>
        <td style="padding:4px 8px;font-weight:bold;font-size:9px;text-align:right;">${n2(inv.grandTotal)}</td>
      </tr>
    </table>
  </div>

  <!-- Balance Summary -->
  <div style="border:1px solid #000;padding:0;">
    <div style="background:#d8d8d8;font-weight:bold;padding:4px 8px;font-size:8.5px;border-bottom:1px solid #000;display:grid;grid-template-columns:1fr 1fr 1fr;">
      <span>Balance Summary</span><span style="text-align:center;">Credit</span><span style="text-align:center;">Debit</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:3px 8px;font-weight:bold;font-size:8px;border-bottom:1px solid #eee;width:45%;">Amount</td>
        <td style="padding:3px 8px;font-size:8px;border-bottom:1px solid #eee;text-align:right;">${inv.creditAmount||""}</td>
        <td style="padding:3px 8px;font-size:8px;border-bottom:1px solid #eee;text-align:right;">${inv.debitAmount||n2(inv.grandTotal)}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px;font-weight:bold;font-size:8px;border-bottom:1px solid #eee;">Metal</td>
        <td style="padding:3px 8px;font-size:8px;border-bottom:1px solid #eee;" colspan="2">${n3(inv.metalBalance||inv.totalNetWt)}</td>
      </tr>
      <tr>
        <td style="padding:3px 8px;font-weight:bold;font-size:8px;">CDMD Wt</td>
        <td style="padding:3px 8px;font-size:8px;" colspan="2">${n4(inv.cdmdWt||0)}</td>
      </tr>
    </table>
  </div>

  <!-- Category Wise Summary -->
  <div style="border:1px solid #000;padding:0;">
    <div style="background:#d8d8d8;font-weight:bold;padding:4px 8px;font-size:8.5px;border-bottom:1px solid #000;display:grid;grid-template-columns:1fr auto;">
      <span>Category Wise Summary</span><span>Qty</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#ebebeb;">
        <th style="${TH}text-align:left;">Group</th>
        <th style="${TH}">Qty</th>
      </tr>
      ${catRows}
      <tr style="font-weight:bold;background:#f5f5f5;">
        <td style="padding:3px 8px;font-size:8px;border-top:1px solid #000;">Total</td>
        <td style="padding:3px 8px;font-size:8px;border-top:1px solid #000;text-align:center;">${catTotal}</td>
      </tr>
    </table>
  </div>
</div>

<!-- ═══ REMARKS + OTHER CHARGES ══════════════════════════════════════════════ -->
<div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-top:10px;border-top:1px solid #ccc;padding-top:8px;">
  <div>
    ${inv.remarks ? `<div style="font-weight:bold;font-size:8.5px;margin-bottom:4px;">Remark :</div><div style="font-size:8px;color:#444;">${inv.remarks}</div>` : ""}
  </div>
  <div style="border:1px solid #000;min-width:200px;">
    <div style="background:#d8d8d8;font-weight:bold;padding:4px 8px;font-size:8.5px;border-bottom:1px solid #000;">Other Charges</div>
    <table style="width:100%;border-collapse:collapse;">
      ${extra.hallMarking ? `<tr><td style="${TD}font-weight:bold;">Hall Marking</td><td style="${TD}text-align:right;">${n2(extra.hallMarking)}</td></tr>` : ""}
      ${extra.certy       ? `<tr><td style="${TD}font-weight:bold;">Certy</td><td style="${TD}text-align:right;">${n2(extra.certy)}</td></tr>` : ""}
      ${extra.shipping    ? `<tr><td style="${TD}font-weight:bold;">Shipping</td><td style="${TD}text-align:right;">${n2(extra.shipping)}</td></tr>` : ""}
      ${extra.addLess     ? `<tr><td style="${TD}font-weight:bold;">Add/Less</td><td style="${TD}text-align:right;">${n2(extra.addLess)}</td></tr>` : ""}
      <tr style="background:#f5f5f5;">
        <td style="${TD}font-weight:bold;">TOTAL</td>
        <td style="${TD}text-align:right;font-weight:bold;">${n2(inv.grandTotal)}</td>
      </tr>
    </table>
  </div>
</div>

<div style="text-align:center;margin-top:16px;padding-top:8px;border-top:1px solid #ccc;font-size:7.5px;color:#888;">
  ** This is computer generated invoice and it does not required signature &nbsp;&nbsp;&nbsp; Page 1 of 1
</div>

</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`;

  const blob = new Blob([html], { type:"text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) alert("Allow popups to print invoice");
  setTimeout(() => URL.revokeObjectURL(url), 90000);
};

// ─────────────────────────────────────────────────────────────────────────────
//  ITEM EDITOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ItemEditor = ({ item, idx, onChange, onRemove, orders, customers = [], selectedCustomer = null }) => {
  // Generic field update. Recomputes derived fields only when their own inputs change,
  // so manually-edited metalAmt / labourAmt survive edits to unrelated fields.
  const updateField = (k, v) => {
    let u = { ...item, [k]: v };
    if (k === "karat") u.finePercent = karatPct(v);

    // Net Wt re-derives whenever gross or any non-gold deduction changes.
    const weightsChanged = ["grossWt", "diamondWt", "stoneWt", "meenaWt"].includes(k);
    if (weightsChanged) u.netWt = computeNetWt(u);
    // Purity/basis edits change Fine Wt, which a "fine"-based metal/labour rate uses.
    const fineAffects = (k === "karat" || k === "finePercent" || k === "fineBasis");
    if (weightsChanged || k === "karat" || k === "finePercent" || k === "fineBasis") {
      const fp = u.finePercent || karatPct(u.karat) || 0;
      u.fineWt = parseFloat((wtForBasis(u, u.fineBasis || "net") * fp / 100).toFixed(3));
    }
    if (weightsChanged || k === "metalRate" || k === "metalBasis" || (fineAffects && u.metalBasis === "fine")) {
      u.metalAmt = parseFloat((wtForBasis(u, u.metalBasis || "net") * (u.metalRate || 0)).toFixed(2));
    }
    if (weightsChanged || k === "labourRate" || k === "labourBasis" || (fineAffects && u.labourBasis === "fine")) {
      u.labourAmt = parseFloat((wtForBasis(u, u.labourBasis || "net") * (u.labourRate || 0)).toFixed(2));
    }
    u.lineTotal = lineTotalOf(u);
    onChange(idx, u);
  };

  // Bag ID → look up the matching order → its customer → auto-fill labour rate.
  // Falls back to the invoice's selected customer (metal inferred from karat) when
  // the bag ID doesn't match a known order.
  const onBagIdChange = (v) => {
    let u = { ...item, bagId: v };
    const ord = String(v).trim()
      ? (orders || []).find(o => String(o.bagId || "").trim() === String(v).trim())
      : null;
    let cust = null, metal = null;
    if (ord) {
      const custId = ord.customer?._id || ord.customer;
      cust  = customers.find(x => String(x._id) === String(custId)) || null;
      metal = ord.metalType || null;
    }
    if (!cust) cust = selectedCustomer;
    if (!metal) metal = String(u.karat || "").startsWith("S") ? "silver" : "gold";
    if (cust && String(v).trim()) {
      u.labourRate = (metal === "silver") ? (cust.labourRateSilver || 0) : (cust.labourRateGold || 0);
      u.labourAmt  = parseFloat((wtForBasis(u, u.labourBasis || "net") * (u.labourRate || 0)).toFixed(2));
    }
    u.lineTotal = lineTotalOf(u);
    onChange(idx, u);
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"6px 9px", borderRadius:7, fontFamily:"'DM Sans'", fontSize:12, outline:"none", width:"100%" };
  const numInp = { ...inp, textAlign:"right" };
  const roInp  = { ...numInp, opacity:0.7 };  // read-only / computed look
  const LBL = ({ children }) => <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:4 }}>{children}</div>;
  const BasisSelect = ({ value, onChange, includeFine }) => (
    <select style={inp} value={value||"net"} onChange={e=>onChange(e.target.value)}>
      <option value="net">Net Wt</option>
      <option value="gross">Gross Wt</option>
      {includeFine && <option value="fine">Fine Wt</option>}
    </select>
  );

  return (
    <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18, marginBottom:14, position:"relative" }}>
      {/* Remove button */}
      <button onClick={()=>onRemove(idx)} style={{ position:"absolute", top:12, right:12, background:`${theme.danger}15`, border:`1px solid ${theme.danger}40`, color:theme.danger, borderRadius:7, padding:"3px 10px", fontSize:12, cursor:"pointer" }}>✕ Remove</button>

      <div style={{ fontSize:13, color:theme.gold, fontWeight:600, marginBottom:14 }}>Item {idx+1}</div>

      {/* Row 1: Order link + basic info */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 0.5fr", gap:10, marginBottom:12 }}>
        <div>
          <LBL>Bag ID</LBL>
          <input style={inp} value={item.bagId||""} onChange={e=>onBagIdChange(e.target.value)} placeholder="e.g. 202630"/>
        </div>
        <div>
          <LBL>Design No</LBL>
          <input style={inp} value={item.design||""} onChange={e=>updateField("design",e.target.value)} placeholder="e.g. LLR0147"/>
        </div>
        <div>
          <LBL>Category</LBL>
          <input style={inp} value={item.category||""} onChange={e=>updateField("category",e.target.value)} placeholder="RING"/>
        </div>
        <div>
          <LBL>Karat / Metal</LBL>
          <select style={inp} value={item.karat||"18"} onChange={e=>updateField("karat",e.target.value)}>
            {KARAT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <LBL>Qty</LBL>
          <input style={numInp} type="number" min="1" value={item.qty||1} onChange={e=>updateField("qty",parseInt(e.target.value)||1)}/>
        </div>
      </div>

      {/* Row 2a: Gross + non-gold deductions (Diamond / Stone in ct, Meena in g) */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <LBL>Gross Wt (g)</LBL>
          <input style={numInp} type="number" step="0.001" value={item.grossWt||""} onChange={e=>updateField("grossWt",parseFloat(e.target.value)||0)} placeholder="0.000"/>
        </div>
        <div>
          <LBL>Diamond Wt (ct)</LBL>
          <input style={numInp} type="number" step="0.0001" value={item.diamondWt||""} onChange={e=>updateField("diamondWt",parseFloat(e.target.value)||0)} placeholder="0.0000" title="From D-Center — subtracted as ct÷5 grams"/>
        </div>
        <div>
          <LBL>Stone Wt (ct)</LBL>
          <input style={numInp} type="number" step="0.0001" value={item.stoneWt||""} onChange={e=>updateField("stoneWt",parseFloat(e.target.value)||0)} placeholder="0.0000" title="Colored stones — subtracted as ct÷5 grams"/>
        </div>
        <div>
          <LBL>Meena/Bhina Wt (g)</LBL>
          <input style={numInp} type="number" step="0.001" value={item.meenaWt||""} onChange={e=>updateField("meenaWt",parseFloat(e.target.value)||0)} placeholder="0.000" title="Enamel / Bhina — subtracted in grams"/>
        </div>
      </div>

      {/* Row 2b: Net & Fine (auto) */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <LBL>Net Wt (g)</LBL>
          <input style={roInp} type="number" value={item.netWt||""} readOnly placeholder="0.000" title="Gross − Diamond ct/5 − Stone ct/5 − Meena g"/>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:7 }}>
          <span style={{ fontSize:10, color:theme.textMuted, lineHeight:1.4 }}>
            = Gross − (Dia+Stone)ct÷5 − Meena
          </span>
        </div>
        <div>
          <LBL>Fine Wt From</LBL>
          <BasisSelect value={item.fineBasis} onChange={v=>updateField("fineBasis",v)}/>
        </div>
        <div>
          <LBL>Fine Wt (g)</LBL>
          <input style={roInp} type="number" value={item.fineWt||""} readOnly placeholder="0.000" title="Net × purity%"/>
        </div>
      </div>

      {/* Row 3: Metal */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <LBL>Metal Rate × </LBL>
          <BasisSelect value={item.metalBasis} onChange={v=>updateField("metalBasis",v)} includeFine/>
        </div>
        <div>
          <LBL>Metal Rate</LBL>
          <input style={numInp} type="number" step="0.01" value={item.metalRate||""} onChange={e=>updateField("metalRate",parseFloat(e.target.value)||0)} placeholder="0.000"/>
        </div>
        <div>
          <LBL>Metal Amt</LBL>
          <input style={roInp} type="number" value={item.metalAmt||""} readOnly placeholder="0.00"/>
        </div>
      </div>

      {/* Row 4: Labour & Other */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr", gap:10, marginBottom:4 }}>
        <div>
          <LBL>Labour Rate × </LBL>
          <BasisSelect value={item.labourBasis} onChange={v=>updateField("labourBasis",v)} includeFine/>
        </div>
        <div><LBL>Labour Rate</LBL><input style={numInp} type="number" value={item.labourRate||""} onChange={e=>updateField("labourRate",parseFloat(e.target.value)||0)} placeholder="0"/></div>
        <div><LBL>Labour Amt</LBL><input style={numInp} type="number" value={item.labourAmt||""} onChange={e=>updateField("labourAmt",parseFloat(e.target.value)||0)} placeholder="0"/></div>
        <div><LBL>Other Amt</LBL><input style={numInp} type="number" value={item.otherAmt||""} onChange={e=>updateField("otherAmt",parseFloat(e.target.value)||0)} placeholder="0"/></div>
        <div><LBL>Other Description</LBL><input style={inp} value={item.otherDescr||""} onChange={e=>updateField("otherDescr",e.target.value)} placeholder="H.M, Certy..."/></div>
      </div>

      {/* Line total */}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:12, alignItems:"center", borderTop:`1px solid ${theme.borderGold}`, paddingTop:10 }}>
        <span style={{ fontSize:12, color:theme.textMuted }}>Line Total:</span>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:theme.gold }}>{n2(item.lineTotal)}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  INVOICE FORM (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
const InvoiceForm = ({ customers, orders, existing, onSave, onCancel }) => {
  const [invoiceType, setInvoiceType] = useState(existing?.invoiceType || "estimate");
  const [date,        setDate]        = useState(existing?.date ? new Date(existing.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
  const [customerId,  setCustomerId]  = useState(existing?.customer?._id || existing?.customer || "");
  const [items,       setItems]       = useState(existing?.items?.length ? existing.items : [emptyItem()]);
  const [remarks,     setRemarks]     = useState(existing?.remarks || "");
  const [otherCharges,setOtherCharges]= useState(existing?.otherCharges || { hallMarking:0, certy:0, shipping:0, addLess:0 });
  const [creditAmt,   setCreditAmt]   = useState(existing?.creditAmount || 0);
  const [debitAmt,    setDebitAmt]    = useState(existing?.debitAmount  || 0);
  const [metalBal,    setMetalBal]    = useState(existing?.metalBalance || 0);
  const [cdmdWt,      setCdmdWt]      = useState(existing?.cdmdWt       || 0);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [importOpen,  setImportOpen]  = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [autoFilling, setAutoFilling] = useState(false);

  const cust = customers.find(c=>c._id===customerId);

  // ── Auto-fill items when customer is selected ─────────────────────────────
  // Maps all completed orders for that customer into invoice line items
  useEffect(() => {
    if (!customerId || existing) return; // skip on edit mode

    const custOrders = orders.filter(o => {
      const oCustomer = o.customer?._id || o.customer;
      return String(oCustomer) === String(customerId) && o.status === "Completed";
    });

    if (!custOrders.length) {
      setItems([emptyItem()]);
      return;
    }

    setAutoFilling(true);

    const autoItems = custOrders.flatMap(o => {
      // Gross Wt = weight remaining after the final step (Packaging) — the finished
      // piece weight, not the raw casting weight. Falls back to casting if uncast.
      const finalWt = o.gramHistory?.length
        ? parseFloat(o.gramHistory[o.gramHistory.length - 1])
        : (o.castingGold || o.castingSilver || 0);
      const grossWt = finalWt;
      // Diamond weight (ct) for the Net deduction = what was issued at D-Center.
      const diamondWt = parseFloat(
        (o.issuedDiamonds || []).reduce((s, d) => s + (d.karats || 0), 0).toFixed(4)
      );
      const stoneWt = 0;
      const meenaWt = 0;
      const netWt   = parseFloat(Math.max(0, grossWt - diamondWt / 5 - stoneWt / 5 - meenaWt).toFixed(3));
      const karat   = (o.metalType === "silver") ? "S925" : "18";
      const fp      = karatPct(karat);
      const fineWt  = parseFloat((netWt * fp / 100).toFixed(3));

      const diamonds = (o.diamondShapes || []).map(d => ({
        shape: d.shapeName || "",
        size:  d.sizeInMM  || "",
        pcs:   d.pcs       || 1,
        wt:    parseFloat(d.weight || 0),
        rate:  0,
        amt:   0,
      }));

      const labourAmt = parseFloat(o.labourTotal || 0);
      const dAmt      = diamonds.reduce((s,d)=>s+(d.amt||0),0);
      const lineTotal = parseFloat((labourAmt + dAmt).toFixed(2));

      const mainItem = {
        orderId:     o._id || null,
        bagId:       o.bagId       || "",
        design:      o.itemNumber  || o.item || "",
        category:    o.folder      || "",
        image:       o.itemImage   || "",
        qty:         1,
        karat,
        finePercent: fp,
        grossWt,
        diamondWt, stoneWt, meenaWt,
        netWt,
        fineBasis:   "net",
        fineWt,
        metalBasis:  "net",
        metalRate:   0,
        metalAmt:    0,
        labourBasis: "net",
        labourRate:  0,
        labourAmt,
        diamonds,
        stones:      [],
        otherDescr:  "",
        otherAmt:    0,
        lineTotal,
      };

      // Findings → one separate line each (gold weight, billed apart from the piece).
      const findingItems = (o.findings || []).map(f => {
        const fGross = parseFloat(f.weight || 0);
        const fFine  = parseFloat((fGross * fp / 100).toFixed(3));
        return {
          orderId: o._id || null, bagId: o.bagId || "",
          design: f.name || "Finding", category: "FINDING", qty: f.pcs || 1,
          karat, finePercent: fp,
          grossWt: fGross, diamondWt: 0, stoneWt: 0, meenaWt: 0, netWt: fGross,
          fineBasis: "net", fineWt: fFine,
          metalBasis: "net", metalRate: 0, metalAmt: 0,
          labourBasis: "net", labourRate: 0, labourAmt: 0,
          diamonds: [], stones: [], otherDescr: "", otherAmt: 0, lineTotal: 0,
        };
      });

      return [mainItem, ...findingItems];
    });

    setItems(autoItems);
    setAutoFilling(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const totalGrandTotal = items.reduce((s,it)=>s+(it.lineTotal||0),0)
    + (otherCharges.hallMarking||0) + (otherCharges.certy||0)
    + (otherCharges.shipping||0) + (otherCharges.addLess||0);

  const handleItemChange = (idx, updated) => setItems(prev => prev.map((it,i)=>i===idx?updated:it));
  const handleItemRemove = (idx) => setItems(prev => prev.filter((_,i)=>i!==idx));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  // Import from orders
  const importFromOrders = async () => {
    if (!selectedOrders.length) return;
    try {
      const res = await invoiceAPI.previewFromOrders({ orderIds: selectedOrders });
      setItems(prev => [...prev.filter(it=>it.bagId||it.design), ...res.data.data]);
      setImportOpen(false); setSelectedOrders([]);
    } catch {}
  };

  const handleSave = async () => {
    if (!customerId) { setError("Please select a customer."); return; }
    if (!items.length) { setError("Add at least one item."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        invoiceType, date, customer: customerId,
        customerName: cust ? `${cust.name}${cust.company?" — "+cust.company:""}` : "",
        items, remarks, otherCharges,
        creditAmount: parseFloat(creditAmt)||0,
        debitAmount:  parseFloat(debitAmt)||0,
        metalBalance: parseFloat(metalBal)||0,
        cdmdWt:       parseFloat(cdmdWt)||0,
      };
      if (existing) await invoiceAPI.update(existing._id, payload);
      else          await invoiceAPI.create(payload);
      onSave();
    } catch (err) { setError(err.response?.data?.error || "Save failed."); }
    finally { setSaving(false); }
  };

  const inp = { background:theme.bg, border:`1px solid ${theme.borderGold}`, color:theme.text, padding:"8px 12px", borderRadius:8, fontFamily:"'DM Sans'", fontSize:13, outline:"none", width:"100%" };
  const LBL = ({ children }) => <div style={{ fontSize:11, color:theme.textMuted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>{children}</div>;

  const customerOrders = customerId ? orders.filter(o=>o.customer===customerId||o.customer?._id===customerId) : orders;

  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div className="section-title">{existing ? "Edit Invoice" : "New Invoice"}</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginTop:4 }}>
            {existing ? `Editing ${existing.invoiceNo}` : "Fill details and add items"}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : existing ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>

      {error && <div style={{ background:`${theme.danger}12`, border:`1px solid ${theme.danger}40`, color:theme.danger, padding:"10px 16px", borderRadius:9, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

      {/* Top fields */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:16 }}>
          <div>
            <LBL>Invoice Type</LBL>
            <select style={inp} value={invoiceType} onChange={e=>setInvoiceType(e.target.value)}>
              <option value="estimate">Estimate Invoice</option>
              <option value="tax">Tax Invoice</option>
              <option value="proforma">Proforma Invoice</option>
            </select>
          </div>
          <div>
            <LBL>Date</LBL>
            <input style={inp} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div>
            <LBL>Customer *</LBL>
            <select style={inp} value={customerId} onChange={e=>setCustomerId(e.target.value)}>
              <option value="">— Select Customer —</option>
              {customers.map(c=><option key={c._id} value={c._id}>{c.name}{c.company?" — "+c.company:""}</option>)}
            </select>
            {customerId && !existing && (() => {
              const completed = orders.filter(o=>{
                const oc = o.customer?._id || o.customer;
                return String(oc)===String(customerId) && o.status==="Completed";
              });
              return completed.length > 0
                ? <div style={{ fontSize:11, color:theme.success, marginTop:5 }}>✓ {completed.length} completed bag{completed.length!==1?"s":""} auto-loaded</div>
                : <div style={{ fontSize:11, color:theme.textMuted, marginTop:5 }}>No completed bags found — add items manually</div>;
            })()}
          </div>
          <div>
            <LBL>Remarks</LBL>
            <input style={inp} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional remarks..."/>
          </div>
        </div>

        {/* Remaining diamonds for the selected customer */}
        {cust && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, background:"#7EC8E310", border:"1px solid #7EC8E340", borderRadius:10, padding:"12px 18px" }}>
            <div style={{ fontSize:12, color:"#7EC8E3", fontWeight:600, alignSelf:"center" }}>💎 Remaining Diamonds — {cust.name}</div>
            <div style={{ display:"flex", gap:24, marginLeft:"auto" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase" }}>Pieces</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#7EC8E3" }}>{cust.diamonds||0}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase" }}>Karats</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:"#7EC8E3" }}>{(cust.diamondKarats||0).toFixed(4)} ct</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold }}>✦ Line Items</span>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setImportOpen(v=>!v)} style={{ background:`${theme.success}15`, border:`1px solid ${theme.success}40`, color:theme.success, padding:"7px 14px", borderRadius:8, fontSize:12, cursor:"pointer" }}>
              ↓ Import from Orders
            </button>
            <button onClick={addItem} style={{ background:`${theme.gold}15`, border:`1px solid ${theme.gold}40`, color:theme.gold, padding:"7px 14px", borderRadius:8, fontSize:12, cursor:"pointer" }}>
              + Add Item
            </button>
          </div>
        </div>

        {/* Import panel */}
        {importOpen && (
          <div style={{ background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:12, color:theme.textMuted, marginBottom:10 }}>Select orders to import (pre-fills weights and diamonds):</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
              {customerOrders.slice(0,30).map(o=>{
                const sel = selectedOrders.includes(o._id);
                return (
                  <div key={o._id} onClick={()=>setSelectedOrders(prev=>sel?prev.filter(id=>id!==o._id):[...prev,o._id])}
                    style={{ background:sel?`${theme.gold}20`:theme.bg, border:`1px solid ${sel?theme.gold:theme.borderGold}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:sel?theme.gold:theme.text }}>
                    #{o.bagId} — {o.customerName}
                  </div>
                );
              })}
            </div>
            <button onClick={importFromOrders} disabled={!selectedOrders.length} style={{ background:theme.gold, color:"#0D0B07", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Import {selectedOrders.length} Order{selectedOrders.length!==1?"s":""}
            </button>
          </div>
        )}

        {items.map((it,idx)=>(
          <ItemEditor key={idx} item={it} idx={idx} onChange={handleItemChange} onRemove={handleItemRemove} orders={orders} customers={customers} selectedCustomer={cust}/>
        ))}
      </div>

      {/* Other Charges + Balance */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* Other Charges */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold, marginBottom:16 }}>Other Charges</div>
          {[["Hall Marking","hallMarking"],["Certy","certy"],["Shipping","shipping"],["Add / Less","addLess"]].map(([l,k])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:13 }}>{l}</span>
              <input style={{ ...inp, width:130, textAlign:"right" }} type="number" step="0.01"
                value={otherCharges[k]||""} placeholder="0"
                onChange={e=>setOtherCharges(prev=>({...prev,[k]:parseFloat(e.target.value)||0}))}/>
            </div>
          ))}
        </div>

        {/* Balance Summary */}
        <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:24 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:theme.gold, marginBottom:16 }}>Balance Summary</div>
          {[["Credit Amount","creditAmt",setCreditAmt,creditAmt],["Debit Amount","debitAmt",setDebitAmt,debitAmt],["Metal Balance (g)","metalBal",setMetalBal,metalBal],["CDMD Wt","cdmdWt",setCdmdWt,cdmdWt]].map(([l,,setter,val])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:13 }}>{l}</span>
              <input style={{ ...inp, width:130, textAlign:"right" }} type="number" step="0.001"
                value={val||""} placeholder="0"
                onChange={e=>setter(parseFloat(e.target.value)||0)}/>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total bar */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.gold}50`, borderRadius:14, padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:theme.textMuted }}>Items: {items.length} · Charges: {n2((otherCharges.hallMarking||0)+(otherCharges.certy||0)+(otherCharges.shipping||0)+(otherCharges.addLess||0))}</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:15, color:theme.textMuted }}>Grand Total</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, color:theme.gold }}>₹ {n2(totalGrandTotal)}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN BILLING PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Billing = ({ customers = [], orders = [] }) => {
  const [invoices,  setInvoices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState("list");   // "list" | "create" | "edit"
  const [editing,   setEditing]   = useState(null);
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast,     setToast]     = useState("");

  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3500); };

  const load = async () => {
    try { const r = await invoiceAPI.getAll(); setInvoices(r.data.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const removeInvoice = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try { await invoiceAPI.remove(id); notify("✓ Invoice deleted"); load(); } catch {}
  };

  const setStatus = async (id, status) => {
    try { await invoiceAPI.updateStatus(id, { status }); load(); notify(`✓ Status updated to ${status}`); } catch {}
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = search
      ? (inv.invoiceNo||"").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName||"").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = statusFilter ? inv.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const regularCustomers = customers.filter(c => !c.isOwner);

  if (loading) return <div style={{ padding:40, color:theme.textMuted }}>Loading invoices...</div>;

  if (view === "create" || view === "edit") return (
    <div className="fade-in">
      <InvoiceForm
        customers={regularCustomers}
        orders={orders}
        existing={view === "edit" ? editing : null}
        onSave={() => { load(); setView("list"); setEditing(null); notify("✓ Invoice saved"); }}
        onCancel={() => { setView("list"); setEditing(null); }}
      />
    </div>
  );

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, background:theme.success, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, zIndex:9999 }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div className="section-title">Billing & Invoices</div>
          <div style={{ fontSize:13, color:theme.textMuted, marginTop:4 }}>{invoices.length} invoices total</div>
        </div>
        <button className="btn-primary" onClick={()=>setView("create")}>+ New Invoice</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          ["Total Invoices", invoices.length, theme.gold],
          ["Draft",  invoices.filter(i=>i.status==="draft").length,  theme.textMuted],
          ["Sent",   invoices.filter(i=>i.status==="sent").length,   "#4F8EF7"],
          ["Paid",   invoices.filter(i=>i.status==="paid").length,   theme.success],
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, color:theme.textMuted, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:12, marginBottom:18, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}><Icon name="search" size={15} color={theme.textMuted}/></div>
          <input className="search-input" placeholder="Invoice no. or customer…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }}/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width:160 }}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
        {(search||statusFilter) && <button className="btn-ghost" onClick={()=>{setSearch("");setStatusFilter("");}} style={{ padding:"8px 14px", fontSize:13 }}>Clear</button>}
        <span style={{ marginLeft:"auto", fontSize:13, color:theme.textMuted }}>{filtered.length} of {invoices.length}</span>
      </div>

      {/* Invoice cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:48, textAlign:"center", color:theme.textMuted }}>
            {invoices.length === 0 ? "No invoices yet. Create your first one!" : "No invoices match your filters."}
          </div>
        )}
        {filtered.map(inv => (
          <div key={inv._id} className="card-hover" style={{ background:theme.surface, border:`1px solid ${theme.borderGold}`, borderRadius:14, padding:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              {/* Left */}
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:theme.gold }}>{inv.invoiceNo}</span>
                  <span style={{ fontSize:12, color:theme.text, fontWeight:500 }}>{inv.customerName}</span>
                  <span style={{ fontSize:11, background:`${STATUS_COLORS[inv.status]}20`, color:STATUS_COLORS[inv.status], border:`1px solid ${STATUS_COLORS[inv.status]}40`, padding:"2px 9px", borderRadius:10 }}>
                    {inv.status}
                  </span>
                  <span style={{ fontSize:11, color:theme.textMuted, background:theme.surfaceAlt, border:`1px solid ${theme.borderGold}`, padding:"2px 9px", borderRadius:10 }}>
                    {inv.invoiceType}
                  </span>
                </div>
                <div style={{ fontSize:12, color:theme.textMuted }}>
                  {fmt(inv.date)} · {inv.items?.length||0} item{inv.items?.length!==1?"s":""} · {inv.items?.reduce((s,it)=>s+(it.category?" "+it.category:""),"")||""}
                </div>
                <div style={{ fontSize:12, color:theme.textMuted, marginTop:4 }}>
                  G.Wt: {n3(inv.totalGrossWt)}g · N.Wt: {n3(inv.totalNetWt)}g · Diamonds: {inv.totalDiamondPcs||0}pc / {n4(inv.totalDiamondWt)}g
                </div>
              </div>

              {/* Right */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, flexShrink:0, marginLeft:20 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:theme.gold }}>
                  ₹ {n2(inv.grandTotal)}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {/* Status buttons */}
                  {inv.status === "draft" && <button onClick={()=>setStatus(inv._id,"sent")} style={{ background:`#4F8EF715`, border:`1px solid #4F8EF740`, color:"#4F8EF7", padding:"4px 10px", borderRadius:7, fontSize:11, cursor:"pointer" }}>Mark Sent</button>}
                  {inv.status === "sent"  && <button onClick={()=>setStatus(inv._id,"paid")} style={{ background:`${theme.success}15`, border:`1px solid ${theme.success}40`, color:theme.success, padding:"4px 10px", borderRadius:7, fontSize:11, cursor:"pointer" }}>Mark Paid</button>}
                  <button onClick={()=>openInvoicePDF(inv)} style={{ background:`${theme.gold}15`, border:`1px solid ${theme.gold}50`, color:theme.gold, padding:"4px 12px", borderRadius:7, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15V3M7 10l5 5 5-5M20 21H4"/></svg>
                    Print PDF
                  </button>
                  <button onClick={()=>{ setEditing(inv); setView("edit"); }} className="btn-edit" style={{ padding:"4px 10px", fontSize:11 }}>Edit</button>
                  <button onClick={()=>removeInvoice(inv._id)} className="btn-icon-danger"><Icon name="trash" size={12} color={theme.danger}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
