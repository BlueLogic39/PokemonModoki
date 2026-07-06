// スプライトシート書き出しツール: node tools/spritesheet.mjs [出力先.png]
// ゲームと同じパイプライン (ミラー展開 → Scale2x → 自動陰影) を再現して
// 全モンスターの最終見た目を1枚のPNGにする。
import zlib from "zlib";
import fs from "fs";
import { MON_SPRITES } from "../js/data/sprites.js";
import { DEX } from "../js/data/dex.js";

// ---------- ピクセルバッファ (RGBA) ----------
function makeBuf(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) };
}
function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function renderBase(def) {
  const size = def.rows.length;
  const buf = makeBuf(size, size);
  for (let y = 0; y < size; y++) {
    const row = def.rows[y] || "";
    const full = row.length === size / 2 ? row + row.split("").reverse().join("") : row;
    for (let x = 0; x < size; x++) {
      const ch = full[x];
      if (!ch || ch === ".") continue;
      const col = def.pal[ch];
      if (!col) continue;
      const [r, g, b] = hexToRgb(col);
      const i = (y * size + x) * 4;
      buf.data[i] = r; buf.data[i + 1] = g; buf.data[i + 2] = b; buf.data[i + 3] = 255;
    }
  }
  return buf;
}

function scale2x(src) {
  const { w, h } = src;
  const s32 = new Uint32Array(src.data.buffer);
  const out = makeBuf(w * 2, h * 2);
  const o32 = new Uint32Array(out.data.buffer);
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : s32[y * w + x];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const P = get(x, y), A = get(x, y - 1), B = get(x + 1, y), C = get(x - 1, y), D = get(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (C === A && C !== D && A !== B) e0 = A;
      if (A === B && A !== C && B !== D) e1 = B;
      if (D === C && D !== B && C !== A) e2 = C;
      if (B === D && B !== A && D !== C) e3 = B;
      const oy = y * 2 * (w * 2) + x * 2;
      o32[oy] = e0; o32[oy + 1] = e1;
      o32[oy + w * 2] = e2; o32[oy + w * 2 + 1] = e3;
    }
  }
  return out;
}

function autoShade(buf, thickness) {
  const { w, h, data: d } = buf;
  const alphaAt = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
  const isEdge = (x, y) => {
    if (alphaAt(x, y) < 40) return true;
    const i = (y * w + x) * 4;
    return d[i] * 0.3 + d[i + 1] * 0.6 + d[i + 2] * 0.1 < 70;
  };
  const lights = [], shades = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 40) continue;
      if (d[i] * 0.3 + d[i + 1] * 0.6 + d[i + 2] * 0.1 < 70) continue;
      let top = false, bottom = false;
      for (let k = 1; k <= thickness; k++) if (isEdge(x, y - k)) { top = true; break; }
      if (!top) for (let k = 1; k <= thickness; k++) if (isEdge(x, y + k)) { bottom = true; break; }
      if (top) lights.push(i);
      else if (bottom) shades.push(i);
    }
  }
  for (const i of lights) for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, d[i + c] * 1.15 + 18);
  for (const i of shades) for (let c = 0; c < 3; c++) d[i + c] = d[i + c] * 0.78;
  return buf;
}

// ---------- PNGエンコード ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(buf) {
  const { w, h, data } = buf;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(data.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(raw)), pngChunk("IEND", Buffer.alloc(0))]);
}

// ---------- シート合成 ----------
const ids = DEX.map((s) => s.id);
const COLS = 6;
const CELL = 64 * 2 + 8; // 2倍表示 + 余白
const rows = Math.ceil(ids.length / COLS);
const sheet = makeBuf(COLS * CELL, rows * CELL);
// 背景
for (let i = 0; i < sheet.data.length; i += 4) {
  sheet.data[i] = 42; sheet.data[i + 1] = 44; sheet.data[i + 2] = 60; sheet.data[i + 3] = 255;
}

ids.forEach((id, idx) => {
  const def = MON_SPRITES[id];
  if (!def) { console.error("スプライトなし:", id); return; }
  let buf = renderBase(def);
  while (buf.w < 64) buf = scale2x(buf);
  autoShade(buf, 2);
  const cx = (idx % COLS) * CELL + 4;
  const cy = Math.floor(idx / COLS) * CELL + 4;
  // 2倍ニアレストで配置
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const si = (y * 64 + x) * 4;
      if (buf.data[si + 3] < 40) continue;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const di = ((cy + y * 2 + dy) * sheet.w + cx + x * 2 + dx) * 4;
          sheet.data[di] = buf.data[si];
          sheet.data[di + 1] = buf.data[si + 1];
          sheet.data[di + 2] = buf.data[si + 2];
          sheet.data[di + 3] = 255;
        }
      }
    }
  }
});

const out = process.argv[2] || "tools/spritesheet.png";
fs.writeFileSync(out, encodePng(sheet));
console.log("書き出し完了:", out, `(${sheet.w}x${sheet.h}, ${ids.length}体)`);
