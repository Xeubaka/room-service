import { customAlphabet, nanoid } from "nanoid";

// nanoid()'s default alphabet includes "_" and "-", which .toUpperCase()
// can't strip (they have no case) — occasionally produced room codes like
// "26_QZU" that failed the "clean, shareable code" contract this ID exists
// for. A restricted alphabet guarantees it instead of leaving it to chance.
const roomCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

const DEFAULT_TIME_CONTROL_MINUTES = 3;
const MIN_TIME_CONTROL_MINUTES = 1;
const MAX_TIME_CONTROL_MINUTES = 60;

// Accepts whatever a client sends for "minutes per side" and clamps it to a
// sane range — the host choosing a time control shouldn't be able to hand
// game-service a 0-minute or multi-day clock. Anything not a finite number
// (missing, NaN, a string) falls back to the 3-minute default.
export function normalizeTimeControlMinutes(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n)) return DEFAULT_TIME_CONTROL_MINUTES;
  return Math.min(MAX_TIME_CONTROL_MINUTES, Math.max(MIN_TIME_CONTROL_MINUTES, n));
}

export function createRoom(timeControlMinutes) {
  // Decided once per room, at creation, so which seat (first joiner vs.
  // second) gets white is a coin flip rather than always "whoever clicks
  // join first" — join order is still recorded via players' array
  // position, it just no longer determines color.
  return {
    id: roomCode(),
    createdAt: Date.now(),
    players: [],
    status: "waiting",
    whiteJoinsFirst: Math.random() < 0.5,
    // The room host's chosen per-player time budget, in ms — threaded
    // through to game-service's clock init at join time (see index.js).
    timeControlMs: normalizeTimeControlMinutes(timeControlMinutes) * 60 * 1000
  };
}

// First empty seat gets whichever color the room's own coin flip picked,
// second seat gets the other, anyone after is a spectator.
export function assignColor(players, whiteJoinsFirst) {
  const seated = players.filter((p) => p.color === "white" || p.color === "black").length;
  if (seated === 0) return whiteJoinsFirst ? "white" : "black";
  if (seated === 1) return whiteJoinsFirst ? "black" : "white";
  return "spectator";
}

export function joinRoom(room, playerName) {
  const color = assignColor(room.players, room.whiteJoinsFirst);
  const player = { id: nanoid(8), name: playerName || `Player-${nanoid(4)}`, color };
  room.players.push(player);
  if (room.players.filter((p) => p.color !== "spectator").length === 2) {
    room.status = "ready";
  }
  return player;
}
