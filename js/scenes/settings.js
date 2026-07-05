// せってい画面: マスター / BGM / こうかおん の音量調整
import { popScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawDarkPanel, drawTextShadow,
} from "../engine/render.js";

const ROWS = [
  { key: "master", label: "ぜんたい おんりょう" },
  { key: "bgm", label: "BGM" },
  { key: "se", label: "こうかおん" },
];

export class SettingsScene {
  constructor(resolve) {
    this.resolve = resolve;
    this.idx = 0;
  }
  update() {
    if (input.justPressed("b")) {
      audio.sfx("cancel");
      popScene();
      this.resolve?.();
      return;
    }
    if (input.justPressed("up")) { this.idx = (this.idx + ROWS.length - 1) % ROWS.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % ROWS.length; audio.sfx("select"); }
    const row = ROWS[this.idx];
    if (input.justPressed("left")) {
      audio.setVolume(row.key, audio.settings[row.key] - 1);
      audio.sfx("select"); // 調整結果がすぐ聞こえるように鳴らす
    }
    if (input.justPressed("right")) {
      audio.setVolume(row.key, audio.settings[row.key] + 1);
      audio.sfx("select");
    }
  }
  draw(ctx, t) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    drawTextShadow(ctx, "せってい", 8, 8, "#f8d030");
    drawWindow(ctx, 10, 26, SCREEN_W - 20, 100);

    ROWS.forEach((row, i) => {
      const y = 38 + i * 28;
      const selected = i === this.idx;
      if (selected) drawText(ctx, "▶", 18, y, "#c03028");
      drawText(ctx, row.label, 30, y, selected ? "#c03028" : "#303030");
      // 音量バー (10目盛)
      const v = audio.settings[row.key];
      const bx = 30, by = y + 11;
      for (let k = 0; k < 10; k++) {
        ctx.fillStyle = k < v ? (selected ? "#e8a020" : "#58a8e8") : "#d0d0d8";
        ctx.fillRect(bx + k * 14, by, 11, 7);
      }
      drawText(ctx, String(v), bx + 146, by - 1, "#303030");
    });

    drawTextShadow(ctx, "←→: ちょうせい / ↑↓: えらぶ / X: もどる", 8, 132, "#a0a8c8", "#00000080");
    drawTextShadow(ctx, "Mキー: ミュートきりかえ" + (audio.muted ? " (ミュートちゅう)" : ""), 8, 146, audio.muted ? "#e05038" : "#a0a8c8", "#00000080");
  }
}
