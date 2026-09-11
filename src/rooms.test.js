import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoom, assignColor, joinRoom } from "./rooms.js";

test("createRoom starts empty and waiting", () => {
  const room = createRoom();
  assert.equal(room.status, "waiting");
  assert.deepEqual(room.players, []);
  assert.match(room.id, /^[A-Z0-9]{6}$/);
});

test("assignColor is decided by the room's coin flip, not join order", () => {
  assert.equal(assignColor([], true), "white");
  assert.equal(assignColor([], false), "black");
  assert.equal(assignColor([{ color: "white" }], true), "black");
  assert.equal(assignColor([{ color: "black" }], false), "white");
  assert.equal(assignColor([{ color: "white" }, { color: "black" }], true), "spectator");
});

test("joinRoom fills the coin-flip's first seat then its second, and flips status to ready", () => {
  const room = createRoom();
  room.whiteJoinsFirst = true; // pin the flip for a deterministic test
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

test("joinRoom flips first-seat color when the room's coin flip lands the other way", () => {
  const room = createRoom();
  room.whiteJoinsFirst = false;
  const p1 = joinRoom(room, "Alice");
  assert.equal(p1.color, "black");
  const p2 = joinRoom(room, "Bob");
  assert.equal(p2.color, "white");
});

test("createRoom's coin flip is actually randomized across rooms", () => {
  const outcomes = new Set(Array.from({ length: 50 }, () => createRoom().whiteJoinsFirst));
  assert.deepEqual(outcomes, new Set([true, false]));
});

test("joinRoom defaults player name when none given", () => {
  const room = createRoom();
  const player = joinRoom(room);
  assert.match(player.name, /^Player-/);
});
