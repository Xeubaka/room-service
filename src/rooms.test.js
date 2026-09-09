import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoom, assignColor, joinRoom } from "./rooms.js";

test("createRoom starts empty and waiting", () => {
  const room = createRoom();
  assert.equal(room.status, "waiting");
  assert.deepEqual(room.players, []);
  assert.match(room.id, /^[A-Z0-9]{6}$/);
});

test("assignColor gives white, then black, then spectator", () => {
  assert.equal(assignColor([]), "white");
  assert.equal(assignColor([{ color: "white" }]), "black");
  assert.equal(assignColor([{ color: "white" }, { color: "black" }]), "spectator");
});

test("joinRoom fills white then black and flips status to ready", () => {
  const room = createRoom();
  const p1 = joinRoom(room, "Alice");
  assert.equal(p1.color, "white");
  assert.equal(room.status, "waiting");

  const p2 = joinRoom(room, "Bob");
  assert.equal(p2.color, "black");
  assert.equal(room.status, "ready");

  const p3 = joinRoom(room, "Carl");
  assert.equal(p3.color, "spectator");
  assert.equal(room.players.length, 3);
});

test("joinRoom defaults player name when none given", () => {
  const room = createRoom();
  const player = joinRoom(room);
  assert.match(player.name, /^Player-/);
});
