// タイトル画面
import { G, newPlayer, replaceScene, pushScene } from "../game.js";
import { ui } from "../engine/ui.js";
import { audio } from "../engine/audio.js";
import {
  SCREEN_W, SCREEN_H, drawTextShadow, drawMonSprite, drawText,
} from "../engine/render.js";
import { hasSave, loadGame } from "../core/save.js";
import { OverworldScene } from "./overworld.js";
import { NameInputScene } from "./name_input.js";

const BOY_NAMES = ["ユウ", "ソウタ", "レン", "ハルト", "ダイチ"];
const GIRL_NAMES = ["ハルカ", "ミオ", "ヒカリ", "サクラ", "コトネ"];

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
        // 性別をえらぶ
        await ui.say("カエデはかせ『きみは おとこのこ? それとも おんなのこ?』");
        const gi = await ui.ask(["おとこのこ", "おんなのこ"], { canCancel: false });
        const gender = gi === 1 ? "girl" : "boy";
        // なまえをえらぶ (性別で候補が変わる + じぶんできめる)
        let name = null;
        while (!name) {
          await ui.say("カエデはかせ『きみの なまえを おしえてくれるかな?』");
          const list = (gender === "girl" ? GIRL_NAMES : BOY_NAMES).concat(["じぶんで きめる"]);
          const ni = await ui.ask(list, { canCancel: false });
          let candidate;
          if (ni === list.length - 1) {
            candidate = await new Promise((resolve) => pushScene(new NameInputScene(resolve)));
            if (!candidate) continue; // キャンセルされたら選び直し
          } else {
            candidate = list[ni];
          }
          if (await ui.confirm(`なまえは 「${candidate}」で いいかな?`)) name = candidate;
        }
        G.player = newPlayer(name, gender);
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
