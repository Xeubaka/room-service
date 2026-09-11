import express from "express";
import cors from "cors";
import { createClient } from "redis";
import { createRoom, joinRoom } from "./rooms.js";

const app = express();
app.use(cors());
app.use(express.json());

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => console.error("Redis error", err));
await redis.connect();

const PORT = process.env.PORT || 3001;

// Health check — CI/CD and orchestrators (ECS, k8s) poll this
app.get("/health", (_req, res) => res.json({ status: "ok", service: "room-service" }));

// Create a room. Returns a short code players use to join. Optional
// { timeControlMinutes } sets the per-player clock (clamped/defaulted in
// createRoom) — both joiners read it back off the room object.
app.post("/rooms", async (req, res) => {
  const { timeControlMinutes } = req.body || {};
  const room = createRoom(timeControlMinutes);
  await redis.set(`room:${room.id}`, JSON.stringify(room));
  res.status(201).json(room);
});

// Fetch room info
app.get("/rooms/:id", async (req, res) => {
  const raw = await redis.get(`room:${req.params.id}`);
  if (!raw) return res.status(404).json({ error: "room not found" });
  res.json(JSON.parse(raw));
});

// Join a room. Color is a coin flip decided once at room creation (room.whiteJoinsFirst),
// not who happens to join first; anyone after both seats are filled is a spectator.
app.post("/rooms/:id/join", async (req, res) => {
  const { playerName } = req.body || {};
  const raw = await redis.get(`room:${req.params.id}`);
  if (!raw) return res.status(404).json({ error: "room not found" });

  const room = JSON.parse(raw);
  if (room.status === "closed") return res.status(410).json({ error: "room is closed" });
  const player = joinRoom(room, playerName);

  await redis.set(`room:${req.params.id}`, JSON.stringify(room));
  res.json({ room, you: player });
});

// Finalizes a room (e.g. game-service calling this after a declined/expired
// rematch offer) — a closed room's code can't be joined again, so a stale
// code from a finished match can't be reused by a third party.
app.post("/rooms/:id/close", async (req, res) => {
  const raw = await redis.get(`room:${req.params.id}`);
  if (!raw) return res.status(404).json({ error: "room not found" });

  const room = JSON.parse(raw);
  room.status = "closed";
  await redis.set(`room:${req.params.id}`, JSON.stringify(room));
  res.json(room);
});

app.listen(PORT, () => console.log(`room-service listening on ${PORT}`));
