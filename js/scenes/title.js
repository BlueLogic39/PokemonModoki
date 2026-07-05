// タイトル画面
import { G, newPlayer, replaceScene } from "../game.js";
import { ui } from "../engine/ui.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawTextShadow, drawMonSprite, drawText,
} from "../engine/render.js";
import { hasSave, loadGame } from "../core/save.js";
import { OverworldScene } from "./overworld.js";

const NAMES = ["ユウ", "ハルカ", "レン", "ミオ", "ソウタ", "ヒカリ"];

export class TitleScene {
  constructor() { this.started = false; }
  enter() {
    audio.playMusic("title");
    this.run();
  }
  async run() {
    // 最初のキー入力を待つ (オーディオ有効化も兼ねる)
    await ui.say("PRESS Z / ENTER", { auto: false });
    while (true) {
      const options = hasSave() ? ["つづきから", "さいしょから"] : ["さいしょから"];
      const i = await ui.ask(options, { x: 80, y: 96, canCancel: false });
      const choice = options[i];
      if (choice === "つづきから") {
        const p = loadGame();
        if (!p) { await ui.say("セーブデータが よみこめなかった…"); continue; }
        G.player = p;
        break;
      } else {
        if (hasSave()) {
          const ok = await ui.confirm("セーブデータが あります。あたらしく はじめると きえてしまいますが いいですか?");
          if (!ok) continue;
        }
        await ui.say("カエデはかせ『やあ! モンスターの せかいへ ようこそ!』");
        await ui.say("カエデはかせ『まずは きみの なまえを おしえてくれるかな?』");
        const ni = await ui.ask(NAMES, { canCancel: false });
        G.player = newPlayer(NAMES[ni]);
        await ui.say(`カエデはかせ『${G.player.name}! いい なまえだ。』`);
        await ui.say("カエデはかせ『じゅんびが できたら いえを でて わたしの けんきゅうじょへ おいで! まっているよ!』");
        break;
      }
    }
    replaceScene(new OverworldScene());
  }
  draw(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
    grad.addColorStop(0, "#1a1c3c");
    grad.addColorStop(1, "#3c2c5c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // 星
    for (let i = 0; i < 40; i++) {
      const sx = (i * 53 + 13) % SCREEN_W;
      const sy = (i * 37 + 7) % 100;
      const tw = Math.floor(t / 400 + i) % 3 === 0;
      ctx.fillStyle = tw ? "#f8f4d0" : "#8888b0";
      ctx.fillRect(sx, sy, 1, 1);
    }
    drawTextShadow(ctx, "―― トモシビちほうの ぼうけん ――", 42, 22, "#c8c8e8", "#000000a0");
    ctx.font = 'bold 20px "MS Gothic", monospace';
    ctx.textBaseline = "top";
    ctx.fillStyle = "#20204080";
    ctx.fillText("トモシビモンスターズ", 22, 40);
    ctx.fillStyle = "#f8d030";
    ctx.fillText("トモシビモンスターズ", 20, 38);
    // マスコット
    const bounce = Math.sin(t / 300) * 3;
    drawMonSprite(ctx, "tengenryu", 96, 66 + bounce, 3);
    drawMonSprite(ctx, "leafy", 40, 90, 2);
    drawMonSprite(ctx, "hinokon", 170, 90, 2);
  }
}
