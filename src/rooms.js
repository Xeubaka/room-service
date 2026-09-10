import { customAlphabet, nanoid } from "nanoid";

// nanoid()'s default alphabet includes "_" and "-", which .toUpperCase()
// can't strip (they have no case) — occasionally produced room codes like
// "26_QZU" that failed the "clean, shareable code" contract this ID exists
// for. A restricted alphabet guarantees it instead of leaving it to chance.
const roomCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export function createRoom() {
  return { id: roomCode(), createdAt: Date.now(), players: [], status: "waiting" };
}

// First joiner becomes white, second becomes black, anyone after is a spectator.
export function assignColor(players) {
  if (!players.find((p) => p.color === "white")) return "white";
  if (!players.find((p) => p.color === "black")) return "black";
  return "spectator";
}

export function joinRoom(room, playerName) {
  const color = assignColor(room.players);
  const player = { id: nanoid(8), name: playerName || `Player-${nanoid(4)}`, color };
  room.players.push(player);
  if (room.players.filter((p) => p.color !== "spectator").length === 2) {
    room.status = "ready";
  }
  return player;
}
