import { customAlphabet, nanoid } from "nanoid";

// nanoid()'s default alphabet includes "_" and "-", which .toUpperCase()
// can't strip (they have no case) — occasionally produced room codes like
// "26_QZU" that failed the "clean, shareable code" contract this ID exists
// for. A restricted alphabet guarantees it instead of leaving it to chance.
const roomCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export function createRoom() {
  // Decided once per room, at creation, so which seat (first joiner vs.
  // second) gets white is a coin flip rather than always "whoever clicks
  // join first" — join order is still recorded via players' array
  // position, it just no longer determines color.
  return { id: roomCode(), createdAt: Date.now(), players: [], status: "waiting", whiteJoinsFirst: Math.random() < 0.5 };
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
