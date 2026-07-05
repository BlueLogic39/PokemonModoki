// ショップ (かう / うる)
import { G, popScene } from "../game.js";
import { ui } from "../engine/ui.js";
import { audio } from "../engine/audio.js";
import { itemData } from "../data/items.js";
import { SCREEN_W, drawText, drawWindow } from "../engine/render.js";

export class ShopScene {
  constructor(stock) {
    this.stock = stock;
    this.overlay = true;
  }
  enter() { this.run(); }
  async run() {
    while (true) {
      const mode = await ui.ask(["かう", "うる", "やめる"]);
      if (mode === -1 || mode === 2) break;
      if (mode === 0) await this.buy();
      else await this.sell();
    }
    await ui.say("まいどありがとうございました!");
    popScene();
  }
  async buy() {
    while (true) {
      const labels = this.stock.map((id) => `${itemData(id).name}  ${itemData(id).price}円`);
      const i = await ui.ask(labels);
      if (i === -1) return;
      const id = this.stock[i];
      const it = itemData(id);
      const maxCount = Math.floor(G.player.money / it.price);
      if (maxCount < 1) { await ui.say("おかねが たりません!"); continue; }
      const counts = [1, 5, 10].filter((c) => c <= maxCount);
      const ci = await ui.ask(counts.map((c) => `${c}こ (${c * it.price}円)`));
      if (ci === -1) continue;
      const count = counts[ci];
      G.player.money -= count * it.price;
      G.player.bag[id] = (G.player.bag[id] || 0) + count;
      audio.sfx("confirm");
      await ui.say(`${it.name}を ${count}こ かった!`);
    }
  }
  async sell() {
    while (true) {
      const ids = Object.keys(G.player.bag).filter((id) => G.player.bag[id] > 0 && itemData(id).price > 0);
      if (ids.length === 0) { await ui.say("うれるものが ない!"); return; }
      const labels = ids.map((id) => `${itemData(id).name} x${G.player.bag[id]} (${Math.floor(itemData(id).price / 2)}円)`);
      const i = await ui.ask(labels);
      if (i === -1) return;
      const id = ids[i];
      const it = itemData(id);
      G.player.bag[id]--;
      if (G.player.bag[id] <= 0) delete G.player.bag[id];
      G.player.money += Math.floor(it.price / 2);
      audio.sfx("confirm");
      await ui.say(`${it.name}を うった! (${Math.floor(it.price / 2)}円)`);
    }
  }
  draw(ctx) {
    drawWindow(ctx, 4, 4, 110, 18);
    drawText(ctx, `おかね ${G.player.money}円`, 10, 9, "#303030");
  }
}
