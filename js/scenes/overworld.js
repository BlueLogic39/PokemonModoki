// フィールドシーン: マップ移動・NPC・イベント・エンカウント
import { G, pushScene, markSeen } from "../game.js";
import { input } from "../engine/input.js";
import { audio } from "../engine/audio.js";
import { ui } from "../engine/ui.js";
import {
  TILE, SCREEN_W, SCREEN_H, drawTileAt, drawChar, drawMonSprite, isSolid, drawText, drawWindow,
} from "../engine/render.js";
import { mapData } from "../data/maps.js";
import { SCRIPTS } from "../data/events.js";
import { makeMon } from "../core/monster.js";
import { Battle } from "../core/battle.js";
import { BattleScene } from "./battle_scene.js";
import { MenuScene } from "./menu.js";
import { ShopScene } from "./shop.js";
import { BoxScene } from "./box.js";
import { healMon } from "../core/monster.js";

const WALK_MS = 170;
const RUN_MS = 105;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function condOk(cond, player) {
  if (!cond) return true;
  if (cond.flag && !player.flags[cond.flag]) return false;
  if (cond.notFlag && player.flags[cond.notFlag]) return false;
  if (cond.notBadges !== undefined && player.badges.length >= cond.notBadges) return false;
  return true;
}

export class OverworldScene {
  constructor() {
    this.map = null;
    this.npcs = [];
    this.moving = false;
    this.prog = 0;
    this.fromX = 0; this.fromY = 0;
    this.scriptRunning = false;
    this.fade = 0;
    this.exclaim = null; // {x,y,until} トレーナー発見の「!」
  }

  enter() {
    this.loadMap(G.player.map, false);
    if (!G.player.respawn) G.player.respawn = { map: "player_home", x: 4, y: 5 };
  }

  loadMap(id, fade = true) {
    const m = mapData(id);
    this.map = m;
    G.player.map = id;
    this.w = m.tiles[0].length;
    this.h = m.tiles.length;
    this.npcs = (m.npcs || []).map((def) => ({
      ...def,
      ox: def.x, oy: def.y,
      wanderT: 2000 + Math.random() * 2000,
      moving: false, prog: 0, fromX: def.x, fromY: def.y,
    }));
    if (fade) this.fade = 1;
    audio.playMusic(m.music || "route");
    this.checkOnEnterTriggers();
  }

  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return "T";
    return this.map.tiles[y][x];
  }

  npcAt(x, y) {
    return this.npcs.find((n) => condOk(n.condition, G.player) &&
      ((n.x === x && n.y === y) || (n.moving && n.fromX === x && n.fromY === y)));
  }

  walkable(x, y, isNpc = false) {
    const ch = this.tileAt(x, y);
    if (isSolid(ch)) return false;
    if (this.npcAt(x, y)) return false;
    if (isNpc) {
      if (G.player.x === x && G.player.y === y) return false;
      if ((this.map.warps || []).some((w) => w.x === x && w.y === y)) return false;
      if (ch === "G") return false;
    }
    return true;
  }

  busy() {
    return this.scriptRunning || ui.busy();
  }

  // ---------- 更新 ----------
  update(dt, t) {
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt / 300);
    this.updateNpcs(dt);

    const p = G.player;
    if (this.moving) {
      this.prog += dt / (input.isDown("run") ? RUN_MS : WALK_MS);
      if (this.prog >= 1) {
        this.moving = false;
        this.prog = 0;
        this.onStepComplete();
      }
      return;
    }
    if (this.busy()) return;

    if (input.justPressed("a")) { this.interact(); return; }
    if (input.justPressed("b")) { pushScene(new MenuScene(this)); return; }

    const dir = input.dirHeld();
    if (dir) {
      if (p.dir !== dir && !input.isDown("run")) {
        // まず向きだけ変える (短押し)
        p.dir = dir;
      }
      p.dir = dir;
      const [dx, dy] = DIRS[dir];
      const nx = p.x + dx, ny = p.y + dy;
      if (this.walkable(nx, ny)) {
        this.fromX = p.x; this.fromY = p.y;
        p.x = nx; p.y = ny;
        this.moving = true;
        this.prog = 0;
      } else if (input.justPressed(dir)) {
        audio.sfx("bump");
      }
    }
  }

  updateNpcs(dt) {
    for (const n of this.npcs) {
      if (n.moving) {
        n.prog += dt / 260;
        if (n.prog >= 1) { n.moving = false; n.prog = 0; }
        continue;
      }
      if (!n.wander || this.busy()) continue;
      n.wanderT -= dt;
      if (n.wanderT <= 0) {
        n.wanderT = 1800 + Math.random() * 2600;
        const dirs = Object.keys(DIRS);
        const d = dirs[Math.floor(Math.random() * 4)];
        const [dx, dy] = DIRS[d];
        const nx = n.x + dx, ny = n.y + dy;
        n.dir = d;
        if (Math.abs(nx - n.ox) <= 1 && Math.abs(ny - n.oy) <= 1 && this.walkable(nx, ny, true)) {
          n.fromX = n.x; n.fromY = n.y;
          n.x = nx; n.y = ny;
          n.moving = true; n.prog = 0;
        }
      }
    }
  }

  async onStepComplete() {
    const p = G.player;
    // ワープ
    const warp = (this.map.warps || []).find((w) => w.x === p.x && w.y === p.y);
    if (warp) {
      if (warp.condition && !condOk(warp.condition, p)) {
        if (warp.failText) {
          this.scriptRunning = true;
          await ui.say(warp.failText);
          this.scriptRunning = false;
        }
        this.stepBack();
        return;
      }
      p.x = warp.tx; p.y = warp.ty;
      this.loadMap(warp.to);
      return;
    }
    // トリガー
    const trig = (this.map.triggers || []).find((tr) => tr.x === p.x && tr.y === p.y &&
      condOk(tr.condition, p) && (!tr.once || !p.flags[tr.once]));
    if (trig) {
      if (trig.once) p.flags[trig.once] = true;
      await this.runScript(trig.script);
      return;
    }
    // エンカウント
    const enc = this.map.encounters;
    if (enc && this.tileAt(p.x, p.y) === (enc.tiles || "G") && Math.random() < enc.rate) {
      await this.startWildFromTable(enc.table);
      return;
    }
    // トレーナーの視線
    await this.checkTrainerSight();
  }

  stepBack() {
    const p = G.player;
    const [dx, dy] = DIRS[p.dir];
    const bx = p.x - dx, by = p.y - dy;
    if (this.walkable(bx, by)) { p.x = bx; p.y = by; }
  }

  checkOnEnterTriggers() {
    // マップ進入時トリガーは現状未使用 (拡張ポイント)
  }

  // ---------- 会話・調べる ----------
  async interact() {
    const p = G.player;
    const [dx, dy] = DIRS[p.dir];
    let tx = p.x + dx, ty = p.y + dy;
    let npc = this.npcAt(tx, ty);
    // カウンター越し
    if (!npc && this.tileAt(tx, ty) === "C") {
      npc = this.npcAt(tx + dx, ty + dy);
    }
    if (npc) {
      npc.dir = { up: "down", down: "up", left: "right", right: "left" }[p.dir] || "down";
      if (npc.trainer) { await this.startTrainerNpc(npc, false); return; }
      if (npc.shop) {
        this.scriptRunning = true;
        await ui.say("いらっしゃいませ! なにを おもとめですか?");
        this.scriptRunning = false;
        pushScene(new ShopScene(npc.shop));
        return;
      }
      if (npc.script) { await this.runScript(npc.script); return; }
      if (npc.lines) {
        this.scriptRunning = true;
        for (const line of npc.lines) await ui.say(line);
        this.scriptRunning = false;
        return;
      }
      return;
    }
    // 看板
    const sign = (this.map.signs || []).find((s) => s.x === tx && s.y === ty);
    if (sign) {
      this.scriptRunning = true;
      await ui.say(sign.text);
      this.scriptRunning = false;
      return;
    }
    // パソコン (ボックス)
    if ((this.map.pcSpots || []).some((s) => s.x === tx && s.y === ty)) {
      audio.sfx("confirm");
      pushScene(new BoxScene());
      return;
    }
    // 回復マシンなど
    if (this.tileAt(tx, ty) === "H") {
      this.scriptRunning = true;
      await ui.say("かいふくマシンだ。 センターの おねえさんに たのもう。");
      this.scriptRunning = false;
    }
  }

  // ---------- トレーナー ----------
  async checkTrainerSight() {
    for (const n of this.npcs) {
      if (!n.trainer || !condOk(n.condition, G.player)) continue;
      if (G.player.flags[n.trainer.flag]) continue;
      const sight = n.trainer.sight || 0;
      if (!sight) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= sight; i++) {
        const cx = n.x + dx * i, cy = n.y + dy * i;
        if (G.player.x === cx && G.player.y === cy) {
          await this.startTrainerNpc(n, true);
          return;
        }
        const ch = this.tileAt(cx, cy);
        if (isSolid(ch) || this.npcAt(cx, cy)) break;
      }
    }
  }

  async startTrainerNpc(npc, spotted) {
    const p = G.player;
    this.scriptRunning = true;
    if (spotted) {
      audio.sfx("encounter");
      this.exclaim = { x: npc.x, y: npc.y, until: Date.now() + 700 };
      await new Promise((r) => setTimeout(r, 700));
      // プレイヤーの方を向かせ、隣まで歩かせる
      const [dx, dy] = DIRS[npc.dir];
      while (Math.abs(npc.x + dx - p.x) + Math.abs(npc.y + dy - p.y) > 0 &&
             Math.abs(npc.x - p.x) + Math.abs(npc.y - p.y) > 1) {
        npc.x += dx; npc.y += dy;
        await new Promise((r) => setTimeout(r, 220));
      }
      p.dir = { up: "down", down: "up", left: "right", right: "left" }[npc.dir];
    }
    const t = npc.trainer;
    for (const line of t.intro || []) await ui.say(line);
    this.scriptRunning = false;
    const result = await this.battleTrainer({
      name: t.name, pal: npc.pal, party: t.party, money: t.money, lose: t.lose,
    });
    if (result === "win") {
      G.player.flags[t.flag] = true;
      this.scriptRunning = true;
      for (const line of t.after || []) await ui.say(line);
      this.scriptRunning = false;
    }
  }

  // ---------- バトル ----------
  battleTrainer(def) {
    return new Promise((resolve) => {
      const foeParty = def.party.map(([id, lv]) => makeMon(id, lv));
      const battle = new Battle({
        myParty: G.player.party,
        foeParty,
        kind: "trainer",
        trainerName: def.name,
        prizeMoney: def.money || 0,
      });
      pushScene(new BattleScene({
        battle,
        kind: "trainer",
        mode: "local",
        music: def.music || "battle",
        foeTrainer: { name: def.name, pal: def.pal, loseText: def.lose },
        onEnd: async (result) => {
          audio.playMusic(this.map.music || "route");
          if (result === "lose") await this.respawn();
          resolve(result);
        },
      }));
    });
  }

  battleWild(speciesId, level, opts = {}) {
    return new Promise((resolve) => {
      const wild = makeMon(speciesId, level);
      markSeen(speciesId);
      const battle = new Battle({
        myParty: G.player.party,
        foeParty: [wild],
        kind: "wild",
      });
      pushScene(new BattleScene({
        battle,
        kind: "wild",
        mode: "local",
        music: opts.music || "battle",
        onEnd: async (result) => {
          audio.playMusic(this.map.music || "route");
          if (result === "lose") await this.respawn();
          resolve(result);
        },
      }));
    });
  }

  async startWildFromTable(table) {
    const total = table.reduce((a, e) => a + e[3], 0);
    let r = Math.random() * total;
    let pick = table[0];
    for (const e of table) { r -= e[3]; if (r <= 0) { pick = e; break; } }
    const level = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1));
    await this.battleWild(pick[0], level);
  }

  async respawn() {
    const p = G.player;
    for (const m of p.party) healMon(m);
    const r = p.respawn || { map: "player_home", x: 4, y: 5 };
    p.x = r.x; p.y = r.y; p.dir = "down";
    this.loadMap(r.map);
    this.scriptRunning = true;
    await ui.say("……きがつくと あんしんできる ばしょに いた。 モンスターたちは かいふくしている!");
    this.scriptRunning = false;
  }

  // ---------- イベントスクリプト ----------
  async runScript(name) {
    const fn = SCRIPTS[name];
    if (!fn) { console.warn("unknown script", name); return; }
    this.scriptRunning = true;
    const scene = this;
    const ctx = {
      player: G.player,
      say: (text) => ui.say(text),
      ask: (items, opts) => ui.ask(items, opts),
      confirm: (text) => ui.confirm(text),
      sfx: (n) => audio.sfx(n),
      music: (n) => audio.playMusic(n || scene.map.music || "route"),
      hasFlag: (f) => !!G.player.flags[f],
      setFlag: (f, v = true) => { G.player.flags[f] = v; },
      badgeCount: () => G.player.badges.length,
      addBadge: (name) => { if (!G.player.badges.includes(name)) G.player.badges.push(name); },
      giveItem: (id, count = 1) => { G.player.bag[id] = (G.player.bag[id] || 0) + count; },
      giveMon: (id, level) => {
        const mon = makeMon(id, level);
        mon.ot = G.player.name;
        if (G.player.party.length < 6) G.player.party.push(mon);
        else G.player.box.push(mon);
        markSeen(id);
        G.player.dexCaught[id] = true;
      },
      healParty: () => { for (const m of G.player.party) healMon(m); },
      setRespawn: () => { G.player.respawn = { map: G.player.map, x: G.player.x, y: G.player.y }; },
      stepBack: () => scene.stepBack(),
      warp: (map, x, y) => { G.player.x = x; G.player.y = y; scene.loadMap(map); },
      battleTrainer: async (def) => {
        scene.scriptRunning = false;
        const r = await scene.battleTrainer(def);
        scene.scriptRunning = true;
        return r;
      },
      battleWild: async (id, lv, opts) => {
        scene.scriptRunning = false;
        const r = await scene.battleWild(id, lv, opts);
        scene.scriptRunning = true;
        return r;
      },
    };
    try {
      await fn(ctx);
    } finally {
      this.scriptRunning = false;
    }
  }

  // ---------- 描画 ----------
  draw(ctx, t) {
    const p = G.player;
    // 補間位置
    const lerp = (a, b, r) => a + (b - a) * r;
    const px = this.moving ? lerp(this.fromX, p.x, this.prog) : p.x;
    const py = this.moving ? lerp(this.fromY, p.y, this.prog) : p.y;

    let camX = Math.round(px * TILE + TILE / 2 - SCREEN_W / 2);
    let camY = Math.round(py * TILE + TILE / 2 - SCREEN_H / 2);
    camX = Math.max(0, Math.min(this.w * TILE - SCREEN_W, camX));
    camY = Math.max(0, Math.min(this.h * TILE - SCREEN_H, camY));
    if (this.w * TILE < SCREEN_W) camX = -(SCREEN_W - this.w * TILE) / 2;
    if (this.h * TILE < SCREEN_H) camY = -(SCREEN_H - this.h * TILE) / 2;

    const x0 = Math.max(0, Math.floor(camX / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE));
    const x1 = Math.min(this.w - 1, Math.ceil((camX + SCREEN_W) / TILE));
    const y1 = Math.min(this.h - 1, Math.ceil((camY + SCREEN_H) / TILE));

    ctx.fillStyle = "#101018";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const indoor = this.map.indoor;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let ch = this.map.tiles[y][x];
        if (indoor && ch === ".") ch = "M";
        drawTileAt(ctx, ch, x, y, x * TILE - camX, y * TILE - camY, t);
      }
    }

    // 描画順 (y ソート): NPC + プレイヤー
    const actors = [];
    for (const n of this.npcs) {
      if (!condOk(n.condition, G.player)) continue;
      const nx = n.moving ? lerp(n.fromX, n.x, n.prog) : n.x;
      const ny = n.moving ? lerp(n.fromY, n.y, n.prog) : n.y;
      actors.push({ x: nx, y: ny, npc: n });
    }
    actors.push({ x: px, y: py, player: true });
    actors.sort((a, b) => a.y - b.y);

    for (const a of actors) {
      const sx = a.x * TILE - camX;
      const sy = a.y * TILE - camY;
      if (a.player) {
        const bob = this.moving && Math.floor(this.prog * 4) % 2 === 0 ? 1 : 0;
        drawChar(ctx, p.gender === "girl" ? "player_girl" : "player", p.dir, sx, sy, bob);
      } else if (a.npc.mon) {
        drawMonSprite(ctx, a.npc.mon, sx, sy - 2, 1);
      } else {
        const bob = a.npc.moving && Math.floor(a.npc.prog * 4) % 2 === 0 ? 1 : 0;
        drawChar(ctx, a.npc.pal, a.npc.dir || "down", sx, sy, bob);
      }
    }

    // トレーナーの「!」
    if (this.exclaim && Date.now() < this.exclaim.until) {
      const sx = this.exclaim.x * TILE - camX;
      const sy = this.exclaim.y * TILE - camY - 14;
      drawWindow(ctx, sx + 2, sy, 12, 13);
      drawText(ctx, "!", sx + 6, sy + 3, "#c03028");
    }

    // マップ名 (入場直後)
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(16,16,24,${this.fade})`;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    ctx.font = '8px "MS Gothic", monospace';
  }
}
