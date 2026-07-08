// つうしんルーム: Supabase Realtime を使った こうかん・たいせん
import { G, popScene, pushScene, markCaught } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import { ui } from "../engine/ui.js";
import {
  SCREEN_W, SCREEN_H, drawText, drawWindow, drawDarkPanel, drawTextShadow, drawMonSprite,
} from "../engine/render.js";
import { netAvailable, Room } from "../net/net.js";
import { serializeMon, deserializeMon } from "../core/monster.js";
import { Battle, summaryOf } from "../core/battle.js";
import { BattleScene } from "./battle_scene.js";
import { PartyScene } from "./menu.js";
import { species } from "../data/dex.js";
import { isFainted } from "../core/monster.js";

const WAIT_LONG = 180000; // 相手の操作待ち (3分)

export class LinkScene {
  constructor() {
    this.status = ["つうしんルーム"];
    this.room = null;
    this.state = "boot";
    this.code = [0, 0, 0, 0];
    this.codeCursor = 0;
    this.codeResolve = null;
    this.offerMine = null;
    this.offerTheirs = null;
    this.peerName = "";
    this.peerLeft = false;
  }

  enter() {
    audio.playMusic("town");
    this.run().catch(async (e) => {
      console.error("link error", e);
      await ui.say("つうしんが きれてしまった…");
      await this.cleanup();
      popScene();
    });
  }

  setStatus(...lines) { this.status = lines; }

  async cleanup() {
    if (this.room) { const r = this.room; this.room = null; await r.leave(); }
  }

  async run() {
    if (!netAvailable()) {
      await ui.say("つうしん きのうは まだ せっていされていません。");
      await ui.say("フォルダにある netconfig.js に Supabaseの URLと anonキーを かきこむと つかえるようになります。(くわしくは README を みてね)");
      popScene();
      return;
    }
    while (true) {
      this.setStatus("つうしんルーム", "なにを しますか?");
      const mode = await ui.ask(["モンスターこうかん", "つうしんたいせん", "やめる"], { canCancel: false });
      if (mode === 2) break;
      const kind = mode === 0 ? "trade" : "battle";

      const role = await ui.ask(["ルームを つくる (ホスト)", "あいことばで はいる"], { canCancel: true });
      if (role === -1) continue;
      const isHost = role === 0;

      let code;
      if (isHost) {
        code = String(1000 + Math.floor(Math.random() * 9000));
        await ui.say(`あいことばは 【${code}】!\nあいてに この 4けたの すうじを つたえてね。`);
      } else {
        await ui.say("あいての あいことば (4けた) を いれてね。");
        code = await this.inputCode();
        if (code === null) continue;
      }

      this.setStatus("せつぞくちゅう…", `あいことば: ${code}`);
      try {
        this.peerLeft = false;
        this.room = await Room.join(kind, code, {
          onPeerLeave: () => { this.peerLeft = true; },
        });
      } catch {
        await ui.say("せつぞくに しっぱいした… netconfig.js の せっていを かくにんしてね。");
        continue;
      }

      // ハンドシェイク (おたがいに hello を送りあう)
      this.setStatus("あいてを まっています…", `あいことば: ${code}`, "(あいてが はいってくるまで まってね)");
      const hello = this.room.waitFor("hello", WAIT_LONG);
      const iv = setInterval(() => this.room?.send("hello", { name: G.player.name, tid: G.player.tid, host: isHost }), 1500);
      let peer;
      try {
        peer = await hello;
      } catch {
        clearInterval(iv);
        await ui.say("あいてが みつからなかった… また あとで ためしてみてね。");
        await this.cleanup();
        continue;
      }
      clearInterval(iv);
      this.room.send("hello", { name: G.player.name, tid: G.player.tid, host: isHost });
      this.peerName = peer.name || "???";
      audio.sfx("confirm");
      await ui.say(`${this.peerName}と つながった!`);

      if (peer.host === isHost) {
        await ui.say("ふたりとも おなじ やくわりを えらんでいるみたい。 かたほうが 『ルームを つくる』、 もうかたほうが 『はいる』を えらんでね。");
        await this.cleanup();
        continue;
      }

      try {
        if (kind === "trade") await this.tradeFlow();
        else await this.battleFlow(isHost);
      } catch (e) {
        console.error(e);
        await ui.say(this.peerLeft ? "あいてが たいしゅつした みたい…" : "つうしんが とぎれてしまった…");
      }
      await this.cleanup();
    }
    popScene();
  }

  // ---------- あいことば入力 ----------
  inputCode() {
    this.state = "code";
    this.code = [0, 0, 0, 0];
    this.codeCursor = 0;
    return new Promise((resolve) => { this.codeResolve = resolve; });
  }

  update() {
    if (this.state !== "code" || ui.busy()) return;
    if (input.justPressed("left")) { this.codeCursor = (this.codeCursor + 3) % 4; audio.sfx("select"); }
    if (input.justPressed("right")) { this.codeCursor = (this.codeCursor + 1) % 4; audio.sfx("select"); }
    if (input.justPressed("up")) { this.code[this.codeCursor] = (this.code[this.codeCursor] + 1) % 10; audio.sfx("select"); }
    if (input.justPressed("down")) { this.code[this.codeCursor] = (this.code[this.codeCursor] + 9) % 10; audio.sfx("select"); }
    if (input.justPressed("a")) {
      audio.sfx("confirm");
      this.state = "connected";
      this.codeResolve(this.code.join(""));
      this.codeResolve = null;
    }
    if (input.justPressed("b")) {
      audio.sfx("cancel");
      this.state = "menu";
      this.codeResolve(null);
      this.codeResolve = null;
    }
  }

  // ---------- こうかん ----------
  async tradeFlow() {
    while (true) {
      this.offerMine = null;
      this.offerTheirs = null;
      this.setStatus(`${this.peerName}との こうかん`, "だす モンスターを えらんでね (Bで やめる)");
      const idx = await new Promise((resolve) => pushScene(new PartyScene(resolve, { pick: true })));
      if (idx === -1) {
        this.room.send("trade_cancel", {});
        await ui.say("こうかんを やめた。");
        return;
      }
      const mine = G.player.party[idx];
      this.offerMine = serializeMon(mine);
      this.room.send("trade_offer", { mon: this.offerMine });

      this.setStatus("あいてが えらんでいます…");
      const theirsMsg = await Promise.race([
        this.room.waitFor("trade_offer", WAIT_LONG).catch(() => null),
        this.room.waitFor("trade_cancel", WAIT_LONG).then(() => null).catch(() => null),
      ]);
      if (!theirsMsg) { await ui.say("あいてが こうかんを やめた。"); return; }
      this.offerTheirs = theirsMsg.mon;

      const theirName = this.offerTheirs.name;
      this.setStatus("こうかん かくにん!");
      const ok = await ui.confirm(`こちらの ${mine.name} と あいての ${theirName} を こうかんする?`);
      this.room.send(ok ? "trade_confirm" : "trade_cancel", {});
      if (!ok) { await ui.say("こうかんを キャンセルした。"); continue; }

      this.setStatus("あいての へんじを まっています…");
      const confirmed = await Promise.race([
        this.room.waitFor("trade_confirm", WAIT_LONG).then(() => true).catch(() => false),
        this.room.waitFor("trade_cancel", WAIT_LONG).then(() => false).catch(() => false),
      ]);
      if (!confirmed) { await ui.say("あいてが キャンセルした。"); continue; }

      // 交換成立!
      const received = deserializeMon(this.offerTheirs);
      if (!received.ot) received.ot = this.peerName;
      const myIdx = G.player.party.findIndex((m) => m.uid === mine.uid);
      if (myIdx >= 0) G.player.party.splice(myIdx, 1);
      G.player.party.push(received);
      markCaught(received.species);
      audio.sfx("caught");
      await ui.say(`${mine.name}は ${this.peerName}のもとへ とんでいった…`);
      await ui.say(`かわりに ${received.name}が やってきた! だいじに そだてよう!`);

      this.offerMine = null;
      this.offerTheirs = null;
      const again = await ui.confirm("もういちど こうかんする?");
      this.room.send(again ? "trade_again" : "trade_end", {});
      this.setStatus("あいての へんじを まっています…");
      const peerAgain = await Promise.race([
        this.room.waitFor("trade_again", WAIT_LONG).then(() => true).catch(() => false),
        this.room.waitFor("trade_end", WAIT_LONG).then(() => false).catch(() => false),
      ]);
      if (!again || !peerAgain) { await ui.say("こうかんを おわった。 またね!"); return; }
    }
  }

  // ---------- たいせん ----------
  async battleFlow(isHost) {
    const alive = G.player.party.filter((m) => !isFainted(m));
    if (alive.length === 0) {
      await ui.say("たたかえる モンスターが いない! かいふくしてから きてね。");
      this.room.send("battle_abort", {});
      return;
    }
    // おたがいのパーティを交換 (バトルは全回復コピーで行い、手持ちには影響しない)
    const myPartyData = G.player.party.map(serializeMon);
    this.room.send("party", { party: myPartyData, name: G.player.name });
    this.setStatus("あいての チームを まっています…");
    const theirs = await Promise.race([
      this.room.waitFor("party", WAIT_LONG).catch(() => null),
      this.room.waitFor("battle_abort", WAIT_LONG).then(() => null).catch(() => null),
    ]);
    if (!theirs) { await ui.say("あいてが たいせんを ちゅうしした。"); return; }

    const myClones = myPartyData.map(deserializeMon);
    const theirClones = theirs.party.map(deserializeMon);
    await ui.say(`${this.peerName}との しょうぶが はじまる! (モンスターは まんたんの コピーで たたかうよ)`);

    const result = await new Promise((resolve) => {
      if (isHost) {
        const battle = new Battle({
          myParty: myClones,
          foeParty: theirClones,
          kind: "link",
          trainerName: this.peerName,
        });
        pushScene(new BattleScene({
          battle,
          kind: "link",
          mode: "host",
          music: "battle",
          foeTrainer: { name: this.peerName },
          getFoeAction: () => this.room.waitFor("action", WAIT_LONG),
          afterTurn: (events) => this.room.send("events", events),
          onEnd: resolve,
        }));
      } else {
        const hostActive = theirClones.find((m) => !isFainted(m)) || theirClones[0];
        pushScene(new BattleScene({
          kind: "link",
          mode: "guest",
          music: "battle",
          myParty: myClones,
          myActive: 0,
          foeParty: theirClones, // 相手の手持ち数(ボール表示)用
          foeSummary: summaryOf(hostActive),
          foeTrainer: { name: this.peerName },
          remote: {
            sendAction: (a) => this.room.send("action", a),
            nextEvents: () => this.room.waitFor("events", WAIT_LONG),
          },
          onEnd: resolve,
        }));
      }
    });
    audio.playMusic("town");
    if (result === "win") await ui.say("つうしんたいせんに かった! やったね!");
    else if (result === "lose") await ui.say("まけちゃった… でも いい しょうぶだった!");
    await ui.say(`${this.peerName}との たいせんが おわった。`);
  }

  // ---------- 描画 ----------
  draw(ctx, t) {
    drawDarkPanel(ctx, 0, 0, SCREEN_W, SCREEN_H);
    drawTextShadow(ctx, "★ つうしんルーム ★", 8, 6, "#f8d030");
    drawWindow(ctx, 6, 20, SCREEN_W - 12, 60);
    this.status.forEach((line, i) => drawText(ctx, line, 12, 26 + i * 13, "#303030"));
    // 接続インジケータ
    if (this.room) {
      const blink = Math.floor(t / 500) % 2 === 0;
      ctx.fillStyle = blink ? "#58c858" : "#98e898";
      ctx.fillRect(SCREEN_W - 20, 8, 6, 6);
    }
    // あいことば入力
    if (this.state === "code") {
      drawWindow(ctx, 60, 88, 120, 46);
      drawText(ctx, "↑↓で すうじ / Aで けってい", 66, 94, "#606060");
      for (let i = 0; i < 4; i++) {
        const x = 78 + i * 22;
        drawWindow(ctx, x, 106, 18, 22);
        drawText(ctx, String(this.code[i]), x + 6, 112, i === this.codeCursor ? "#c03028" : "#303030");
        if (i === this.codeCursor) {
          ctx.fillStyle = "#c03028";
          ctx.fillRect(x + 3, 124, 12, 2);
        }
      }
    }
    // 交換オファー表示
    if (this.offerMine || this.offerTheirs) {
      drawWindow(ctx, 6, 84, SCREEN_W - 12, 66);
      drawText(ctx, "こちら", 30, 90, "#606060");
      drawText(ctx, "あいて", 160, 90, "#606060");
      if (this.offerMine) {
        drawMonSprite(ctx, this.offerMine.species, 24, 100, 2);
        drawText(ctx, `${this.offerMine.name} Lv${this.offerMine.level}`, 12, 136, "#303030");
      }
      drawText(ctx, "⇔", 114, 110, "#c03028");
      if (this.offerTheirs) {
        try {
          species(this.offerTheirs.species);
          drawMonSprite(ctx, this.offerTheirs.species, 154, 100, 2);
          drawText(ctx, `${this.offerTheirs.name} Lv${this.offerTheirs.level}`, 142, 136, "#303030");
        } catch { /* 不明データは表示しない */ }
      }
    }
  }
}
