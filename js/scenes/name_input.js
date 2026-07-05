// なまえ入力画面 (ポケモン風の50音表)
// 使い方: pushScene(new NameInputScene(resolve)) → resolve(名前 or null=キャンセル)
import { popScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawDarkPanel, drawTextShadow,
} from "../engine/render.js";

const HIRA =
  "あいうえおかきくけこさし" +
  "すせそたちつてとなにぬね" +
  "のはひふへほまみむめもや" +
  "ゆよらりるれろわをんぁぃ" +
  "ぅぇぉゃゅょっがぎぐげご" +
  "ざじずぜぞだぢづでどばび" +
  "ぶべぼぱぴぷぺぽー・";
const KATA =
  "アイウエオカキクケコサシ" +
  "スセソタチツテトナニヌネ" +
  "ノハヒフヘホマミムメモヤ" +
  "ユヨラリルレロワヲンァィ" +
  "ゥェォャュョッガギグゲゴ" +
  "ザジズゼゾダヂヅデドバビ" +
  "ブベボパピプペポー・";

const COLS = 12;
const MAX_LEN = 6;
const CELL_W = 18;
const CELL_H = 13;
const GRID_X = 12;
const GRID_Y = 26;

export class NameInputScene {
  constructor(resolve) {
    this.resolve = resolve;
    this.name = "";
    this.page = 0; // 0=ひらがな 1=カタカナ
    this.cx = 0;
    this.cy = 0;
    this.rows = Math.ceil(HIRA.length / COLS);
  }

  chars() { return this.page === 0 ? HIRA : KATA; }

  update() {
    const totalRows = this.rows + 1; // 最下段はボタン行 [きりかえ/けす/けってい]
    const onButtons = () => this.cy === this.rows;
    const maxX = () => (onButtons() ? 3 : COLS);

    if (input.justPressed("up")) { this.cy = (this.cy + totalRows - 1) % totalRows; audio.sfx("select"); }
    if (input.justPressed("down")) { this.cy = (this.cy + 1) % totalRows; audio.sfx("select"); }
    if (this.cx >= maxX()) this.cx = maxX() - 1;
    if (input.justPressed("left")) { this.cx = (this.cx + maxX() - 1) % maxX(); audio.sfx("select"); }
    if (input.justPressed("right")) { this.cx = (this.cx + 1) % maxX(); audio.sfx("select"); }

    if (input.justPressed("b")) {
      if (this.name.length > 0) {
        this.name = this.name.slice(0, -1);
        audio.sfx("cancel");
      } else {
        // 空の状態でB → 入力をやめる
        audio.sfx("cancel");
        popScene();
        this.resolve(null);
      }
      return;
    }

    if (input.justPressed("a")) {
      if (onButtons()) {
        if (this.cx === 0) { // ひらがな⇔カタカナ
          this.page = 1 - this.page;
          audio.sfx("select");
        } else if (this.cx === 1) { // 1もじけす
          if (this.name.length > 0) { this.name = this.name.slice(0, -1); audio.sfx("cancel"); }
          else audio.sfx("bump");
        } else { // けってい
          if (this.name.length >= 1) {
            audio.sfx("confirm");
            popScene();
            this.resolve(this.name);
          } else {
            audio.sfx("bump");
          }
        }
        return;
      }
      const ch = this.chars()[this.cy * COLS + this.cx];
      if (!ch || ch === "　") { audio.sfx("bump"); return; }
      if (this.name.length >= MAX_LEN) { audio.sfx("bump"); return; }
      this.name += ch;
      audio.sfx("select");
      if (this.name.length >= MAX_LEN) { // 6文字入れたら「けってい」へカーソル移動
        this.cy = this.rows;
        this.cx = 2;
      }
    }
  }

  draw(ctx, t) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    drawTextShadow(ctx, "なまえを いれてね", 8, 6, "#f8d030");

    // 入力中の名前 (6マス)
    for (let i = 0; i < MAX_LEN; i++) {
      const x = 122 + i * 16;
      drawWindow(ctx, x, 4, 14, 15);
      const ch = this.name[i];
      if (ch) drawText(ctx, ch, x + 3, 7, "#303030");
      else if (i === this.name.length && Math.floor(t / 400) % 2 === 0) {
        ctx.fillStyle = "#c03028";
        ctx.fillRect(x + 3, 14, 8, 2);
      }
    }

    // 50音グリッド
    const chars = this.chars();
    drawWindow(ctx, GRID_X - 6, GRID_Y - 4, COLS * CELL_W + 12, this.rows * CELL_H + 8);
    for (let i = 0; i < chars.length; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = GRID_X + col * CELL_W;
      const y = GRID_Y + row * CELL_H;
      const selected = this.cy === row && this.cx === col;
      if (selected) {
        ctx.fillStyle = "#f8d030";
        ctx.fillRect(x - 2, y - 1, 14, 11);
      }
      drawText(ctx, chars[i], x, y, selected ? "#803020" : "#303030");
    }

    // ボタン行
    const buttons = [
      { label: this.page === 0 ? "カタカナへ" : "ひらがなへ", x: 12, w: 66 },
      { label: "1もじけす", x: 86, w: 62 },
      { label: "けってい", x: 156, w: 56 },
    ];
    const by = GRID_Y + this.rows * CELL_H + 8;
    buttons.forEach((b, i) => {
      drawWindow(ctx, b.x, by, b.w, 16);
      const selected = this.cy === this.rows && this.cx === i;
      drawText(ctx, b.label, b.x + 6, by + 4, selected ? "#c03028" : "#303030");
      if (selected) {
        ctx.fillStyle = "#c03028";
        ctx.fillRect(b.x + 2, by + 13, b.w - 4, 1);
      }
    });

    drawTextShadow(ctx, "Z:えらぶ  X:けす (6もじまで)", 8, SCREEN_H - 12, "#a0a8c8", "#00000080");
  }
}
