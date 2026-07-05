// キーボード入力管理
// 論理キー: up down left right a(決定) b(キャンセル) run(ダッシュ)
const KEYMAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  z: "a", Enter: "a", " ": "a",
  x: "b", Escape: "b",
  Shift: "run",
};

class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set(); // このフレームで押された
    window.addEventListener("keydown", (e) => {
      const k = KEYMAP[e.key] ?? KEYMAP[e.key.toLowerCase?.() ?? e.key];
      if (!k) return;
      e.preventDefault();
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
    });
    window.addEventListener("keyup", (e) => {
      const k = KEYMAP[e.key] ?? KEYMAP[e.key.toLowerCase?.() ?? e.key];
      if (!k) return;
      this.down.delete(k);
    });
    window.addEventListener("blur", () => this.down.clear());
  }
  isDown(k) { return this.down.has(k); }
  justPressed(k) { return this.pressed.has(k); }
  // フレーム末に呼ぶ
  endFrame() { this.pressed.clear(); }
  // 方向キーのどれかが押されているか
  dirHeld() {
    for (const d of ["up", "down", "left", "right"]) if (this.down.has(d)) return d;
    return null;
  }
}

export const input = new Input();
