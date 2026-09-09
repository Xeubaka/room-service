import express from "express";
import cors from "cors";
import { createClient } from "redis";
import { nanoid } from "nanoid";

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

// Create a room. Returns a short code players use to join.
app.post("/rooms", async (_req, res) => {
  const roomId = nanoid(6).toUpperCase();
  const room = {
    id: roomId,
    createdAt: Date.now(),
    players: [],
    status: "waiting"
  };
  await redis.set(`room:${roomId}`, JSON.stringify(room));
  res.status(201).json(room);
});

// Fetch room info
app.get("/rooms/:id", async (req, res) => {
  const raw = await redis.get(`room:${req.params.id}`);
  if (!raw) return res.status(404).json({ error: "room not found" });
  res.json(JSON.parse(raw));
});

// Join a room. First joiner becomes white, second becomes black, anyone after is a spectator.
app.post("/rooms/:id/join", async (req, res) => {
  const { playerName } = req.body || {};
  const raw = await redis.get(`room:${req.params.id}`);
  if (!raw) return res.status(404).json({ error: "room not found" });

  const room = JSON.parse(raw);
  let color = "spectator";
  if (!room.players.find((p) => p.color === "white")) color = "white";
  else if (!room.players.find((p) => p.color === "black")) color = "black";

  const player = { id: nanoid(8), name: playerName || `Player-${nanoid(4)}`, color };
  room.players.push(player);
  if (room.players.filter((p) => p.color !== "spectator").length === 2) {
    room.status = "ready";
  }

  await redis.set(`room:${req.params.id}`, JSON.stringify(room));
  res.json({ room, you: player });
});

app.listen(PORT, () => console.log(`room-service listening on ${PORT}`));
