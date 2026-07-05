// Supabase Realtime ラッパー (ルームコード方式の1対1通信)
// テーブル不要: broadcast チャンネルだけで交換・対戦を実現する。
import { NET_CONFIG } from "../../netconfig.js";

export function netAvailable() {
  return !!(NET_CONFIG.SUPABASE_URL && NET_CONFIG.SUPABASE_ANON_KEY);
}

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(({ createClient }) =>
      createClient(NET_CONFIG.SUPABASE_URL, NET_CONFIG.SUPABASE_ANON_KEY, {
        realtime: { params: { eventsPerSecond: 20 } },
      }),
    );
  }
  return clientPromise;
}

// 1対1のルーム。send(type, data) / onMessage で JSON をやりとりする。
export class Room {
  constructor(channel, selfId) {
    this.channel = channel;
    this.selfId = selfId;
    this.handlers = new Map(); // type -> [resolve,...] (waitFor用)
    this.listeners = new Set();
    this.inbox = new Map();     // type -> [data,...] 待ち受け前に届いたメッセージを貯める
    this.closed = false;
  }

  static async join(kind, code, { onPeerJoin, onPeerLeave } = {}) {
    const sb = await getClient();
    const selfId = Math.random().toString(36).slice(2, 10);
    const channel = sb.channel(`tomo-${kind}-${code}`, {
      config: {
        broadcast: { self: false },
        presence: { key: selfId },
      },
    });
    const room = new Room(channel, selfId);

    channel.on("broadcast", { event: "msg" }, ({ payload }) => {
      if (!payload || payload.from === selfId) return;
      room.dispatch(payload);
    });
    channel.on("presence", { event: "join" }, ({ key }) => {
      if (key !== selfId) onPeerJoin?.(key);
    });
    channel.on("presence", { event: "leave" }, ({ key }) => {
      if (key !== selfId) onPeerLeave?.(key);
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 12000);
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          await channel.track({ at: Date.now() });
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          reject(new Error("connect failed: " + status));
        }
      });
    });
    return room;
  }

  peerCount() {
    const state = this.channel.presenceState();
    return Object.keys(state).filter((k) => k !== this.selfId).length;
  }

  dispatch(payload) {
    const waiters = this.handlers.get(payload.type);
    if (waiters && waiters.length) {
      waiters.shift()(payload.data);
      return;
    }
    if (this.listeners.size) {
      for (const fn of this.listeners) fn(payload.type, payload.data);
      return;
    }
    // まだ誰も受け取っていない → バッファに貯めて、あとで waitFor が来たら渡す
    if (!this.inbox.has(payload.type)) this.inbox.set(payload.type, []);
    this.inbox.get(payload.type).push(payload.data);
  }

  onAny(fn) { this.listeners.add(fn); }

  send(type, data = {}) {
    if (this.closed) return;
    this.channel.send({ type: "broadcast", event: "msg", payload: { type, data, from: this.selfId } });
  }

  // 指定タイプのメッセージを1つ待つ
  waitFor(type, timeoutMs = 0) {
    // すでにバッファに届いていれば即座に返す (取りこぼし防止)
    const buffered = this.inbox.get(type);
    if (buffered && buffered.length) {
      return Promise.resolve(buffered.shift());
    }
    return new Promise((resolve, reject) => {
      if (!this.handlers.has(type)) this.handlers.set(type, []);
      let timer = null;
      const fn = (data) => { if (timer) clearTimeout(timer); resolve(data); };
      this.handlers.get(type).push(fn);
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          const arr = this.handlers.get(type) || [];
          const i = arr.indexOf(fn);
          if (i >= 0) arr.splice(i, 1);
          reject(new Error("timeout: " + type));
        }, timeoutMs);
      }
    });
  }

  async leave() {
    this.closed = true;
    try {
      const sb = await getClient();
      await sb.removeChannel(this.channel);
    } catch { /* 切断失敗は無視 */ }
  }
}
