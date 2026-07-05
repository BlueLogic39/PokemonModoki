// WebAudio によるレトロ風サウンド (効果音 + 簡易BGMシーケンサ)
class AudioSys {
  constructor() {
    this.ctx = null;
    this.musicTimer = null;
    this.currentSong = null;
    this.muted = false;
    this.musicGain = null;
    window.addEventListener("keydown", (e) => {
      if (e.key === "m" || e.key === "M") this.toggleMute();
    });
  }
  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : 0.12;
  }
  tone(freq, dur = 0.08, type = "square", vol = 0.15, delay = 0, slide = 0) {
    if (this.muted) return;
    try {
      this.ensure();
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch { /* オーディオ未許可時は無音 */ }
  }
  sfx(name) {
    switch (name) {
      case "select": this.tone(880, 0.05, "square", 0.08); break;
      case "confirm": this.tone(660, 0.06, "square", 0.1); this.tone(990, 0.08, "square", 0.1, 0.06); break;
      case "cancel": this.tone(440, 0.08, "square", 0.08, 0, -100); break;
      case "bump": this.tone(120, 0.06, "square", 0.1); break;
      case "hit": this.tone(200, 0.1, "sawtooth", 0.15, 0, -80); break;
      case "superhit": this.tone(300, 0.12, "sawtooth", 0.18, 0, -150); this.tone(150, 0.1, "square", 0.12, 0.08); break;
      case "weakhit": this.tone(180, 0.07, "triangle", 0.1); break;
      case "faint": this.tone(300, 0.35, "sawtooth", 0.15, 0, -220); break;
      case "heal": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.09, "sine", 0.12, i * 0.09)); break;
      case "levelup": [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.08, "square", 0.1, i * 0.07)); break;
      case "catch": this.tone(700, 0.08, "square", 0.12); this.tone(500, 0.1, "square", 0.12, 0.1); break;
      case "caught": [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.12, "square", 0.12, i * 0.11)); break;
      case "run": this.tone(500, 0.15, "sawtooth", 0.1, 0, 400); break;
      case "encounter": this.tone(200, 0.1, "square", 0.12); this.tone(260, 0.1, "square", 0.12, 0.1); break;
      case "badge": [659, 784, 880, 1046, 1318, 1568].forEach((f, i) => this.tone(f, 0.11, "square", 0.11, i * 0.1)); break;
    }
  }
  // 簡易BGM: [音程(MIDIノート番号, 0=休符), 長さ(拍)] の列をループ
  playMusic(songName) {
    if (this.currentSong === songName) return;
    this.stopMusic();
    this.currentSong = songName;
    const song = SONGS[songName];
    if (!song) return;
    let idx = 0;
    const step = () => {
      if (this.currentSong !== songName) return;
      const [note, beats] = song.notes[idx % song.notes.length];
      const dur = beats * song.beat;
      if (note > 0 && !this.muted) {
        try {
          this.ensure();
          const f = 440 * Math.pow(2, (note - 69) / 12);
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = song.wave || "square";
          osc.frequency.value = f;
          g.gain.setValueAtTime(0.5, this.ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur * 0.9);
          osc.connect(g); g.connect(this.musicGain);
          osc.start(); osc.stop(this.ctx.currentTime + dur * 0.95);
        } catch { /* まだユーザー操作前 */ }
      }
      idx++;
      this.musicTimer = setTimeout(step, dur * 1000);
    };
    step();
  }
  stopMusic() {
    this.currentSong = null;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }
}

// MIDIノート: 60=C4
const SONGS = {
  title: { beat: 0.22, wave: "square", notes: [[60,1],[64,1],[67,1],[72,2],[71,1],[67,1],[64,1],[60,2],[62,1],[65,1],[69,2],[67,1],[64,1],[62,2],[0,1]] },
  town: { beat: 0.24, wave: "triangle", notes: [[67,1],[64,1],[60,1],[64,1],[67,1],[72,2],[69,1],[65,1],[62,1],[65,1],[69,1],[74,2],[72,1],[67,1],[64,1],[60,2],[0,1]] },
  route: { beat: 0.18, wave: "square", notes: [[60,1],[62,1],[64,1],[67,1],[64,1],[67,1],[69,1],[72,1],[71,1],[69,1],[67,1],[64,1],[65,1],[64,1],[62,1],[60,1]] },
  battle: { beat: 0.13, wave: "square", notes: [[57,1],[57,1],[60,1],[57,1],[62,1],[57,1],[64,1],[62,1],[57,1],[57,1],[60,1],[57,1],[65,1],[64,1],[62,1],[60,1]] },
  gym: { beat: 0.2, wave: "square", notes: [[55,2],[58,1],[60,2],[62,1],[63,2],[62,1],[60,2],[58,1],[55,3],[0,1]] },
  cave: { beat: 0.3, wave: "triangle", notes: [[48,2],[51,2],[55,2],[51,2],[48,2],[53,2],[56,2],[53,2]] },
  evil: { beat: 0.16, wave: "sawtooth", notes: [[45,1],[45,1],[48,1],[45,1],[51,1],[48,1],[45,1],[44,1],[45,1],[45,1],[48,1],[45,1],[53,1],[51,1],[48,1],[45,1]] },
  champion: { beat: 0.14, wave: "square", notes: [[64,1],[67,1],[71,1],[76,2],[74,1],[71,1],[67,1],[64,1],[65,1],[69,1],[72,1],[77,2],[76,1],[72,1],[69,1],[65,1]] },
  legend: { beat: 0.28, wave: "triangle", notes: [[57,2],[60,2],[64,2],[69,3],[67,2],[64,2],[60,2],[57,3],[0,2]] },
};

export const audio = new AudioSys();
