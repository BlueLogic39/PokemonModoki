// ストーリーイベントスクリプト
// ctx API (scenes/overworld.js が提供):
//   say, ask, confirm, battleTrainer(def), battleWild(species, level, opts),
//   giveMon, giveItem, setFlag, hasFlag, badgeCount, addBadge,
//   healParty, stepBack, player, sfx, music

const STARTERS = [
  { id: "leafy", label: "リーフィ (くさタイプ)", desc: "おだやかで そだてやすい くさタイプ。" },
  { id: "hinokon", label: "ヒノコン (ほのおタイプ)", desc: "げんきいっぱいの ほのおタイプ。" },
  { id: "shizumin", label: "シズミン (みずタイプ)", desc: "のんびりやさんの みずタイプ。" },
];
const COUNTER = { leafy: "hinokon", hinokon: "shizumin", shizumin: "leafy" };

function rivalStarter(ctx, level) {
  const mine = ctx.player.flags.starter || "leafy";
  const sp = COUNTER[mine];
  // Lv16以上なら進化形
  const EVO = { leafy: "foresta", hinokon: "goemba", shizumin: "taidarn" };
  return [level >= 16 ? EVO[sp] : sp, level];
}

export const SCRIPTS = {
  // ---------- 導入 ----------
  async blockRoute1(ctx) {
    await ctx.say("カエデはかせ『まちなさ〜い!!』");
    await ctx.say("カエデはかせ『モンスターも つれずに くさむらに はいっては いけないよ! やせいの モンスターに おそわれてしまう!』");
    await ctx.say("カエデはかせ『わたしの けんきゅうじょに おいで。 いいものを あげよう。』");
    ctx.stepBack();
  },

  async momTalk(ctx) {
    if (!ctx.hasFlag("intro_done")) {
      await ctx.say(`ママ『${ctx.player.name}、きょうから いよいよ トレーナーデビューね!』`);
      await ctx.say("ママ『カエデはかせが けんきゅうじょで まってるわよ。 いってらっしゃい!』");
    } else {
      await ctx.say("ママ『おかえりなさい! つかれた かおしてるわね。』");
      await ctx.say("ママ『ゆっくり やすんでいきなさい。』");
      ctx.sfx("heal");
      ctx.healParty();
      await ctx.say("モンスターたちは げんきいっぱいに かいふくした!");
    }
  },

  async profIntro(ctx) {
    if (!ctx.hasFlag("intro_done")) {
      await ctx.say("カエデはかせ『おお きたね! まっていたよ。』");
      await ctx.say("カエデはかせ『わたしは モンスターの けんきゅうを している カエデ。 この トモシビちほうには ふしぎな いきもの モンスターが たくさん すんでいる。』");
      await ctx.say("カエデはかせ『きみには この ずかん 【モンスターずかん】と あいぼうを たくそう!』");
      let chosen = null;
      while (!chosen) {
        const i = await ctx.ask(STARTERS.map((s) => s.label), { canCancel: false });
        const s = STARTERS[i];
        await ctx.say(s.desc);
        if (await ctx.confirm(`${s.label.split(" ")[0]}に けってい する?`)) chosen = s;
      }
      ctx.giveMon(chosen.id, 5);
      ctx.setFlag("starter", chosen.id);
      ctx.sfx("caught");
      await ctx.say(`${ctx.player.name}は あいぼうを てにいれた!`);
      ctx.giveItem("ball1", 5);
      await ctx.say("カエデはかせ『キャプボールも 5こ もっていきなさい。 くさむらで よわらせてから なげると つかまえやすいぞ。』");
      await ctx.say("カエデはかせ『わたしの むすこの ソラも けさ たびだった。 きっと どこかで であうだろう。』");
      await ctx.say("カエデはかせ『トモシビちほうには 4にんの ジムリーダーが いる。 バッジを 4つ あつめれば チャンピオンに ちょうせんできる!』");
      await ctx.say("カエデはかせ『それと… さいきん シャドウだん という わるものが あばれている。 じゅうぶん きをつけて。』");
      ctx.setFlag("intro_done", true);
    } else if (!ctx.hasFlag("badge1")) {
      await ctx.say("カエデはかせ『まずは きたの コモレビちょうの ジムに ちょうせんしてみるといい。』");
    } else if (!ctx.hasFlag("champion_beaten")) {
      await ctx.say("カエデはかせ『ずかんは うまってきたかな? けいぞくは ちからなり だよ。』");
    } else {
      await ctx.say("カエデはかせ『チャンピオンおめでとう! きみは わたしの じまんの トレーナーだ!』");
    }
  },

  // ---------- ライバル ----------
  async rival1(ctx) {
    await ctx.say("ソラ『おっ! きみが けんきゅうじょで あいぼうを もらった トレーナーだね?』");
    await ctx.say("ソラ『ぼくは ソラ! カエデはかせの むすこ! ちょうど いい、 しょうぶしようよ!』");
    await ctx.battleTrainer({
      name: "ライバルの ソラ", pal: "rival", money: 300,
      party: [rivalStarter(ctx, 5)],
      lose: ["ソラ『うわー まけた! きみ つよいね!』"],
      win: ["ソラ『よーし かった! おたがい がんばろうね!』"],
    });
    await ctx.say("ソラ『ぼくは バッジを あつめて チャンピオンに なるんだ! きみも コモレビジムに ちょうせんしなよ!』");
    await ctx.say("ソラは かぜのように はしっていった!");
  },

  async rival2(ctx) {
    await ctx.say("ソラ『やあ! どうくつを ぬけてきたんだね!』");
    await ctx.say("ソラ『ぼくの チーム つよくなったよ。 みせてあげる!』");
    await ctx.battleTrainer({
      name: "ライバルの ソラ", pal: "rival", money: 700,
      party: [["pipitto", 12], rivalStarter(ctx, 14)],
      lose: ["ソラ『ええー!? また まけたー!』"],
      win: ["ソラ『へへん! しゅぎょうの せいかさ!』"],
    });
    await ctx.say("ソラ『そういえば くろい ふくの シャドウだんが みなとで あばれてたよ。 きをつけてね!』");
  },

  async rival3(ctx) {
    await ctx.say("ソラ『…きたんだね。 ここで まってたんだ。』");
    await ctx.say("ソラ『チャンピオンに いどめるのは ひとり だけ。 だから… ここで ぜんりょくの しょうぶだ!!』");
    await ctx.battleTrainer({
      name: "ライバルの ソラ", pal: "rival", money: 2000,
      party: [["sorahane", 34], ["goukender", 33], rivalStarter(ctx, 36)],
      lose: ["ソラ『…かんぺきに まけた。 きみは ほんものだ。』"],
      win: ["ソラ『やった! …でも きみは ここで おわる トレーナーじゃない よね。』"],
    });
    await ctx.say("ソラ『いきなよ。 チャンピオンの アカツキさんは この さきだ。』");
    await ctx.say("ソラ『きみなら… かてるよ!』");
  },

  // ---------- ジムリーダー ----------
  async gymLeader1(ctx) {
    if (ctx.hasFlag("badge1")) {
      await ctx.say("ミドリ『フォレストバッジが きみの かつやくを みまもっているよ。』");
      return;
    }
    await ctx.say("ミドリ『ようこそ コモレビジムへ。 わたしは もりと むしを あいする ミドリ。』");
    await ctx.say("ミドリ『ちいさな いのちの おおきな ちから、 みせてあげる!』");
    const r = await ctx.battleTrainer({
      name: "ジムリーダーの ミドリ", pal: "leader1", money: 1100,
      party: [["kemukemu", 8], ["choumai", 11]],
      lose: ["ミドリ『まけたわ。 きみと モンスターの きずなの かちね。』"],
      win: ["ミドリ『もりの ちからは まだまだ おくが ふかいのよ。』"],
    });
    if (r === "win") {
      ctx.sfx("badge");
      ctx.addBadge("フォレストバッジ");
      ctx.setFlag("badge1", true);
      await ctx.say("フォレストバッジを てにいれた!");
      await ctx.say("ミドリ『つぎは ひがしの どうくつを ぬけて ミナトしへ。 ジムリーダーの ナギサに よろしくね。』");
    }
  },

  async gymLeader2(ctx) {
    if (ctx.hasFlag("badge2")) {
      await ctx.say("ナギサ『うみは ひろいぞ〜。 また いつでも あそびに こい!』");
      return;
    }
    await ctx.say("ナギサ『おう! おれは ミナトジムの ナギサ! うみの おとこだ!』");
    await ctx.say("ナギサ『なみの ちからに のまれるなよ!』");
    const r = await ctx.battleTrainer({
      name: "ジムリーダーの ナギサ", pal: "leader2", money: 1700,
      party: [["shizumin", 14], ["taidarn", 17]],
      lose: ["ナギサ『でっけえ なみに のまれた きぶんだ! あっぱれ!』"],
      win: ["ナギサ『うみを なめると いたいめに あうぜ!』"],
    });
    if (r === "win") {
      ctx.sfx("badge");
      ctx.addBadge("マリンバッジ");
      ctx.setFlag("badge2", true);
      await ctx.say("マリンバッジを てにいれた!");
      await ctx.say("ナギサ『きたの ライメイちょうは かみなりの まち。 ジムリーダーの ライゾウは ごうかいな やつだぜ!』");
    }
  },

  async gymLeader3(ctx) {
    if (ctx.hasFlag("badge3")) {
      await ctx.say("ライゾウ『ガハハ! ボルトバッジは ひかってるか!?』");
      return;
    }
    await ctx.say("ライゾウ『ガハハハ! よくきた! おれが らいめいの ライゾウだ!』");
    await ctx.say("ライゾウ『いなずまの はやさ、 みきれるかな!?』");
    const r = await ctx.battleTrainer({
      name: "ジムリーダーの ライゾウ", pal: "leader3", money: 2300,
      party: [["biribo", 19], ["raigoron", 23]],
      lose: ["ライゾウ『ガハハ! しびれる ほどの つよさだ!』"],
      win: ["ライゾウ『でんこうせっか! しゅぎょうし なおして こい!』"],
    });
    if (r === "win") {
      ctx.sfx("badge");
      ctx.addBadge("ボルトバッジ");
      ctx.setFlag("badge3", true);
      await ctx.say("ボルトバッジを てにいれた!");
      await ctx.say("ライゾウ『ひがしの やまを こえれば テンクウし。 さいごの ジムリーダー ヨミが まってるぜ。』");
      if (!ctx.hasFlag("power_done")) {
        await ctx.say("ライゾウ『…それと はつでんしょの シャドウだんを なんとか してくれると たすかるんだが な。』");
      }
    }
  },

  async gymLeader4(ctx) {
    if (ctx.hasFlag("badge4")) {
      await ctx.say("ヨミ『ゴーストバッジと ともに… よき たびを…。』");
      return;
    }
    await ctx.say("ヨミ『…ようこそ。 わたしは よみの くにの もりびと ヨミ。』");
    await ctx.say("ヨミ『みえないものを おそれる こころ… それが あなたの よわさに なる…。』");
    const r = await ctx.battleTrainer({
      name: "ジムリーダーの ヨミ", pal: "leader4", money: 3000,
      party: [["hotabi", 27], ["yumemira", 28], ["onibirasu", 30]],
      lose: ["ヨミ『…あなたの こころに くもりは ない。 みごと。』"],
      win: ["ヨミ『まだ こころに まよいが ある よう…。』"],
    });
    if (r === "win") {
      ctx.sfx("badge");
      ctx.addBadge("ゴーストバッジ");
      ctx.setFlag("badge4", true);
      await ctx.say("ゴーストバッジを てにいれた! これで バッジが 4つ そろった!");
      await ctx.say("ヨミ『…きたの もんの さきは チャンピオンロード。』");
      await ctx.say("ヨミ『…ですが その まえに。 まちの みなみの たてものに シャドウだんが ひそんでいます。 『ほしのカギ』を とりもどして…。』");
    }
  },

  // ---------- シャドウ団 ----------
  async caveGrunts(ctx) {
    if (ctx.hasFlag("cave_grunts_done")) return;
    ctx.music("evil");
    await ctx.say("シャドウだんの したっぱ『おい! ガキが みてるぞ!』");
    await ctx.say("したっぱ『みられたからには しかたねえ… けすぞ!』");
    const r1 = await ctx.battleTrainer({
      name: "シャドウだんの したっぱ", pal: "grunt", money: 350,
      party: [["dokudama", 10], ["koronezu", 9]],
      lose: ["したっぱ『ちっ… つよいガキだ!』"],
      win: ["したっぱ『へへっ よわいくせに でしゃばるからだ!』"],
    });
    if (r1 !== "win") { ctx.music(null); return; }
    await ctx.say("したっぱB『この やろう! おれが あいてだ!』");
    const r2 = await ctx.battleTrainer({
      name: "シャドウだんの したっぱ", pal: "grunt", money: 350,
      party: [["hotabi", 10]],
      lose: ["したっぱB『おぼえてろよ〜!!』"],
      win: ["したっぱB『ざまあみろ!』"],
    });
    if (r2 !== "win") { ctx.music(null); return; }
    await ctx.say("したっぱたちは 『ほしのちからの けんきゅうは つづく…』と すてゼリフを のこして にげていった!");
    ctx.setFlag("cave_grunts_done", true);
    ctx.music(null);
  },

  async minatoPier(ctx) {
    if (ctx.hasFlag("minato_pier_done")) return;
    ctx.music("evil");
    await ctx.say("ふなのり『たすけてくれー! シャドウだんが にもつを うばっていくんだ!』");
    await ctx.say("シャドウだんの したっぱ『じゃまだ じゃまだ! この にもつは シャドウだんが いただく!』");
    const r = await ctx.battleTrainer({
      name: "シャドウだんの したっぱ", pal: "grunt", money: 450,
      party: [["dokudama", 13], ["hotabi", 13]],
      lose: ["したっぱ『くそっ! にもつは おいていってやる!』"],
      win: ["したっぱ『にもつは いただいていくぜ!』"],
    });
    ctx.music(null);
    if (r !== "win") return;
    await ctx.say("シャドウだんの したっぱは にげていった!");
    ctx.giveItem("ball2", 3);
    await ctx.say("ふなのり『ありがとう! おれいに シルバーボールを 3つ うけとってくれ!』");
    ctx.setFlag("minato_pier_done", true);
  },

  async raimeiIntro(ctx) {
    await ctx.say("むらびと『たいへんだ! たいへんだ!』");
    await ctx.say("むらびと『シャドウだんが はつでんしょを のっとって まちが ていでんしたんだ!』");
    await ctx.say("むらびと『はつでんしょは まちの ひだりした! たのむ、 なんとかしてくれ!』");
  },

  async bossGenba(ctx) {
    if (ctx.hasFlag("power_done")) return;
    await ctx.say("シャドウだんかんぶ ゲンバ『…なんだ この ガキは。』");
    await ctx.say("ゲンバ『ほしのちからを うごかすには でんきが いる。 だから ここを いただいた。 それだけの ことだ。』");
    await ctx.say("ゲンバ『こどもは いえに かえって ねてろ!』");
    const r = await ctx.battleTrainer({
      name: "シャドウだんかんぶ ゲンバ", pal: "boss", money: 2000,
      party: [["mogurai", 20], ["dokudama", 21]],
      lose: ["ゲンバ『…ちっ。 ガキに てこずるとは。』"],
      win: ["ゲンバ『しょせん こどもか。』"],
    });
    if (r !== "win") return;
    await ctx.say("ゲンバ『ひきあげだ! …だが おぼえておけ。 ボスは すでに 『ほしのカギ』を てにいれた。』");
    await ctx.say("ゲンバ『てんくうの とびらが ひらくとき… この よは かわる!』");
    await ctx.say("シャドウだんは はつでんしょから ひきあげていった! まちに でんきが もどった!");
    ctx.giveItem("ball3", 2);
    await ctx.say("さぎょういん『ありがとう! おれいに ゴールドボールを 2つ どうぞ!』");
    ctx.setFlag("power_done", true);
  },

  async bossKurogane(ctx) {
    if (ctx.hasFlag("boss_beaten")) return;
    await ctx.say("……おくの へやに おとこが たっている。");
    await ctx.say("シャドウだん ボス クロガネ『…よく ここまで きたな。 ほめてやろう。』");
    await ctx.say("クロガネ『ほしふりの とうに ねむる でんせつの りゅう テンゲンリュウ。 その ちからが あれば この よを おもいのままに できる。』");
    await ctx.say("クロガネ『ほしのカギは ここに ある。 ほしければ… ちからずくで うばってみろ!!』");
    const r = await ctx.battleTrainer({
      name: "シャドウだんボス クロガネ", pal: "boss", money: 5000,
      party: [["dokudama", 29], ["onibirasu", 31], ["gansekioh", 32]],
      lose: ["クロガネ『……この おれが… こどもに…。』"],
      win: ["クロガネ『ふん。 その ていどか。』"],
    });
    if (r !== "win") return;
    await ctx.say("クロガネ『…もっていけ。 だが おぼえておけ、 でんせつの りゅうは にんげんを えらぶ。』");
    ctx.sfx("badge");
    await ctx.say("『ほしのカギ』を とりもどした!");
    ctx.giveItem("ballX", 1);
    await ctx.say("クロガネが おとした ミラクルボールも てにいれた!");
    await ctx.say("クロガネ『シャドウだんは かいさんだ。 …おまえの ような トレーナーが いるなら この よも わるくない。』");
    ctx.setFlag("boss_beaten", true);
  },

  // ---------- 伝説 ----------
  async legendEncounter(ctx) {
    await ctx.say("…とうの さいじょうかい。 ほしあかりが ふりそそいでいる。");
    await ctx.say("グオオオオオオン!!");
    await ctx.say("でんせつの りゅう テンゲンリュウが めを さました!");
    const r = await ctx.battleWild("tengenryu", 45, { music: "legend" });
    if (r === "caught") {
      await ctx.say("テンゲンリュウは あなたを みとめ、 ちからを かしてくれるようだ!");
      ctx.setFlag("legend_done", true);
    } else if (r === "win") {
      await ctx.say("テンゲンリュウは おおぞらへ とんでいった…。");
      await ctx.say("…また いつか であえる きが する。");
      ctx.setFlag("legend_done", true);
    } else if (r === "ran") {
      await ctx.say("テンゲンリュウは しずかに こちらを みつめている…。");
    }
  },

  // ---------- リーグ ----------
  async leagueGate(ctx) {
    await ctx.say("もんばん『ここから さきは チャンピオンロード。』");
    await ctx.say(`もんばん『バッジ 4つが つうこうの あかし。 …いまの きみは ${ctx.badgeCount()}こ か。 でなおして きな!』`);
    ctx.stepBack();
  },

  async championBattle(ctx) {
    if (ctx.hasFlag("champion_beaten")) {
      await ctx.say("チャンピオン アカツキ『やあ チャンピオン。 きょうも いい かぜが ふいているね。』");
      return;
    }
    await ctx.say("アカツキ『ようこそ、 トモシビでんどうへ。』");
    await ctx.say("アカツキ『わたしは チャンピオンの アカツキ。 ここまでの たびで きみが つちかった すべてを みせてほしい。』");
    await ctx.say("アカツキ『いくぞ… これが ちょうじょうの たたかいだ!!』");
    const r = await ctx.battleTrainer({
      name: "チャンピオンの アカツキ", pal: "champion", money: 10000,
      party: [["sorahane", 38], ["gansekioh", 38], ["yumemira", 39], ["goukender", 39], ["ryugaoh", 41]],
      lose: ["アカツキ『…みごとだ。 きみの モンスターたちは ひかりかがやいて いた。』"],
      win: ["アカツキ『ちょうじょうの かべは あつい。 また ちょうせんして きなさい。』"],
      music: "champion",
    });
    if (r !== "win") return;
    ctx.sfx("badge");
    await ctx.say("アカツキ『…あたらしい チャンピオンの たんじょうだ!』");
    await ctx.say(`トモシビちほう チャンピオン ${ctx.player.name} ここに たんじょう!!`);
    await ctx.say("~~~ でんどういり おめでとう! ~~~");
    for (const m of ctx.player.party) {
      await ctx.say(`でんどういり: ${m.name} Lv${m.level}`);
    }
    await ctx.say("アカツキ『きみと モンスターたちの ぼうけんは これからも つづく。』");
    await ctx.say("アカツキ『つうしんで なかまと しょうぶするもよし、 ずかんを かんせい させるもよし… たびは じゆうだ!』");
    await ctx.say("- THE END… そして ぼうけんは つづく! -");
    ctx.setFlag("champion_beaten", true);
    ctx.healParty();
    ctx.warp("player_home", 4, 5);
  },

  // ---------- 施設 ----------
  async nurseHeal(ctx) {
    await ctx.say("『ようこそ かいふくセンターへ!』");
    if (await ctx.confirm("モンスターを かいふく しますか?")) {
      ctx.sfx("heal");
      ctx.healParty();
      ctx.setRespawn();
      await ctx.say("おまたせしました! モンスターたちは げんきいっぱいです!");
      await ctx.say("またの ごりようを おまちしております!");
    }
  },
};
