// モンスターボックス (回復センターのパソコン)
import { G, popScene } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import { ui } from "../engine/ui.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawDarkPanel, drawTextShadow, drawMonSprite,
} from "../engine/render.js";
import { statsOf } from "../core/monster.js";

export class BoxScene {
  constructor() {
    this.side = 0; // 0=てもち 1=ボックス
    this.idx = 0;
    this.busy = false;
  }
  list(side = this.side) {
    return side === 0 ? G.player.party : G.player.box;
  }
  update() {
    if (this.busy || ui.busy()) return;
    if (input.justPressed("b")) { audio.sfx("cancel"); popScene(); return; }
    if (input.justPressed("left") || input.justPressed("right")) {
      this.side = 1 - this.side;
      this.idx = 0;
      audio.sfx("select");
    }
    const list = this.list();
    if (list.length === 0) return;
    if (this.idx >= list.length) this.idx = list.length - 1;
    if (input.justPressed("up")) { this.idx = (this.idx + list.length - 1) % list.length; audio.sfx("select"); }
    if (input.justPressed("down")) { this.idx = (this.idx + 1) % list.length; audio.sfx("select"); }
    if (input.justPressed("a")) this.moveFlow();
  }
  async moveFlow() {
    this.busy = true;
    try {
      const mon = this.list()[this.idx];
      if (!mon) return;
      const toBox = this.side === 0;
      const sel = await ui.ask([toBox ? "ボックスに あずける" : "てもちに くわえる", "やめる"]);
      if (sel !== 0) return;
      if (toBox) {
        if (G.player.party.length <= 1) { await ui.say("さいごの モンスターは あずけられない!"); return; }
        G.player.party.splice(this.idx, 1);
        G.player.box.push(mon);
        audio.sfx("confirm");
        await ui.say(`${mon.name}を ボックスに あずけた!`);
      } else {
        if (G.player.party.length >= 6) { await ui.say("てもちが いっぱいだ!"); return; }
        G.player.box.splice(this.idx, 1);
        G.player.party.push(mon);
        audio.sfx("confirm");
        await ui.say(`${mon.name}を てもちに くわえた!`);
      }
      if (this.idx >= this.list().length) this.idx = Math.max(0, this.list().length - 1);
    } finally {
      this.busy = false;
    }
  }
  draw(ctx) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    drawTextShadow(ctx, "モンスターボックス (←→で きりかえ)", 8, 5, "#f8f8f8");
    const panels = [
      { label: `てもち ${G.player.party.length}/6`, x: 6, list: G.player.party },
      { label: `ボックス ${G.player.box.length}`, x: 122, list: G.player.box },
    ];
    panels.forEach((p, side) => {
      drawWindow(ctx, p.x, 18, 112, 138);
      drawText(ctx, p.label, p.x + 6, 22, side === this.side ? "#c03028" : "#606060");
      const top = side === this.side ? Math.max(0, Math.min(this.idx - 4, p.list.length - 9)) : 0;
      for (let r = 0; r < 9; r++) {
        const i = top + r;
        if (i >= p.list.length) break;
        const m = p.list[i];
        const y = 34 + r * 13;
        if (side === this.side && i === this.idx) drawText(ctx, "▶", p.x + 4, y, "#c03028");
        drawMonSprite(ctx, m.species, p.x + 12, y - 2, 1);
        drawText(ctx, m.name, p.x + 30, y, "#303030");
        drawText(ctx, `Lv${m.level}`, p.x + 84, y, "#606060");
      }
    });
  }
}
