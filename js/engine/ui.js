// 汎用UI: メッセージウィンドウ (タイプライター) と 選択メニュー
// シーンから `await ui.say("...")` / `await ui.ask([...])` で使う
import { input } from "./input.js";
import { audio } from "./audio.js";
import { drawWindow, drawText, textWidth, SCREEN_W, SCREEN_H, FONT } from "./render.js";

const BOX_H = 44;
const LINE_H = 13;
const MAX_W = SCREEN_W - 28;

function wrapText(ctx, text) {
  // 改行 + 自動折返し (日本語は1文字ずつ測る)
  const lines = [];
  for (const src of String(text).split("\n")) {
    let cur = "";
    for (const ch of src) {
      if (textWidth(ctx, cur + ch) > MAX_W) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    lines.push(cur);
  }
  return lines;
}

class DialogWidget {
  constructor(ctx, text, resolve, opts = {}) {
    this.lines = wrapText(ctx, text);
    this.pages = [];
    for (let i = 0; i < this.lines.length; i += 2) this.pages.push(this.lines.slice(i, i + 2));
    this.page = 0;
    this.chars = 0;
    this.resolve = resolve;
    this.done = false;
    this.opts = opts;
    this.charTimer = 0;
  }
  update(dt, isTop = true) {
    const pageText = this.pages[this.page].join("");
    if (!isTop) { this.chars = pageText.length; return true; } // 前面にメニューがある間は全文表示で待機
    if (this.chars < pageText.length) {
      this.charTimer += dt;
      const speed = input.isDown("a") ? 8 : 22; // A押しっぱなしで速く
      while (this.charTimer > speed && this.chars < pageText.length) {
        this.charTimer -= speed;
        this.chars++;
      }
      if (input.justPressed("a")) this.chars = pageText.length;
      return true;
    }
    if (this.opts.auto) {
      this.charTimer += dt;
      if (this.charTimer > (this.opts.auto === true ? 900 : this.opts.auto)) this.advance();
      return true;
    }
    if (input.justPressed("a") || input.justPressed("b")) {
      audio.sfx("select");
      this.advance();
    }
    return true;
  }
  advance() {
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.chars = 0;
      this.charTimer = 0;
    } else {
      this.done = true;
      this.resolve();
    }
  }
  draw(ctx, t) {
    const y = SCREEN_H - BOX_H;
    drawWindow(ctx, 2, y, SCREEN_W - 4, BOX_H - 2);
    const pageLines = this.pages[this.page];
    let remaining = this.chars;
    for (let i = 0; i < pageLines.length; i++) {
      const ln = pageLines[i];
      const show = ln.slice(0, Math.max(0, remaining));
      remaining -= ln.length;
      drawText(ctx, show, 10, y + 8 + i * LINE_H, "#303030");
    }
    // 続きあり表示
    const pageText = pageLines.join("");
    if (this.chars >= pageText.length && !this.opts.auto && Math.floor(t / 400) % 2 === 0) {
      ctx.fillStyle = "#c03028";
      const ax = SCREEN_W - 16, ay = SCREEN_H - 12;
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(ax + 6, ay); ctx.lineTo(ax + 3, ay + 4);
      ctx.fill();
    }
  }
}

class MenuWidget {
  constructor(ctx, items, resolve, opts = {}) {
    this.items = items;
    this.resolve = resolve;
    this.opts = opts;
    this.idx = opts.startIndex || 0;
    this.done = false;
    // サイズ計算
    ctx.font = FONT;
    let w = 0;
    for (const it of items) w = Math.max(w, textWidth(ctx, it));
    this.w = Math.min(SCREEN_W - 8, w + 24);
    this.h = items.length * LINE_H + 12;
    this.x = opts.x ?? SCREEN_W - this.w - 4;
    this.y = opts.y ?? Math.max(4, SCREEN_H - BOX_H - this.h - 2);
  }
  update(dt, isTop = true) {
    if (!isTop) return true;
    if (input.justPressed("up")) { this.idx = (this.idx + this.items.length - 1) % this.items.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % this.items.length; audio.sfx("select"); }
    if (input.justPressed("a")) {
      audio.sfx("confirm");
      this.done = true;
      this.resolve(this.idx);
    } else if (input.justPressed("b") && this.opts.canCancel !== false) {
      audio.sfx("cancel");
      this.done = true;
      this.resolve(-1);
    }
    return true;
  }
  draw(ctx) {
    drawWindow(ctx, this.x, this.y, this.w, this.h);
    for (let i = 0; i < this.items.length; i++) {
      drawText(ctx, this.items[i], this.x + 14, this.y + 7 + i * LINE_H, "#303030");
      if (i === this.idx) drawText(ctx, "▶", this.x + 4, this.y + 7 + i * LINE_H, "#c03028");
    }
  }
}

class UI {
  constructor() { this.widgets = []; }
  say(text, opts = {}) {
    return new Promise((resolve) => {
      this.widgets.push(new DialogWidget(document.createElement("canvas").getContext("2d"), text, resolve, opts));
    });
  }
  ask(items, opts = {}) {
    return new Promise((resolve) => {
      this.widgets.push(new MenuWidget(document.createElement("canvas").getContext("2d"), items, resolve, opts));
    });
  }
  // はい/いいえ
  async confirm(text) {
    const p = this.say(text, { hold: true });
    const ans = await this.ask(["はい", "いいえ"]);
    this.dismissTopDialog();
    await p;
    return ans === 0;
  }
  dismissTopDialog() {
    for (let i = this.widgets.length - 1; i >= 0; i--) {
      if (this.widgets[i] instanceof DialogWidget) {
        this.widgets[i].done = true;
        this.widgets[i].resolve();
        break;
      }
    }
  }
  busy() { return this.widgets.length > 0; }
  update(dt) {
    this.widgets = this.widgets.filter((w) => !w.done);
    const top = this.widgets[this.widgets.length - 1];
    // 新しく最前面に来たウィジェットは1フレーム入力を受け付けない
    // (直前のウィジェットを閉じたキー押下を続けて拾わないようにするため)
    const settling = top && top !== this._lastTop;
    this._lastTop = top;
    for (let i = 0; i < this.widgets.length; i++) {
      const isTop = i === this.widgets.length - 1;
      this.widgets[i].update(dt, isTop && !settling);
    }
  }
  draw(ctx, t) {
    for (const w of this.widgets) w.draw(ctx, t);
  }
}

export const ui = new UI();
