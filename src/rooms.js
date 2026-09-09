import { nanoid } from "nanoid";

export function createRoom() {
  return { id: nanoid(6).toUpperCase(), createdAt: Date.now(), players: [], status: "waiting" };
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
