// トモシビ地方 全マップデータ
// tiles: 1文字=1タイル。凡例は engine/render.js の drawTileAt を参照。
// warps: その座標に乗ると移動。condition があれば満たさない時 failText を表示して戻る。
// npcs: lines=会話 / script=イベント / trainer=勝負 (sight=視線マス数)
// triggers: 座標に乗った時に script 実行。once はフラグ名 (実行済みなら発火しない)。

// ---- 汎用の建物内装ファクトリ ----
function makeCenter(id, backMap, backX, backY) {
  return {
    id,
    name: "かいふくセンター",
    music: "town",
    indoor: true,
    tiles: [
      "wwwwwwwwwwww",
      "w.HH....PP.w",
      "w..........w",
      "w.CCCC.....w",
      "w..........w",
      "w..........w",
      "w..........w",
      "wwwwwdwwwwww",
    ],
    warps: [{ x: 5, y: 7, to: backMap, tx: backX, ty: backY }],
    npcs: [
      { id: id + "_nurse", x: 3, y: 2, pal: "nurse", dir: "down", script: "nurseHeal" },
      { id: id + "_pcinfo", x: 9, y: 3, pal: "boy", dir: "down", wander: true, lines: ["みぎうえの パソコンで ボックスの モンスターを あずけたり ひきだしたり できるよ。", "『つうしん』は メニューから! ともだちと こうかんや バトルが できるんだ。"] },
    ],
    pcSpots: [{ x: 8, y: 1 }, { x: 9, y: 1 }],
  };
}

function makeShop(id, backMap, backX, backY, stock) {
  return {
    id,
    name: "ショップ",
    music: "town",
    indoor: true,
    tiles: [
      "wwwwwwwwww",
      "wKK....KKw",
      "w........w",
      "w.CC.....w",
      "w........w",
      "w........w",
      "w........w",
      "wwwwdwwwww",
    ],
    warps: [{ x: 4, y: 7, to: backMap, tx: backX, ty: backY }],
    npcs: [{ id: id + "_clerk", x: 2, y: 2, pal: "clerk", dir: "down", shop: stock }],
  };
}

export const MAPS = {};

// ================= ハジメ村 =================
MAPS.hajime = {
  id: "hajime",
  name: "ハジメむら",
  music: "town",
  tiles: [
    "TTTTTTTTppTTTTTTTTTT",
    "T.......pp.........T",
    "T..RRRR.pp...RRRR..T",
    "T..BDBB.pp...BBDB..T",
    "T.......pp.........T",
    "T~~.....pp.......~~T",
    "T.......pp.....S...T",
    "T.RRRRRR.pp........T",
    "T.BBDBBB.pp........T",
    "T........pp.....~~.T",
    "T..~~....pp........T",
    "T........pp........T",
    "T........pp........T",
    "TTTTTTTTTTTTTTTTTTTT",
  ],
  warps: [
    { x: 4, y: 3, to: "player_home", tx: 4, ty: 6 },
    { x: 15, y: 3, to: "neighbor_home", tx: 4, ty: 6 },
    { x: 4, y: 8, to: "lab", tx: 5, ty: 8 },
    { x: 8, y: 0, to: "route1", tx: 6, ty: 20 },
    { x: 9, y: 0, to: "route1", tx: 7, ty: 20 },
  ],
  signs: [{ x: 15, y: 6, text: "ハジメむら 「ぼうけんの はじまりの ばしょ」" }],
  npcs: [
    { id: "hajime_boy", x: 13, y: 9, pal: "boy", dir: "down", wander: true, lines: ["くさむらには やせいの モンスターが かくれているんだ。", "モンスターが いないと きけんだよ!"] },
    { id: "hajime_girl", x: 5, y: 11, pal: "girl", dir: "down", wander: true, lines: ["カエデはかせの けんきゅうじょは みなみの おおきな たてものよ。"] },
  ],
  triggers: [
    { x: 8, y: 1, script: "blockRoute1", condition: { notFlag: "intro_done" } },
    { x: 9, y: 1, script: "blockRoute1", condition: { notFlag: "intro_done" } },
  ],
};

MAPS.player_home = {
  id: "player_home",
  name: "じぶんの いえ",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwww",
    "wb..KK..Xw",
    "w........w",
    "w..XX....w",
    "w..XX....w",
    "w........w",
    "w........w",
    "wwwwdwwwww",
  ],
  warps: [{ x: 4, y: 7, to: "hajime", tx: 4, ty: 4 }],
  npcs: [
    { id: "mom", x: 6, y: 3, pal: "mom", dir: "down", script: "momTalk" },
  ],
};

MAPS.neighbor_home = {
  id: "neighbor_home",
  name: "おとなりの いえ",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwww",
    "wKK....bXw",
    "w........w",
    "w...XX...w",
    "w...XX...w",
    "w........w",
    "w........w",
    "wwwwdwwwww",
  ],
  warps: [{ x: 4, y: 7, to: "hajime", tx: 15, ty: 4 }],
  npcs: [
    { id: "neighbor_old", x: 3, y: 3, pal: "oldman", dir: "down", lines: ["わしの わかいころは モンスターずかんなんて なかったのう。", "カエデはかせの ずかんは たいしたものじゃ。"] },
  ],
};

MAPS.lab = {
  id: "lab",
  name: "カエデ けんきゅうじょ",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wKKKK..KKKKw",
    "w..........w",
    "w.PP.XXX.PPw",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 9, to: "hajime", tx: 4, ty: 9 }],
  npcs: [
    { id: "prof", x: 6, y: 4, pal: "professor", dir: "down", script: "profIntro" },
    { id: "lab_assistant", x: 9, y: 6, pal: "girl", dir: "down", lines: ["はかせは モンスターずかんの かんせいが ゆめなの。", "たくさん つかまえて ずかんを うめてあげてね!"] },
  ],
};

// ================= 1ばんどうろ =================
MAPS.route1 = {
  id: "route1",
  name: "1ばんどうろ",
  music: "route",
  encounters: {
    rate: 0.14, tiles: "G",
    table: [["koronezu", 2, 4, 25], ["pipitto", 2, 4, 22], ["kemukemu", 2, 3, 18], ["mokoppo", 2, 4, 20], ["hanabii", 2, 4, 15]],
  },
  tiles: [
    "TTTTTTTTppTTTTTTTT",
    "T.......pp.......T",
    "T..GGG..pp...GGG.T",
    "T..GGG..pp...GGG.T",
    "T..GGG..pp...GGG.T",
    "T.......pp.......T",
    "T....S..pp.......T",
    "T.......pppp.....T",
    "T.........pp.....T",
    "T..GGGG...pp.....T",
    "T..GGGG...pp..GG.T",
    "T..GGGG...pp..GG.T",
    "T.........pp..GG.T",
    "T.....pppppp.....T",
    "T.....pp.........T",
    "T..~..pp....~~...T",
    "T.....pp.........T",
    "T..GG.pp..GGG....T",
    "T..GG.pp..GGG....T",
    "T.....pp.........T",
    "T.....pp.........T",
    "TTTTTTppTTTTTTTTTT",
  ],
  warps: [
    { x: 8, y: 0, to: "komorebi", tx: 9, ty: 14 },
    { x: 9, y: 0, to: "komorebi", tx: 10, ty: 14 },
    { x: 6, y: 21, to: "hajime", tx: 8, ty: 1 },
    { x: 7, y: 21, to: "hajime", tx: 9, ty: 1 },
  ],
  signs: [{ x: 5, y: 6, text: "1ばんどうろ ↑コモレビちょう ↓ハジメむら" }],
  npcs: [
    {
      id: "r1_kenta", x: 12, y: 8, pal: "boy", dir: "left",
      trainer: {
        name: "たんぱんこぞうの ケンタ", flag: "t_r1_kenta", sight: 4, money: 160,
        party: [["koronezu", 4], ["pipitto", 4]],
        intro: ["きみ! モンスターを もってるなら しょうぶだ!"],
        lose: ["つよいなあ! まいった!"],
        after: ["トレーナーどうしは めが あったら しょうぶ! それが ルールさ。"],
      },
    },
    {
      id: "r1_yui", x: 4, y: 16, pal: "girl", dir: "right",
      trainer: {
        name: "ようちえんじの ユイ", flag: "t_r1_yui", sight: 3, money: 100,
        party: [["kemukemu", 5]],
        intro: ["ケムケムちゃんは かわいくて つよいんだから!"],
        lose: ["ケムケムちゃ〜ん!"],
        after: ["ケムケムちゃんは Lv10で チョウマイに しんかするのよ。"],
      },
    },
  ],
  triggers: [
    { x: 6, y: 19, script: "rival1", once: "rival1_done" },
    { x: 7, y: 19, script: "rival1", once: "rival1_done" },
  ],
};

// ================= コモレビちょう =================
MAPS.komorebi = {
  id: "komorebi",
  name: "コモレビちょう",
  music: "town",
  tiles: [
    "TTTTTTTTTTTTTTTTTTTTTT",
    "T....................T",
    "T.RRRR..rrrr..RRRR...T",
    "T.BDBB..BDBB..BBDB...T",
    "T....................T",
    "T..~~....S...........T",
    "T....................T",
    "T....RRRRRR..........T",
    "T....RRRRRR..........T",
    "T....BBDBBB.......~~.T",
    "T....................T",
    "T....................T",
    "T...................pp",
    "T...................pp",
    "T........pp..........T",
    "TTTTTTTTTppTTTTTTTTTTT",
  ],
  warps: [
    { x: 3, y: 3, to: "center_komorebi", tx: 5, ty: 6 },
    { x: 9, y: 3, to: "shop_komorebi", tx: 4, ty: 6 },
    { x: 16, y: 3, to: "house_komorebi", tx: 4, ty: 6 },
    { x: 7, y: 9, to: "gym1", tx: 5, ty: 8 },
    { x: 9, y: 15, to: "route1", tx: 8, ty: 1 },
    { x: 10, y: 15, to: "route1", tx: 9, ty: 1 },
    { x: 21, y: 12, to: "route2", tx: 1, ty: 12 },
    { x: 21, y: 13, to: "route2", tx: 1, ty: 13 },
  ],
  signs: [{ x: 9, y: 5, text: "コモレビちょう 「こもれびと ともに いきる まち」" }],
  npcs: [
    { id: "komo_boy", x: 14, y: 6, pal: "boy", dir: "down", wander: true, lines: ["ジムリーダーの ミドリさんは むしタイプの つかいてだよ。", "ほのおや ひこうタイプが とくいなら らくしょうかも!"] },
    { id: "komo_old", x: 4, y: 11, pal: "oldman", dir: "down", lines: ["ひがしの どうくつを ぬけると みなとまち ミナトへ いける。", "どうくつは くらくて あぶない。 かいふくの じゅんびを わすれるな。"] },
    { id: "komo_assistant", x: 18, y: 12, pal: "girl", dir: "right", script: "townMapGift" },
  ],
  triggers: [
    { x: 20, y: 12, script: "townMapGift", once: "townmap_gift_done" },
    { x: 20, y: 13, script: "townMapGift", once: "townmap_gift_done" },
  ],
};

MAPS.center_komorebi = makeCenter("center_komorebi", "komorebi", 3, 4);
MAPS.shop_komorebi = makeShop("shop_komorebi", "komorebi", 9, 4, ["ball1", "potion1", "antidote", "parheal"]);
MAPS.house_komorebi = {
  id: "house_komorebi",
  name: "みんか",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwww",
    "wKK.bb..Xw",
    "w........w",
    "w...XX...w",
    "w...XX...w",
    "w........w",
    "w........w",
    "wwwwdwwwww",
  ],
  warps: [{ x: 4, y: 7, to: "komorebi", tx: 16, ty: 4 }],
  npcs: [{ id: "komo_house_girl", x: 6, y: 3, pal: "girl", dir: "down", lines: ["モンスターは じょうたいいじょうに なると せんとうで ちからを だせないの。", "どくには どくけし、まひには まひなおしよ。"] }],
};

MAPS.gym1 = {
  id: "gym1",
  name: "コモレビジム",
  music: "gym",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wJ........Jw",
    "w....xx....w",
    "w....xx....w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 9, to: "komorebi", tx: 7, ty: 10 }],
  npcs: [
    {
      id: "gym1_trainer", x: 3, y: 5, pal: "boy", dir: "right",
      trainer: {
        name: "むしとりしょうねんの コウタ", flag: "t_gym1_kota", sight: 3, money: 240,
        party: [["kemukemu", 7], ["kemukemu", 7]],
        intro: ["ミドリさんに いどむなら まず ぼくを たおしてから!"],
        lose: ["ぼくの むしたちが…!"],
        after: ["ミドリさんの チョウマイは ねむりごなを つかうよ。 きをつけて!"],
      },
    },
    {
      id: "gym1_leader", x: 5, y: 2, pal: "leader1", dir: "down", script: "gymLeader1",
    },
  ],
};

// ================= 2ばんどうろ =================
MAPS.route2 = {
  id: "route2",
  name: "2ばんどうろ",
  music: "route",
  encounters: {
    rate: 0.14, tiles: "G",
    table: [["koronezu", 5, 8, 15], ["pipitto", 5, 8, 15], ["biribo", 5, 8, 15], ["nemuriro", 6, 8, 10], ["denrisu", 5, 8, 18], ["tentorin", 5, 8, 15], ["nyaruma", 5, 8, 12]],
  },
  tiles: [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "T......................T",
    "T..GGG.....GGG......mmmT",
    "T..GGG.....GGG......mmmT",
    "T...................mmmT",
    "T.S.................mmmT",
    "TpppppppppppppppppppcmmT",
    "T...................mmmT",
    "T..GGGG......GGGG...mmmT",
    "T..GGGG......GGGG....mmT",
    "T....................mmT",
    "T......~~..............T",
    "pp.....................T",
    "pp.....................T",
    "T......................T",
    "TTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  warps: [
    { x: 20, y: 6, to: "iwakura", tx: 1, ty: 7 },
    { x: 0, y: 12, to: "komorebi", tx: 20, ty: 12 },
    { x: 0, y: 13, to: "komorebi", tx: 20, ty: 13 },
  ],
  signs: [{ x: 2, y: 5, text: "2ばんどうろ →イワクラどうくつ ←コモレビちょう" }],
  npcs: [
    {
      id: "r2_sho", x: 8, y: 5, pal: "boy", dir: "down",
      trainer: {
        name: "むらびとの ショウ", flag: "t_r2_sho", sight: 3, money: 280,
        party: [["pipitto", 7], ["koronezu", 7]],
        intro: ["この みちを とおるなら しょうぶしていきなよ!"],
        lose: ["はやい とりには かなわない って いうけど まけたー!"],
        after: ["どうくつには いわタイプが おおい。 みずや くさの わざが きくよ。"],
      },
    },
    {
      id: "r2_manabu", x: 15, y: 9, pal: "boy", dir: "left",
      trainer: {
        name: "めがねの マナブ", flag: "t_r2_manabu", sight: 3, money: 320,
        party: [["biribo", 8]],
        intro: ["でんきの ちからを けいさんで しょうめいしてみせる!"],
        lose: ["けいさんが くるった…!"],
        after: ["でんきタイプの わざは じめんタイプに まったく きかないんだ。"],
      },
    },
  ],
  triggers: [],
};

// ================= イワクラどうくつ =================
MAPS.iwakura = {
  id: "iwakura",
  name: "イワクラどうくつ",
  music: "cave",
  indoor: true,
  encounters: {
    rate: 0.11, tiles: "c",
    table: [["gorotan", 8, 12, 35], ["dokudama", 8, 12, 25], ["mogurai", 9, 12, 20], ["punigumo", 8, 12, 15], ["tatsume", 10, 10, 5]],
  },
  tiles: [
    "mmmmmmmmmmmmmmmmmmmm",
    "mccccmmmmccccccccccm",
    "mcccccmmcccccooccccm",
    "mccocccccccccccccccm",
    "mcccccmmmccccmmmcccm",
    "mccccmmmmmcccmmmcccm",
    "mccccccccccccmmccccm",
    "ccccccmmmccccccccccc",
    "mcccccccccccccmccccm",
    "mccoccccmmmccccccccm",
    "mccccccmmmmmcccocccm",
    "mccccccccccccccccccm",
    "mccccmmccccccmmccccm",
    "mmmmmmmmmmmmmmmmmmmm",
  ],
  warps: [
    { x: 0, y: 7, to: "route2", tx: 19, ty: 6 },
    { x: 19, y: 7, to: "minato", tx: 1, ty: 8 },
  ],
  npcs: [
    {
      id: "cave_goro", x: 5, y: 3, pal: "oldman", dir: "down",
      trainer: {
        name: "やまおとこの ゴロウ", flag: "t_cave_goro", sight: 3, money: 400,
        party: [["gorotan", 10], ["gorotan", 11]],
        intro: ["いわの かたさ おしえてやろう!"],
        lose: ["がんせきが くだけた…!"],
        after: ["さいきん くろい ふくの やつらが おくで なにか さがしとる。 きみわるいのう。"],
      },
    },
    {
      id: "cave_grunt1", x: 15, y: 7, pal: "grunt", dir: "left", script: "caveGrunts",
      condition: { notFlag: "cave_grunts_done" },
    },
    {
      id: "cave_grunt2", x: 15, y: 8, pal: "grunt", dir: "left", script: "caveGrunts",
      condition: { notFlag: "cave_grunts_done" },
    },
  ],
  triggers: [
    { x: 13, y: 7, script: "caveGrunts", once: "cave_grunts_done" },
  ],
};

// ================= ミナトし =================
MAPS.minato = {
  id: "minato",
  name: "ミナトし",
  music: "town",
  tiles: [
    "TTTTTTTTTTTTTTTTTTppTTTT",
    "T.................pp...T",
    "T.RRRR..rrrr..RRRR.....T",
    "T.BDBB..BDBB..BBDB.....T",
    "T......................T",
    "T...S..................T",
    "T......RRRRRR..........T",
    "T......RRRRRR..........T",
    "p......BBBDBB..........T",
    "p......................T",
    "T......................T",
    "T......................T",
    "Tsssssssssssssssssss...T",
    "TssssssssppssssssssssssT",
    "TWWWWWWWWppWWWWWWWWWWWWT",
    "TWWWWWWWWWWWWWWWWWWWWWWT",
  ],
  warps: [
    { x: 3, y: 3, to: "center_minato", tx: 5, ty: 6 },
    { x: 9, y: 3, to: "shop_minato", tx: 4, ty: 6 },
    { x: 16, y: 3, to: "house_minato", tx: 4, ty: 6 },
    { x: 10, y: 8, to: "gym2", tx: 5, ty: 8 },
    { x: 0, y: 8, to: "iwakura", tx: 18, ty: 7 },
    { x: 0, y: 9, to: "iwakura", tx: 18, ty: 7 },
    { x: 18, y: 0, to: "route3", tx: 7, ty: 18 },
    { x: 19, y: 0, to: "route3", tx: 8, ty: 18 },
  ],
  signs: [{ x: 4, y: 5, text: "ミナトし 「うみと ふねと モンスターの まち」" }],
  npcs: [
    { id: "minato_sailor", x: 6, y: 12, pal: "clerk", dir: "down", wander: true, lines: ["ふなのりは みずタイプと ともだちさ!", "ジムリーダーの ナギサさんも もとは ふなのりだ。"] },
    { id: "minato_girl", x: 14, y: 10, pal: "girl", dir: "down", wander: true, lines: ["きたの 3ばんどうろの さきは ライメイちょう。", "かみなりが おおい ばしょだから でんきタイプに きをつけて!"] },
  ],
  triggers: [
    { x: 2, y: 8, script: "rival2", once: "rival2_done" },
    { x: 2, y: 9, script: "rival2", once: "rival2_done" },
    { x: 8, y: 13, script: "minatoPier", once: "minato_pier_done" },
    { x: 9, y: 13, script: "minatoPier", once: "minato_pier_done" },
  ],
};

MAPS.center_minato = makeCenter("center_minato", "minato", 3, 4);
MAPS.shop_minato = makeShop("shop_minato", "minato", 9, 4, ["ball1", "ball2", "potion1", "potion2", "antidote", "parheal", "awake", "burnheal"]);
MAPS.house_minato = {
  id: "house_minato",
  name: "みんか",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwww",
    "wXX.KK..bw",
    "w........w",
    "w..XX....w",
    "w..XX....w",
    "w........w",
    "w........w",
    "wwwwdwwwww",
  ],
  warps: [{ x: 4, y: 7, to: "minato", tx: 16, ty: 4 }],
  npcs: [{ id: "minato_house_old", x: 6, y: 3, pal: "oldman", dir: "down", lines: ["トレーナーどうしの こうかんで そだった モンスターは けいけんちが よく はいる… きがする。", "なにより ともだちの モンスターは たからものじゃよ。"] }],
};

MAPS.gym2 = {
  id: "gym2",
  name: "ミナトジム",
  music: "gym",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wJ........Jw",
    "w....xx....w",
    "w....xx....w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 9, to: "minato", tx: 10, ty: 9 }],
  npcs: [
    {
      id: "gym2_trainer", x: 8, y: 5, pal: "girl", dir: "left",
      trainer: {
        name: "うきわガールの マリン", flag: "t_gym2_marin", sight: 3, money: 480,
        party: [["shizumin", 15]],
        intro: ["ナギサさんに あいたいなら わたしを こえてから!"],
        lose: ["おぼれちゃう〜!"],
        after: ["みずタイプには でんきか くさ! じょうしきよ!"],
      },
    },
    { id: "gym2_leader", x: 5, y: 2, pal: "leader2", dir: "down", script: "gymLeader2" },
  ],
};

// ================= 3ばんどうろ =================
MAPS.route3 = {
  id: "route3",
  name: "3ばんどうろ",
  music: "route",
  encounters: {
    rate: 0.14, tiles: "G",
    table: [["biribo", 12, 16, 15], ["kobusshi", 13, 16, 12], ["dotanezu", 13, 16, 12], ["nemuriro", 13, 15, 8], ["pukupuku", 12, 16, 18], ["penpeko", 13, 16, 12], ["panchibi", 13, 16, 12], ["mokoppo", 12, 15, 11]],
  },
  tiles: [
    "TTTTTTTTppTTTTTTTT",
    "T.......pp.......T",
    "T..GG...pp...GG..T",
    "T..GG...pp...GG..T",
    "T.......pp.......T",
    "T...S...pp.......T",
    "T.......pp....GG.T",
    "T..GGG..pp....GG.T",
    "T..GGG..pp.......T",
    "T..GGG..pppp.....T",
    "T.........pp.....T",
    "T.........pp.GGG.T",
    "T.........pp.GGG.T",
    "T......pppppp....T",
    "T......pp........T",
    "T..GG..pp...~~...T",
    "T..GG..pp........T",
    "T......pp........T",
    "T......pp........T",
    "TTTTTTTppTTTTTTTTT",
  ],
  warps: [
    { x: 8, y: 0, to: "raimei", tx: 8, ty: 12 },
    { x: 9, y: 0, to: "raimei", tx: 9, ty: 12 },
    { x: 7, y: 19, to: "minato", tx: 18, ty: 1 },
    { x: 8, y: 19, to: "minato", tx: 19, ty: 1 },
  ],
  signs: [{ x: 4, y: 5, text: "3ばんどうろ ↑ライメイちょう ↓ミナトし" }],
  npcs: [
    {
      id: "r3_haruto", x: 12, y: 10, pal: "boy", dir: "left",
      trainer: {
        name: "でんきずきの ハルト", flag: "t_r3_haruto", sight: 4, money: 560,
        party: [["biribo", 14]],
        intro: ["ビリビリの あじ おしえてやるぜ!"],
        lose: ["でんちぎれだ〜!"],
        after: ["ライメイちょうの ジムは でんきタイプ。 じめんタイプが いると あんしんだ。"],
      },
    },
    {
      id: "r3_aoi", x: 4, y: 8, pal: "girl", dir: "right",
      trainer: {
        name: "たんけんかの アオイ", flag: "t_r3_aoi", sight: 3, money: 600,
        party: [["mogurai", 15], ["gorotan", 14]],
        intro: ["たんけんで きたえた モンスターは つよいわよ!"],
        lose: ["まだまだ たんけんが たりないわね…"],
        after: ["イワクラどうくつには まれに タツメが でるらしいわ。 ドラゴンタイプよ!"],
      },
    },
    {
      id: "r3_takuma", x: 11, y: 16, pal: "boy", dir: "left",
      trainer: {
        name: "からておうの タクマ", flag: "t_r3_takuma", sight: 3, money: 600,
        party: [["kobusshi", 15]],
        intro: ["おす! しょうぶ おねがいします!"],
        lose: ["おす! まいりました!"],
        after: ["かくとうタイプは ひこうや エスパーが にがてなんです。 おす!"],
      },
    },
  ],
  triggers: [],
};

// ================= ライメイちょう =================
MAPS.raimei = {
  id: "raimei",
  name: "ライメイちょう",
  music: "town",
  tiles: [
    "TTTTTTTTTTTTTTTTTTTT",
    "T..................T",
    "T.RRRR..rrrr..RRRR.T",
    "T.BDBB..BDBB..BBDB.T",
    "T..................T",
    "T.S................T",
    "T.....RRRRRR.......T",
    "T.....RRRRRR.......T",
    "T.....BBDBBB.......T",
    "T..................T",
    "T..rrrr............T",
    "T..BBDB...........pp",
    "T.................pp",
    "TTTTTTTTppTTTTTTTTTT",
  ],
  warps: [
    { x: 3, y: 3, to: "center_raimei", tx: 5, ty: 6 },
    { x: 9, y: 3, to: "shop_raimei", tx: 4, ty: 6 },
    { x: 16, y: 3, to: "house_raimei", tx: 4, ty: 6 },
    { x: 8, y: 8, to: "gym3", tx: 5, ty: 8 },
    { x: 5, y: 11, to: "powerplant", tx: 5, ty: 7 },
    { x: 8, y: 13, to: "route3", tx: 8, ty: 1 },
    { x: 9, y: 13, to: "route3", tx: 9, ty: 1 },
    { x: 19, y: 11, to: "route4", tx: 1, ty: 11 },
    { x: 19, y: 12, to: "route4", tx: 1, ty: 12 },
  ],
  signs: [{ x: 2, y: 5, text: "ライメイちょう 「かみなりの めぐみで ひかる まち」" }],
  npcs: [
    { id: "raimei_boy", x: 14, y: 9, pal: "boy", dir: "down", wander: true, lines: ["はつでんしょに くろい ふくの やつらが おしいったんだ!", "まちの でんきが きえたり ついたり… こわいよ〜。"] },
    { id: "raimei_old", x: 5, y: 4, pal: "oldman", dir: "down", lines: ["ひがしの 4ばんどうろは やまみちじゃ。", "そのさきの テンクウしには ふるい とうが あってのう… ほしのりゅうの でんせつが のこっとる。"] },
  ],
  triggers: [
    { x: 8, y: 12, script: "raimeiIntro", once: "raimei_intro_done" },
    { x: 9, y: 12, script: "raimeiIntro", once: "raimei_intro_done" },
  ],
};

MAPS.center_raimei = makeCenter("center_raimei", "raimei", 3, 4);
MAPS.shop_raimei = makeShop("shop_raimei", "raimei", 9, 4, ["ball2", "potion2", "burnheal", "awake", "fullcure", "revive"]);
MAPS.house_raimei = {
  id: "house_raimei",
  name: "みんか",
  music: "town",
  indoor: true,
  tiles: [
    "wwwwwwwwww",
    "wb..KK..Xw",
    "w........w",
    "w...XX...w",
    "w...XX...w",
    "w........w",
    "w........w",
    "wwwwdwwwww",
  ],
  warps: [{ x: 4, y: 7, to: "raimei", tx: 16, ty: 4 }],
  npcs: [{ id: "raimei_house_boy", x: 3, y: 3, pal: "boy", dir: "down", lines: ["シャドウだんは でんせつの モンスターの ちからを ねらってるって うわさだよ。", "でんせつの モンスター… テンゲンリュウ っていうんだって。"] }],
};

MAPS.gym3 = {
  id: "gym3",
  name: "ライメイジム",
  music: "gym",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wJ........Jw",
    "w....xx....w",
    "w....xx....w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 9, to: "raimei", tx: 8, ty: 9 }],
  npcs: [
    {
      id: "gym3_trainer", x: 3, y: 5, pal: "clerk", dir: "right",
      trainer: {
        name: "エンジニアの デンジ", flag: "t_gym3_denji", sight: 3, money: 680,
        party: [["biribo", 17], ["biribo", 17]],
        intro: ["ライゾウさんの でんあつは このていどじゃないぜ!"],
        lose: ["ショートした…!"],
        after: ["ライゾウさんの ライゴロンは はやい! まひでんぱに ちゅうい だ。"],
      },
    },
    { id: "gym3_leader", x: 5, y: 2, pal: "leader3", dir: "down", script: "gymLeader3" },
  ],
};

MAPS.powerplant = {
  id: "powerplant",
  name: "はつでんしょ",
  music: "evil",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wPP.PP.PP.Pw",
    "w..........w",
    "w..........w",
    "wPP....PP..w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 8, to: "raimei", tx: 5, ty: 12 }],
  npcs: [
    {
      id: "pp_grunt", x: 3, y: 3, pal: "grunt", dir: "down",
      condition: { notFlag: "power_done" },
      trainer: {
        name: "シャドウだんの したっぱ", flag: "t_pp_grunt", sight: 4, money: 500,
        party: [["dokudama", 18], ["hotabi", 18]],
        intro: ["ここは シャドウだんが せんきょした! ガキは かえんな!"],
        lose: ["ゲンバさん すんません…!"],
        after: ["……。"],
      },
    },
    { id: "pp_genba", x: 6, y: 2, pal: "boss", dir: "down", script: "bossGenba", condition: { notFlag: "power_done" } },
    { id: "pp_worker", x: 9, y: 5, pal: "clerk", dir: "down", lines: ["でんきが もどった! きみの おかげだよ!", "シャドウだんは 『ほしのカギ』とか いってたな… テンクウしの ほうへ にげていった。"], condition: { flag: "power_done" } },
  ],
  triggers: [],
};

// ================= 4ばんどうろ =================
MAPS.route4 = {
  id: "route4",
  name: "4ばんどうろ",
  music: "route",
  encounters: {
    rate: 0.14, tiles: "G",
    table: [["gorotan", 18, 22, 18], ["hotabi", 18, 22, 15], ["kobusshi", 18, 22, 12], ["pokaguma", 18, 22, 18], ["fukusuke", 19, 22, 12], ["kodamakko", 19, 22, 10], ["sorahane", 20, 22, 6], ["sunagon", 20, 22, 4], ["tatsume", 20, 21, 5]],
  },
  tiles: [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "Tmmmm...........mmmmmmmT",
    "Tmmm..GGG....GG..mmmmmmT",
    "Tmm...GGG....GG......mmT",
    "Tm....................mT",
    "T...o..........o.......T",
    "T......................T",
    "T......................T",
    "T..GG....GGG....GG.....T",
    "T..GG....GGG....GG.....T",
    "T......................T",
    "pp................o....T",
    "pp....................pp",
    "T.....................pp",
    "Tmmm......GG.......mmmmT",
    "TTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  warps: [
    { x: 0, y: 11, to: "raimei", tx: 18, ty: 11 },
    { x: 0, y: 12, to: "raimei", tx: 18, ty: 12 },
    { x: 23, y: 12, to: "tenkuu", tx: 1, ty: 11 },
    { x: 23, y: 13, to: "tenkuu", tx: 1, ty: 12 },
  ],
  signs: [],
  npcs: [
    {
      id: "r4_ren", x: 6, y: 6, pal: "boy", dir: "right",
      trainer: {
        name: "とりつかいの レン", flag: "t_r4_ren", sight: 4, money: 800,
        party: [["pipitto", 19], ["sorahane", 21]],
        intro: ["おおぞらの スピードに ついてこれるか!?"],
        lose: ["つばさを もがれた きぶんだ…"],
        after: ["ソラハネの きゅうこうかは トモシビいち はやいんだぜ。"],
      },
    },
    {
      id: "r4_akari", x: 15, y: 9, pal: "girl", dir: "left",
      trainer: {
        name: "みこの アカリ", flag: "t_r4_akari", sight: 3, money: 800,
        party: [["nemuriro", 20], ["hotabi", 20]],
        intro: ["この やまには ふしぎな ちからが やどっています…"],
        lose: ["これも さだめ…"],
        after: ["テンクウしの とうには ほしのりゅうが ねむっている… いいつたえです。"],
      },
    },
    {
      id: "r4_ganta", x: 19, y: 5, pal: "oldman", dir: "left",
      trainer: {
        name: "やまおとこの ガンタ", flag: "t_r4_ganta", sight: 3, money: 840,
        party: [["gorotan", 21], ["gansekioh", 22]],
        intro: ["やまの おきてだ! とおるなら しょうぶ!"],
        lose: ["やまが うごいた…!"],
        after: ["ガンセキオーは ゴロタンが Lv20で しんかした すがた だ。"],
      },
    },
  ],
  triggers: [],
};

// ================= テンクウし =================
MAPS.tenkuu = {
  id: "tenkuu",
  name: "テンクウし",
  music: "town",
  tiles: [
    "TTTTTTTTTTppTTTTTTTTTTTT",
    "T.........pp...........T",
    "T.RRRR....pp....rrrr...T",
    "T.BDBB....pp....BDBB...T",
    "T.........pp...........T",
    "T..S......pp...........T",
    "T.........pp..rrrrrr...T",
    "T..RRRRRR.pp..rrrrrr...T",
    "T..RRRRRR.pp..BBDBBB...T",
    "T..BBDBBB.pp...........T",
    "T.........pp...........T",
    "pp........pp...........T",
    "pp........pp....RRRR...T",
    "T.........pp....BBDB...T",
    "T.........pp...........T",
    "T.........pp...~~......T",
    "T.........pp...........T",
    "TTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  warps: [
    { x: 3, y: 3, to: "center_tenkuu", tx: 5, ty: 6 },
    { x: 17, y: 3, to: "shop_tenkuu", tx: 4, ty: 6 },
    { x: 5, y: 9, to: "gym4", tx: 5, ty: 8 },
    {
      x: 16, y: 8, to: "tower", tx: 5, ty: 14,
      condition: { flag: "boss_beaten" },
      failText: "とうの とびらは 『ほしのカギ』が ないと あかないようだ…",
    },
    {
      x: 18, y: 13, to: "hideout", tx: 7, ty: 9,
      condition: { flag: "badge4" },
      failText: "とびらは かたく しまっている。 …なかから ひとの けはいがする。",
    },
    { x: 0, y: 11, to: "route4", tx: 22, ty: 12 },
    { x: 0, y: 12, to: "route4", tx: 22, ty: 13 },
    { x: 10, y: 0, to: "champroad", tx: 8, ty: 13 },
    { x: 11, y: 0, to: "champroad", tx: 9, ty: 13 },
  ],
  signs: [{ x: 3, y: 5, text: "テンクウし 「そらに いちばん ちかい まち」" }],
  npcs: [
    { id: "tenkuu_old", x: 15, y: 5, pal: "sage", dir: "down", lines: ["ふるい とうには ほしのりゅう テンゲンリュウが ねむる…", "とうの とびらを あけるには 『ほしのカギ』が ひつようじゃ。", "…だが カギは シャドウだんに ぬすまれてしもうた。"] },
    { id: "tenkuu_girl", x: 6, y: 14, pal: "girl", dir: "down", wander: true, lines: ["きたの もんの さきは チャンピオンロード。", "バッジを 4つ もってないと とおしてもらえないわ。"] },
  ],
  triggers: [
    { x: 10, y: 1, script: "leagueGate", condition: { notBadges: 4 } },
    { x: 11, y: 1, script: "leagueGate", condition: { notBadges: 4 } },
  ],
};

MAPS.center_tenkuu = makeCenter("center_tenkuu", "tenkuu", 3, 4);
MAPS.shop_tenkuu = makeShop("shop_tenkuu", "tenkuu", 17, 4, ["ball2", "ball3", "potion2", "potion3", "fullheal", "fullcure", "revive"]);

MAPS.gym4 = {
  id: "gym4",
  name: "テンクウジム",
  music: "gym",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "wJ........Jw",
    "w....xx....w",
    "w....xx....w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 9, to: "tenkuu", tx: 5, ty: 10 }],
  npcs: [
    {
      id: "gym4_trainer", x: 8, y: 5, pal: "sage", dir: "left",
      trainer: {
        name: "れいばいしの シオン", flag: "t_gym4_shion", sight: 3, money: 1040,
        party: [["hotabi", 26], ["nemuriro", 26]],
        intro: ["この ジムには れいが みちている…"],
        lose: ["れいが さわいでいる…"],
        after: ["ヨミさまの オニビラスは ゴーストと ほのお。 ノーマルわざは きかないよ…"],
      },
    },
    { id: "gym4_leader", x: 5, y: 2, pal: "leader4", dir: "down", script: "gymLeader4" },
  ],
};

MAPS.hideout = {
  id: "hideout",
  name: "シャドウだん アジト",
  music: "evil",
  indoor: true,
  tiles: [
    "mmmmmmmmmmmmmmmm",
    "mccccccccccccccm",
    "mccmmccccmmmcccm",
    "mccccccccccccccm",
    "mccccmmccccccccm",
    "mcccccccccmmcccm",
    "mccmmccccccccccm",
    "mccccccccccccccm",
    "mcccccccmmcccccm",
    "mccccccdcccccccm",
    "mmmmmmmmmmmmmmmm",
  ],
  warps: [{ x: 7, y: 9, to: "tenkuu", tx: 18, ty: 14 }],
  npcs: [
    {
      id: "ho_grunt1", x: 5, y: 6, pal: "grunt", dir: "right",
      trainer: {
        name: "シャドウだんの したっぱ", flag: "t_ho_grunt1", sight: 3, money: 700,
        party: [["dokudama", 27], ["hotabi", 27]],
        intro: ["よくぞ ここまで きたな! だが ここで おわりだ!"],
        lose: ["ボスー! すんませーん!"],
        after: ["ボスの クロガネさまは おくに いるぜ…"],
      },
    },
    {
      id: "ho_grunt2", x: 11, y: 4, pal: "grunt", dir: "left",
      trainer: {
        name: "シャドウだんの したっぱ", flag: "t_ho_grunt2", sight: 3, money: 700,
        party: [["mogurai", 28]],
        intro: ["ほしのカギは わたさねえ!"],
        lose: ["カギは ボスが もってる…!"],
        after: ["シャドウだんは もう おしまいだ…"],
      },
    },
    { id: "ho_boss", x: 8, y: 2, pal: "boss", dir: "down", script: "bossKurogane", condition: { notFlag: "boss_beaten" } },
  ],
  triggers: [],
};

MAPS.tower = {
  id: "tower",
  name: "ほしふりの とう",
  music: "legend",
  indoor: true,
  encounters: {
    rate: 0.1, tiles: "M",
    table: [["hotabi", 20, 26, 30], ["nemuriro", 20, 26, 15], ["sheetun", 20, 26, 25], ["yubake", 21, 26, 15], ["kodamakko", 21, 26, 12], ["tsukiusa", 25, 25, 3]],
  },
  tiles: [
    "wwwwwwwwwwww",
    "w..........w",
    "w....xx....w",
    "w....xx....w",
    "w..........w",
    "w..K....K..w",
    "wMMMMMMMMMMw",
    "wMMMMMMMMMMw",
    "w..K....K..w",
    "wMMMMMMMMMMw",
    "wMMMMMMMMMMw",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 14, to: "tenkuu", tx: 16, ty: 9 }],
  npcs: [
    { id: "legend", x: 5, y: 2, mon: "tengenryu", script: "legendEncounter", condition: { notFlag: "legend_done" } },
  ],
  triggers: [],
};

// ================= チャンピオンロード =================
MAPS.champroad = {
  id: "champroad",
  name: "チャンピオンロード",
  music: "cave",
  indoor: true,
  encounters: {
    rate: 0.12, tiles: "c",
    table: [["gorotan", 28, 32, 20], ["mogurai", 28, 32, 18], ["hotabi", 28, 32, 15], ["dotanezu", 29, 32, 12], ["sunagon", 29, 32, 15], ["tentogado", 29, 32, 10], ["nyaruda", 29, 32, 6], ["tatsume", 30, 30, 4]],
  },
  tiles: [
    "mmmmmmmmccmmmmmm",
    "mccccccccccccccm",
    "mccmmmccccmmmccm",
    "mccccccccccccccm",
    "mcmmccccmmmmcccm",
    "mcccccoccccccccm",
    "mmmccccccmmmcccm",
    "mccccccccccccccm",
    "mccmmmmccccmmccm",
    "mccccccccccccccm",
    "mcmmccccccmmmccm",
    "mccccccccccccccm",
    "mccccmmmmccccccm",
    "mccccccccccccccm",
    "mmmmmmmmccmmmmmm",
  ],
  warps: [
    { x: 8, y: 0, to: "league", tx: 5, ty: 10 },
    { x: 9, y: 0, to: "league", tx: 6, ty: 10 },
    { x: 8, y: 14, to: "tenkuu", tx: 10, ty: 1 },
    { x: 9, y: 14, to: "tenkuu", tx: 11, ty: 1 },
  ],
  npcs: [
    {
      id: "cr_rei", x: 5, y: 5, pal: "girl", dir: "right",
      trainer: {
        name: "エリートの レイ", flag: "t_cr_rei", sight: 4, money: 1320,
        party: [["dotanezu", 32], ["raigoron", 33]],
        intro: ["ここまで こられたことは ほめてあげる。 でも ここからは べつせかいよ!"],
        lose: ["…みとめざるを えないわね。"],
        after: ["チャンピオンの アカツキさまは ドラゴンつかい。 かくごなさい。"],
      },
    },
    {
      id: "cr_kai", x: 10, y: 9, pal: "boy", dir: "left",
      trainer: {
        name: "エリートの カイ", flag: "t_cr_kai", sight: 4, money: 1320,
        party: [["choumai", 32], ["goukender", 33]],
        intro: ["この さきに すすむ しかく ためさせてもらう!"],
        lose: ["みごとだ…!"],
        after: ["きみの めには チャンピオンに いどむ ひかりが やどっている。"],
      },
    },
  ],
  triggers: [
    { x: 8, y: 2, script: "rival3", once: "rival3_done" },
    { x: 9, y: 2, script: "rival3", once: "rival3_done" },
  ],
};

MAPS.league = {
  id: "league",
  name: "トモシビ でんどう",
  music: "champion",
  indoor: true,
  tiles: [
    "wwwwwwwwwwww",
    "w....xx....w",
    "w....xx....w",
    "w..J....J..w",
    "w..........w",
    "w..........w",
    "w..J....J..w",
    "w..........w",
    "w..........w",
    "w..........w",
    "w..........w",
    "wwwwwdwwwwww",
  ],
  warps: [{ x: 5, y: 11, to: "champroad", tx: 8, ty: 1 }],
  npcs: [
    { id: "champion", x: 5, y: 1, pal: "champion", dir: "down", script: "championBattle" },
  ],
};

export function mapData(id) {
  const m = MAPS[id];
  if (!m) throw new Error("unknown map: " + id);
  return m;
}
